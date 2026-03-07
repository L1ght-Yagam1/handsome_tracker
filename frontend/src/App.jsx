import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToastNotice } from "./components/ToastNotice";
import { SettingsPage } from "./pages/SettingsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NotesPage } from "./pages/NotesPage";
import { UsersPage } from "./pages/UsersPage";
import { AppLayout } from "./layouts/AppLayout";
import { NoteWorkspace } from "./features/notes/NoteWorkspace";
import {
  createNote,
  createUser,
  deleteNote,
  deleteUser,
  favoriteNote,
  fetchNotes,
  fetchUsers,
  login,
  logout as logoutApi,
  refreshAccessToken,
  registerUser,
  sendRegistrationCode,
  unfavoriteNote,
  updateNote
} from "./services/handsomeApi";
import { stripHtml } from "./utils/noteContent";

const AUTH_STORAGE_KEY = "handsome_auth";
const NOTE_INTERACTIONS_STORAGE_PREFIX = "handsome_note_interactions";
const SETTINGS_STORAGE_KEY = "handsome_settings";
const EMPTY_AUTH = { accessToken: "", refreshToken: "", email: "" };
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_SETTINGS = {
  username: "User",
  darkMode: true,
  emailNotifications: true
};
const EMPTY_NOTE_DRAFT = {
  id: null,
  title: "",
  content: "",
  createdAt: null
};
const AUTOSAVE_DELAY_MS = 700;

function deriveNameFromEmail(email) {
  const local = email.split("@")[0] || "User";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return EMPTY_AUTH;
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.email) return EMPTY_AUTH;
    return {
      accessToken: String(parsed.accessToken),
      refreshToken: String(parsed.refreshToken),
      email: String(parsed.email)
    };
  } catch {
    return EMPTY_AUTH;
  }
}

function loadStoredNoteInteractions(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveStoredNoteInteractions(storageKey, interactions) {
  localStorage.setItem(storageKey, JSON.stringify(interactions));
}

function loadStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      username: String(parsed?.username || DEFAULT_SETTINGS.username),
      darkMode:
        typeof parsed?.darkMode === "boolean" ? parsed.darkMode : DEFAULT_SETTINGS.darkMode,
      emailNotifications:
        typeof parsed?.emailNotifications === "boolean"
          ? parsed.emailNotifications
          : DEFAULT_SETTINGS.emailNotifications
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function getNoteTimestamp(note) {
  if (note.interactedAt) return new Date(note.interactedAt).getTime();
  if (note.createdAt) return new Date(note.createdAt).getTime();
  return 0;
}

function isEmptyDraftNote(note) {
  const normalizedTitle = (note?.title || "").trim().toLowerCase();
  const normalizedContent = stripHtml(note?.content || "");
  return (!normalizedTitle || normalizedTitle === "untitled note") && normalizedContent.length === 0;
}

function createDraftSnapshot(draft) {
  return JSON.stringify({
    id: draft.id ?? null,
    title: draft.title || "",
    content: draft.content || ""
  });
}

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [auth, setAuth] = useState(loadStoredAuth);
  const [authView, setAuthView] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    verificationCode: ""
  });
  const [authError, setAuthError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerInfo, setRegisterInfo] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [noteSyncing, setNoteSyncing] = useState(false);
  const [noteAutosaveStatus, setNoteAutosaveStatus] = useState("saved");
  const [notesError, setNotesError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [search, setSearch] = useState("");
  const [notesSort, setNotesSort] = useState("updated");
  const [settings, setSettings] = useState(loadStoredSettings);
  const [isNoteWorkspaceOpen, setIsNoteWorkspaceOpen] = useState(false);
  const [noteWorkspaceDraft, setNoteWorkspaceDraft] = useState(EMPTY_NOTE_DRAFT);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [favoritesPage, setFavoritesPage] = useState(0);
  const [favoritePendingId, setFavoritePendingId] = useState(null);
  const [toast, setToast] = useState(null);
  const interactionStorageKey = useMemo(
    () => `${NOTE_INTERACTIONS_STORAGE_PREFIX}:${auth.email || "guest"}`,
    [auth.email]
  );
  const noteInteractionsRef = useRef({});
  const lastSavedDraftRef = useRef(createDraftSnapshot(EMPTY_NOTE_DRAFT));
  const normalizedRegisterEmail = registerForm.email.trim();
  const isRegisterEmailValid =
    normalizedRegisterEmail.length > 0 && EMAIL_REGEX.test(normalizedRegisterEmail);

  const mergeNotesWithInteraction = (prevNotes, incomingNotes) => {
    const prevById = new Map(prevNotes.map((note) => [note.id, note]));
    const storedInteractions = noteInteractionsRef.current;

    return incomingNotes.map((note) => ({
      ...note,
      interactedAt:
        storedInteractions[String(note.id)] ||
        prevById.get(note.id)?.interactedAt ||
        note.createdAt ||
        null
    }));
  };

  const setNoteInteraction = useCallback(
    (noteId, interactedAt = new Date().toISOString()) => {
      const next = { ...noteInteractionsRef.current, [String(noteId)]: interactedAt };
      noteInteractionsRef.current = next;
      saveStoredNoteInteractions(interactionStorageKey, next);
      return interactedAt;
    },
    [interactionStorageKey]
  );

  const removeNoteInteraction = useCallback(
    (noteId) => {
      const next = { ...noteInteractionsRef.current };
      delete next[String(noteId)];
      noteInteractionsRef.current = next;
      saveStoredNoteInteractions(interactionStorageKey, next);
    },
    [interactionStorageKey]
  );

  useEffect(() => {
    noteInteractionsRef.current = loadStoredNoteInteractions(interactionStorageKey);
  }, [interactionStorageKey]);

  const showToast = useCallback((message, tone = "warning") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const clearSession = useCallback(() => {
    setAuth(EMPTY_AUTH);
    setUsers([]);
    setNotes([]);
    setFavoriteIds([]);
    setIsAdmin(false);
    setAdminOpen(false);
    setIsProfileOpen(false);
    setAuthError("");
    setUsersError("");
    setNotesError("");
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (!auth.accessToken || !auth.refreshToken || !auth.email) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }, [auth]);

  const handleSaveSettings = useCallback(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    showToast("Settings saved.", "success");
  }, [settings, showToast]);

  const loadData = useCallback(async () => {
    if (!auth.accessToken) return;

    setLoading(true);
    setNotesError("");
    setUsersError("");
    let token = auth.accessToken;

    const refreshSessionIfNeeded = async () => {
      if (!auth.refreshToken) {
        clearSession();
        return false;
      }

      try {
        const refreshed = await refreshAccessToken(auth.refreshToken);
        token = refreshed.access_token;
        setAuth({
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          email: auth.email
        });
        return true;
      } catch {
        clearSession();
        return false;
      }
    };

    try {
      const loadedNotes = await fetchNotes(token);
      setNotes((prev) => mergeNotesWithInteraction(prev, loadedNotes));
      setFavoriteIds(loadedNotes.filter((note) => note.isFavorite).map((note) => note.id));
    } catch (err) {
      if (err.status === 401) {
        const refreshed = await refreshSessionIfNeeded();
        if (!refreshed) {
          setLoading(false);
          return;
        }

        const loadedNotes = await fetchNotes(token);
        setNotes((prev) => mergeNotesWithInteraction(prev, loadedNotes));
        setFavoriteIds(loadedNotes.filter((note) => note.isFavorite).map((note) => note.id));
      } else {
        setNotesError(err.message || "Failed to load notes");
      }
    }

    try {
      const loadedUsers = await fetchUsers(token);
      setUsers(loadedUsers);
      setIsAdmin(true);
      const me = loadedUsers.find((user) => user.email === auth.email);
      if (me?.fullName) {
        setSettings((prev) => ({ ...prev, username: me.fullName }));
      }
    } catch (err) {
      if (err.status === 401) {
        clearSession();
        setLoading(false);
        return;
      }

      setIsAdmin(false);
      setAdminOpen(false);
      if (activePage === "admin-users") {
        setActivePage("dashboard");
      }
      if (err.status === 403) {
        setUsersError("Users endpoint is available only for admin users.");
      } else {
        setUsersError(err.message || "Failed to load users");
      }
    } finally {
      setLoading(false);
    }
  }, [activePage, auth.accessToken, auth.email, auth.refreshToken, clearSession]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogin = async () => {
    const email = loginForm.email.trim();
    const password = loginForm.password;
    if (!email || !password) return;

    setAuthLoading(true);
    setAuthError("");
    try {
      const payload = await login({ email, password });
      setAuth({ accessToken: payload.access_token, refreshToken: payload.refresh_token, email });
      setSettings((prev) => ({ ...prev, username: deriveNameFromEmail(email) }));
      setLoginForm({ email, password: "" });
    } catch (err) {
      setAuthError(err.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSwitchAuthView = (nextView) => {
    setAuthView(nextView);
    setAuthError("");
    setRegisterError("");
    setRegisterInfo("");
  };

  const updateRegisterField = (field, value) => {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
    setRegisterError("");
    if (field === "email") {
      setRegisterInfo("");
    }
  };

  const handleSendVerificationCode = () => {
    if (!isRegisterEmailValid || authLoading) return;

    setAuthLoading(true);
    setRegisterError("");
    setRegisterInfo("");
    sendRegistrationCode(normalizedRegisterEmail)
      .then(() => {
        setRegisterInfo(`Verification code was sent to ${normalizedRegisterEmail}.`);
      })
      .catch((err) => {
        setRegisterError(err.message || "Failed to send verification code.");
      })
      .finally(() => {
        setAuthLoading(false);
      });
  };

  const handleRegisterPreview = () => {
    const email = normalizedRegisterEmail;
    const password = registerForm.password;
    const confirmPassword = registerForm.confirmPassword;
    const verificationCode = registerForm.verificationCode.trim();

    if (!email || !password || !confirmPassword || !verificationCode) {
      setRegisterError("Fill in all registration fields.");
      return;
    }
    if (!isRegisterEmailValid) {
      setRegisterError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setRegisterError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setRegisterError("Passwords do not match.");
      return;
    }

    setAuthLoading(true);
    setRegisterError("");
    setRegisterInfo("");
    registerUser({
      email,
      password,
      confirmPassword,
      code: verificationCode,
      fullName: ""
    })
      .then(() => {
        setRegisterForm({
          email,
          password: "",
          confirmPassword: "",
          verificationCode: ""
        });
        setAuthView("login");
        setLoginForm({ email, password: "" });
        setRegisterInfo("Account created. Sign in with your new credentials.");
      })
      .catch((err) => {
        setRegisterError(err.message || "Registration failed.");
      })
      .finally(() => {
        setAuthLoading(false);
      });
  };

  const handleLogout = async () => {
    try {
      if (auth.refreshToken) {
        await logoutApi(auth.refreshToken);
      }
    } catch {
      // Ignore revoke errors, we still clear local session on client.
    }
    clearSession();
  };

  const handleAddUser = async (userPayload) => {
    if (!auth.accessToken) return null;
    setWorking(true);
    setUsersError("");
    try {
      const createdUser = await createUser(auth.accessToken, userPayload);
      setUsers((prev) => [...prev, createdUser].sort((a, b) => a.email.localeCompare(b.email)));
      showToast("User created successfully.", "success");
      return createdUser;
    } catch (err) {
      setUsersError(err.message || "Failed to create user");
      return null;
    } finally {
      setWorking(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!auth.accessToken) return;
    setWorking(true);
    setUsersError("");
    try {
      await deleteUser(auth.accessToken, id);
      setUsers((prev) => prev.filter((user) => user.id !== id));
      showToast("User deleted.", "error");
    } catch (err) {
      setUsersError(err.message || "Failed to delete user");
    } finally {
      setWorking(false);
    }
  };

  const openExistingNoteWorkspace = useCallback(
    (note) => {
      const interactionTime = setNoteInteraction(note.id);
      setNotes((prev) =>
        prev.map((item) => (item.id === note.id ? { ...item, interactedAt: interactionTime } : item))
      );
      const nextDraft = {
        id: note.id,
        title: note.title || "",
        content: note.content || "",
        createdAt: note.createdAt || new Date().toISOString()
      };
      lastSavedDraftRef.current = createDraftSnapshot(nextDraft);
      setNoteWorkspaceDraft(nextDraft);
      setNoteAutosaveStatus("saved");
      setIsNoteWorkspaceOpen(true);
    },
    [setNoteInteraction]
  );

  const handleCreateOrReuseDraftNote = useCallback(async () => {
    const currentDraftIsReusable =
      isNoteWorkspaceOpen && noteWorkspaceDraft.id && isEmptyDraftNote(noteWorkspaceDraft);
    if (currentDraftIsReusable) return;

    const existingDraft = notes.find((note) => isEmptyDraftNote(note));
    if (existingDraft) {
      openExistingNoteWorkspace(existingDraft);
      return;
    }

    if (!auth.accessToken) return;

    setWorking(true);
    setNotesError("");
    try {
      const createdNote = await createNote(auth.accessToken, {
        title: "Untitled note",
        content: ""
      });
      const interactedAt = setNoteInteraction(createdNote.id);
      const nextNote = {
        ...createdNote,
        title: createdNote.title || "Untitled note",
        content: createdNote.content || "",
        createdAt: createdNote.createdAt || new Date().toISOString(),
        isFavorite: createdNote.isFavorite || false,
        interactedAt
      };

      setNotes((prev) => [nextNote, ...prev]);
      lastSavedDraftRef.current = createDraftSnapshot(nextNote);
      setNoteWorkspaceDraft({
        id: nextNote.id,
        title: nextNote.title,
        content: nextNote.content,
        createdAt: nextNote.createdAt
      });
      setNoteAutosaveStatus("saved");
      setIsNoteWorkspaceOpen(true);
    } catch (err) {
      setNotesError(err.message || "Failed to create note");
      setNoteAutosaveStatus("error");
    } finally {
      setWorking(false);
    }
  }, [
    auth.accessToken,
    isNoteWorkspaceOpen,
    noteWorkspaceDraft,
    notes,
    openExistingNoteWorkspace,
    setNoteInteraction
  ]);

  const closeNoteWorkspace = useCallback(() => {
    setIsNoteWorkspaceOpen(false);
    setNoteWorkspaceDraft(EMPTY_NOTE_DRAFT);
    lastSavedDraftRef.current = createDraftSnapshot(EMPTY_NOTE_DRAFT);
    setNoteAutosaveStatus("saved");
  }, []);

  const handleNavigate = useCallback(
    (nextPage) => {
      closeNoteWorkspace();
      setActivePage(nextPage);
    },
    [closeNoteWorkspace]
  );

  const changeNoteWorkspaceDraft = useCallback((field, value) => {
    setNoteWorkspaceDraft((prev) => ({ ...prev, [field]: value }));
    setNoteAutosaveStatus("unsaved");
  }, []);

  const handleAddNote = async (payload, options = {}) => {
    if (!auth.accessToken) return;
    if (options.trackBusy !== false) {
      setWorking(true);
    } else {
      setNoteSyncing(true);
    }
    setNotesError("");
    try {
      const createdNote = await createNote(auth.accessToken, payload);
      const interactedAt = setNoteInteraction(createdNote.id);
      setNotes((prev) => [
        {
          ...createdNote,
          createdAt: createdNote.createdAt || new Date().toISOString(),
          isFavorite: createdNote.isFavorite || false,
          interactedAt
        },
        ...prev
      ]);
      if (!options.silent) {
        showToast("Note created successfully.", "success");
      }
      const nextDraft = {
        id: createdNote.id,
        title: createdNote.title || payload.title,
        content: createdNote.content || payload.content,
        createdAt: createdNote.createdAt || new Date().toISOString()
      };
      lastSavedDraftRef.current = createDraftSnapshot(nextDraft);
      setNoteWorkspaceDraft(nextDraft);
      setNoteAutosaveStatus("saved");
      setIsNoteWorkspaceOpen(true);
      return createdNote;
    } catch (err) {
      setNotesError(err.message || "Failed to create note");
      setNoteAutosaveStatus("error");
      return null;
    } finally {
      if (options.trackBusy !== false) {
        setWorking(false);
      } else {
        setNoteSyncing(false);
      }
    }
  };

  const handleDeleteNote = async (id) => {
    if (!auth.accessToken) return;
    setWorking(true);
    setNotesError("");
    try {
      await deleteNote(auth.accessToken, id);
      setNotes((prev) => prev.filter((note) => note.id !== id));
      setFavoriteIds((prev) => prev.filter((item) => item !== id));
      removeNoteInteraction(id);
      showToast("Note deleted.", "error");
      if (noteWorkspaceDraft.id === id) {
        closeNoteWorkspace();
      }
    } catch (err) {
      setNotesError(err.message || "Failed to delete note");
    } finally {
      setWorking(false);
    }
  };

  const handleUpdateNote = async (id, payload, options = {}) => {
    if (!auth.accessToken) return;
    if (options.trackBusy !== false) {
      setWorking(true);
    } else {
      setNoteSyncing(true);
    }
    setNotesError("");
    try {
      const updatedNote = await updateNote(auth.accessToken, id, payload);
      const interactionTime = setNoteInteraction(id);
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, ...updatedNote, interactedAt: interactionTime } : note
        )
      );
      const nextDraft = {
        id,
        title: updatedNote.title || payload.title || noteWorkspaceDraft.title,
        content: updatedNote.content || payload.content || noteWorkspaceDraft.content,
        createdAt: updatedNote.createdAt || noteWorkspaceDraft.createdAt
      };
      lastSavedDraftRef.current = createDraftSnapshot(nextDraft);
      setNoteWorkspaceDraft((prev) => ({
        ...prev,
        ...nextDraft
      }));
      setNoteAutosaveStatus("saved");
      if (!options.silent) {
        showToast("Note updated successfully.", "success");
      }
      return updatedNote;
    } catch (err) {
      setNotesError(err.message || "Failed to update note");
      setNoteAutosaveStatus("error");
      return null;
    } finally {
      if (options.trackBusy !== false) {
        setWorking(false);
      } else {
        setNoteSyncing(false);
      }
    }
  };

  useEffect(() => {
    if (!isNoteWorkspaceOpen || noteSyncing) return;
    if (!noteWorkspaceDraft.id) return;

    const snapshot = createDraftSnapshot(noteWorkspaceDraft);
    if (snapshot === lastSavedDraftRef.current) return;

    const hasMeaningfulContent =
      noteWorkspaceDraft.title.trim().length > 0 || stripHtml(noteWorkspaceDraft.content).length > 0;
    if (!hasMeaningfulContent) return;

  const timer = setTimeout(() => {
      setNoteAutosaveStatus("saving");
      const persistedNote = notes.find((note) => note.id === noteWorkspaceDraft.id);
      const payload = {
        title: noteWorkspaceDraft.title.trim() || persistedNote?.title || "Untitled note",
        content: noteWorkspaceDraft.content
      };

      handleUpdateNote(noteWorkspaceDraft.id, payload, { silent: true, trackBusy: false });
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [handleUpdateNote, isNoteWorkspaceOpen, noteSyncing, noteWorkspaceDraft, notes]);

  const toggleFavorite = async (id) => {
    if (!auth.accessToken || favoritePendingId === id) return;

    setFavoritePendingId(id);
    setNotesError("");
    const isCurrentlyFavorite = favoriteIds.includes(id);

    try {
      const updatedNote = isCurrentlyFavorite
        ? await unfavoriteNote(auth.accessToken, id)
        : await favoriteNote(auth.accessToken, id);
      const interactionTime = setNoteInteraction(id);

      setFavoriteIds((prev) =>
        isCurrentlyFavorite ? prev.filter((item) => item !== id) : [...prev, id]
      );
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id
            ? {
                ...note,
                isFavorite: updatedNote.isFavorite,
                interactedAt: interactionTime
              }
            : note
        )
      );
    } catch (err) {
      setNotesError(err.message || "Failed to update favorite");
    } finally {
      setFavoritePendingId(null);
    }
  };

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const visibleNotes = notes.filter((note) => {
      if (!query) return true;
      return (
        note.title.toLowerCase().includes(query) ||
        stripHtml(note.content).toLowerCase().includes(query)
      );
    });

    return [...visibleNotes].sort((a, b) => {
      if (notesSort === "created") {
        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bCreated - aCreated;
      }
      if (notesSort === "title") {
        return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      }
      return getNoteTimestamp(b) - getNoteTimestamp(a);
    });
  }, [notes, notesSort, search]);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.email.localeCompare(b.email)),
    [users]
  );
  const favoriteCount = notes.filter((note) => favoriteIds.includes(note.id)).length;
  const recentNotes = [...notes].sort((a, b) => getNoteTimestamp(b) - getNoteTimestamp(a)).slice(0, 3);
  const favoriteNotes = [...notes]
    .filter((note) => favoriteIds.includes(note.id))
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  const favoritesPageSize = 3;
  const totalFavoritesPages = Math.max(1, Math.ceil(favoriteNotes.length / favoritesPageSize));
  const pagedFavoriteNotes = favoriteNotes.slice(
    favoritesPage * favoritesPageSize,
    favoritesPage * favoritesPageSize + favoritesPageSize
  );
  const profileName = settings.username || deriveNameFromEmail(auth.email);
  const initials = useMemo(
    () =>
      profileName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "U",
    [profileName]
  );

  useEffect(() => {
    if (favoritesPage > totalFavoritesPages - 1) {
      setFavoritesPage(Math.max(0, totalFavoritesPages - 1));
    }
  }, [favoritesPage, totalFavoritesPages]);

  if (!auth.accessToken) {
    return (
      <div className="app-shell auth-shell">
        <section className="panel login-panel">
          <div className="login-panel-head">
            <p className="eyebrow">handsome</p>
            <button
              type="button"
              className="btn btn-ghost auth-toggle-btn"
              onClick={() => handleSwitchAuthView(authView === "login" ? "register" : "login")}
            >
              {authView === "login" ? "Register" : "Sign in"}
            </button>
          </div>

          {authView === "login" ? (
            <>
              <h1>Welcome back</h1>
              <p className="subtle">Sign in to manage notes and users.</p>
              <div className="login-form">
                <input
                  type="email"
                  placeholder="Email"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  disabled={authLoading}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  disabled={authLoading}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleLogin}
                  disabled={authLoading}
                >
                  Sign in
                </button>
              </div>
              {authError && <p className="status error">{authError}</p>}
            </>
          ) : (
            <>
              <h1>Create account</h1>
              <p className="subtle">Register to manage notes and users.</p>
              <div className="login-form">
                <input
                  type="email"
                  placeholder="Email"
                  value={registerForm.email}
                  onChange={(event) => updateRegisterField("email", event.target.value)}
                  disabled={authLoading}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={registerForm.password}
                  onChange={(event) => updateRegisterField("password", event.target.value)}
                  disabled={authLoading}
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={registerForm.confirmPassword}
                  onChange={(event) => updateRegisterField("confirmPassword", event.target.value)}
                  disabled={authLoading}
                />
                <div className="auth-code-row">
                  <input
                    type="text"
                    placeholder="Code from email"
                    value={registerForm.verificationCode}
                    onChange={(event) =>
                      updateRegisterField("verificationCode", event.target.value)
                    }
                    disabled={authLoading}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleSendVerificationCode}
                    disabled={!isRegisterEmailValid || authLoading}
                  >
                    Send code
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleRegisterPreview}
                  disabled={authLoading}
                >
                  Create account
                </button>
              </div>
              {registerInfo && <p className="status success">{registerInfo}</p>}
              {registerError && <p className="status error">{registerError}</p>}
            </>
          )}
        </section>
      </div>
    );
  }

  const pageContent = {
    dashboard: (
      <DashboardPage
        profileName={profileName}
        notes={notes}
        recentNotes={recentNotes}
        favoriteCount={favoriteCount}
        favoriteIds={favoriteIds}
        favoritePendingId={favoritePendingId}
        pagedFavoriteNotes={pagedFavoriteNotes}
        favoriteNotes={favoriteNotes}
        favoritesPage={favoritesPage}
        totalFavoritesPages={totalFavoritesPages}
        onCreateNote={handleCreateOrReuseDraftNote}
        onOpenNote={openExistingNoteWorkspace}
        onToggleFavorite={toggleFavorite}
        onFavoritesPageChange={setFavoritesPage}
      />
    ),
    notes: (
      <NotesPage
        search={search}
        notesSort={notesSort}
        notes={filteredNotes}
        favoriteIds={favoriteIds}
        favoritePendingId={favoritePendingId}
        isBusy={working || loading}
        error={notesError}
        onSearchChange={setSearch}
        onSortChange={setNotesSort}
        onCreateNote={handleCreateOrReuseDraftNote}
        onEditNote={openExistingNoteWorkspace}
        onDeleteNote={handleDeleteNote}
        onToggleFavorite={toggleFavorite}
      />
    ),
    "admin-users": (
      <UsersPage
        users={sortedUsers}
        error={usersError}
        isBusy={working || loading}
        onAddUser={handleAddUser}
        onDeleteUser={handleDeleteUser}
      />
    ),
    settings: (
      <SettingsPage
        settings={settings}
        email={auth.email}
        onSettingsChange={setSettings}
        onSave={handleSaveSettings}
      />
    )
  };

  return (
    <>
      <AppLayout
        activePage={activePage}
        isAdmin={isAdmin}
        adminOpen={adminOpen}
        initials={initials}
        profileName={profileName}
        loading={loading}
        isProfileOpen={isProfileOpen}
        email={auth.email}
        onToggleAdmin={() => setAdminOpen((prev) => !prev)}
        onPageChange={handleNavigate}
        onOpenProfile={() => setIsProfileOpen(true)}
        onCloseProfile={() => setIsProfileOpen(false)}
        onOpenSettings={() => {
          closeNoteWorkspace();
          setActivePage("settings");
          setIsProfileOpen(false);
        }}
        onLogout={handleLogout}
      >
        {isNoteWorkspaceOpen ? (
          <NoteWorkspace
            autosaveStatus={noteAutosaveStatus}
            draft={noteWorkspaceDraft}
            favoriteIds={favoriteIds}
            favoritePendingId={favoritePendingId}
            isBusy={working || loading}
            notes={filteredNotes}
            onChangeDraft={changeNoteWorkspaceDraft}
            onClose={closeNoteWorkspace}
            onCreateNew={handleCreateOrReuseDraftNote}
            onDeleteNote={handleDeleteNote}
            onSelectNote={(noteId) => {
              const nextNote = notes.find((item) => item.id === noteId);
              if (nextNote) {
                openExistingNoteWorkspace(nextNote);
              }
            }}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          pageContent[activePage] || pageContent.dashboard
        )}
      </AppLayout>

      {toast && (
        <div className="toast-layer">
          <ToastNotice message={toast.message} tone={toast.tone} />
        </div>
      )}
    </>
  );
}

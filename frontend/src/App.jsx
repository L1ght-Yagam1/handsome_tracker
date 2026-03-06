import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UsersPanel } from "./features/users/UsersPanel";
import { NotesPanel } from "./features/notes/NotesPanel";
import { CreateNoteModal } from "./components/CreateNoteModal";
import { EditNoteModal } from "./components/EditNoteModal";
import { ToastNotice } from "./components/ToastNotice";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  FileIcon,
  FilterIcon,
  HomeIcon,
  NotesIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  UserIcon,
  UsersIcon
} from "./components/Icons";
import {
  createNote,
  createUser,
  deleteNote,
  deleteUser,
  favoriteNote,
  fetchNotes,
  fetchUsers,
  login,
  registerUser,
  logout as logoutApi,
  refreshAccessToken,
  sendRegistrationCode,
  updateNote,
  unfavoriteNote
} from "./services/handsomeApi";
import { stripHtml } from "./utils/noteContent";

const mainPages = [
  { id: "dashboard", label: "Home", icon: HomeIcon },
  { id: "notes", label: "All Notes", icon: NotesIcon }
];
const notesSortOptions = [
  { id: "created", label: "Created" },
  { id: "updated", label: "Updated" },
  { id: "title", label: "Title" }
];
const AUTH_STORAGE_KEY = "handsome_auth";
const NOTE_INTERACTIONS_STORAGE_PREFIX = "handsome_note_interactions";
const EMPTY_AUTH = { accessToken: "", refreshToken: "", email: "" };
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [notesError, setNotesError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [search, setSearch] = useState("");
  const [notesSort, setNotesSort] = useState("updated");
  const [settings, setSettings] = useState({
    username: "User",
    darkMode: true,
    emailNotifications: true
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
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
    if (!auth.accessToken) return;
    setWorking(true);
    setUsersError("");
    try {
      const createdUser = await createUser(auth.accessToken, userPayload);
      setUsers((prev) => [...prev, createdUser]);
    } catch (err) {
      setUsersError(err.message || "Failed to create user");
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
    } catch (err) {
      setUsersError(err.message || "Failed to delete user");
    } finally {
      setWorking(false);
    }
  };

  const handleAddNote = async (payload) => {
    if (!auth.accessToken) return;
    setWorking(true);
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
      showToast("Note created successfully.", "success");
    } catch (err) {
      setNotesError(err.message || "Failed to create note");
    } finally {
      setWorking(false);
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
    } catch (err) {
      setNotesError(err.message || "Failed to delete note");
    } finally {
      setWorking(false);
    }
  };

  const handleOpenEditNote = (note) => {
    const interactionTime = setNoteInteraction(note.id);
    setNotes((prev) =>
      prev.map((item) => (item.id === note.id ? { ...item, interactedAt: interactionTime } : item))
    );
    setEditingNote({ ...note });
  };

  const handleCloseEditNote = () => {
    setEditingNote(null);
  };

  const handleUpdateNote = async (id, payload) => {
    if (!auth.accessToken) return;
    setWorking(true);
    setNotesError("");
    try {
      const updatedNote = await updateNote(auth.accessToken, id, payload);
      const interactionTime = setNoteInteraction(id);
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id
            ? { ...note, ...updatedNote, interactedAt: interactionTime }
            : note
        )
      );
      setEditingNote(null);
    } catch (err) {
      setNotesError(err.message || "Failed to update note");
    } finally {
      setWorking(false);
    }
  };

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const visibleNotes = notes.filter((note) => {
      if (!query) return true;
      return (
        note.title.toLowerCase().includes(query) || stripHtml(note.content).toLowerCase().includes(query)
      );
    });

    const getCreatedAtTime = (note) => (note.createdAt ? new Date(note.createdAt).getTime() : 0);
    const getUpdatedAtTime = (note) =>
      note.interactedAt ? new Date(note.interactedAt).getTime() : getCreatedAtTime(note);

    return [...visibleNotes].sort((a, b) => {
      if (notesSort === "created") return getCreatedAtTime(b) - getCreatedAtTime(a);
      if (notesSort === "title") return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      return getUpdatedAtTime(b) - getUpdatedAtTime(a);
    });
  }, [notes, notesSort, search]);
  const favoriteCount = notes.filter((note) => favoriteIds.includes(note.id)).length;
  const recentNotes = [...notes]
    .sort((a, b) => {
      const aTime = a.interactedAt
        ? new Date(a.interactedAt).getTime()
        : a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;
      const bTime = b.interactedAt
        ? new Date(b.interactedAt).getTime()
        : b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;
      return bTime - aTime;
    })
    .slice(0, 3);
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

  const toggleFavorite = async (id) => {
    if (!auth.accessToken) return;
    if (favoritePendingId === id) return;

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

  return (
    <div className="layout-shell">
      <aside className="sidebar">
        <div>
          <h1 className="brand">NoteVault</h1>
          <p className="subtle">Secure & Simple</p>
        </div>
        <nav className="sidebar-nav">
          {mainPages.map((item) => (
            <button
              key={item.id}
              className={item.id === activePage ? "btn nav-item active" : "btn nav-item"}
              onClick={() => setActivePage(item.id)}
              type="button"
            >
              <item.icon className="nav-icon" />
              {item.label}
            </button>
          ))}

          {isAdmin && (
            <div className="admin-menu">
              <button
                className={adminOpen ? "btn nav-item admin-toggle active" : "btn nav-item admin-toggle"}
                type="button"
                onClick={() => setAdminOpen((prev) => !prev)}
              >
                <UsersIcon className="nav-icon" />
                Admin
                <ChevronDownIcon className={adminOpen ? "chevron open" : "chevron"} />
              </button>
              {adminOpen && (
                <button
                  className={activePage === "admin-users" ? "btn subnav-item active" : "btn subnav-item"}
                  onClick={() => setActivePage("admin-users")}
                  type="button"
                >
                  Users
                </button>
              )}
            </div>
          )}
        </nav>
      </aside>

      <div className="app-shell">
        <header className="topbar">
          <div />
          <div className="topbar-actions">
            <button
              type="button"
              className="btn avatar-btn"
              onClick={() => setIsProfileOpen(true)}
              aria-label="Open profile menu"
            >
              <span>{initials}</span>
            </button>
          </div>
        </header>

        <main className="content-area">
          {loading && <p className="status loading">Loading data from backend...</p>}

          {activePage === "dashboard" && (
            <section className="page">
              <h2 className="page-title">
                Welcome back, <span className="accent">{profileName}!</span>
              </h2>
              <p className="subtle">Here&apos;s what&apos;s happening with your notes today.</p>
              <div className="stats-grid">
                <article className="stat-card">
                  <div className="stat-icon">
                    <FileIcon />
                  </div>
                  <h3>{notes.length}</h3>
                  <p>Total Notes</p>
                </article>
                <article className="stat-card">
                  <div className="stat-icon">
                    <ClockIcon />
                  </div>
                  <h3>{recentNotes.length}</h3>
                  <p>Recent Notes</p>
                </article>
                <article className="stat-card">
                  <div className="stat-icon">
                    <StarIcon />
                  </div>
                  <h3>{favoriteCount}</h3>
                  <p>Favorites</p>
                </article>
              </div>
              <div className="section-head">
                <h3 className="section-title">Recent Notes</h3>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <PlusIcon className="btn-icon" />
                  Note
                </button>
              </div>
              <div className="note-grid">
                {recentNotes.map((note) => (
                  <article
                    key={note.id}
                    className="note-card note-card-item editable"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenEditNote(note)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleOpenEditNote(note);
                      }
                    }}
                  >
                    <div className="note-head">
                      <h4>{note.title}</h4>
                      <button
                        type="button"
                        className={
                          favoriteIds.includes(note.id)
                            ? "icon-btn favorite-btn active"
                            : "icon-btn favorite-btn"
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFavorite(note.id);
                        }}
                        disabled={loading || favoritePendingId === note.id}
                      >
                        <StarIcon filled={favoriteIds.includes(note.id)} />
                      </button>
                    </div>
                    <p className="note-card-preview">{stripHtml(note.content)}</p>
                    <div className="note-card-date">
                      <CalendarIcon className="meta-icon" />
                      {note.createdAt
                        ? new Date(note.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })
                        : "Today"}
                    </div>
                  </article>
                ))}
              </div>

              <div className="section-head favorites-head">
                <h3 className="section-title">Favorite Notes</h3>
                <div className="favorites-nav">
                  <button
                    type="button"
                    className="btn btn-ghost nav-arrow"
                    onClick={() => setFavoritesPage((prev) => Math.max(0, prev - 1))}
                    disabled={favoritesPage === 0}
                    aria-label="Previous favorites page"
                  >
                    <ArrowLeftIcon className="nav-arrow-icon" />
                  </button>
                  <span className="favorites-page-indicator">
                    {favoriteNotes.length === 0 ? "0/0" : `${favoritesPage + 1}/${totalFavoritesPages}`}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost nav-arrow"
                    onClick={() =>
                      setFavoritesPage((prev) => Math.min(totalFavoritesPages - 1, prev + 1))
                    }
                    disabled={favoritesPage >= totalFavoritesPages - 1}
                    aria-label="Next favorites page"
                  >
                    <ArrowRightIcon className="nav-arrow-icon" />
                  </button>
                </div>
              </div>
              <div className="note-grid favorites-grid">
                {pagedFavoriteNotes.map((note) => (
                  <article
                    key={note.id}
                    className="note-card note-card-item editable"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenEditNote(note)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleOpenEditNote(note);
                      }
                    }}
                  >
                    <div className="note-head">
                      <h4>{note.title}</h4>
                      <button
                        type="button"
                        className={
                          favoriteIds.includes(note.id)
                            ? "btn icon-btn favorite-btn active"
                            : "btn icon-btn favorite-btn"
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFavorite(note.id);
                        }}
                        disabled={loading || favoritePendingId === note.id}
                      >
                        <StarIcon filled={favoriteIds.includes(note.id)} />
                      </button>
                    </div>
                    <p className="note-card-preview">{stripHtml(note.content)}</p>
                    <div className="note-card-date">
                      <CalendarIcon className="meta-icon" />
                      {note.createdAt
                        ? new Date(note.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })
                        : "Today"}
                    </div>
                  </article>
                ))}
                {pagedFavoriteNotes.length === 0 && (
                  <p className="subtle">No favorites yet. Click the star on any note.</p>
                )}
              </div>
            </section>
          )}

          {activePage === "notes" && (
            <section className="page">
              <div className="notes-search-top">
                <div className="search-wrap notes-search notes-search-centered">
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <SearchIcon className="search-icon" />
                </div>
              </div>
              <div className="section-head notes-head">
                <div className="all-notes-header">
                  <h2 className="panel-title all-notes-title">All Notes</h2>
                  <div className="notes-filter-row">
                    <FilterIcon className="notes-filter-icon" />
                    <div className="notes-sort-group" role="group" aria-label="Sort notes">
                      {notesSortOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={
                            notesSort === option.id
                              ? "btn notes-sort-btn active"
                              : "btn notes-sort-btn"
                          }
                          onClick={() => setNotesSort(option.id)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="notes-toolbar">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <PlusIcon className="btn-icon" />
                    Create Note
                  </button>
                </div>
              </div>
              <NotesPanel
                notes={filteredNotes}
                onEditNote={handleOpenEditNote}
                onDeleteNote={handleDeleteNote}
                onToggleFavorite={toggleFavorite}
                favoriteIds={favoriteIds}
                favoritePendingId={favoritePendingId}
                error={notesError}
                isBusy={working || loading}
              />
            </section>
          )}

          {activePage === "admin-users" && (
            <section className="page">
              <UsersPanel
                users={users}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
                error={usersError}
                isBusy={working || loading}
              />
            </section>
          )}

          {activePage === "settings" && (
            <section className="page panel settings-panel">
              <h2 className="page-title">Settings</h2>
              <p className="subtle">Manage your account settings and preferences.</p>
              <div className="settings-grid">
                <label>
                  Username
                  <input
                    type="text"
                    value={settings.username}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, username: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Email
                  <input type="email" value={auth.email} disabled />
                </label>
              </div>
              <div className="switch-row">
                <span>Dark Mode</span>
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, darkMode: event.target.checked }))
                  }
                />
              </div>
              <div className="switch-row">
                <span>Email Notifications</span>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      emailNotifications: event.target.checked
                    }))
                  }
                />
              </div>
            </section>
          )}
        </main>
      </div>

      <CreateNoteModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleAddNote}
        onNotify={showToast}
        isBusy={working || loading}
      />

      <EditNoteModal
        key={editingNote?.id ?? "edit-note-empty"}
        open={Boolean(editingNote)}
        note={editingNote}
        onClose={handleCloseEditNote}
        onSave={handleUpdateNote}
        onNotify={showToast}
        isBusy={working || loading}
      />

      {toast && (
        <div className="toast-layer">
          <ToastNotice message={toast.message} tone={toast.tone} />
        </div>
      )}

      {isProfileOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="profile-modal">
            <button
              type="button"
              className="btn icon-btn btn-ghost close-profile"
              onClick={() => setIsProfileOpen(false)}
            >
              ×
            </button>
            <div className="profile-avatar">
              <UserIcon />
            </div>
            <h3>{profileName}</h3>
            <p className="subtle">{auth.email}</p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setActivePage("settings");
                setIsProfileOpen(false);
              }}
            >
              Open Settings
            </button>
            <button type="button" className="btn btn-primary profile-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

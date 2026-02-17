import { useCallback, useEffect, useMemo, useState } from "react";
import { UsersPanel } from "./features/users/UsersPanel";
import { NotesPanel } from "./features/notes/NotesPanel";
import { CreateNoteModal } from "./components/CreateNoteModal";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  FileIcon,
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
  fetchNotes,
  fetchUsers,
  login
} from "./services/handsomeApi";

const mainPages = [
  { id: "dashboard", label: "Home", icon: HomeIcon },
  { id: "notes", label: "All Notes", icon: NotesIcon }
];

function deriveNameFromEmail(email) {
  const local = email.split("@")[0] || "User";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [auth, setAuth] = useState({
    accessToken: "",
    refreshToken: "",
    email: ""
  });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState({
    username: "User",
    darkMode: true,
    emailNotifications: true
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [favoritesPage, setFavoritesPage] = useState(0);

  const loadData = useCallback(async () => {
    if (!auth.accessToken) return;

    setLoading(true);
    setNotesError("");
    setUsersError("");
    try {
      const loadedNotes = await fetchNotes(auth.accessToken);
      setNotes(loadedNotes);
    } catch (err) {
      setNotesError(err.message || "Failed to load notes");
    }

    try {
      const loadedUsers = await fetchUsers(auth.accessToken);
      setUsers(loadedUsers);
      setIsAdmin(true);
      const me = loadedUsers.find((user) => user.email === auth.email);
      if (me?.fullName) {
        setSettings((prev) => ({ ...prev, username: me.fullName }));
      }
    } catch (err) {
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
  }, [activePage, auth.accessToken, auth.email]);

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

  const handleLogout = () => {
    setAuth({ accessToken: "", refreshToken: "", email: "" });
    setUsers([]);
    setNotes([]);
    setIsAdmin(false);
    setAdminOpen(false);
    setIsProfileOpen(false);
    setAuthError("");
    setUsersError("");
    setNotesError("");
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
      setNotes((prev) => [
        {
          ...createdNote,
          createdAt: createdNote.createdAt || new Date().toISOString()
        },
        ...prev
      ]);
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
    } catch (err) {
      setNotesError(err.message || "Failed to delete note");
    } finally {
      setWorking(false);
    }
  };

  const filteredNotes = notes.filter((note) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query)
    );
  });
  const favoriteCount = notes.filter((note) => favoriteIds.includes(note.id)).length;
  const recentNotes = [...notes]
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
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

  const toggleFavorite = (id) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
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
          <p className="eyebrow">handsome</p>
          <h1>Welcome back</h1>
          <p className="subtle">Sign in to manage notes and users.</p>
          <div className="row">
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
            <button type="button" className="btn btn-primary" onClick={handleLogin} disabled={authLoading}>
              Sign in
            </button>
          </div>
          {authError && <p className="status error">{authError}</p>}
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
                  Create New Note
                </button>
              </div>
              <div className="note-grid">
                {recentNotes.map((note) => (
                  <article key={note.id} className="note-card">
                    <div className="note-head">
                      <h4>{note.title}</h4>
                      <button
                        type="button"
                        className={
                          favoriteIds.includes(note.id)
                            ? "icon-btn favorite-btn active"
                            : "icon-btn favorite-btn"
                        }
                        onClick={() => toggleFavorite(note.id)}
                      >
                        <StarIcon filled={favoriteIds.includes(note.id)} />
                      </button>
                    </div>
                    <p>{note.content}</p>
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
                  <article key={note.id} className="note-card">
                    <div className="note-head">
                      <h4>{note.title}</h4>
                      <button
                        type="button"
                        className={
                          favoriteIds.includes(note.id)
                            ? "btn icon-btn favorite-btn active"
                            : "btn icon-btn favorite-btn"
                        }
                        onClick={() => toggleFavorite(note.id)}
                      >
                        <StarIcon filled={favoriteIds.includes(note.id)} />
                      </button>
                    </div>
                    <p>{note.content}</p>
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
                <h2 className="panel-title all-notes-title">All Notes</h2>
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
                onDeleteNote={handleDeleteNote}
                onToggleFavorite={toggleFavorite}
                favoriteIds={favoriteIds}
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
        isBusy={working || loading}
      />

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

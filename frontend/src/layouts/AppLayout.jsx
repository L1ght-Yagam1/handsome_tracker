import {
  ChevronDownIcon,
  HomeIcon,
  NotesIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon
} from "../components/Icons";

const mainPages = [
  { id: "dashboard", label: "Home", icon: HomeIcon },
  { id: "notes", label: "All Notes", icon: NotesIcon },
  { id: "settings", label: "Settings", icon: SettingsIcon }
];

export function AppLayout({
  activePage,
  adminOpen,
  children,
  email,
  initials,
  isAdmin,
  isProfileOpen,
  loading,
  onCloseProfile,
  onLogout,
  onOpenProfile,
  onOpenSettings,
  onPageChange,
  onToggleAdmin,
  profileName
}) {
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
              onClick={() => onPageChange(item.id)}
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
                onClick={onToggleAdmin}
              >
                <UsersIcon className="nav-icon" />
                Admin
                <ChevronDownIcon className={adminOpen ? "chevron open" : "chevron"} />
              </button>
              {adminOpen && (
                <button
                  className={activePage === "admin-users" ? "btn subnav-item active" : "btn subnav-item"}
                  onClick={() => onPageChange("admin-users")}
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
              onClick={onOpenProfile}
              aria-label="Open profile menu"
            >
              <span>{initials}</span>
            </button>
          </div>
        </header>

        <main className="content-area">
          {loading && <p className="status loading">Loading data from backend...</p>}
          {children}
        </main>
      </div>

      {isProfileOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="profile-modal">
            <button
              type="button"
              className="btn icon-btn btn-ghost close-profile"
              onClick={onCloseProfile}
            >
              ×
            </button>
            <div className="profile-avatar">
              <UserIcon />
            </div>
            <h3>{profileName}</h3>
            <p className="subtle">{email}</p>
            <button type="button" className="btn btn-ghost" onClick={onOpenSettings}>
              Open Settings
            </button>
            <button type="button" className="btn btn-primary profile-logout" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

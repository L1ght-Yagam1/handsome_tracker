export function SettingsPage({ email, onSave, onSettingsChange, settings }) {
  return (
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
              onSettingsChange((prev) => ({ ...prev, username: event.target.value }))
            }
          />
        </label>
        <label>
          Email
          <input type="email" value={email} disabled />
        </label>
      </div>

      <div className="switch-row">
        <span>Dark Mode</span>
        <input
          type="checkbox"
          checked={settings.darkMode}
          onChange={(event) =>
            onSettingsChange((prev) => ({ ...prev, darkMode: event.target.checked }))
          }
        />
      </div>

      <div className="switch-row">
        <span>Email Notifications</span>
        <input
          type="checkbox"
          checked={settings.emailNotifications}
          onChange={(event) =>
            onSettingsChange((prev) => ({
              ...prev,
              emailNotifications: event.target.checked
            }))
          }
        />
      </div>

      <div className="page-actions">
        <button type="button" className="btn btn-primary" onClick={onSave}>
          Save Changes
        </button>
      </div>
    </section>
  );
}

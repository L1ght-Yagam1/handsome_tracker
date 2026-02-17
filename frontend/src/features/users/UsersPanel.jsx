import { useState } from "react";

export function UsersPanel({ users, onAddUser, onDeleteUser, isBusy, error }) {
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    password: "",
    isSuperuser: false
  });

  const addUser = async () => {
    const email = form.email.trim();
    const password = form.password;
    if (!email || !password) return;

    await onAddUser({
      email,
      password,
      fullName: form.fullName.trim(),
      isSuperuser: form.isSuperuser
    });
    setForm({ email: "", fullName: "", password: "", isSuperuser: false });
  };

  return (
    <section className="panel">
      <h2 className="panel-title">Users</h2>
      <div className="users-row">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          disabled={isBusy}
        />
        <input
          type="text"
          placeholder="Full name"
          value={form.fullName}
          onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
          disabled={isBusy}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          disabled={isBusy}
        />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.isSuperuser}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, isSuperuser: event.target.checked }))
            }
            disabled={isBusy}
          />
          Superuser
        </label>
        <button onClick={addUser} type="button" className="btn btn-primary" disabled={isBusy}>
          Add user
        </button>
      </div>
      {error && <p className="status error">{error}</p>}

      <ul className="list users-list">
        {users.map((user) => (
          <li key={user.id} className="list-item user-item">
            <span>
              <strong>{user.email}</strong>
              {user.fullName ? ` (${user.fullName})` : ""}{" "}
              {!user.isActive ? "[inactive]" : ""} {user.isSuperuser ? "[admin]" : ""}
            </span>
            <button
              onClick={() => onDeleteUser(user.id)}
              type="button"
              className="btn btn-ghost"
              disabled={isBusy}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

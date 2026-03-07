import { useEffect, useState } from "react";
import { ModalShell } from "../../../components/ModalShell";
import { PlusIcon, XIcon } from "../../../components/Icons";

const EMPTY_FORM = {
  email: "",
  fullName: "",
  password: "",
  isSuperuser: false
};

export function CreateUserModal({ isBusy, onClose, onCreateUser, open }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    const email = form.email.trim();
    const password = form.password;
    if (!email || !password) return;

    const createdUser = await onCreateUser({
      email,
      password,
      fullName: form.fullName.trim(),
      isSuperuser: form.isSuperuser
    });

    if (createdUser) {
      onClose();
    }
  };

  return (
    <ModalShell title="Create user" className="user-modal-card">
      <div className="modal-header">
        <div>
          <h3>Create User</h3>
          <p className="subtle modal-subtitle">Account creation is isolated from the main table actions.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn icon-btn btn-ghost"
          disabled={isBusy}
          aria-label="Close create user modal"
        >
          <XIcon />
        </button>
      </div>

      <div className="modal-body">
        <label className="modal-field">
          Email
          <input
            type="email"
            placeholder="user@company.com"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            disabled={isBusy}
          />
        </label>

        <label className="modal-field">
          Full name
          <input
            type="text"
            placeholder="Jane Doe"
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            disabled={isBusy}
          />
        </label>

        <label className="modal-field">
          Temporary password
          <input
            type="password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            disabled={isBusy}
          />
        </label>

        <label className="checkbox checkbox-card">
          <input
            type="checkbox"
            checked={form.isSuperuser}
            onChange={(event) => setForm((prev) => ({ ...prev, isSuperuser: event.target.checked }))}
            disabled={isBusy}
          />
          Grant admin access
        </label>
      </div>

      <div className="modal-actions">
        <button type="button" onClick={handleSubmit} className="btn btn-primary" disabled={isBusy}>
          <PlusIcon className="btn-icon" />
          Create User
        </button>
        <button type="button" className="btn btn-ghost btn-cancel" onClick={onClose} disabled={isBusy}>
          Cancel
        </button>
      </div>
    </ModalShell>
  );
}

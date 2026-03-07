import { useMemo, useState } from "react";
import { PlusIcon } from "../../components/Icons";
import { CreateUserModal } from "./components/CreateUserModal";
import { UsersTable } from "./components/UsersTable";

export function UsersPanel({ users, onAddUser, onDeleteUser, isBusy, error }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const activeUsersCount = useMemo(
    () => users.filter((user) => user.isActive).length,
    [users]
  );
  const adminsCount = useMemo(
    () => users.filter((user) => user.isSuperuser).length,
    [users]
  );

  return (
    <section className="users-page">
      <div className="users-hero panel">
        <div>
          <p className="eyebrow">Administration</p>
          <h2 className="page-title users-page-title">Users</h2>
          <p className="subtle users-page-subtitle">
            Manage accounts, permissions and access from a separate admin workspace.
          </p>
        </div>

        <div className="users-hero-actions">
          <div className="users-summary-card">
            <span className="users-summary-value">{users.length}</span>
            <span className="users-summary-label">total accounts</span>
          </div>
          <div className="users-summary-card">
            <span className="users-summary-value">{activeUsersCount}</span>
            <span className="users-summary-label">active users</span>
          </div>
          <div className="users-summary-card">
            <span className="users-summary-value">{adminsCount}</span>
            <span className="users-summary-label">admins</span>
          </div>
          <button
            type="button"
            className="btn btn-primary users-add-btn"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={isBusy}
          >
            <PlusIcon className="btn-icon" />
            Add User
          </button>
        </div>
      </div>

      {error && <p className="status error">{error}</p>}

      <div className="panel users-table-panel">
        <div className="section-head users-table-head">
          <div>
            <h3 className="section-title">Directory</h3>
            <p className="subtle">Separate viewing from actions to keep admin flows predictable.</p>
          </div>
        </div>

        <UsersTable users={users} onDeleteUser={onDeleteUser} isBusy={isBusy} />
      </div>

      <CreateUserModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateUser={onAddUser}
        isBusy={isBusy}
      />
    </section>
  );
}

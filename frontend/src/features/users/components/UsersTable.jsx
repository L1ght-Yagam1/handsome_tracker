function UserRoleBadge({ isSuperuser }) {
  return (
    <span className={isSuperuser ? "users-role-badge admin" : "users-role-badge member"}>
      {isSuperuser ? "Admin" : "Member"}
    </span>
  );
}

function UserStatusBadge({ isActive }) {
  return (
    <span className={isActive ? "users-status-badge active" : "users-status-badge inactive"}>
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export function UsersTable({ isBusy, onDeleteUser, users }) {
  if (users.length === 0) {
    return <p className="subtle users-empty-state">No users found.</p>;
  }

  return (
    <div className="users-table-wrap">
      <table className="users-table">
        <colgroup>
          <col className="users-col-user" />
          <col className="users-col-role" />
          <col className="users-col-status" />
          <col className="users-col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th>
              <div className="users-header-label users-header-label-left">User</div>
            </th>
            <th>
              <div className="users-header-label users-header-label-center">Role</div>
            </th>
            <th>
              <div className="users-header-label users-header-label-center">Status</div>
            </th>
            <th>
              <div className="users-header-label users-header-label-center">Actions</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="users-identity">
                  <div className="users-avatar">{(user.fullName || user.email)[0]?.toUpperCase() || "U"}</div>
                  <div>
                    <strong>{user.fullName || "Unnamed user"}</strong>
                    <span>{user.email}</span>
                  </div>
                </div>
              </td>
              <td className="users-table-center">
                <div className="users-cell-center">
                  <UserRoleBadge isSuperuser={user.isSuperuser} />
                </div>
              </td>
              <td className="users-table-center">
                <div className="users-cell-center">
                  <UserStatusBadge isActive={user.isActive} />
                </div>
              </td>
              <td className="users-table-center">
                <div className="users-cell-center">
                  <button
                    onClick={() => onDeleteUser(user.id)}
                    type="button"
                    className="btn btn-ghost users-delete-btn"
                    disabled={isBusy}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

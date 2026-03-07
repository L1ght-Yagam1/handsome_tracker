import { UsersPanel } from "../features/users/UsersPanel";

export function UsersPage({ error, isBusy, onAddUser, onDeleteUser, users }) {
  return (
    <section className="page">
      <UsersPanel
        users={users}
        onAddUser={onAddUser}
        onDeleteUser={onDeleteUser}
        error={error}
        isBusy={isBusy}
      />
    </section>
  );
}

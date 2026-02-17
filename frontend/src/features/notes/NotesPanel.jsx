import { CalendarIcon, StarIcon } from "../../components/Icons";

export function NotesPanel({
  notes,
  onDeleteNote,
  onToggleFavorite,
  favoriteIds,
  isBusy,
  error
}) {
  return (
    <section>
      {error && <p className="status error">{error}</p>}
      <ul className="notes-card-grid">
        {notes.map((note) => (
          <li key={note.id} className="note-card-item">
            <div className="note-card-head">
              <h3>{note.title}</h3>
                <button
                  type="button"
                  className={
                    favoriteIds.includes(note.id)
                      ? "btn icon-btn favorite-btn active"
                      : "btn icon-btn favorite-btn"
                  }
                  onClick={() => onToggleFavorite(note.id)}
                  disabled={isBusy}
                >
                <StarIcon filled={favoriteIds.includes(note.id)} />
              </button>
            </div>
            <p className="note-card-preview">{note.content}</p>
            <div className="note-card-meta">
              <span className="note-time">
                <CalendarIcon className="meta-icon" />
                {note.createdAt
                  ? new Date(note.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })
                  : "Today"}
              </span>
              <button
                onClick={() => onDeleteNote(note.id)}
                type="button"
                className="btn btn-ghost"
                disabled={isBusy}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {notes.length === 0 && <p className="subtle">No notes found.</p>}
    </section>
  );
}

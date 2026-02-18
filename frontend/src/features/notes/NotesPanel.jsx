import { CalendarIcon, StarIcon } from "../../components/Icons";
import { stripHtml } from "../../utils/noteContent";

export function NotesPanel({
  notes,
  onEditNote,
  onDeleteNote,
  onToggleFavorite,
  favoriteIds,
  favoritePendingId,
  isBusy,
  error
}) {
  return (
    <section>
      {error && <p className="status error">{error}</p>}
      <ul className="notes-card-grid">
        {notes.map((note) => (
          <li
            key={note.id}
            className="note-card-item editable"
            role="button"
            tabIndex={0}
            onClick={() => onEditNote(note)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onEditNote(note);
              }
            }}
          >
            <div className="note-card-head">
              <h3>{note.title}</h3>
                <button
                  type="button"
                  className={
                    favoriteIds.includes(note.id)
                      ? "btn icon-btn favorite-btn active"
                      : "btn icon-btn favorite-btn"
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleFavorite(note.id);
                  }}
                  disabled={isBusy || favoritePendingId === note.id}
                >
                <StarIcon filled={favoriteIds.includes(note.id)} />
              </button>
            </div>
            <p className="note-card-preview">{stripHtml(note.content)}</p>
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
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteNote(note.id);
                }}
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

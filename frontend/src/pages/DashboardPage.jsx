import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  FileIcon,
  PlusIcon,
  StarIcon
} from "../components/Icons";
import { stripHtml } from "../utils/noteContent";

function NoteCard({ favoriteIds, favoritePendingId, note, onOpenNote, onToggleFavorite }) {
  return (
    <article
      className="note-card note-card-item editable"
      role="button"
      tabIndex={0}
      onClick={() => onOpenNote(note)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenNote(note);
        }
      }}
    >
      <div className="note-head">
        <h4>{note.title}</h4>
        <button
          type="button"
          className={favoriteIds.includes(note.id) ? "icon-btn favorite-btn active" : "icon-btn favorite-btn"}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(note.id);
          }}
          disabled={favoritePendingId === note.id}
        >
          <StarIcon filled={favoriteIds.includes(note.id)} />
        </button>
      </div>
      <p className="note-card-preview">{stripHtml(note.content)}</p>
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
  );
}

export function DashboardPage({
  favoriteCount,
  favoriteIds,
  favoriteNotes,
  favoritePendingId,
  favoritesPage,
  notes,
  onCreateNote,
  onFavoritesPageChange,
  onOpenNote,
  onToggleFavorite,
  pagedFavoriteNotes,
  profileName,
  recentNotes,
  totalFavoritesPages
}) {
  return (
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
        <button type="button" className="btn btn-primary" onClick={onCreateNote}>
          <PlusIcon className="btn-icon" />
          Note
        </button>
      </div>

      <div className="note-grid">
        {recentNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            favoriteIds={favoriteIds}
            favoritePendingId={favoritePendingId}
            onOpenNote={onOpenNote}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      <div className="section-head favorites-head">
        <h3 className="section-title">Favorite Notes</h3>
        <div className="favorites-nav">
          <button
            type="button"
            className="btn btn-ghost nav-arrow"
            onClick={() => onFavoritesPageChange((prev) => Math.max(0, prev - 1))}
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
              onFavoritesPageChange((prev) => Math.min(totalFavoritesPages - 1, prev + 1))
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
          <NoteCard
            key={note.id}
            note={note}
            favoriteIds={favoriteIds}
            favoritePendingId={favoritePendingId}
            onOpenNote={onOpenNote}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
        {pagedFavoriteNotes.length === 0 && (
          <p className="subtle">No favorites yet. Click the star on any note.</p>
        )}
      </div>
    </section>
  );
}

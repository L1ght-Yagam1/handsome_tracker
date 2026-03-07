import { FilterIcon, PlusIcon, SearchIcon } from "../components/Icons";
import { NotesPanel } from "../features/notes/NotesPanel";

const notesSortOptions = [
  { id: "created", label: "Created" },
  { id: "updated", label: "Updated" },
  { id: "title", label: "Title" }
];

export function NotesPage({
  error,
  favoriteIds,
  favoritePendingId,
  isBusy,
  notes,
  notesSort,
  onCreateNote,
  onDeleteNote,
  onEditNote,
  onSearchChange,
  onSortChange,
  onToggleFavorite,
  search
}) {
  return (
    <section className="page">
      <div className="notes-search-top">
        <div className="search-wrap notes-search notes-search-centered">
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <SearchIcon className="search-icon" />
        </div>
      </div>

      <div className="section-head notes-head">
        <div className="all-notes-header">
          <h2 className="panel-title all-notes-title">All Notes</h2>
          <div className="notes-filter-row">
            <FilterIcon className="notes-filter-icon" />
            <div className="notes-sort-group" role="group" aria-label="Sort notes">
              {notesSortOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={notesSort === option.id ? "btn notes-sort-btn active" : "btn notes-sort-btn"}
                  onClick={() => onSortChange(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="notes-toolbar">
          <button type="button" className="btn btn-primary" onClick={onCreateNote}>
            <PlusIcon className="btn-icon" />
            Create Note
          </button>
        </div>
      </div>

      <NotesPanel
        notes={notes}
        onEditNote={onEditNote}
        onDeleteNote={onDeleteNote}
        onToggleFavorite={onToggleFavorite}
        favoriteIds={favoriteIds}
        favoritePendingId={favoritePendingId}
        error={error}
        isBusy={isBusy}
      />
    </section>
  );
}

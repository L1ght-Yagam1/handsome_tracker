import { useMemo, useState } from "react";
import {
  CalendarIcon,
  FileIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  TrashIcon,
  XIcon
} from "../../components/Icons";
import { RichTextEditor } from "../../components/RichTextEditor";
import { stripHtml } from "../../utils/noteContent";

function formatNoteDate(value) {
  if (!value) return "Today";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getAutosaveLabel(status) {
  if (status === "saving") return "Saving...";
  if (status === "saved") return "Saved";
  if (status === "error") return "Save failed";
  return "Unsaved";
}

export function NoteWorkspace({
  autosaveStatus,
  draft,
  favoriteIds,
  favoritePendingId,
  isBusy,
  notes,
  onChangeDraft,
  onClose,
  onCreateNew,
  onDeleteNote,
  onSelectNote,
  onToggleFavorite
}) {
  const [sidebarQuery, setSidebarQuery] = useState("");
  const isExistingNote = Boolean(draft.id);
  const filteredSidebarNotes = useMemo(() => {
    const query = sidebarQuery.trim().toLowerCase();
    if (!query) return notes;

    return notes.filter((note) => {
      const title = (note.title || "").toLowerCase();
      const preview = stripHtml(note.content).toLowerCase();
      return title.includes(query) || preview.includes(query);
    });
  }, [notes, sidebarQuery]);

  return (
    <section className="note-workspace">
      <div className="note-workspace-shell">
        <div className="note-workspace-main">
          <div className="note-workspace-topbar">
            <div className="note-workspace-topbar-left">
              <p className="eyebrow">Editor</p>
              <p className="subtle">Toolbar on top, document in the center, files on the right.</p>
            </div>

            <div className="note-workspace-topbar-actions">
              <span className={`note-workspace-autosave ${autosaveStatus || "idle"}`}>
                {getAutosaveLabel(autosaveStatus)}
              </span>
            </div>
          </div>

          <div className="note-workspace-editor-panel">
            <div className="note-workspace-title-panel">
              <input
                type="text"
                className="note-workspace-title-input"
                placeholder="Note title"
                value={draft.title}
                onChange={(event) => onChangeDraft("title", event.target.value)}
                disabled={isBusy}
              />
              <div className="note-workspace-meta">
                <span className="note-workspace-meta-chip">
                  <CalendarIcon className="meta-icon" />
                  {formatNoteDate(draft.createdAt)}
                </span>
                {isExistingNote && (
                  <button
                    type="button"
                    className={
                      favoriteIds.includes(draft.id)
                        ? "btn icon-btn favorite-btn active"
                        : "btn icon-btn favorite-btn"
                    }
                    onClick={() => onToggleFavorite(draft.id)}
                    disabled={isBusy || favoritePendingId === draft.id}
                    aria-label="Toggle favorite note"
                  >
                    <StarIcon filled={favoriteIds.includes(draft.id)} />
                  </button>
                )}
              </div>
            </div>

            <RichTextEditor
              value={draft.content}
              onChange={(nextContent) => onChangeDraft("content", nextContent)}
              isBusy={isBusy}
              className="note-workspace-rte"
            />
          </div>
        </div>

        <aside className="note-workspace-sidebar">
          <div className="note-workspace-sidebar-header">
            <div>
              <p className="eyebrow">Navigator</p>
              <h3>Notes</h3>
            </div>
            <div className="note-workspace-sidebar-header-actions">
              <button type="button" className="btn btn-primary" onClick={onCreateNew} disabled={isBusy}>
                <PlusIcon className="btn-icon" />
                New
              </button>
              <button
                type="button"
                className="btn btn-ghost icon-btn note-workspace-close-btn"
                onClick={onClose}
                disabled={isBusy}
                aria-label="Close note workspace"
                title="Close"
              >
                <XIcon />
              </button>
            </div>
          </div>

          <div className="note-workspace-sidebar-search">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              value={sidebarQuery}
              onChange={(event) => setSidebarQuery(event.target.value)}
              placeholder="Find note..."
              aria-label="Find note"
            />
          </div>

          <div className="note-workspace-sidebar-list">
            {filteredSidebarNotes.map((note) => {
              const isActive = draft.id ? note.id === draft.id : false;
              return (
                <button
                  key={note.id}
                  type="button"
                  className={isActive ? "note-switcher active" : "note-switcher"}
                  onClick={() => onSelectNote(note.id)}
                >
                  <div className="note-switcher-file">
                    <FileIcon className="note-switcher-file-icon" />
                    <div className="note-switcher-file-content">
                      <strong>{note.title || "Untitled note"}</strong>
                      <span>{formatNoteDate(note.createdAt)}</span>
                    </div>
                    {favoriteIds.includes(note.id) && <StarIcon className="note-switcher-star" filled />}
                    <button
                      type="button"
                      className="btn icon-btn btn-ghost note-switcher-delete-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteNote(note.id);
                      }}
                      disabled={isBusy}
                      aria-label="Delete note"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </button>
              );
            })}
            {filteredSidebarNotes.length === 0 && (
              <p className="subtle note-workspace-sidebar-empty">No notes match this search.</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import { RichTextEditor } from "./RichTextEditor";
import { normalizeEditorContentForSave } from "../utils/noteContent";

export function EditNoteModal({ open, note, onClose, onSave, onNotify, isBusy }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open || !note) return;
    setTitle(note.title || "");
    setContent(note.content || "");
  }, [open, note]);

  if (!open || !note) return null;

  const handleSave = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      onNotify?.("Title is required to save changes.", "warning");
      return;
    }
    await onSave(note.id, {
      title: cleanTitle,
      content: normalizeEditorContentForSave(content)
    });
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card note-editor-modal">
        <div className="modal-header">
          <h3>Edit Note</h3>
        </div>
        <div className="modal-body">
          <label className="modal-field">
            Title
            <input
              type="text"
              placeholder="Enter note title..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isBusy}
            />
          </label>
          <div className="modal-field">
            <span>Content</span>
            <RichTextEditor value={content} onChange={setContent} isBusy={isBusy} />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={handleSave} className="btn btn-primary" disabled={isBusy}>
            Save Changes
          </button>
          <button type="button" className="btn btn-ghost btn-cancel" onClick={onClose} disabled={isBusy}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

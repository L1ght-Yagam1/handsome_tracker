import { useEffect, useState } from "react";
import { PlusIcon, XIcon } from "./Icons";
import { RichTextEditor } from "./RichTextEditor";
import { normalizeEditorContentForSave } from "../utils/noteContent";

export function CreateNoteModal({ open, onClose, onSave, onNotify, isBusy }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setContent("");
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      onNotify?.("Title is required to create a note.", "warning");
      return;
    }
    await onSave({ title: cleanTitle, content: normalizeEditorContentForSave(content) });
    setTitle("");
    setContent("");
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Create New Note</h3>
          <button
            type="button"
            onClick={onClose}
            className="btn icon-btn btn-ghost"
            disabled={isBusy}
          >
            <XIcon />
          </button>
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
            <RichTextEditor
              value={content}
              onChange={setContent}
              isBusy={isBusy}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={handleSave} className="btn btn-primary" disabled={isBusy}>
            <PlusIcon className="btn-icon" />
            Create Note
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-cancel"
            onClick={onClose}
            disabled={isBusy}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

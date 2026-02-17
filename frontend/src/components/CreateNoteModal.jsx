import { useState } from "react";
import { PlusIcon, XIcon } from "./Icons";

export function CreateNoteModal({ open, onClose, onSave, isBusy }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  if (!open) return null;

  const handleSave = async () => {
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    if (!cleanTitle || !cleanContent) return;
    await onSave({ title: cleanTitle, content: cleanContent });
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
          <label className="modal-field">
            Content
            <textarea
              placeholder="Write your note..."
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={7}
              disabled={isBusy}
            />
          </label>
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

import { useEffect } from "react";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { ensureEditorHtml } from "../utils/noteContent";

function ToolbarButton({ onClick, isActive, disabled, label }) {
  return (
    <button
      type="button"
      className={isActive ? "btn btn-ghost rte-btn active" : "btn btn-ghost rte-btn"}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

function isMarkActive(editor, markName) {
  const { selection } = editor.state;
  if (!selection.empty) {
    return editor.isActive(markName);
  }
  return selection.$from.marks().some((mark) => mark.type.name === markName);
}

export function RichTextEditor({ value, onChange, isBusy }) {
  const normalizedValue = ensureEditorHtml(value);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: normalizedValue,
    editorProps: {
      attributes: {
        class: "rte-content"
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    onFocus: ({ editor: currentEditor }) => {
      if (currentEditor.isEmpty) {
        currentEditor.commands.unsetAllMarks();
        currentEditor.view.dispatch(currentEditor.state.tr.setStoredMarks([]));
      }
    },
    onCreate: ({ editor: currentEditor }) => {
      if (currentEditor.isEmpty) {
        currentEditor.commands.unsetAllMarks();
        currentEditor.view.dispatch(currentEditor.state.tr.setStoredMarks([]));
      }
    }
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== normalizedValue) {
      editor.commands.setContent(normalizedValue, false);
    }
  }, [editor, normalizedValue]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isBusy);
  }, [editor, isBusy]);

  if (!editor) return null;

  return (
    <div className="rte-wrap">
      <div className="rte-toolbar">
        <ToolbarButton
          label="B"
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={isMarkActive(editor, "bold")}
          disabled={isBusy}
        />
        <ToolbarButton
          label="I"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={isMarkActive(editor, "italic")}
          disabled={isBusy}
        />
        <ToolbarButton
          label="U"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={isMarkActive(editor, "underline")}
          disabled={isBusy}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

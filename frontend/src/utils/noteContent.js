export function stripHtml(value) {
  if (!value) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeEditorContentForSave(html) {
  return stripHtml(html) ? String(html) : "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function looksLikeHtml(value) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function ensureEditorHtml(value) {
  if (!value) return "<p></p>";
  const source = String(value);
  if (looksLikeHtml(source)) return source;
  const withBreaks = escapeHtml(source).replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n/g, "<br>");
  return `<p>${withBreaks}</p>`;
}

export function ToastNotice({ message, tone = "warning" }) {
  const toneClass =
    tone === "success" ? "toast-success" : tone === "error" ? "toast-error" : "toast-warning";

  return (
    <div className={`toast-notice ${toneClass}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}

export function ModalShell({ children, className = "", title }) {
  const modalClassName = className ? `modal-card ${className}` : "modal-card";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className={modalClassName}>{children}</div>
    </div>
  );
}

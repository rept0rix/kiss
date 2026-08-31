export function Confirm({
  open,
  title,
  body,
  yes,
  no = "Cancel",
  onYes,
  onNo,
}: {
  open: boolean;
  title: string;
  body: string;
  yes: string;
  no?: string;
  onYes: () => void;
  onNo: () => void;
}) {
  if (!open) return null;
  return (
    <div className="sheet-scrim confirm-scrim" onClick={onNo}>
      <div className="confirm-card" role="dialog" onClick={(e) => e.stopPropagation()}>
        <p className="font-display text-xl">{title}</p>
        <p className="mt-2 text-sm text-muted">{body}</p>
        <div className="confirm-actions">
          <button type="button" className="confirm-no" onClick={onNo}>
            {no}
          </button>
          <button type="button" className="confirm-yes" onClick={onYes}>
            {yes}
          </button>
        </div>
      </div>
    </div>
  );
}

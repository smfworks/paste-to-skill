interface ActionsProps {
  disabled: boolean;
  busy: "copy" | "download" | "share" | null;
  onCopy: () => void;
  onDownload: () => void;
  onShare: () => void;
  onReset: () => void;
}

export function Actions({
  disabled,
  busy,
  onCopy,
  onDownload,
  onShare,
  onReset,
}: ActionsProps) {
  return (
    <div className="actions">
      <button
        type="button"
        className="btn btn-ember"
        disabled={disabled || busy !== null}
        onClick={onCopy}
      >
        {busy === "copy" ? "Copying…" : "Copy markdown"}
      </button>
      <button type="button" className="btn" disabled={disabled || busy !== null} onClick={onDownload}>
        {busy === "download" ? "Saving…" : "Download SKILL.md"}
      </button>
      <button type="button" className="btn" disabled={disabled || busy !== null} onClick={onShare}>
        {busy === "share" ? "Copying…" : "Copy share text"}
      </button>
      <button type="button" className="btn btn-ghost" onClick={onReset}>
        Reset
      </button>
    </div>
  );
}

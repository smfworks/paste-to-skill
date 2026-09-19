import { useEffect, useState } from "react";

interface HandoffBannerProps {
  onPaste: (text: string) => void;
}

export function HandoffBanner({ onPaste }: HandoffBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setVisible(params.get("handoff") === "1");
  }, []);

  if (!visible) return null;

  return (
    <div className="handoff-banner" role="status">
      <span>A sister app copied an artifact to the clipboard.</span>
      <button
        type="button"
        className="btn"
        onClick={() => {
          void (async () => {
            try {
              const text = await navigator.clipboard.readText();
              if (!text.trim()) return;
              onPaste(text);
              setVisible(false);
            } catch {
              /* permission denied — Ctrl+V still works */
            }
          })();
        }}
      >
        Paste it here
      </button>
    </div>
  );
}

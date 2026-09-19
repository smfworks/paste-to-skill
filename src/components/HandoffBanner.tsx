import { useEffect, useState } from "react";
import type { HandoffKind } from "../data/kit";

interface HandoffBannerProps {
  onPaste: (text: string) => void;
  accept?: HandoffKind | HandoffKind[];
}

function clearHandoffQuery(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("handoff") && !url.searchParams.has("kind")) return;
  url.searchParams.delete("handoff");
  url.searchParams.delete("kind");
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", next);
}

export function HandoffBanner({ onPaste, accept }: HandoffBannerProps) {
  const [visible, setVisible] = useState(false);
  const [kind, setKind] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setVisible(params.get("handoff") === "1");
    setKind(params.get("kind"));
  }, []);

  if (!visible) return null;

  const accepted = accept == null ? [] : Array.isArray(accept) ? accept : [accept];
  const mismatch =
    kind &&
    accepted.length > 0 &&
    kind !== "plain" &&
    !accepted.includes(kind as HandoffKind);

  return (
    <div className="handoff-banner" role="status">
      <span>
        {mismatch
          ? `Clipboard handoff is “${kind}”; this app expects ${accepted.join(" or ")}.`
          : "A sister app copied an artifact to the clipboard."}
      </span>
      <button
        type="button"
        className="btn"
        onClick={() => {
          void (async () => {
            try {
              const text = await navigator.clipboard.readText();
              if (!text.trim()) {
                setError("Clipboard is empty.");
                return;
              }
              onPaste(text);
              setVisible(false);
              clearHandoffQuery();
            } catch {
              setError("Clipboard permission denied — use Ctrl+V in the paste box.");
            }
          })();
        }}
      >
        Paste it here
      </button>
      {error ? <span className="handoff-error">{error}</span> : null}
    </div>
  );
}

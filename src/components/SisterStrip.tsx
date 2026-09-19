import { KIT_NEXT, VIRAL_KIT, type HandoffKind, type ViralKitId } from "../data/kit";

interface SisterStripProps {
  current: ViralKitId;
  payload?: string;
  kind?: HandoffKind;
}

function isModifiedClick(event: {
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  button: number;
}): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function openSister(demo: string, payload: string, kind: HandoffKind | undefined): void {
  const win = window.open("about:blank", "_blank");
  if (!win) return;
  win.opener = null;
  void (async () => {
    const url = new URL(demo);
    try {
      await navigator.clipboard.writeText(payload);
      url.searchParams.set("handoff", "1");
      if (kind) url.searchParams.set("kind", kind);
    } catch {
      /* open the demo without a handoff banner */
    }
    win.location.replace(url.toString());
  })();
}

export function SisterStrip({ current, payload, kind }: SisterStripProps) {
  const nextIds = KIT_NEXT[current] ?? [];
  const next = nextIds
    .map((id) => VIRAL_KIT.find((item) => item.id === id))
    .filter((item): item is (typeof VIRAL_KIT)[number] => Boolean(item));

  const onNextClick = (
    event: {
      preventDefault: () => void;
      metaKey: boolean;
      ctrlKey: boolean;
      shiftKey: boolean;
      altKey: boolean;
      button: number;
    },
    demo: string,
  ) => {
    if (!payload?.trim() || isModifiedClick(event)) return;
    event.preventDefault();
    openSister(demo, payload, kind);
  };

  return (
    <div className="kit-nav">
      <nav className="sisters" aria-label="SMF Works viral kit">
        {VIRAL_KIT.map((item, index) => {
          const n = String(index + 1).padStart(2, "0");
          if (item.id === current) {
            return (
              <span className="sisters-current" key={item.id} aria-current="page">
                <span>{n}</span>
                <strong>{item.label}</strong>
                <small>{item.blurb}</small>
              </span>
            );
          }
          return (
            <a href={item.demo} rel="noreferrer" target="_blank" key={item.id}>
              <span>{n}</span>
              <strong>{item.label}</strong>
              <small>{item.blurb}</small>
            </a>
          );
        })}
      </nav>
      {next.length ? (
        <p className="kit-next">
          Next in the kit:{" "}
          {next.map((item, index) => (
            <span key={item.id}>
              {index > 0 ? " · " : null}
              <a
                href={item.demo}
                rel="noreferrer"
                target="_blank"
                onClick={(event) => onNextClick(event, item.demo)}
              >
                {item.label}
              </a>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

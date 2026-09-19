import { KIT_NEXT, VIRAL_KIT, type ViralKitId } from "../data/kit";

interface SisterStripProps {
  current: ViralKitId;
  payload?: string;
}

async function openSister(demo: string, payload?: string) {
  const url = new URL(demo);
  if (payload?.trim()) {
    try {
      await navigator.clipboard.writeText(payload);
      url.searchParams.set("handoff", "1");
    } catch {
      /* still navigate */
    }
  }
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

export function SisterStrip({ current, payload }: SisterStripProps) {
  const nextIds = KIT_NEXT[current] ?? [];
  const next = nextIds
    .map((id) => VIRAL_KIT.find((item) => item.id === id))
    .filter((item): item is (typeof VIRAL_KIT)[number] => Boolean(item));

  const onKitClick = (event: { preventDefault: () => void }, demo: string) => {
    if (!payload?.trim()) return;
    event.preventDefault();
    void openSister(demo, payload);
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
            <a
              href={item.demo}
              rel="noreferrer"
              target="_blank"
              key={item.id}
              onClick={(event) => onKitClick(event, item.demo)}
            >
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
                onClick={(event) => onKitClick(event, item.demo)}
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

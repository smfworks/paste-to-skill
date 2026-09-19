import { KIT_NEXT, VIRAL_KIT, type ViralKitId } from "../data/kit";

interface SisterStripProps {
  current: ViralKitId;
}

export function SisterStrip({ current }: SisterStripProps) {
  const nextIds = KIT_NEXT[current] ?? [];
  const next = nextIds
    .map((id) => VIRAL_KIT.find((item) => item.id === id))
    .filter((item): item is (typeof VIRAL_KIT)[number] => Boolean(item));

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
              <a href={item.demo} rel="noreferrer" target="_blank">
                {item.label}
              </a>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

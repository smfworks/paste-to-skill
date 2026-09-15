import { PASTE_PLACEHOLDER, SAMPLES } from "../data/samples";

interface ComposerProps {
  raw: string;
  sampleId: string | null;
  onRawChange: (value: string) => void;
  onSample: (id: string) => void;
}

export function Composer({ raw, sampleId, onRawChange, onSample }: ComposerProps) {
  return (
    <section className="composer">
      <div className="composer-head">
        <h2>Paste</h2>
        <p>An SOP, email thread, checklist, or JSON other tools emit.</p>
      </div>
      <div className="sample-row" role="list">
        {SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            role="listitem"
            className={sampleId === sample.id ? "chip is-on" : "chip"}
            onClick={() => onSample(sample.id)}
          >
            <span>{sample.label}</span>
            <small>{sample.blurb}</small>
          </button>
        ))}
      </div>
      <label className="editor-label" htmlFor="paste-input">
        Notes
      </label>
      <textarea
        id="paste-input"
        value={raw}
        onChange={(event) => onRawChange(event.target.value)}
        placeholder={PASTE_PLACEHOLDER}
        spellCheck={false}
        autoComplete="off"
      />
      <div className="composer-foot">
        <a href="/schema/agent-skill.schema.json">JSON schema</a>
        <span>{raw.trim() ? `${raw.length.toLocaleString()} chars` : "Client-side only · no keys"}</span>
      </div>
    </section>
  );
}

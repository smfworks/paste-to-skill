import type { SkillDraft } from "../types";

interface EditorsProps {
  draft: SkillDraft;
  onChange: (patch: Partial<SkillDraft>) => void;
}

function fromLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.replace(/^\d+[.)]\s+/, "").replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
}

export function Editors({ draft, onChange }: EditorsProps) {
  return (
    <section className="editors">
      <div className="composer-head">
        <h2>Tune</h2>
        <p>Edits regenerate SKILL.md live. Name stays kebab-case.</p>
      </div>
      <div className="field-grid">
        <label className="field">
          <span className="editor-label">Name</span>
          <input
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <label className="field field-wide">
          <span className="editor-label">Description</span>
          <textarea
            className="short"
            value={draft.description}
            onChange={(event) => onChange({ description: event.target.value })}
            rows={2}
          />
        </label>
        <label className="field">
          <span className="editor-label">Steps</span>
          <textarea
            className="mid"
            value={draft.steps.join("\n")}
            onChange={(event) => onChange({ steps: fromLines(event.target.value) })}
          />
        </label>
        <label className="field">
          <span className="editor-label">Refuse</span>
          <textarea
            className="mid"
            value={draft.refuse.join("\n")}
            onChange={(event) => onChange({ refuse: fromLines(event.target.value) })}
          />
        </label>
      </div>
    </section>
  );
}

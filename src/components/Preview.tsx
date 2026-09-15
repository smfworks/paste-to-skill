import type { SkillDraft, SkillFlavor } from "../types";
import { highlightSkill } from "../lib/highlight";
import { flavorLabel } from "../lib/render";

interface PreviewProps {
  draft: SkillDraft | null;
  flavor: SkillFlavor;
  markdown: string;
}

export function Preview({ draft, flavor, markdown }: PreviewProps) {
  return (
    <section className="preview-card">
      <div className="preview-toolbar">
        <div>
          <p className="eyebrow">SKILL.md</p>
          <strong>{draft ? `${draft.name} · ${flavorLabel(flavor)}` : "Waiting for a paste"}</strong>
        </div>
        <span className="preview-file">SKILL.md</span>
      </div>
      {draft ? (
        <pre className="skill-preview" tabIndex={0}>
          <code>{highlightSkill(markdown)}</code>
        </pre>
      ) : (
        <div className="preview-empty">
          <p>Paste notes. A Hermes or OpenClaw skill lands here — frontmatter plus the playbook.</p>
          <p className="muted">No API keys. Heuristics only. Tune name, description, steps, and refuse after generate.</p>
        </div>
      )}
    </section>
  );
}

import type { SkillFlavor } from "../types";

interface FlavorToggleProps {
  flavor: SkillFlavor;
  onChange: (flavor: SkillFlavor) => void;
}

const OPTIONS: Array<{ id: SkillFlavor; label: string; blurb: string }> = [
  { id: "hermes", label: "Hermes", blurb: "tags · When to Use · Pitfalls" },
  { id: "openclaw", label: "OpenClaw", blurb: "requires · Refuse · Success" },
];

export function FlavorToggle({ flavor, onChange }: FlavorToggleProps) {
  return (
    <div className="flavor" role="tablist" aria-label="Skill flavor">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={flavor === option.id}
          className={flavor === option.id ? "chip is-on" : "chip"}
          onClick={() => onChange(option.id)}
        >
          <span>{option.label}</span>
          <small>{option.blurb}</small>
        </button>
      ))}
    </div>
  );
}

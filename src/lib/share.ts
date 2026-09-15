import type { SkillDraft, SkillFlavor } from "../types";
import { flavorLabel } from "./render";

export const SHARE_URL = "https://github.com/smfworks/paste-to-skill";

export function formatShareText(draft: SkillDraft, flavor: SkillFlavor): string {
  return [
    "📋 Paste → Skill",
    draft.name,
    draft.description,
    "",
    `${draft.steps.length} steps · ${draft.refuse.length} refuses · ${flavorLabel(flavor)}`,
    "Paste messy notes. Get a SKILL.md an agent can run.",
    "",
    "Paste → Skill · SMF Works",
    SHARE_URL,
  ].join("\n");
}

export function formatCompactStats(draft: SkillDraft, flavor: SkillFlavor): string {
  return `${flavorLabel(flavor)} · ${draft.steps.length} steps · ${draft.tools.length} tools · ${draft.refuse.length} refuses`;
}

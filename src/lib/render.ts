import type { SkillDraft, SkillFlavor } from "../types";
import { ensureUseWhen, slugify, yamlScalar } from "./convert.ts";

function yamlList(items: string[], indent = 2): string {
  if (!items.length) return `${" ".repeat(indent)}[]`;
  return items.map((item) => `${" ".repeat(indent)}- ${yamlScalar(item)}`).join("\n");
}

function mdList(items: string[], ordered = false): string {
  if (!items.length) return ordered ? "1. _None captured — add steps in the editor._" : "- _None captured._";
  return items.map((item, index) => (ordered ? `${index + 1}. ${item}` : `- ${item}`)).join("\n");
}

function toolLines(draft: SkillDraft): string {
  if (!draft.tools.length && !draft.inputs.length) {
    return "- Infer from the paste. Prefer existing tools over new credentials.";
  }
  const lines: string[] = [];
  for (const tool of draft.tools) {
    lines.push(tool.purpose ? `- **${tool.name}** — ${tool.purpose}` : `- **${tool.name}**`);
  }
  for (const input of draft.inputs) {
    lines.push(`- Input: ${input}`);
  }
  return lines.join("\n");
}

function hermesFrontmatter(draft: SkillDraft): string {
  const tags = draft.tags.length ? draft.tags : ["workflow"];
  return [
    "---",
    `name: ${yamlScalar(draft.name)}`,
    `description: ${yamlScalar(draft.description)}`,
    `version: "1.0.0"`,
    "license: MIT",
    "metadata:",
    "  hermes:",
    "    tags:",
    yamlList(tags, 6),
    "---",
  ].join("\n");
}

function openClawFrontmatter(draft: SkillDraft): string {
  const lines = [
    "---",
    `name: ${yamlScalar(draft.name)}`,
    `description: ${yamlScalar(draft.description)}`,
    "metadata:",
    "  openclaw:",
  ];
  const { bins, env } = draft.requires;
  if (bins.length || env.length) {
    lines.push("    requires:");
    if (bins.length) {
      lines.push("      bins:");
      lines.push(yamlList(bins, 8));
    }
    if (env.length) {
      lines.push("      env:");
      lines.push(yamlList(env, 8));
    }
  } else {
    lines.push("    requires: {}");
  }
  lines.push("---");
  return lines.join("\n");
}

function hermesBody(draft: SkillDraft): string {
  return [
    `# ${draft.title}`,
    "",
    draft.goal,
    "",
    "## When to Use",
    "",
    mdList(draft.whenToUse),
    "",
    "## Steps",
    "",
    mdList(draft.steps, true),
    "",
    "## Inputs / tools",
    "",
    toolLines(draft),
    "",
    "## Pitfalls",
    "",
    mdList(draft.refuse),
    "",
    "## Verification",
    "",
    mdList(draft.success),
    "",
  ].join("\n");
}

function openClawBody(draft: SkillDraft): string {
  return [
    `# ${draft.title}`,
    "",
    draft.goal,
    "",
    "## Goal / when to use",
    "",
    mdList(draft.whenToUse),
    "",
    "## Steps",
    "",
    mdList(draft.steps, true),
    "",
    "## Inputs / tools",
    "",
    toolLines(draft),
    "",
    "## Refuse",
    "",
    mdList(draft.refuse),
    "",
    "## Success criteria",
    "",
    mdList(draft.success),
    "",
  ].join("\n");
}

export function renderSkill(draft: SkillDraft, flavor: SkillFlavor): string {
  const ready: SkillDraft = {
    ...draft,
    name: slugify(draft.name),
    description: ensureUseWhen(draft.description),
  };
  const front = flavor === "hermes" ? hermesFrontmatter(ready) : openClawFrontmatter(ready);
  const body = flavor === "hermes" ? hermesBody(ready) : openClawBody(ready);
  return `${front}\n\n${body}`.replace(/\n{3,}/g, "\n\n");
}

export function flavorLabel(flavor: SkillFlavor): string {
  return flavor === "hermes" ? "Hermes" : "OpenClaw";
}

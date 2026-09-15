export type SkillFlavor = "hermes" | "openclaw";

export interface SkillTool {
  name: string;
  purpose?: string;
}

export interface SkillRequires {
  bins: string[];
  env: string[];
}

/** Canonical intermediate skill. Other tools can emit this JSON and render SKILL.md. */
export interface SkillDraft {
  name: string;
  description: string;
  title: string;
  goal: string;
  whenToUse: string[];
  steps: string[];
  inputs: string[];
  tools: SkillTool[];
  refuse: string[];
  success: string[];
  tags: string[];
  requires: SkillRequires;
}

export interface SampleSop {
  id: string;
  label: string;
  blurb: string;
  paste: string;
}

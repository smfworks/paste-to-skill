/** Keep in sync with smfworks/smfworks README ## Try these (viral apps). */
export const VIRAL_KIT = [
  { id: "paste-to-skill", demo: "https://paste-to-skill.vercel.app", label: "Paste → Skill", blurb: "create" },
  { id: "skill-lint", demo: "https://skill-lint.vercel.app", label: "Skill Lint", blurb: "grade / fix" },
  { id: "eval-scorecard", demo: "https://eval-scorecard.vercel.app", label: "Eval Scorecard", blurb: "grade a run" },
  { id: "skill-card", demo: "https://skill-card-theta.vercel.app", label: "Skill Card", blurb: "present" },
  { id: "persona-card", demo: "https://persona-card-teal.vercel.app", label: "Persona Card", blurb: "the soul" },
  { id: "prompt-diff", demo: "https://prompt-diff-eight.vercel.app", label: "Prompt Diff", blurb: "the rewrite" },
  { id: "agent-contract", demo: "https://agent-contract.vercel.app", label: "Agent Contract", blurb: "agree" },
  { id: "refuse-card", demo: "https://refuse-card.vercel.app", label: "Refuse Card", blurb: "the gate" },
  { id: "tool-permit", demo: "https://tool-permit.vercel.app", label: "Tool Permit", blurb: "allowlist" },
  { id: "agent-receipt", demo: "https://agent-receipt-green.vercel.app", label: "Agent Receipt", blurb: "what ran" },
  { id: "session-timeline", demo: "https://session-timeline-sepia.vercel.app", label: "Session Timeline", blurb: "the log" },
  { id: "handoff-slip", demo: "https://handoff-slip.vercel.app", label: "Handoff Slip", blurb: "the baton" },
  { id: "redact-before-share", demo: "https://redact-before-share.vercel.app", label: "Redact Before Share", blurb: "scrub" },
  { id: "context-budget", demo: "https://context-budget-eight.vercel.app", label: "Context Budget", blurb: "tokens" },
  { id: "constraint-card", demo: "https://constraint-card.vercel.app", label: "Constraint Card", blurb: "standing rules" },
] as const;

export type ViralKitId = (typeof VIRAL_KIT)[number]["id"];

export type HandoffKind =
  | "skill-md"
  | "session-json"
  | "redacted-text"
  | "eval-json"
  | "prompt-text"
  | "json"
  | "plain";


export const KIT_NEXT: Record<ViralKitId, ViralKitId[]> = {
  "paste-to-skill": ["skill-lint", "skill-card"],
  "skill-lint": ["eval-scorecard", "skill-card"],
  "eval-scorecard": ["agent-receipt", "session-timeline"],
  "skill-card": ["persona-card", "prompt-diff"],
  "persona-card": ["agent-contract", "constraint-card"],
  "prompt-diff": ["agent-contract", "refuse-card"],
  "agent-contract": ["refuse-card", "tool-permit"],
  "refuse-card": ["tool-permit", "constraint-card"],
  "tool-permit": ["agent-receipt", "refuse-card"],
  "agent-receipt": ["session-timeline", "redact-before-share"],
  "session-timeline": ["handoff-slip", "agent-receipt"],
  "handoff-slip": ["constraint-card", "session-timeline"],
  "redact-before-share": ["agent-receipt", "context-budget"],
  "context-budget": ["redact-before-share", "eval-scorecard"],
  "constraint-card": ["refuse-card", "agent-contract"],
};

export function kitById(id: string) {
  return VIRAL_KIT.find((item) => item.id === id);
}

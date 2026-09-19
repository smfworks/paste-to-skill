import type { SkillDraft, SkillRequires, SkillTool } from "../types";

const MAX_PASTE = 50_000;
const MAX_NAME = 64;
const MAX_DESCRIPTION = 1024;
const MAX_STEPS = 20;
const MAX_LIST = 12;

const STOP = new Set(["a", "an", "the", "and", "or", "of"]);

const DEFAULT_REFUSE = [
  "Do not send external messages, money, or public posts without a human review.",
  "Do not exfiltrate secrets, credentials, private customer data, or .env files.",
  "Do not invent medical, legal, or financial advice.",
  "Do not make irreversible production changes without an explicit approval.",
];

const TOOL_ALIASES: Array<{ match: RegExp; name: string; purpose: string; bins?: string[]; env?: string[] }> =
  [
    { match: /\bgmail\b|\binbox\b|\be-?mail\b/i, name: "email", purpose: "read and draft mail", bins: ["curl"] },
    { match: /\bgoogle calendar\b|\bgcal\b/i, name: "calendar", purpose: "read holds and events" },
    { match: /\bslack\b/i, name: "slack", purpose: "post to the named channel only after review" },
    { match: /\bgithub\b|\bgh\b|\bpull requests?\b/i, name: "github", purpose: "issues, PRs, and ship notes", bins: ["gh", "git"] },
    { match: /\bgit (?:status|diff|clone|push|log|commit)\b/i, name: "git", purpose: "history, tags, and diffs", bins: ["git"] },
    { match: /\bdocker\b/i, name: "docker", purpose: "images and containers", bins: ["docker"] },
    { match: /\bvercel\b/i, name: "vercel", purpose: "preview and production deploys", bins: ["vercel"], env: ["VERCEL_TOKEN"] },
    { match: /\bstripe\b/i, name: "stripe", purpose: "captured charges and refunds", env: ["STRIPE_API_KEY"] },
    { match: /\bzendesk\b/i, name: "tickets", purpose: "customer thread and evidence" },
    { match: /\blinear\b|\bjira\b/i, name: "board", purpose: "shipped / blocked items" },
    { match: /\bbash\b|\bterminal\b|\bshell command/i, name: "shell", purpose: "commands the skill names", bins: ["bash"] },
    { match: /\bweb browser\b|\bplaywright\b|\bpuppeteer\b/i, name: "browser", purpose: "open the named surface" },
  ];

const IMPERATIVE =
  /^(scan|check|confirm|verify|open|read|draft|send|hold|archive|flag|sort|pull|collect|create|update|tag|deploy|watch|announce|prepare|issue|post|ask|review|run|test|smoke|compare|record|attach|quote|page|stop|rollback|notify|summarize|write|copy|paste|extract|label|move|close|reopen)\b/i;

const LABELED =
  /^(name|title|subject|sop|description|goal|purpose|when|when to use|step|steps|refuse|never|never do|don't|dont|do not|tool|tools|input|inputs|need|success|done when|done|verification|tag|tags|bin|bins|env)\s*[:\-–]\s*(.+)$/i;

const SECTION_ALIASES: Record<string, keyof ParsedBuckets> = {
  step: "steps",
  steps: "steps",
  procedure: "steps",
  checklist: "steps",
  "how to": "steps",
  playbook: "steps",
  sop: "steps",
  do: "steps",
  "do this": "steps",
  goal: "goal",
  purpose: "goal",
  when: "when",
  "when to use": "when",
  "use when": "when",
  trigger: "when",
  refuse: "refuse",
  never: "refuse",
  "never do": "refuse",
  pitfalls: "refuse",
  "out of scope": "refuse",
  "do not": "refuse",
  dont: "refuse",
  "don't": "refuse",
  input: "inputs",
  inputs: "inputs",
  need: "inputs",
  needs: "inputs",
  required: "inputs",
  tool: "tools",
  tools: "tools",
  success: "success",
  "success criteria": "success",
  "done when": "success",
  done: "success",
  verification: "success",
  criteria: "success",
};

interface ParsedBuckets {
  title: string;
  description: string;
  goal: string;
  when: string[];
  steps: string[];
  inputs: string[];
  tools: string[];
  refuse: string[];
  success: string[];
  tags: string[];
  bins: string[];
  env: string[];
}

function emptyBuckets(): ParsedBuckets {
  return {
    title: "",
    description: "",
    goal: "",
    when: [],
    steps: [],
    inputs: [],
    tools: [],
    refuse: [],
    success: [],
    tags: [],
    bins: [],
    env: [],
  };
}

export function slugify(input: string): string {
  const words = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0 && !STOP.has(word));
  const fallback = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  let slug = (words.length ? words.join("-") : fallback)
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_NAME)
    .replace(/-$/g, "");
  if (!slug || !/^[a-z0-9]/.test(slug)) slug = `skill-${slug || "untitled"}`.slice(0, MAX_NAME);
  if (slug.endsWith("-")) slug = slug.slice(0, -1);
  return slug || "untitled-skill";
}

export function ensureUseWhen(text: string): string {
  let body = text
    .trim()
    .replace(/^use this skill when\s+/i, "")
    .replace(/^use this when\s+/i, "")
    .replace(/^use when\s+/i, "")
    .replace(/^whenever\s+/i, "")
    .replace(/^when\s+/i, "");
  body = firstSentence(body);
  if (!body) body = "the operator pastes a playbook the agent should follow";
  if (IMPERATIVE.test(body) || /^(ship|sort|turn|follow|draft|triage|ack)\b/i.test(body)) {
    body = `you need to ${body.charAt(0).toLowerCase()}${body.slice(1)}`;
  }
  const sentence = body.charAt(0).toLowerCase() + body.slice(1);
  let description = `Use this when ${sentence}`.replace(/\s+/g, " ").trim();
  if (!/[.!?]$/.test(description)) description += ".";
  if (description.length > MAX_DESCRIPTION) {
    description = `${description.slice(0, MAX_DESCRIPTION - 3).replace(/\s+\S*$/, "")}...`;
  }
  return description;
}

export function yamlScalar(value: string): string {
  if (value === "") return '""';
  if (/[:#{}[\],&*?|>!%@`]/.test(value) || /['"]/.test(value) || /^\s|\s$/.test(value) || value.includes("\n")) {
    return JSON.stringify(value);
  }
  return value;
}

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const trimmed = cleanItem(item).replace(/[.]+$/, "");
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function cleanItem(value: string): string {
  return value
    .replace(/^[-*•–—]\s+/, "")
    .replace(/^\[[ xX]\]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/^step\s*\d+\s*[:.)\-]\s*/i, "")
    .replace(/^>\s?/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstSentence(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const match = cleaned.match(/^(.{20,220}?)(?:[.!?](?:\s|$)|$)/);
  return (match?.[1] ?? cleaned.slice(0, 220)).replace(/[.!?]$/, "").trim();
}

function isHeadingShape(line: string): boolean {
  if (/^#{1,6}\s+\S/.test(line)) return true;
  const stripped = line.replace(/[:\-–]\s*$/, "").trim();
  if (stripped.length > 42) return false;
  if (stripped.split(/\s+/).length > 6) return false;
  if (/^\d+[.)]/.test(stripped) || /^\[[ xX]\]/.test(stripped)) return false;
  return true;
}

function looksLikeHeader(line: string): boolean {
  return (
    /^#{1,6}\s+\S/.test(line) ||
    /^(from|to|cc|bcc|date|sent|subject)\s*:/i.test(line) ||
    /^on .+ wrote:\s*$/i.test(line)
  );
}

function sectionKey(line: string): keyof ParsedBuckets | null {
  if (!isHeadingShape(line)) return null;
  const stripped = line
    .replace(/^#{1,6}\s+/, "")
    .replace(/[:\-–]\s*$/, "")
    .trim()
    .toLowerCase();
  if (!stripped) return null;
  if (stripped in SECTION_ALIASES) return SECTION_ALIASES[stripped];
  if (/^(steps?|checklist|procedure|playbook)\b/.test(stripped)) return "steps";
  if (/^(never|refuse|pitfalls|don'?t)\b/.test(stripped) && stripped.split(/\s+/).length <= 4) return "refuse";
  if (/^(inputs?|needs?)\b/.test(stripped)) return "inputs";
  if (/^tools?\b/.test(stripped)) return "tools";
  if (/^(success|verification|done when)\b/.test(stripped)) return "success";
  if (/^(when to use|use when|when)$/.test(stripped)) return "when";
  return null;
}

function extractTitle(text: string): string {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^>\s?/, "").trim())
    .filter(Boolean);
  const h1 = lines.find((line) => /^#{1,6}\s+\S/.test(line) && !sectionKey(line));
  if (h1) return h1.replace(/^#{1,6}\s+/, "").trim();
  const labeled = lines.find((line) => /^(name|title|sop)\s*[:\-–]\s+\S/i.test(line));
  if (labeled) return labeled.replace(/^(name|title|sop)\s*[:\-–]\s+/i, "").trim();
  const first = lines.find(
    (line) =>
      !looksLikeHeader(line) &&
      !sectionKey(line) &&
      !LABELED.test(line) &&
      line.length >= 3 &&
      line.length <= 72,
  );
  if (first) return cleanItem(first);
  const subject = lines.find((line) => /^subject\s*:/i.test(line));
  if (subject) {
    return subject
      .replace(/^subject\s*:/i, "")
      .replace(/^(re:\s*)+/i, "")
      .trim();
  }
  return "Untitled skill";
}

function extractListItems(block: string): string[] {
  const items: string[] = [];
  for (const rawLine of block.split(/\n/)) {
    const line = rawLine.trim();
    if (!line || looksLikeHeader(line)) continue;
    if (/^[-*•–—]\s+\S/.test(line) || /^\[[ xX]\]\s+\S/.test(line) || /^\d+[.)]\s+\S/.test(line) || /^step\s*\d+/i.test(line)) {
      items.push(cleanItem(line));
    }
  }
  return unique(items);
}

function extractImperatives(block: string): string[] {
  const items: string[] = [];
  for (const rawLine of block.split(/\n/)) {
    const line = cleanItem(rawLine);
    if (!line || looksLikeHeader(line) || line.length > 220) continue;
    if (IMPERATIVE.test(line)) items.push(line.replace(/\.$/, ""));
  }
  return unique(items);
}

function proseLead(block: string, title = ""): string {
  const titleKey = title.toLowerCase();
  const lines: string[] = [];
  for (const raw of block.split("\n")) {
    const line = raw.replace(/^>\s?/, "").trim();
    if (!line) {
      if (lines.length) break;
      continue;
    }
    if (looksLikeHeader(line) || sectionKey(line) || LABELED.test(line)) continue;
    if (/^[-*•–—]\s+\S/.test(line) || /^\[[ xX]\]/.test(line) || /^\d+[.)]\s+\S/.test(line)) break;
    const cleaned = cleanItem(line);
    if (!cleaned) continue;
    if (titleKey && cleaned.toLowerCase() === titleKey) continue;
    if (titleKey && cleaned.toLowerCase().startsWith(titleKey + " —")) continue;
    lines.push(cleaned);
    if (lines.join(" ").length > 140) break;
  }
  return firstSentence(lines.join(" "));
}

function looksLikeAnecdote(text: string): boolean {
  return (
    /\b(can we|could we|please refund|jane|hey there)\b/i.test(text) ||
    (text.includes("?") && text.length < 90)
  );
}

function parseLabeledLine(line: string, buckets: ParsedBuckets): boolean {
  const match = line.match(LABELED);
  if (!match) return false;
  const key = match[1].toLowerCase();
  const value = match[2].trim();
  switch (key) {
    case "name":
      buckets.title = buckets.title || value;
      break;
    case "title":
    case "subject":
    case "sop":
      buckets.title = buckets.title || value.replace(/^(re:\s*)+/i, "").trim();
      break;
    case "description":
      buckets.description = value;
      break;
    case "goal":
    case "purpose":
      buckets.goal = value;
      break;
    case "when":
    case "when to use":
      buckets.when.push(value);
      break;
    case "step":
    case "steps":
      buckets.steps.push(value);
      break;
    case "refuse":
    case "never":
    case "never do":
    case "don't":
    case "dont":
    case "do not":
      buckets.refuse.push(value);
      break;
    case "tool":
    case "tools":
      buckets.tools.push(...value.split(/[,/]| and /i).map((item) => item.trim()));
      break;
    case "input":
    case "inputs":
    case "need":
      buckets.inputs.push(value);
      break;
    case "success":
    case "done when":
    case "done":
    case "verification":
      buckets.success.push(value);
      break;
    case "tag":
    case "tags":
      buckets.tags.push(...value.split(/[,/]/).map((item) => item.trim()));
      break;
    case "bin":
    case "bins":
      buckets.bins.push(...value.split(/[,/]/).map((item) => item.trim()));
      break;
    case "env":
      buckets.env.push(...value.split(/[,/\s]+/).map((item) => item.trim()));
      break;
    default:
      return false;
  }
  return true;
}

function parseFreeform(text: string): ParsedBuckets {
  const buckets = emptyBuckets();
  buckets.title = extractTitle(text);
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let current: keyof ParsedBuckets | null = null;
  const buffer: string[] = [];

  const absorbBlock = (block: string, target: keyof ParsedBuckets | null) => {
    const items = extractListItems(block);
    const lead = proseLead(block, buckets.title);
    if (!target) {
      if (!buckets.goal && lead) buckets.goal = lead;
      if (items.length) buckets.steps.push(...items);
      return;
    }
    if (target === "goal" && lead) buckets.goal = buckets.goal || lead;
    else if (target === "title" && lead) buckets.title = buckets.title || lead;
    else if (Array.isArray(buckets[target])) {
      const extra = items.length ? items : lead ? [lead] : [];
      (buckets[target] as string[]).push(...extra);
    }
  };

  const flush = () => {
    if (buffer.length === 0) return;
    absorbBlock(buffer.join("\n"), current);
    buffer.length = 0;
  };

  for (const raw of lines) {
    const line = raw.replace(/^>\s?/, "").trim();
    if (!line) {
      buffer.push("");
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+)/);
    if (heading && !sectionKey(line)) {
      continue;
    }
    if (/^subject\s*:/i.test(line)) {
      continue;
    }
    if (/^(from|to|cc|bcc|date|sent)\s*:/i.test(line) || /^on .+ wrote:\s*$/i.test(line)) {
      continue;
    }
    const key = sectionKey(line);
    if (key) {
      flush();
      current = key;
      const rest = line.replace(/^#{1,6}\s+/, "").replace(/^[^:]*:\s*/, "");
      if (rest && rest.toLowerCase() !== line.replace(/^#{1,6}\s+/, "").toLowerCase() && !sectionKey(rest)) {
        buffer.push(rest);
      }
      continue;
    }
    if (parseLabeledLine(line, buckets)) {
      continue;
    }
    if (
      /^(never|do not|don't|dont|refuse|avoid)\b/i.test(line) &&
      !sectionKey(line)
    ) {
      buckets.refuse.push(
        cleanItem(line.replace(/^(never|do not|don't|dont|refuse|avoid)\s+/i, "")),
      );
      continue;
    }
    buffer.push(line);
  }
  flush();

  if (!buckets.steps.length) {
    const listed = extractListItems(text);
    if (listed.length) buckets.steps.push(...listed);
    else buckets.steps.push(...extractImperatives(text));
  }

  if (!buckets.refuse.length) {
    for (const line of lines) {
      const trimmed = line.replace(/^>\s?/, "").trim();
      if (/^(never|do not|don't|dont|refuse|avoid)\b/i.test(trimmed) && !sectionKey(trimmed)) {
        buckets.refuse.push(cleanItem(trimmed.replace(/^(never|do not|don't|dont|refuse|avoid)\s+/i, "")));
      }
    }
  }

  if (!buckets.title) {
    buckets.title = extractTitle(text);
  }

  return buckets;
}

function parseSkillMarkdown(text: string): ParsedBuckets | null {
  if (!text.trimStart().startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  if (end < 0) return null;
  const fm = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\s*\n/, "");
  const buckets = parseFreeform(body);
  for (const line of fm.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.+)$/);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].replace(/^["']|["']$/g, "").trim();
    if (key === "name") buckets.title = buckets.title || value;
    if (key === "description") buckets.description = value;
  }
  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1) buckets.title = h1[1].trim();
  return buckets;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "name" in item && typeof (item as { name: unknown }).name === "string") {
        const purpose = "purpose" in item && typeof (item as { purpose: unknown }).purpose === "string" ? (item as { purpose: string }).purpose : "";
        return purpose ? `${(item as { name: string }).name} — ${purpose}` : (item as { name: string }).name;
      }
      return "";
    })
    .filter(Boolean);
}

function parseJsonSkill(text: string): ParsedBuckets | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    const value: unknown = JSON.parse(trimmed);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (!("name" in record || "title" in record || "description" in record || "steps" in record)) return null;
    const buckets = emptyBuckets();
    if (typeof record.title === "string") buckets.title = record.title;
    if (typeof record.name === "string") buckets.title = buckets.title || record.name;
    if (typeof record.description === "string") buckets.description = record.description;
    if (typeof record.goal === "string") buckets.goal = record.goal;
    buckets.when = asStringArray(record.whenToUse);
    buckets.steps = asStringArray(record.steps);
    buckets.inputs = asStringArray(record.inputs);
    buckets.tools = asStringArray(record.tools);
    buckets.refuse = asStringArray(record.refuse);
    buckets.success = asStringArray(record.success);
    buckets.tags = asStringArray(record.tags);
    const requires = record.requires;
    if (requires && typeof requires === "object") {
      buckets.bins = asStringArray((requires as { bins?: unknown }).bins);
      buckets.env = asStringArray((requires as { env?: unknown }).env);
    }
    return buckets;
  } catch {
    return null;
  }
}

function inferTools(text: string, mentioned: string[]): { tools: SkillTool[]; requires: SkillRequires; tags: string[] } {
  const tools: SkillTool[] = [];
  const bins: string[] = [];
  const env: string[] = [];
  const tags = new Set<string>(["workflow"]);
  const haystack = `${text}\n${mentioned.join(" ")}`;
  for (const alias of TOOL_ALIASES) {
    if (!alias.match.test(haystack)) continue;
    if (tools.some((tool) => tool.name === alias.name)) continue;
    tools.push({ name: alias.name, purpose: alias.purpose });
    bins.push(...(alias.bins ?? []));
    env.push(...(alias.env ?? []));
    tags.add(alias.name);
  }
  for (const item of mentioned) {
    const name = slugify(item).replace(/-/g, "");
    if (!name) continue;
    if (tools.some((tool) => tool.name === item.toLowerCase() || tool.name === slugify(item))) continue;
    if (item.length > 32) continue;
    tools.push({ name: slugify(item), purpose: "named in the paste" });
  }
  return {
    tools: tools.slice(0, 8),
    requires: { bins: unique(bins).slice(0, 8), env: unique(env).map((item) => item.toUpperCase().replace(/[^A-Z0-9_]/g, "_")).slice(0, 8) },
    tags: [...tags].slice(0, 8),
  };
}

function inferRefuse(text: string, existing: string[]): string[] {
  const extra: string[] = [];
  if (/\brefund\b|\bstripe\b|\bmoney\b|\bpayment\b/i.test(text)) {
    extra.push("Do not move money or issue a refund without documented evidence and a human click.");
  }
  if (/\bdeploy\b|\bproduction\b|\bmigration\b/i.test(text)) {
    extra.push("Do not skip tests or deploy when the rollback path is unknown.");
  }
  if (/\binbox\b|\bemail\b|\bgmail\b|\bmail\b/i.test(text)) {
    extra.push("Do not send or delete mail that looks sensitive without a human read.");
  }
  if (/\bcustomer\b|\brefund\b|\bticket\b/i.test(text)) {
    extra.push("Do not promise compensation, exceptions, or legal outcomes in a draft.");
  }
  if (/\bfriday\b/i.test(text)) {
    extra.push("Do not ship late Friday unless on-call is awake and named.");
  }
  return unique([...existing, ...extra, ...DEFAULT_REFUSE]).slice(0, MAX_LIST);
}

function inferInputs(text: string, existing: string[]): string[] {
  if (existing.length) return unique(existing).slice(0, MAX_LIST);
  const found: string[] = [];
  const patterns = [
    /\b(order id|rma|release sha|environment|date range|audience|inbox|last 24h|ticket|commit)\b/gi,
  ];
  for (const pattern of patterns) {
    const matches = text.match(pattern) ?? [];
    found.push(...matches);
  }
  if (!found.length) found.push("The operator's paste, and any ids named in it");
  return unique(found).slice(0, MAX_LIST);
}

function inferSuccess(existing: string[], steps: string[]): string[] {
  if (existing.length) return unique(existing).slice(0, MAX_LIST);
  const fallback = [
    "Every numbered step completed or explicitly skipped with a reason.",
    "Refuse list honored — nothing irreversible happened without a human.",
    "A short note exists for the operator: what ran, what is held.",
  ];
  if (steps.length) fallback.unshift(`The playbook's ${steps.length} steps were followed in order.`);
  return fallback;
}

function inferWhen(description: string, existing: string[]): string[] {
  if (existing.length) return unique(existing).slice(0, MAX_LIST);
  const seed = description.replace(/^Use this when\s+/i, "").replace(/[.]$/, "");
  return seed ? [seed] : [];
}

function titleCase(value: string): string {
  const cleaned = value.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "Untitled skill";
  return cleaned
    .split(" ")
    .map((word) => (word.length <= 2 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join(" ")
    .replace(/\bSop\b/g, "SOP")
    .replace(/\bId\b/g, "ID");
}

export function normalizeDraft(partial: Partial<SkillDraft> & { name?: string }): SkillDraft {
  const title = (partial.title || partial.name || "Untitled skill").trim();
  const name = slugify(partial.name || title);
  const goal = (partial.goal || "").trim() || "Follow the playbook and stop for a human on anything consequential.";
  const description = ensureUseWhen(partial.description || goal);
  return {
    name,
    description,
    title: titleCase(title),
    goal,
    whenToUse: unique(partial.whenToUse ?? []).slice(0, MAX_LIST),
    steps: unique(partial.steps ?? []).slice(0, MAX_STEPS),
    inputs: unique(partial.inputs ?? []).slice(0, MAX_LIST),
    tools: (partial.tools ?? []).slice(0, 8),
    refuse: unique(partial.refuse ?? DEFAULT_REFUSE).slice(0, MAX_LIST),
    success: unique(partial.success ?? []).slice(0, MAX_LIST),
    tags: unique(partial.tags ?? ["workflow"]).slice(0, 8),
    requires: {
      bins: unique(partial.requires?.bins ?? []),
      env: unique(partial.requires?.env ?? []),
    },
  };
}

function playbookGoal(title: string): string {
  return `Follow the ${title.toLowerCase()} playbook, then stop for a human.`;
}

function bucketsToDraft(buckets: ParsedBuckets, source: string): SkillDraft {
  const inferred = inferTools(source, buckets.tools);
  const title = buckets.title || "Untitled skill";
  let goal = (buckets.goal && firstSentence(buckets.goal)) || "";
  if (!goal || looksLikeAnecdote(goal) || slugify(goal) === slugify(title)) {
    goal = playbookGoal(title);
  }
  const description = ensureUseWhen(buckets.description || buckets.when[0] || goal);
  const steps = unique(buckets.steps).slice(0, MAX_STEPS);
  const filledSteps =
    steps.length > 0
      ? steps
      : [
          "Read the paste. Restate the goal in one sentence.",
          "Follow the implied order of work. Ask if a step is missing.",
          "Stop and hold anything irreversible for a human.",
          "Write a short completion note: done, held, refused.",
        ];
  return normalizeDraft({
    name: slugify(title),
    description,
    title,
    goal,
    whenToUse: inferWhen(description, buckets.when),
    steps: filledSteps,
    inputs: inferInputs(source, buckets.inputs),
    tools: inferred.tools,
    refuse: inferRefuse(source, buckets.refuse),
    success: inferSuccess(buckets.success, filledSteps),
    tags: unique([...inferred.tags, ...buckets.tags]),
    requires: {
      bins: unique([...inferred.requires.bins, ...buckets.bins]),
      env: unique([...inferred.requires.env, ...buckets.env]),
    },
  });
}

export function convertPaste(raw: string): SkillDraft | null {
  const text = raw.replace(/\r\n/g, "\n").trim().slice(0, MAX_PASTE);
  if (!text) return null;
  const fromJson = parseJsonSkill(text);
  if (fromJson) return bucketsToDraft(fromJson, text);
  const fromMd = parseSkillMarkdown(text);
  if (fromMd) return bucketsToDraft(fromMd, text);
  return bucketsToDraft(parseFreeform(text), text);
}

export function draftToJson(draft: SkillDraft): string {
  return `${JSON.stringify(draft, null, 2)}\n`;
}

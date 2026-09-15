import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SAMPLES } from "../data/samples.ts";
import { convertPaste, ensureUseWhen, slugify } from "./convert.ts";
import { renderSkill } from "./render.ts";

describe("slugify", () => {
  it("emits kebab-case without stopwords", () => {
    assert.equal(slugify("Triage the Inbox"), "triage-inbox");
  });

  it("stays within 64 characters", () => {
    assert.ok(slugify("x".repeat(80)).length <= 64);
  });
});

describe("ensureUseWhen", () => {
  it("prefixes the required style", () => {
    assert.match(ensureUseWhen("unread mail piles up overnight"), /^Use this when unread mail piles up overnight\./);
  });

  it("does not double the prefix", () => {
    assert.equal(ensureUseWhen("Use this when the deploy is ready."), "Use this when the deploy is ready.");
  });
});

describe("convertPaste", () => {
  it("prefers an H1 title over an email subject", () => {
    const draft = convertPaste(`# Triage inbox

Subject: morning mail is a mess again

When unread mail piles up overnight, sort it.

1. Scan
2. Draft
3. Hold
`);
    assert.equal(draft?.name, "triage-inbox");
    assert.match(draft?.description ?? "", /^Use this when the inbox has unread|^Use this when unread mail/i);
    assert.equal(/\bwhen when\b/i.test(draft?.description ?? ""), false);
  });

  it("pulls numbered steps, refuses, and tools from freeform notes", () => {
    const draft = convertPaste(`# Deploy checklist

1. Run tests
2. Tag the release
3. Deploy

never skip tests
tools: git, docker
done when smoke checks pass
`);
    assert.ok(draft);
    assert.equal(draft.name, "deploy-checklist");
    assert.equal(draft.description.startsWith("Use this when "), true);
    assert.match(draft.steps[0] ?? "", /Run tests/i);
    assert.equal(draft.steps.length, 3);
    assert.equal(draft.refuse.some((item) => /skip tests/i.test(item)), true);
    assert.equal(draft.tools.some((tool) => tool.name === "git" || tool.name === "docker"), true);
  });

  it("accepts the JSON intermediate schema", () => {
    const draft = convertPaste(
      JSON.stringify({
        name: "refund-path",
        description: "Use this when a customer asks for a refund.",
        steps: ["Confirm the return scan", "Hold for a human click"],
        refuse: ["Do not refund without a scan"],
      }),
    );
    assert.equal(draft?.name, "refund-path");
    assert.ok(draft?.steps.includes("Confirm the return scan"));
    assert.match(draft?.refuse[0] ?? "", /scan/i);
  });

  it("round-trips generated SKILL.md", () => {
    const first = convertPaste("# Weekly status\n\n1. Pull shipped items\n2. Draft the letter\nnever send without a human");
    assert.ok(first);
    const md = renderSkill(first, "hermes");
    const again = convertPaste(md);
    assert.equal(again?.name, first.name);
    assert.match(again?.steps[0] ?? "", /Pull shipped/i);
  });

  it("converts every sample into a useful skill in-process", () => {
    for (const sample of SAMPLES) {
      const started = Date.now();
      const draft = convertPaste(sample.paste);
      assert.ok(Date.now() - started < 1000, sample.id);
      assert.ok(draft, sample.id);
      assert.match(draft.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.equal(draft.description.startsWith("Use this when "), true);
      assert.ok(draft.steps.length >= 3, `${sample.id} steps`);
      assert.ok(draft.refuse.length >= 3, `${sample.id} refuse`);
      const hermes = renderSkill(draft, "hermes");
      const openclaw = renderSkill(draft, "openclaw");
      assert.ok(hermes.includes("metadata:\n  hermes:"));
      assert.ok(hermes.includes("## When to Use"));
      assert.ok(hermes.includes("## Pitfalls"));
      assert.ok(openclaw.includes("metadata:\n  openclaw:"));
      assert.ok(openclaw.includes("## Refuse"));
      assert.ok(openclaw.includes("## Success criteria"));
    }
  });
});

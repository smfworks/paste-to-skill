import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SAMPLES } from "./data/samples";
import { convertPaste } from "./lib/convert";
import { copyText, downloadText } from "./lib/clipboard";
import { cardToPngBlob, downloadBlob, shareTextAndPng } from "./lib/exportImage";
import { renderSkill } from "./lib/render";
import { formatCompactStats, formatShareText } from "./lib/share";
import type { SkillDraft, SkillFlavor } from "./types";
import { Actions } from "./components/Actions";
import { Composer } from "./components/Composer";
import { Editors } from "./components/Editors";
import { FlavorToggle } from "./components/FlavorToggle";
import { Header } from "./components/Header";
import { SisterStrip } from "./components/SisterStrip";
import { Preview } from "./components/Preview";
import { Toast } from "./components/Toast";

export default function App() {
  const [raw, setRaw] = useState("");
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [flavor, setFlavor] = useState<SkillFlavor>("hermes");
  const [draft, setDraft] = useState<SkillDraft | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<"copy" | "download" | "share" | "png" | null>(null);
  const frameRef = useRef<HTMLElement | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDraft(convertPaste(raw));
    }, 80);
    return () => window.clearTimeout(handle);
  }, [raw]);

  const markdown = useMemo(() => (draft ? renderSkill(draft, flavor) : ""), [draft, flavor]);

  const loadSample = useCallback((id: string) => {
    const sample = SAMPLES.find((item) => item.id === id);
    if (!sample) return;
    setSampleId(id);
    setRaw(sample.paste);
  }, []);

  const reset = useCallback(() => {
    setRaw("");
    setDraft(null);
    setSampleId(null);
    showToast("Cleared.");
  }, [showToast]);

  const patchDraft = useCallback((patch: Partial<SkillDraft>) => {
    setDraft((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      if (patch.name !== undefined) {
        const slug = patch.name
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-/, "")
          .slice(0, 64);
        next.name = slug || current.name;
      }
      return next;
    });
  }, []);

  const copyMarkdown = useCallback(async () => {
    if (!markdown) return;
    setBusy("copy");
    try {
      await copyText(markdown);
      showToast("SKILL.md copied.");
    } catch {
      showToast("Could not copy markdown.");
    } finally {
      setBusy(null);
    }
  }, [markdown, showToast]);

  const downloadMarkdown = useCallback(() => {
    if (!markdown || !draft) return;
    setBusy("download");
    try {
      downloadText(markdown, "SKILL.md");
      showToast("SKILL.md downloaded.");
    } catch {
      showToast("Download failed.");
    } finally {
      setBusy(null);
    }
  }, [draft, markdown, showToast]);

  const downloadPng = useCallback(async () => {
    if (!draft || !frameRef.current) return;
    setBusy("png");
    try {
      const blob = await cardToPngBlob(frameRef.current);
      downloadBlob(blob, `${draft.name || "skill"}.png`);
      showToast("PNG downloaded.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "PNG export failed.");
    } finally {
      setBusy(null);
    }
  }, [draft, showToast]);

  const copyShare = useCallback(async () => {
    if (!draft) return;
    setBusy("share");
    try {
      const text = formatShareText(draft, flavor);
      if (frameRef.current && typeof navigator.share === "function") {
        const blob = await cardToPngBlob(frameRef.current);
        const mode = await shareTextAndPng(text, blob, `${draft.name || "skill"}.png`, draft.name);
        showToast(mode === "shared" ? "Shared card." : "Share text copied.");
      } else {
        await copyText(text);
        showToast("Share text copied.");
      }
    } catch {
      showToast("Could not share.");
    } finally {
      setBusy(null);
    }
  }, [draft, flavor, showToast]);

  return (
    <>
      <div className="ambient" aria-hidden="true" />
      <div className="page">
        <Header />
        <SisterStrip current="paste-to-skill" />
        <div className="layout">
          <div className="stack">
            <Composer
              raw={raw}
              sampleId={sampleId}
              onRawChange={(value) => {
                setSampleId(null);
                setRaw(value);
              }}
              onSample={loadSample}
            />
            {draft ? <Editors draft={draft} onChange={patchDraft} /> : null}
          </div>
          <div className="stage">
            <FlavorToggle flavor={flavor} onChange={setFlavor} />
            <Preview draft={draft} flavor={flavor} markdown={markdown} frameRef={frameRef} />
            {draft ? <p className="stage-stats">{formatCompactStats(draft, flavor)}</p> : null}
            <Actions
              disabled={!draft}
              busy={busy}
              onCopy={() => void copyMarkdown()}
              onDownload={downloadMarkdown}
              onPng={() => void downloadPng()}
              onShare={() => void copyShare()}
              onReset={reset}
            />
          </div>
        </div>
        <footer className="site-foot">
          <p>Paste → Skill · SMF Works</p>
          <p>
            Sister app:{" "}
            <a href="https://github.com/smfworks/agent-receipt">Agent Receipt</a>
            {" — "}
            what ran; this is what to run next. Demo:{" "}
            <a href="https://agent-receipt-green.vercel.app">agent-receipt-green.vercel.app</a>
          </p>
          <p>Intelligence is abundant. Judgment is the product.</p>
          <p>
            MIT · Built by{" "}
            <a href="https://smfworks.com">SMF Works</a>
            {" · "}
            <a href="https://github.com/smfworks/paste-to-skill">GitHub</a>
            {" · "}
            <a href="https://x.com/MichaelGannotti">@MichaelGannotti</a>
          </p>
          <p className="fineprint">
            No secrets, no monetization, no medical or legal advice. A shareable skill
            file is not an audit and not a substitute for human review.
          </p>
        </footer>
      </div>
      <Toast message={toast} />
    </>
  );
}

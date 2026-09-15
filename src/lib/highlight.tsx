import type { ReactNode } from "react";
import { createElement } from "react";

type Kind = "fence" | "key" | "str" | "head" | "list" | "comment" | "text";

interface Token {
  kind: Kind;
  text: string;
}

function tokenizeYaml(line: string): Token[] {
  if (line.trim() === "---") return [{ kind: "fence", text: line }];
  if (line.trim() === "{}") return [{ kind: "comment", text: line }];
  const key = line.match(/^(\s*)([A-Za-z0-9_-]+)(:)(\s*)(.*)$/);
  if (key) {
    const tokens: Token[] = [
      { kind: "text", text: key[1] },
      { kind: "key", text: key[2] },
      { kind: "fence", text: key[3] },
    ];
    if (key[4]) tokens.push({ kind: "text", text: key[4] });
    if (key[5]) tokens.push({ kind: key[5] === "{}" ? "comment" : "str", text: key[5] });
    return tokens;
  }
  const list = line.match(/^(\s*-\s+)(.*)$/);
  if (list) {
    return [
      { kind: "list", text: list[1] },
      { kind: "str", text: list[2] },
    ];
  }
  return [{ kind: "text", text: line }];
}

function tokenizeMarkdown(line: string): Token[] {
  if (/^#{1,6}\s/.test(line)) return [{ kind: "head", text: line }];
  const ordered = line.match(/^(\d+\.\s+)(.*)$/);
  if (ordered) {
    return [
      { kind: "list", text: ordered[1] },
      { kind: "text", text: ordered[2] },
    ];
  }
  const bullet = line.match(/^(\-\s+)(.*)$/);
  if (bullet) {
    return [
      { kind: "list", text: bullet[1] },
      { kind: "text", text: bullet[2] },
    ];
  }
  return [{ kind: "text", text: line }];
}

export function highlightSkill(markdown: string): ReactNode {
  const lines = markdown.split("\n");
  let inFront = false;
  let seenOpen = false;

  return lines.map((line, index) => {
    if (line.trim() === "---") {
      if (!seenOpen) {
        seenOpen = true;
        inFront = true;
      } else if (inFront) {
        inFront = false;
      }
    }
    const tokens = inFront || line.trim() === "---" ? tokenizeYaml(line) : tokenizeMarkdown(line);
    return createElement(
      "div",
      { className: "code-line", key: index },
      createElement("span", { className: "ln", "aria-hidden": true }, String(index + 1)),
      createElement(
        "span",
        { className: "lt" },
        tokens.map((token, tokenIndex) =>
          createElement(
            "span",
            { className: `tok-${token.kind}`, key: tokenIndex },
            token.text || " ",
          ),
        ),
      ),
    );
  });
}

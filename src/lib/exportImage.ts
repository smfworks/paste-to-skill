import { toBlob } from "html-to-image";

const OPTIONS = {
  pixelRatio: 3,
  cacheBust: true,
  backgroundColor: "#0A0F1F",
} as const;

export async function cardToPngBlob(node: HTMLElement): Promise<Blob> {
  const blob = await toBlob(node, OPTIONS);
  if (!blob) throw new Error("Could not render the skill image.");
  return blob;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareTextAndPng(
  text: string,
  blob: Blob,
  filename: string,
  title: string,
): Promise<"shared" | "copied"> {
  const file = new File([blob], filename, { type: "image/png" });
  const canShare =
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file], text, title });
  if (canShare) {
    await navigator.share({ files: [file], text, title });
    return "shared";
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}

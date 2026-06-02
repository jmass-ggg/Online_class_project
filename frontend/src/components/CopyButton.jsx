import { useState } from "react";

export default function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value || value === "—") return;

    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      className={`copy-button ${copied ? "copied" : ""}`}
      type="button"
      onClick={handleCopy}
      aria-label="Copy enrollment code"
      title="Copy enrollment code"
    >
      <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
      <strong>{copied ? "Copied" : "Copy"}</strong>
    </button>
  );
}
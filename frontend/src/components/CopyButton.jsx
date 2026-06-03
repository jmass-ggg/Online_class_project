import { useState } from "react";

export default function CopyButton({ value, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const copyWithTextarea = (text) => {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.readOnly = true;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    const success = document.execCommand("copy");

    document.body.removeChild(textarea);

    return success;
  };

  const handleCopy = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const text = String(value || "").trim();

    if (!text || text === "—") {
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const success = copyWithTextarea(text);

        if (!success) {
          throw new Error("Fallback copy failed");
        }
      }

      setCopied(true);
      setFailed(false);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (err) {
      console.error("Copy failed:", err);

      setCopied(false);
      setFailed(true);

      window.prompt("Copy this enrollment code:", text);

      setTimeout(() => {
        setFailed(false);
      }, 2000);
    }
  };

  return (
    <button
      className={`copy-button ${copied ? "copied" : ""} ${
        failed ? "failed" : ""
      }`}
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${value || ""}`}
      title="Copy enrollment code"
    >
      <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
      <strong>{copied ? "Copied" : failed ? "Copy failed" : label}</strong>
    </button>
  );
}
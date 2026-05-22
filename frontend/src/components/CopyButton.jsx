import { useState } from "react";

export default function CopyButton({ value, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button className="btn btn-secondary btn-small" type="button" onClick={copy} disabled={!value}>
      {copied ? "Copied" : label}
    </button>
  );
}

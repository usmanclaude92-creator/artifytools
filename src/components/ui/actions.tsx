"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import { Icon } from "./icon";
import { useToast } from "./toast";

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts / older browsers.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

export function CopyButton({
  value,
  label = "Copy",
  size = "sm",
  disabled,
  toastMessage = "Copied to clipboard",
  ariaLabel,
}: {
  value: string;
  label?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  toastMessage?: string;
  ariaLabel?: string;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Button
      variant="secondary"
      size={size}
      disabled={disabled || !value}
      aria-label={ariaLabel}
      onClick={async () => {
        const ok = await writeClipboard(value);
        if (ok) {
          setCopied(true);
          toast(toastMessage);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 1800);
        } else {
          toast("Couldn't copy — select the text and copy it manually");
        }
      }}
    >
      <Icon name={copied ? "check" : "copy"} size={16} />
      {copied ? "Copied" : label}
    </Button>
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DownloadButton({
  filename,
  getBlob,
  label = "Download",
  disabled,
  variant = "secondary",
  size = "sm",
}: {
  filename: string;
  getBlob: () => Blob | Promise<Blob>;
  label?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
}) {
  const toast = useToast();
  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={async () => {
        try {
          downloadBlob(await getBlob(), filename);
          toast(`Downloaded ${filename}`);
        } catch {
          toast("Download failed");
        }
      }}
    >
      <Icon name="download" size={16} />
      {label}
    </Button>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { downloadBlob } from "@/components/ui/actions";
import { useToast } from "@/components/ui/toast";
import { useMessages } from "@/components/i18n/locale-provider";
import { createZip, safeFileName, uniqueNames } from "@/lib/files";

export interface OutputFile {
  name: string;
  blob: Blob;
}

/** One result downloads as itself; several are bundled into a single ZIP, built in the browser. */
export function DownloadAllButton({ files, zipName, disabled }: { files: OutputFile[]; zipName: string; disabled?: boolean }) {
  const m = useMessages();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (files.length === 0) return;
    if (files.length === 1) {
      downloadBlob(files[0]!.blob, safeFileName(files[0]!.name));
      return;
    }
    setBusy(true);
    try {
      const names = uniqueNames(files.map((f) => safeFileName(f.name)));
      const entries = await Promise.all(files.map(async (f, i) => ({ name: names[i]!, data: new Uint8Array(await f.blob.arrayBuffer()) })));
      const zip = createZip(entries);
      downloadBlob(new Blob([zip.buffer as ArrayBuffer], { type: "application/zip" }), safeFileName(zipName));
      toast(m.ui.downloaded(zipName));
    } catch {
      toast(m.ui.downloadFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={run} disabled={disabled || busy || files.length === 0}>
      <Icon name={busy ? "loader" : files.length > 1 ? "file-archive" : "download"} size={18} className={busy ? "animate-spin" : undefined} />
      {busy ? m.files.zipping : files.length > 1 ? m.files.downloadAll : m.ui.download}
    </Button>
  );
}

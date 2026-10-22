/** Helpers for naming downloaded files. */

const UNSAFE = /[\\/:*?"<>|\u0000-\u001f\u007f]/g;

/** Removes characters that are invalid in file names on common systems. Keeps Arabic and other scripts. */
export function safeFileName(name: string, fallback = "file"): string {
  const cleaned = name.replace(UNSAFE, "_").replace(/\s+/g, " ").trim().replace(/^\.+/, "");
  return cleaned.slice(0, 180) || fallback;
}

export function baseName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(0, dot) : base;
}

/** "photo.HEIC" + ".jpg" -> "photo.jpg"; "notes" + ".txt" -> "notes.txt". */
export function replaceExtension(name: string, ext: string): string {
  const e = ext.startsWith(".") ? ext : `.${ext}`;
  return `${safeFileName(baseName(name))}${e}`;
}

/** "photo.png" + "compressed" -> "photo-compressed.png". */
export function withSuffix(name: string, suffix: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : "";
  return safeFileName(`${stem}-${suffix}${ext}`);
}

/** Makes names unique case-insensitively: a.png, a.png -> a.png, a (2).png. */
export function uniqueNames(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    let candidate = name;
    let n = 2;
    while (used.has(candidate.toLowerCase())) {
      const dot = name.lastIndexOf(".");
      candidate = dot > 0 ? `${name.slice(0, dot)} (${n})${name.slice(dot)}` : `${name} (${n})`;
      n++;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  });
}

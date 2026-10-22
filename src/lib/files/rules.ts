/**
 * File-selection rules shared by every file tool. Pure functions, so they are unit-tested
 * and behave the same for picked, dropped and pasted files.
 */

/** The parts of a File the rules need (a real File satisfies this). */
export interface FileLike {
  name: string;
  type: string;
  size: number;
}

export interface FileRules {
  /** Accepted types: MIME types ("image/png"), wildcards ("image/*") or extensions (".pdf"). Empty = anything. */
  accept: string[];
  /** Largest single file, in bytes. */
  maxFileBytes: number;
  /** Largest combined size of all selected files, in bytes. */
  maxTotalBytes?: number;
  /** Most files that can be selected at once (including ones already selected). */
  maxFiles: number;
}

export type RejectReason = "type" | "size" | "empty" | "count" | "total";

export interface Rejection<F extends FileLike = FileLike> {
  file: F;
  reason: RejectReason;
}

export function extensionOf(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot).toLowerCase() : "";
}

export function matchesAccept(file: FileLike, accept: string[]): boolean {
  if (accept.length === 0) return true;
  const type = file.type.toLowerCase();
  const ext = extensionOf(file.name);
  return accept.some((raw) => {
    const a = raw.trim().toLowerCase();
    if (a.startsWith(".")) return ext === a;
    if (a.endsWith("/*")) return type.startsWith(a.slice(0, -1));
    return type === a;
  });
}

/**
 * Splits incoming files into accepted and rejected, given the files already selected.
 * Order is preserved; once the count or total limit is reached, later files are rejected.
 */
export function validateFiles<F extends FileLike>(incoming: F[], existing: FileLike[], rules: FileRules): { accepted: F[]; rejected: Rejection<F>[] } {
  const accepted: F[] = [];
  const rejected: Rejection<F>[] = [];
  let count = existing.length;
  let total = existing.reduce((sum, f) => sum + f.size, 0);
  for (const file of incoming) {
    let reason: RejectReason | null = null;
    if (!matchesAccept(file, rules.accept)) reason = "type";
    else if (file.size === 0) reason = "empty";
    else if (file.size > rules.maxFileBytes) reason = "size";
    else if (count >= rules.maxFiles) reason = "count";
    else if (rules.maxTotalBytes !== undefined && total + file.size > rules.maxTotalBytes) reason = "total";
    if (reason) {
      rejected.push({ file, reason });
    } else {
      accepted.push(file);
      count++;
      total += file.size;
    }
  }
  return { accepted, rejected };
}

/** The `accept` attribute for <input type="file">. */
export function acceptAttribute(accept: string[]): string | undefined {
  return accept.length ? accept.join(",") : undefined;
}

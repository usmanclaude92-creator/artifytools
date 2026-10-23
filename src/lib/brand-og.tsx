import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** The logo mark as a data URL for generated social images (read once per build). */
let markPromise: Promise<string> | null = null;
export function ogMark(): Promise<string> {
  markPromise ??= readFile(join(process.cwd(), "public/brand/artify-tools-mark.png")).then((b) => `data:image/png;base64,${b.toString("base64")}`);
  return markPromise;
}

/** Mark + "Artify Tools" wordmark for OG images (Satori supports gradient text via backgroundClip). */
export function OgBrand({ mark, height }: { mark: string; height: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(height * 0.3) }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
      <img src={mark} width={Math.round((height * 375) / 283)} height={height} alt="" />
      <div style={{ display: "flex", fontSize: Math.round(height * 0.62), fontWeight: 800, letterSpacing: -1 }}>
        <span style={{ color: "#071329" }}>Artify&nbsp;</span>
        <span style={{ backgroundImage: "linear-gradient(90deg, #00C6F0, #145BFF 42%, #7B2BFF 72%, #E500F5)", backgroundClip: "text", color: "transparent" }}>Tools</span>
      </div>
    </div>
  );
}

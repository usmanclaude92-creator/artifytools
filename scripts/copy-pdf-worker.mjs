// Copies pdf.js's worker, character maps and standard fonts into public/ so the
// browser can load them as static files (versioned, so caches never mix releases).
import { copyFileSync, cpSync, mkdirSync, readFileSync } from "node:fs";
const root = new URL("../node_modules/pdfjs-dist/", import.meta.url);
const { version } = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
const out = new URL(`../public/vendor/pdfjs-${version}/`, import.meta.url);
mkdirSync(out, { recursive: true });
copyFileSync(new URL("legacy/build/pdf.worker.min.mjs", root), new URL("pdf.worker.min.mjs", out));
cpSync(new URL("cmaps/", root), new URL("cmaps/", out), { recursive: true });
cpSync(new URL("standard_fonts/", root), new URL("standard_fonts/", out), { recursive: true });

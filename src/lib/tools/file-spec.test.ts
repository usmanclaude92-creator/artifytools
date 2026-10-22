import { describe, expect, it } from "vitest";
import { validateFiles } from "@/lib/files";
import { fileRulesFor, formatList, inputKindOf } from "./file-spec";
import { getSearchItems, toDirectoryItem, tools } from "./registry";
import { searchTools } from "../search";
import type { ToolDefinition, ToolFileSpec } from "./types";

const imageSpec: ToolFileSpec = { inputFormats: ["JPG", "PNG", "WebP"], accept: ["image/jpeg", "image/png", "image/webp"], outputFormats: ["JPG", "PNG", "WebP"], maxFileBytes: 25_000_000, maxFiles: 20, maxTotalBytes: 200_000_000 };
const pdfSpec: ToolFileSpec = { inputFormats: ["PDF"], accept: ["application/pdf", ".pdf"], outputFormats: ["PDF"], maxFileBytes: 100_000_000, maxFiles: 20 };

// A file tool built from a real text tool, to check the plumbing before the first real one ships.
const fakeImageTool: ToolDefinition = { ...tools[0]!, id: "image-compressor", slug: "image-compressor", name: "Image Compressor", category: "images", files: imageSpec };

describe("file tool specs", () => {
  it("derives what a tool works on", () => {
    expect(inputKindOf({})).toBe("text");
    expect(inputKindOf({ files: imageSpec })).toBe("images");
    expect(inputKindOf({ files: pdfSpec })).toBe("pdf");
    expect(inputKindOf({ files: { ...pdfSpec, accept: ["application/pdf", "image/png"] } })).toBe("files");
  });

  it("turns a spec into picker rules that enforce the same limits", () => {
    const rules = fileRulesFor(imageSpec);
    const big = { name: "huge.jpg", type: "image/jpeg", size: 30_000_000 };
    const ok = { name: "ok.webp", type: "image/webp", size: 1_000 };
    const pdf = { name: "doc.pdf", type: "application/pdf", size: 1_000 };
    const { accepted, rejected } = validateFiles([big, ok, pdf], [], rules);
    expect(accepted).toEqual([ok]);
    expect(rejected.map((r) => r.reason)).toEqual(["size", "type"]);
  });

  it("formats lists in English and Arabic", () => {
    expect(formatList(["JPG"], "en")).toBe("JPG");
    expect(formatList(["JPG", "PNG", "WebP"], "en")).toBe("JPG, PNG or WebP");
    expect(formatList(["JPG", "PNG", "WebP"], "ar")).toBe("JPG، PNG أو WebP");
    expect(formatList(["PDF", "Word"], "ar", "and")).toBe("PDF وWord");
  });

  it("puts formats into directory items so they are filterable and searchable", () => {
    const item = toDirectoryItem(fakeImageTool);
    expect(item.inputKind).toBe("images");
    expect(item.keywords).toEqual(expect.arrayContaining(["jpg", "png", "webp"]));
    expect(searchTools([...getSearchItems(), item], "webp", 1)[0]!.slug).toBe("image-compressor");
    expect(getSearchItems().every((i) => i.inputKind === "text")).toBe(true); // today's tools all take text or numbers
  });
});

describe("registered file tools", () => {
  const fileTools = tools.filter((t) => t.files);
  it("declare sane, consistent limits and formats", () => {
    for (const t of fileTools) {
      const f = t.files!;
      expect(f.inputFormats.length, t.id).toBeGreaterThan(0);
      expect(f.outputFormats.length, t.id).toBeGreaterThan(0);
      expect(f.accept.length, t.id).toBeGreaterThan(0);
      expect(f.maxFileBytes, t.id).toBeGreaterThan(0);
      expect(f.maxFileBytes, t.id).toBeLessThanOrEqual(500_000_000);
      expect(f.maxFiles, t.id).toBeGreaterThanOrEqual(1);
      if (f.maxTotalBytes !== undefined) expect(f.maxTotalBytes, t.id).toBeGreaterThanOrEqual(f.maxFileBytes);
      expect(["images", "pdf", "productivity", "ai"], t.id).toContain(t.category);
    }
  });
});

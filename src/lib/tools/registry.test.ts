import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { searchTools, tokenizeQuery } from "../search";
import { categories } from "./categories";
import { exampleSearches, getPopularTools, getPublishedCategories, getRelatedTools, getSearchItems, tools } from "./registry";

describe("tool registry integrity", () => {
  it("has unique ids and slugs, and slug matches id", () => {
    expect(new Set(tools.map((t) => t.id)).size).toBe(tools.length);
    expect(new Set(tools.map((t) => t.slug)).size).toBe(tools.length);
    for (const t of tools) expect(t.slug).toBe(t.id);
  });
  it("references real categories and related tools", () => {
    const catIds = new Set(categories.map((c) => c.id));
    const ids = new Set(tools.map((t) => t.id));
    for (const t of tools) {
      expect(catIds.has(t.category), t.id).toBe(true);
      for (const r of t.related ?? []) expect(ids.has(r) && r !== t.id, `${t.id} → ${r}`).toBe(true);
    }
  });
  it("has a UI and logic module for every published tool", () => {
    for (const t of tools.filter((t) => t.status !== "coming-soon")) {
      expect(existsSync(path.join(__dirname, "../../tools", t.id, "ui.tsx")), `${t.id} ui`).toBe(true);
    }
  });
  it("has complete, well-sized SEO and content fields", () => {
    for (const t of tools) {
      expect(t.seoTitle.endsWith("| Artify Tools"), t.id).toBe(true);
      expect(t.seoTitle.length, `${t.id} title`).toBeLessThanOrEqual(65);
      expect(t.seoDescription.length, `${t.id} desc`).toBeGreaterThan(60);
      expect(t.seoDescription.length, `${t.id} desc`).toBeLessThanOrEqual(175);
      expect(t.intro.length).toBeGreaterThanOrEqual(1);
      expect(t.howTo.length).toBeGreaterThanOrEqual(3);
      expect(t.faqs.length).toBeGreaterThanOrEqual(3);
      expect(t.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(t.privacyNote.length).toBeGreaterThan(20);
    }
  });
  it("describes processing honestly: external providers are never 'browser-local'", () => {
    for (const t of tools.filter((t) => t.aiPowered)) expect(t.processingMode).toBe("external-provider");
    for (const t of tools.filter((t) => t.processingMode === "browser-local")) {
      expect(t.privacyNote, t.id).not.toMatch(/sent to (an )?(artify )?server/i);
    }
  });
  it("only publishes categories that contain tools", () => {
    const published = getPublishedCategories();
    expect(published.map((c) => c.id)).not.toContain("images");
    expect(published.length).toBeGreaterThanOrEqual(4);
  });
  it("curates popular tools and always has related tools", () => {
    expect(getPopularTools(8)).toHaveLength(8);
    for (const t of tools) expect(getRelatedTools(t, 3).length).toBe(3);
  });
});

describe("search", () => {
  const items = getSearchItems();
  const top = (q: string) => searchTools(items, q, 3).map((i) => i.slug);

  it("returns the expected tool first for every hero example search", () => {
    const expected: Record<string, string> = {
      "Count words": "word-counter",
      "Calculate a percentage": "percentage-calculator",
      "Format JSON": "json-formatter",
      "Generate a secure password": "password-generator",
      "Find the difference between dates": "date-difference",
    };
    for (const q of exampleSearches) expect(top(q)[0], q).toBe(expected[q]);
  });
  it("matches names, tags, keywords and descriptions case-insensitively", () => {
    expect(top("WORD COUNTER")[0]).toBe("word-counter");
    expect(top("uuid")[0]).toBe("uuid-generator");
    expect(top("hex to rgb")[0]).toBe("color-converter");
    expect(top("qr")[0]).toBe("qr-code-generator");
    expect(top("vat")[0]).toBe("vat-calculator");
    expect(top("snake_case")).toContain("case-converter");
    expect(top("dedupe list")[0]).toBe("remove-duplicate-lines");
  });
  it("ranks exact name matches above weaker matches", () => {
    expect(top("password generator")[0]).toBe("password-generator");
    expect(top("json")[0]).toBe("json-formatter");
  });
  it("returns nothing for empty or unmatched queries", () => {
    expect(searchTools(items, "")).toEqual([]);
    expect(searchTools(items, "   ")).toEqual([]);
    expect(searchTools(items, "convert an image")).toEqual([]);
    expect(searchTools(items, "zzzzqqq")).toEqual([]);
  });
  it("tokenizes with filler removal and stemming", () => {
    expect(tokenizeQuery("Find the difference between dates")).toEqual(tokenizeQuery("difference dates"));
  });
});

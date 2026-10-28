import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { addBidi, decodeText, parseCsv, readFile, ReadError, rtfToLines, writeCsv } from "./read";

const file = (name: string, content: string) => new File([content], name);
const zipFile = async (name: string, parts: Record<string, string>) => {
  const z = new JSZip();
  for (const [n, c] of Object.entries(parts)) z.file(n, c);
  return new File([await z.generateAsync({ type: "arraybuffer" })], name);
};
const reread = async (blob: Blob, name: string) => readFile(new File([await blob.arrayBuffer()], name));

describe("Word (.docx)", () => {
  const doc = `<?xml version="1.0"?><w:document xmlns:w="w"><w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/><w:jc w:val="center"/></w:pPr><w:r><w:t>Annual report</w:t></w:r></w:p>
    <w:p><w:pPr><w:pStyle w:val="Normal"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">Sales grew </w:t></w:r><w:r><w:t>by 18 percent.</w:t></w:r></w:p>
    <w:p><w:r><w:t>12345</w:t></w:r></w:p>
    <w:tbl><w:tr><w:tc><w:p><w:r><w:t>Total &amp; tax</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
  </w:body></w:document>`;

  it("reads headings and paragraphs, joining text split over runs and skipping numbers", async () => {
    const r = await readFile(await zipFile("a.docx", { "word/document.xml": doc }));
    expect(r.format).toBe("docx");
    expect(r.blocks.map((b) => [b.kind, b.text])).toEqual([["heading", "Annual report"], ["paragraph", "Sales grew by 18 percent."], ["paragraph", "Total & tax"]]);
    expect(r.blocks[0]!.center).toBe(true);
  });

  it("writes the translation back into the same file, keeping the formatting and the numbers", async () => {
    const f = await zipFile("a.docx", { "word/document.xml": doc, "word/styles.xml": "<styles/>" });
    const r = await readFile(f);
    const out = await r.rebuild!(["التقرير السنوي", "نمت المبيعات بنسبة 18 بالمائة.", "الإجمالي والضريبة"], "ar");
    const zip = await JSZip.loadAsync(await out.arrayBuffer());
    expect(zip.file("word/styles.xml")).not.toBeNull();
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("<w:b/>"); // run formatting is still there
    expect(xml).toContain("<w:t>12345</w:t>"); // numbers untouched
    const back = await reread(out, "b.docx");
    expect(back.blocks.map((b) => b.text)).toEqual(["التقرير السنوي", "نمت المبيعات بنسبة 18 بالمائة.", "الإجمالي والضريبة"]);
  });

  it("marks paragraphs right-to-left for Arabic, in the order Word requires", () => {
    const p = '<w:p><w:pPr><w:pStyle w:val="X"/><w:spacing w:after="0"/><w:jc w:val="left"/></w:pPr><w:r><w:t>x</w:t></w:r></w:p>';
    expect(addBidi(p)).toContain('<w:pStyle w:val="X"/><w:bidi/><w:spacing');
    expect(addBidi("<w:p><w:r><w:t>x</w:t></w:r></w:p>")).toBe("<w:p><w:pPr><w:bidi/></w:pPr><w:r><w:t>x</w:t></w:r></w:p>");
    expect(addBidi(addBidi(p))).toBe(addBidi(p));
  });

  it("escapes characters that are special in XML", async () => {
    const r = await readFile(await zipFile("a.docx", { "word/document.xml": doc }));
    const out = await r.rebuild!(["H", "A < B & C", "Tom & Jerry"], "en");
    const xml = await (await JSZip.loadAsync(await out.arrayBuffer())).file("word/document.xml")!.async("string");
    expect(xml).toContain("A &lt; B &amp; C");
  });
});

describe("PowerPoint (.pptx)", () => {
  const slide = (t: string) => `<p:sld><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:pPr algn="l"/><a:r><a:t>${t}</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`;
  it("reads slides in order and writes the translation back, right-to-left for Arabic", async () => {
    const f = await zipFile("a.pptx", { "ppt/slides/slide2.xml": slide("Second slide"), "ppt/slides/slide1.xml": slide("First slide") });
    const r = await readFile(f);
    expect(r.blocks.map((b) => [b.text, b.page])).toEqual([["First slide", 1], ["Second slide", 2]]);
    const out = await r.rebuild!(["الشريحة الأولى", "الشريحة الثانية"], "ar");
    const zip = await JSZip.loadAsync(await out.arrayBuffer());
    const xml = await zip.file("ppt/slides/slide1.xml")!.async("string");
    expect(xml).toContain('rtl="1"');
    expect(xml).toContain("الشريحة الأولى");
  });
});

describe("Excel (.xlsx)", () => {
  it("translates the text cells and leaves the rest of the workbook alone", async () => {
    const sst = '<sst><si><t>Name</t></si><si><t>2026</t></si><si><r><t>Total </t></r><r><t>cost</t></r></si></sst>';
    const f = await zipFile("a.xlsx", { "xl/workbook.xml": "<workbook/>", "xl/sharedStrings.xml": sst, "xl/worksheets/sheet1.xml": "<worksheet>keep</worksheet>" });
    const r = await readFile(f);
    expect(r.blocks.map((b) => b.text)).toEqual(["Name", "Total cost"]);
    const out = await r.rebuild!(["Nom", "Coût total"], "fr");
    const zip = await JSZip.loadAsync(await out.arrayBuffer());
    expect(await zip.file("xl/worksheets/sheet1.xml")!.async("string")).toBe("<worksheet>keep</worksheet>");
    const back = await reread(out, "b.xlsx");
    expect(back.blocks.map((b) => b.text)).toEqual(["Nom", "Coût total"]);
  });
});

describe("OpenDocument, RTF, HTML", () => {
  it("reads .odt paragraphs and headings", async () => {
    const f = await zipFile("a.odt", { "content.xml": '<office:text><text:h text:outline-level="1">Title here</text:h><text:p>Hello<text:s/>there <text:span>world</text:span></text:p></office:text>' });
    const r = await readFile(f);
    expect(r.blocks.map((b) => [b.kind, b.text])).toEqual([["heading", "Title here"], ["paragraph", "Hello there world"]]);
    expect(r.rebuild).toBeNull();
  });

  it("reads RTF text and drops the formatting codes", () => {
    const rtf = String.raw`{\rtf1\ansi{\fonttbl{\f0 Arial;}}\pard Hello \b world\b0  caf\'e9\par Second line\par}`;
    expect(rtfToLines(rtf)).toEqual(["Hello world café", "Second line"]);
  });

  it("translates the text of an HTML page and keeps its tags", async () => {
    const html = '<html lang="en"><head><title>Hi there</title><style>p{color:red}</style></head><body><h1>Welcome</h1><p>Read <b>this</b> now &amp; later.</p><script>var a = "x";</script></body></html>';
    const r = await readFile(file("a.html", html));
    expect(r.blocks.map((b) => [b.kind, b.text])).toEqual([["paragraph", "Hi there"], ["heading", "Welcome"], ["paragraph", "Read"], ["paragraph", "this"], ["paragraph", "now & later."]]);
    const out = await r.rebuild!(["Bonjour", "Bienvenue", "Lisez", "ceci", "maintenant & plus tard."], "fr");
    const text = await out.text();
    expect(text).toContain("<h1>Bienvenue</h1>");
    expect(text).toContain("<script>var a = \"x\";</script>");
    expect(text).toContain('lang="fr" dir="ltr"');
    expect(text).toContain("maintenant &amp; plus tard.");
    const ar = await (await r.rebuild!(["a", "b", "c", "d", "e"], "ar")).text();
    expect(ar).toContain('dir="rtl"');
  });
});

describe("text, Markdown, subtitles, CSV", () => {
  it("translates each line of a text file and keeps the blank lines", async () => {
    const r = await readFile(file("a.txt", "First line\n\nSecond line\n"));
    expect(r.blocks.map((b) => b.text)).toEqual(["First line", "Second line"]);
    expect(await (await r.rebuild!(["Un", "Deux"], "fr")).text()).toBe("Un\n\nDeux\n");
  });

  it("keeps Markdown markers and code blocks", async () => {
    const md = "# Title\n\n- item one\n1. step\n> quoted\n\n```\ncode line\n```\nplain\n";
    const r = await readFile(file("a.md", md));
    expect(r.blocks.map((b) => [b.kind, b.text])).toEqual([["heading", "Title"], ["paragraph", "item one"], ["paragraph", "step"], ["paragraph", "quoted"], ["paragraph", "plain"]]);
    const out = await (await r.rebuild!(["T", "I", "S", "Q", "P"], "fr")).text();
    expect(out).toBe("# T\n\n- I\n1. S\n> Q\n\n```\ncode line\n```\nP\n");
  });

  it("translates only the spoken lines of subtitles", async () => {
    const srt = "1\n00:00:01,000 --> 00:00:03,000\nHello there.\nHow are you?\n\n2\n00:00:04,000 --> 00:00:05,000\nFine.\n";
    const r = await readFile(file("a.srt", srt));
    expect(r.blocks.map((b) => b.text)).toEqual(["Hello there.", "How are you?", "Fine."]);
    const out = await (await r.rebuild!(["Bonjour.", "Comment allez-vous ?", "Bien."], "fr")).text();
    expect(out).toBe("1\n00:00:01,000 --> 00:00:03,000\nBonjour.\nComment allez-vous ?\n\n2\n00:00:04,000 --> 00:00:05,000\nBien.\n");
  });

  it("translates the words in a CSV and leaves numbers and codes", async () => {
    const csv = 'Name,Amount,Note\r\n"Smith, John",100,Paid in full\r\nAcme,2026-01-05,"Say ""hi"""\r\n';
    const r = await readFile(file("a.csv", csv));
    expect(r.blocks.map((b) => b.text)).toEqual(["Name", "Amount", "Note", "Smith, John", "Paid in full", "Acme", 'Say "hi"']);
    const out = await (await r.rebuild!(["Nom", "Montant", "Remarque", "Smith, Jean", "Payé", "Acme", "Dis « salut »"], "fr")).text();
    expect(out.replace("﻿", "")).toBe('Nom,Montant,Remarque\r\n"Smith, Jean",100,Payé\r\nAcme,2026-01-05,Dis « salut »\r\n');
  });

  it("parses and writes CSV with quotes and line breaks", () => {
    const rows = [["a", 'b"c', "d,e"], ["line\nbreak", "", "x"]];
    expect(parseCsv(writeCsv(rows, ","), ",")).toEqual(rows);
  });

  it("decodes UTF-8, UTF-16 and Windows-1252 text", () => {
    expect(decodeText(new TextEncoder().encode("héllo"))).toBe("héllo");
    expect(decodeText(Uint8Array.from([0xff, 0xfe, 0x68, 0x00, 0x69, 0x00]))).toBe("hi");
    expect(decodeText(Uint8Array.from([0x63, 0x61, 0x66, 0xe9]))).toBe("café");
  });
});

describe("unsupported files", () => {
  it("asks for the newer format when given an old Office file", async () => {
    await expect(readFile(file("a.doc", "x"))).rejects.toMatchObject({ code: "legacy" });
    await expect(readFile(file("a.xls", "x"))).rejects.toBeInstanceOf(ReadError);
  });
  it("refuses types it cannot read, and damaged zips", async () => {
    await expect(readFile(file("a.exe", "x"))).rejects.toMatchObject({ code: "unsupported" });
    await expect(readFile(file("a.docx", "not a zip"))).rejects.toMatchObject({ code: "invalid" });
    await expect(readFile(await zipFile("a.docx", { "other.txt": "x" }))).rejects.toMatchObject({ code: "invalid" });
  });
});

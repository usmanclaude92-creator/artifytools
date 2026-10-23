import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { csvSheet, displayText, readWorkbook, sheetHtml } from "./model";

describe("spreadsheet model", () => {
  it("formats numbers and dates like Excel", () => {
    expect(displayText({ value: 1234.5, numFmt: "#,##0.00" }).text).toBe("1,234.50");
    expect(displayText({ value: 0.155, numFmt: "0.0%" }).text).toBe("15.5%");
    expect(displayText({ value: new Date(Date.UTC(2026, 9, 23)), numFmt: "dd/mm/yyyy" }).text).toBe("23/10/2026");
    expect(displayText({ value: { formula: "A1*2", result: 42 }, numFmt: "0" } as never).text).toBe("42");
    expect(displayText({ value: { richText: [{ text: "a" }, { text: "b" }] }, numFmt: "" } as never).text).toBe("ab");
  });

  it("reads styles, merges, widths and skips hidden sheets", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Invoice");
    ws.getColumn(1).width = 20;
    ws.mergeCells("A1:C1");
    ws.getCell("A1").value = "Quarterly sales";
    ws.getCell("A1").font = { bold: true, color: { argb: "FF145BFF" } };
    ws.getCell("A1").alignment = { horizontal: "center" };
    ws.getCell("A2").value = "المبلغ";
    ws.getCell("B2").value = 1250.5;
    ws.getCell("B2").numFmt = "#,##0.000";
    ws.getCell("C2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
    wb.addWorksheet("Secret").state = "hidden";
    const [s] = readWorkbook(wb);
    expect(readWorkbook(wb)).toHaveLength(1);
    expect(s!.cols[0]).toBe(145);
    expect(s!.rows[0]!.cells[0]).toMatchObject({ text: "Quarterly sales", bold: true, color: "#145BFF", align: "center", colspan: 3 });
    expect(s!.rows[0]!.cells[1]).toBeNull();
    expect(s!.rows[1]!.cells[0]).toMatchObject({ text: "المبلغ", rtl: true });
    expect(s!.rows[1]!.cells[1]).toMatchObject({ text: "1,250.500", align: "right" });
    expect(s!.rows[1]!.cells[2]).toMatchObject({ bg: "#FFFF00" });
    const html = sheetHtml(s!, { gridlines: true, title: true });
    expect(html).toContain('colspan="3"');
    expect(html).toContain("<h2>Invoice</h2>");
    expect(html).toContain('dir="rtl"');
  });

  it("parses CSV with quotes and semicolons, and escapes HTML", () => {
    const s = csvSheet('name;amount\n"Al Noor; LLC";1250\n<b>x</b>;3\n');
    expect(s.rows).toHaveLength(3);
    expect(s.rows[1]!.cells.map((c) => c!.text)).toEqual(["Al Noor; LLC", "1250"]);
    expect(s.rows[1]!.cells[1]!.align).toBe("right");
    expect(sheetHtml(s, { gridlines: false, title: false })).toContain("&lt;b&gt;x&lt;/b&gt;");
    // The last text cell in a row may run on past its column, like Excel.
    expect(sheetHtml(csvSheet("A very long note"), { gridlines: false, title: false })).toContain("overflow:visible");
  });
});

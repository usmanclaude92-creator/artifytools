import { expect, test } from "@playwright/test";

const mm = (px: number) => (px * 25.4) / 96;

test.describe("Cheque Printer", () => {
  test("fills an Omani cheque and prints it at real millimetre positions", async ({ page }) => {
    await page.goto("/tools/cheque-printer", { waitUntil: "networkidle" });
    await page.getByLabel("Country", { exact: true }).selectOption("OM");
    await expect(page.getByText(/Starting point: positions vary/)).toBeVisible();
    await page.getByLabel("Pay to", { exact: true }).fill("Al Noor Trading LLC");
    await page.getByRole("textbox", { name: "Amount" }).fill("1250.500");
    await page.getByLabel("Date", { exact: true }).fill("2026-11-05");
    await page.getByLabel("Crossing", { exact: true }).selectOption("acpayee");
    await page.evaluate(() => { (window as unknown as { printed: number }).printed = 0; window.print = () => { (window as unknown as { printed: number }).printed++; }; });
    await page.emulateMedia({ media: "print" });
    await page.getByRole("button", { name: "Print cheque" }).click();
    const root = page.locator("#cheque-print-root");
    await expect(root).toBeVisible();
    await expect(root).toContainText("**1,250.500**");
    await expect(root).toContainText("فقط ألف ومائتان وخمسون ريالًا عمانيًا وخمسمائة بيسة لا غير");
    await expect(root).toContainText("05/11/2026");
    await expect(root).toContainText("A/C Payee Only");
    await expect.poll(() => page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);
    // Payee box sits 20 mm from the left and 24 mm from the top of the cheque.
    const box = await root.getByText("Al Noor Trading LLC").evaluate((e) => {
      const r = (e.closest("[data-field]") ?? e).getBoundingClientRect();
      return { x: r.left, y: r.top };
    });
    expect(mm(box.x)).toBeCloseTo(20, 0);
    expect(mm(box.y)).toBeCloseTo(24, 0);
    // Guides are not printed on the real cheque.
    await expect(root.getByText("Payee", { exact: true })).toHaveCount(0);
  });

  test("rejects too many decimals and handles batch rows", async ({ page }) => {
    await page.goto("/tools/cheque-printer", { waitUntil: "networkidle" });
    await page.getByLabel("Cheque size").selectOption("us-business");
    await page.getByRole("textbox", { name: "Amount" }).fill("10.555");
    await expect(page.getByText("Enter an amount with at most 2 decimal places.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Print cheque" })).toBeDisabled();
    await page.getByRole("radio", { name: "Several cheques" }).check({ force: true });
    await page.getByLabel(/Paste rows/).fill("Acme Supplies Inc.\t980.25\t2026-11-01\nBad row\nJane Doe, 15, 01/12/2026");
    await expect(page.getByText("2 cheques ready.")).toBeVisible();
    await expect(page.getByText(/Check line\(s\) 2/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Print 2 cheques" })).toBeEnabled();
  });

  test("saves a calibrated layout on this device", async ({ page }) => {
    await page.goto("/tools/cheque-printer", { waitUntil: "networkidle" });
    await page.getByText("Adjust positions", { exact: true }).click();
    await page.getByLabel("Payee · Left (mm)").fill("25");
    await page.getByLabel("Save layout as…").fill("My bank");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Layout saved on this device.")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Cheque size").locator("option", { hasText: "My bank" })).toHaveCount(1);
  });

  test("country, bank and size dropdowns narrow each other", async ({ page }) => {
    await page.goto("/tools/cheque-printer", { waitUntil: "networkidle" });
    await page.getByLabel("Country", { exact: true }).selectOption("PK");
    const bank = page.getByLabel("Bank", { exact: true });
    await expect(bank.locator("option")).toHaveText(["Standard / any bank", "UBL"]);
    await bank.selectOption({ label: "UBL" });
    const size = page.getByLabel("Cheque size");
    await expect(size.locator("option")).toHaveText([/215\.9 × 71\.1 mm/, /241\.3 × 95\.3 mm/, "+ Add custom size"]);
    await size.selectOption("pk-ubl-1");
    await expect(page.getByRole("button", { name: "Print cheque" })).toBeVisible();
    await page.getByLabel("Country", { exact: true }).selectOption("CA");
    await expect(bank.locator("option")).toHaveCount(1);
    await expect(size.locator("option").first()).toContainText("158.8 × 69.9 mm");
  });

  test("a custom size is saved on this device and only shared when ticked", async ({ page }) => {
    const shared: unknown[] = [];
    await page.route("**/api/cheque-size", async (route) => {
      shared.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    });
    await page.goto("/tools/cheque-printer", { waitUntil: "networkidle" });
    await page.getByLabel("Country", { exact: true }).selectOption("PK");
    await page.getByLabel("Cheque size").selectOption("custom");
    await page.getByLabel("Name for this size").fill("Branch cheque");
    await page.getByLabel("Width (mm)", { exact: true }).fill("190");
    await page.getByLabel("Height (mm)", { exact: true }).fill("85");
    await page.getByRole("button", { name: "Save size" }).click();
    await expect(page.getByText("Layout saved on this device.")).toBeVisible();
    expect(shared).toHaveLength(0);
    await page.reload({ waitUntil: "networkidle" });
    await page.getByLabel("Country", { exact: true }).selectOption("PK");
    await expect(page.getByLabel("Cheque size").locator("option", { hasText: "Branch cheque · 190 × 85 mm" })).toHaveCount(1);
    // Ticking the box shares just the measurements.
    await page.getByLabel("Cheque size").selectOption("custom");
    await page.getByLabel("Name for this size").fill("Shared one");
    await page.getByRole("checkbox", { name: /Share this size with Artify/ }).first().check();
    await page.getByRole("button", { name: "Save size" }).click();
    await expect(page.getByText(/shared with Artify/)).toBeVisible();
    expect(shared).toHaveLength(1);
    expect(shared[0]).toMatchObject({ name: "Shared one", country: "PK", width: 175, height: 80 });
  });

  test("measures a cheque from an A4 scan and reads its labels with OCR", async ({ page }) => {
    await page.goto("/tools/cheque-printer", { waitUntil: "networkidle" });
    await page.getByLabel("Cheque size").selectOption("custom");
    await page.getByRole("button", { name: "Detect from an A4 scan" }).click();
    await expect(page.getByText("Print it at 100%", { exact: false })).toBeVisible();
    // An A4 page at 150 dpi with a 203 × 89 mm cheque copied onto it.
    const png = await page.evaluate(() => {
      const mm = 1240 / 210;
      const c = document.createElement("canvas");
      c.width = 1240; c.height = 1754;
      const g = c.getContext("2d")!;
      g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
      const x = 4 * mm, y = 40 * mm, w = 203 * mm, h = 89 * mm;
      g.strokeStyle = "#000"; g.lineWidth = 3; g.strokeRect(x, y, w, h);
      g.fillStyle = "#000"; g.font = "34px Arial";
      g.fillText("Date", x + 150 * mm, y + 12 * mm);
      g.fillText("Pay", x + 10 * mm, y + 30 * mm);
      g.fillText("Rupees", x + 10 * mm, y + 50 * mm);
      g.fillText("Rs.", x + 152 * mm, y + 62 * mm);
      g.strokeRect(x + 165 * mm, y + 54 * mm, 34 * mm, 12 * mm);
      return c.toDataURL("image/png").split(",")[1]!;
    });
    await page.locator('[data-testid="a4-scan"] input[type="file"]').setInputFiles({ name: "cheque-a4.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") });
    const size = page.getByTestId("scan-size");
    await expect(size).toContainText("Measured size:");
    const [w, h] = (await size.innerText()).match(/(\d+(?:\.\d+)?) × (\d+(?:\.\d+)?)/)!.slice(1).map(Number);
    expect(Math.abs(w! - 203)).toBeLessThan(3);
    expect(Math.abs(h! - 89)).toBeLessThan(3);
    await page.getByRole("button", { name: "Detect fields" }).click();
    await expect(page.getByRole("button", { name: "Use this size" })).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText(/of 6 fields were found from printed labels/)).toBeVisible();
    await page.getByRole("button", { name: "Use this size" }).click();
    const width = Number(await page.getByLabel("Width (mm)", { exact: true }).inputValue());
    expect(Math.abs(width - 203)).toBeLessThan(3);
    await expect(page.getByTestId("a4-scan")).toHaveCount(0);
  });

  test("an image that isn't a whole A4 sheet is refused with advice", async ({ page }) => {
    await page.goto("/tools/cheque-printer", { waitUntil: "networkidle" });
    await page.getByLabel("Cheque size").selectOption("custom");
    await page.getByRole("button", { name: "Detect from an A4 scan" }).click();
    const png = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 900; c.height = 900;
      c.getContext("2d")!.fillRect(0, 0, 900, 900);
      return c.toDataURL("image/png").split(",")[1]!;
    });
    await page.locator('[data-testid="a4-scan"] input[type="file"]').setInputFiles({ name: "square.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") });
    await expect(page.getByText(/doesn't look like a whole A4 sheet/)).toBeVisible();
  });

  test("Arabic page renders the tool", async ({ page }) => {
    await page.goto("/ar/tools/cheque-printer", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("طباعة الشيكات");
    await page.getByRole("textbox", { name: "المبلغ", exact: true }).fill("320.750");
    await expect(page.getByText("فقط ثلاثمائة وعشرون ريالًا عمانيًا وسبعمائة وخمسون بيسة لا غير").first()).toBeVisible();
  });
});

import { expect, test } from "@playwright/test";

test.describe("Amount in Words", () => {
  test("English page: Omani rials with three decimals, and validation", async ({ page }) => {
    await page.goto("/tools/amount-in-words");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Currency", { exact: true }).selectOption("OMR");
    await page.getByRole("textbox", { name: "Amount" }).fill("523.05");
    await expect(page.locator('p[lang="en"]')).toHaveText("Omani Rials Five Hundred Twenty Three and Baisa Fifty Only");
    await expect(page.locator('p[lang="ar"]')).toHaveText("فقط خمسمائة وثلاثة وعشرون ريالًا عمانيًا وخمسون بيسة لا غير");
    await page.getByLabel("English in CAPITALS").check();
    await expect(page.locator('p[lang="en"]')).toHaveText("OMANI RIALS FIVE HUNDRED TWENTY THREE AND BAISA FIFTY ONLY");
    // The Gulf bank style can be switched off for the usual order.
    await page.getByLabel("English in CAPITALS").uncheck();
    await page.getByLabel("Currency name first (Gulf bank style)").uncheck();
    await expect(page.locator('p[lang="en"]')).toHaveText("Five Hundred Twenty-Three Omani Rials and Fifty Baisa Only");
    await page.getByRole("textbox", { name: "Amount" }).fill("10.1234");
    await expect(page.getByRole("alert").first()).toContainText("at most 3 decimal places");
  });

  test("Arabic page: Arabic digits and the remembered currency", async ({ page }) => {
    await page.goto("/ar/tools/amount-in-words");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("العملة", { exact: true }).selectOption("AED");
    await page.getByRole("textbox", { name: "المبلغ" }).fill("١٥٠٠");
    await expect(page.locator('p[lang="ar"]')).toHaveText("فقط ألف وخمسمائة درهم إماراتي لا غير");
    await expect(page.locator('p[lang="en"]')).toHaveText("UAE Dirhams One Thousand Five Hundred Only");
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByLabel("العملة", { exact: true })).toHaveValue("AED");
  });
});

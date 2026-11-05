import { expect, test, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { readFileSync } from "node:fs";


async function open(page: Page, url = "/tools/adv-project-planner") {
  page.on("pageerror", (e) => { throw e; });
  await page.goto(url, { waitUntil: "networkidle" });
  await expect(page.getByTestId("planner-canvas")).toBeVisible();
}
const node = (page: Page, name: string) => page.locator("[data-node]", { hasText: name }).first();

test.describe("Adv. Project Planner", () => {
  test.use({ viewport: { width: 1440, height: 1000 }, permissions: ["clipboard-read", "clipboard-write"] });
  test("builds a plan with your own levels and shows a heading band for each", async ({ page }) => {
    await open(page);
    // A starting plan: the blank template has two levels, each with its own band and heading.
    await expect(page.locator("[data-level-band]")).toHaveCount(2);
    await page.getByRole("radio", { name: "Levels and tags" }).check({ force: true });
    await page.getByLabel("Level name 1").fill("Vision");
    await page.getByLabel("Level name 2").fill("Initiative");
    await expect(page.locator("svg text", { hasText: "Vision" })).toBeVisible();
    // Add a child under a box: a third level appears by itself and can be renamed.
    await node(page, "Item 1").click();
    await page.getByRole("button", { name: "Add child" }).click();
    await expect(page.locator("[data-level-band]")).toHaveCount(3);
    await page.getByLabel("Title", { exact: true }).fill("Deep task");
    await page.getByRole("radio", { name: "Levels and tags" }).check({ force: true });
    await page.getByLabel("Level name 3").fill("Action");
    await expect(page.locator("svg text", { hasText: "Action" })).toBeVisible();
    await expect(node(page, "Deep task")).toBeVisible();
    // Add a level by hand.
    await page.getByRole("button", { name: "Add level" }).click();
    await expect(page.getByLabel("Level name 4")).toBeVisible();
    await expect(page.locator("[data-level-band]")).toHaveCount(4);
  });

  test("status, notes and tags are kept, and undo and redo work", async ({ page }) => {
    await open(page);
    await node(page, "Item 2").click();
    await page.getByLabel("Status").selectOption("doing");
    await page.getByLabel("Due date").fill("2026-12-01");
    await expect(page.locator("[data-node]", { hasText: "2026-12-01" })).toBeVisible();
    await page.getByRole("radio", { name: "Levels and tags" }).check({ force: true });
    await page.getByRole("button", { name: "Add tag" }).click();
    await page.getByLabel("Tag name").fill("Urgent");
    await page.getByRole("radio", { name: "Box details" }).check({ force: true });
    await expect(page.getByRole("checkbox", { name: "Urgent" })).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByRole("button", { name: "Redo" })).toBeEnabled();
    await page.getByRole("button", { name: "Redo" }).click();
    await page.reload({ waitUntil: "networkidle" });
    // Saved in this browser.
    await expect(node(page, "Item 2")).toBeVisible();
    await node(page, "Item 2").click();
    await expect(page.getByLabel("Status")).toHaveValue("doing");
  });

  test("switches between layouts and collapses a branch", async ({ page }) => {
    await open(page);
    await page.getByLabel("Start a new plan from").selectOption("project");
    await page.getByRole("button", { name: "Create" }).click();
    for (const name of ["Left-to-right", "Radial"]) {
      await page.getByRole("button", { name, exact: true }).click();
      await expect(node(page, "Define the scope")).toBeVisible();
    }
    await page.getByRole("button", { name: "Top-down" }).click();
    await page.getByRole("button", { name: "Collapse: Plan" }).click();
    await expect(page.locator("[data-node]", { hasText: "Define the scope" })).toHaveCount(0);
    await page.getByRole("button", { name: "Expand: Plan" }).click();
    await expect(node(page, "Define the scope")).toBeVisible();
    await page.getByRole("button", { name: "Outline", exact: true }).click();
    await expect(page.getByRole("tree")).toContainText("Collect feedback");
  });

  test("a read-only link opens the plan without editing, and can be copied to edit", async ({ page, context }) => {
    await open(page);
    await page.getByLabel("Plan name").fill("Shared plan");
    await node(page, "Item 1").click();
    await page.getByLabel("Title", { exact: true }).fill("Visible to all");
    await page.getByRole("button", { name: "Copy read-only link" }).click();
    const link = await page.getByLabel("Read-only link").inputValue();
    expect(link).toContain("#plan=");
    const viewer = await context.newPage();
    await open(viewer, link);
    await expect(viewer.getByText("Read-only view: Shared plan")).toBeVisible();
    await expect(node(viewer, "Visible to all")).toBeVisible();
    await expect(viewer.getByRole("button", { name: "Add child" })).toHaveCount(0);
    await expect(viewer.getByLabel("Level name 1")).toHaveCount(0);
    await node(viewer, "Visible to all").click();
    await expect(viewer.getByTestId("planner-details")).toContainText("Visible to all");
    await viewer.getByRole("button", { name: "Make an editable copy" }).click();
    await expect(viewer.getByRole("button", { name: "Add child" })).toBeVisible();
    expect(viewer.url()).not.toContain("#plan=");
  });

  test("builds from an outline and exports files", async ({ page }) => {
    await open(page);
    await page.getByLabel("Build from an outline").fill("Studio\n  Design\n    Logo\n  Build\n    Site");
    await page.getByRole("button", { name: "Build plan" }).click();
    await expect(node(page, "Logo")).toBeVisible();
    await expect(page.locator("[data-level-band]")).toHaveCount(3);
    const [json] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Plan file (JSON)" }).click()]);
    expect(json.suggestedFilename()).toMatch(/\.json$/);
    expect(JSON.parse(readFileSync((await json.path())!, "utf8")).nodes).toHaveLength(5);
    const [svg] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "SVG image" }).click()]);
    expect(readFileSync((await svg.path())!, "utf8")).toContain("<svg");
    const [png] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "PNG image" }).click()]);
    expect(readFileSync((await png.path())!).subarray(1, 4).toString()).toBe("PNG");
    const [pdf] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "PDF", exact: true }).click()]);
    expect((await PDFDocument.load(readFileSync((await pdf.path())!))).getPageCount()).toBe(1);
  });

  test("deleting a box with children asks first", async ({ page }) => {
    await open(page);
    await page.getByLabel("Build from an outline").fill("Root\n  A\n    A1\n  B");
    await page.getByRole("button", { name: "Build plan" }).click();
    await node(page, "A").first().click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText("Delete this box and 1 inside it")).toBeVisible();
    await page.getByRole("button", { name: "Yes, delete" }).click();
    await expect(page.locator("[data-node]", { hasText: "A1" })).toHaveCount(0);
    await expect(node(page, "B")).toBeVisible();
  });

  test("the tools sit at the left, the site sidebar is gone, and full screen works", async ({ page }) => {
    await open(page);
    await expect(page.getByRole("complementary")).toHaveCount(0);
    const rail = page.getByRole("navigation", { name: "Planner tools" });
    const canvas = page.getByTestId("planner-canvas");
    expect((await rail.boundingBox())!.x).toBeLessThan((await canvas.boundingBox())!.x);
    await page.getByRole("button", { name: "Full screen" }).click();
    await expect(page.getByRole("button", { name: "Exit full screen" }).first()).toBeVisible();
    await expect(node(page, "Item 1")).toBeVisible();
    await page.getByRole("button", { name: "Exit full screen" }).first().click();
    await expect(page.getByRole("button", { name: "Full screen" })).toBeVisible();
  });

  test("the Arabic page works", async ({ page }) => {
    await open(page, "/ar/tools/adv-project-planner");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("مخطط المشاريع المتقدم");
    await page.getByRole("radio", { name: "المستويات والوسوم" }).check({ force: true });
    await expect(page.getByLabel("اسم المستوى 1")).toBeVisible();
    await page.getByRole("button", { name: "قائمة", exact: true }).click();
    await expect(page.getByRole("tree")).toBeVisible();
  });
});

test.describe("on a phone", () => {
test("the planner opens as an outline @mobile", async ({ page }) => {
  await page.goto("/tools/adv-project-planner", { waitUntil: "networkidle" });
  await expect(page.getByRole("tree")).toBeVisible();
  await page.getByRole("button", { name: /^Item 1/ }).first().click();
  await expect(page.getByTestId("planner-details")).toBeVisible();
});
});

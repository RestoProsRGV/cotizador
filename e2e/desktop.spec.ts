import { test, expect } from "@playwright/test";

const EMAIL = process.env.VITE_E2E_EMAIL ?? "";
const PASSWORD = process.env.VITE_E2E_PASSWORD ?? "";

test.describe("Desktop UI", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, "VITE_E2E_EMAIL / VITE_E2E_PASSWORD not set");
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/estimates|\/desktop/, { timeout: 15_000 });
  });

  test("desktop estimates list renders table", async ({ page }) => {
    await page.goto("/desktop/estimates");
    // Table should be visible (even if empty)
    await expect(page.locator("table, [role=table]")).toBeVisible({ timeout: 10_000 });
  });

  test("desktop search filters estimates", async ({ page }) => {
    await page.goto("/desktop/estimates");
    const search = page.getByPlaceholder(/search/i);
    await expect(search).toBeVisible();
    await search.fill("zzznomatch");
    // Table body should show empty state
    await expect(page.getByText(/no estimates|no results/i)).toBeVisible({ timeout: 5_000 });
  });

  test("desktop sidebar is visible with navigation icons", async ({ page }) => {
    await page.goto("/desktop/estimates");
    // Sidebar should be 64px wide — check it exists
    const sidebar = page.locator("nav, aside").first();
    await expect(sidebar).toBeVisible();
  });

  test("clicking a desktop estimate row navigates to detail", async ({ page }) => {
    await page.goto("/desktop/estimates");
    // Click the first table row link if any estimates exist
    const firstRow = page.locator("table tbody tr, [role=row]").first();
    const rowCount = await firstRow.count();
    if (rowCount === 0) {
      test.skip(true, "No estimates in DB to click");
    }
    await firstRow.click();
    await expect(page).toHaveURL(/\/desktop\/estimates\/.+/, { timeout: 10_000 });
  });

  test("desktop estimate detail shows 4 tabs", async ({ page }) => {
    await page.goto("/desktop/estimates");
    const firstRow = page.locator("table tbody tr, [role=row]").first();
    const rowCount = await firstRow.count();
    if (rowCount === 0) {
      test.skip(true, "No estimates in DB to test detail page");
    }
    await firstRow.click();
    await expect(page).toHaveURL(/\/desktop\/estimates\/.+/, { timeout: 10_000 });

    // Four tabs: Overview, Areas, General, Total
    await expect(page.getByRole("tab", { name: /overview/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /areas/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /general/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /total/i })).toBeVisible();
  });

  test("new estimate button on desktop shows toast instead of navigating", async ({ page }) => {
    await page.goto("/desktop/estimates");
    const newBtn = page.getByRole("button", { name: /new estimate/i });
    await expect(newBtn).toBeVisible();
    await newBtn.click();
    await expect(page.getByText(/create estimates from the mobile app/i)).toBeVisible({ timeout: 5_000 });
  });
});

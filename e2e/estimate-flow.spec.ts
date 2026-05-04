import { test, expect } from "@playwright/test";

const EMAIL = process.env.VITE_E2E_EMAIL ?? "";
const PASSWORD = process.env.VITE_E2E_PASSWORD ?? "";

test.describe("Full Estimate Flow", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, "VITE_E2E_EMAIL / VITE_E2E_PASSWORD not set");
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/estimates/, { timeout: 15_000 });
  });

  test("creates a new water estimate and navigates to areas", async ({ page }) => {
    await page.goto("/estimates/new");

    await page.getByLabel(/client name/i).fill("E2E Test Client");
    await page.getByLabel(/property address/i).fill("123 Test Street, McAllen TX");

    // Select Water job type
    await page.getByRole("button", { name: /water/i }).click();

    // Select Cat 1
    await page.getByRole("button", { name: /cat 1/i }).click();

    await page.getByRole("button", { name: /start estimate/i }).click();

    // Should land on areas screen
    await expect(page).toHaveURL(/\/estimates\/.+\/areas/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: /areas/i })).toBeVisible();
  });

  test("adds an area to an existing estimate", async ({ page }) => {
    // Create estimate first
    await page.goto("/estimates/new");
    await page.getByLabel(/client name/i).fill("E2E Area Test");
    await page.getByLabel(/property address/i).fill("456 Area Lane");
    await page.getByRole("button", { name: /water/i }).click();
    await page.getByRole("button", { name: /cat 1/i }).click();
    await page.getByRole("button", { name: /start estimate/i }).click();
    await expect(page).toHaveURL(/\/estimates\/.+\/areas/, { timeout: 10_000 });

    // Add an area
    const addBtn = page.getByRole("button", { name: /add area/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Fill area name
    await page.getByLabel(/room name/i).fill("Living Room");
    await page.getByRole("button", { name: /save/i }).click();

    // Area should appear in list
    await expect(page.getByText("Living Room")).toBeVisible({ timeout: 5_000 });
  });

  test("navigates through estimate tabs", async ({ page }) => {
    // Create estimate
    await page.goto("/estimates/new");
    await page.getByLabel(/client name/i).fill("E2E Nav Test");
    await page.getByLabel(/property address/i).fill("789 Nav Road");
    await page.getByRole("button", { name: /water/i }).click();
    await page.getByRole("button", { name: /cat 1/i }).click();
    await page.getByRole("button", { name: /start estimate/i }).click();
    await expect(page).toHaveURL(/\/estimates\/.+\/areas/, { timeout: 10_000 });

    // Extract estimate ID from URL
    const url = page.url();
    const idMatch = url.match(/\/estimates\/([^/]+)\/areas/);
    const estimateId = idMatch?.[1];
    test.skip(!estimateId, "Could not extract estimate ID");

    // Navigate to General tab
    await page.goto(`/estimates/${estimateId}/general`);
    await expect(page.getByRole("heading", { name: /general/i })).toBeVisible();

    // Navigate to Total tab
    await page.goto(`/estimates/${estimateId}/total`);
    await expect(page.getByRole("heading", { name: /total/i })).toBeVisible();
  });

  test("total screen shows grand total and action buttons", async ({ page }) => {
    // Create estimate
    await page.goto("/estimates/new");
    await page.getByLabel(/client name/i).fill("E2E Total Test");
    await page.getByLabel(/property address/i).fill("321 Total Ave");
    await page.getByRole("button", { name: /water/i }).click();
    await page.getByRole("button", { name: /cat 1/i }).click();
    await page.getByRole("button", { name: /start estimate/i }).click();
    await expect(page).toHaveURL(/\/estimates\/.+\/areas/, { timeout: 10_000 });

    const url = page.url();
    const idMatch = url.match(/\/estimates\/([^/]+)\/areas/);
    const estimateId = idMatch?.[1];
    test.skip(!estimateId, "Could not extract estimate ID");

    await page.goto(`/estimates/${estimateId}/total`);
    await expect(page.getByRole("button", { name: /present to client/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /download pdf/i })).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

const EMAIL = process.env.VITE_E2E_EMAIL ?? "";
const PASSWORD = process.env.VITE_E2E_PASSWORD ?? "";

test.describe("Estimates List", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, "VITE_E2E_EMAIL / VITE_E2E_PASSWORD not set");
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/estimates/, { timeout: 15_000 });
  });

  test("shows estimates list page header", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /my estimates/i })).toBeVisible();
  });

  test("search bar is visible and interactive", async ({ page }) => {
    const search = page.getByPlaceholder(/search by name/i);
    await expect(search).toBeVisible();
    await search.fill("test search");
    await expect(search).toHaveValue("test search");
  });

  test("search filters the list", async ({ page }) => {
    const search = page.getByPlaceholder(/search by name/i);
    await search.fill("zzznomatch");
    await expect(page.getByText(/no results found/i)).toBeVisible({ timeout: 5_000 });
  });

  test("FAB button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /new estimate/i })).toBeVisible();
  });

  test("FAB navigates to new estimate form", async ({ page }) => {
    await page.getByRole("button", { name: /new estimate/i }).click();
    await expect(page).toHaveURL(/\/estimates\/new/);
  });

  test("new estimate form has required fields", async ({ page }) => {
    await page.goto("/estimates/new");
    await expect(page.getByLabel(/client name/i)).toBeVisible();
    await expect(page.getByLabel(/property address/i)).toBeVisible();
  });

  test("shows validation errors when submitting empty form", async ({ page }) => {
    await page.goto("/estimates/new");
    await page.getByRole("button", { name: /start estimate/i }).click();
    await expect(page.getByText(/client name is required/i)).toBeVisible();
    await expect(page.getByText(/property address is required/i)).toBeVisible();
  });
});

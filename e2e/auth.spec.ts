import { test, expect } from "@playwright/test";

const EMAIL = process.env.VITE_E2E_EMAIL ?? "";
const PASSWORD = process.env.VITE_E2E_PASSWORD ?? "";

test.describe("Authentication", () => {
  test("redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/estimates");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("wrong@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 10_000 });
  });

  test("logs in with valid credentials and lands on estimates list", async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, "VITE_E2E_EMAIL / VITE_E2E_PASSWORD not set");
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/estimates/, { timeout: 15_000 });
  });

  test("signs out and redirects to login", async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, "VITE_E2E_EMAIL / VITE_E2E_PASSWORD not set");
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/estimates/, { timeout: 15_000 });

    // Open menu and sign out
    await page.getByRole("button", { name: /menu/i }).click();
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});

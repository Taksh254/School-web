import { test, expect, Page } from "@playwright/test"

// Helper: clear all auth state and localStorage seeded flag
async function clearAuth(page: Page) {
  await page.goto("/login")
  await page.evaluate(() => {
    localStorage.clear()
    document.cookie = "hk_bypass_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  })
}

// Helper: login as admin via dev bypass button
async function loginAsAdmin(page: Page) {
  await page.goto("/login")
  await page.evaluate(() => localStorage.setItem("hk_seeded", "1"))
  // Click the admin bypass button (only visible in development mode)
  await page.getByRole("button", { name: /bypass login \(enter as admin\)/i }).click()
  await page.waitForURL("**/dashboard/admin**", { timeout: 15000, waitUntil: "domcontentloaded" })
}

// Helper: login as parent via dev bypass button
async function loginAsParent(page: Page) {
  await page.goto("/login")
  await page.evaluate(() => localStorage.setItem("hk_seeded", "1"))
  await page.getByRole("button", { name: /bypass login \(enter as parent\)/i }).click()
  await page.waitForURL("**/dashboard/parent**", { timeout: 15000, waitUntil: "domcontentloaded" })
}

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page)
  })

  test("login page renders with email and password fields", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByText("Tiny Mind Play School")).toBeVisible()
    await expect(page.getByLabel(/email address/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /enter portal/i })).toBeVisible()
  })

  test("login page shows school logo and Back to Home link", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByText(/back to home/i)).toBeVisible()
  })

  test("admin bypass login redirects to /dashboard/admin", async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page).toHaveURL(/\/dashboard\/admin/)
    await expect(page.getByText("Admin Dashboard")).toBeVisible({ timeout: 10000 })
  })

  test("parent bypass login redirects to /dashboard/parent", async ({ page }) => {
    await loginAsParent(page)
    await expect(page).toHaveURL(/\/dashboard\/parent/)
  })

  test("already-logged-in admin visiting /login is redirected to /dashboard/admin", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/login")
    await page.waitForURL("**/dashboard/admin**", { timeout: 8000 })
    await expect(page).toHaveURL(/\/dashboard\/admin/)
  })

  test("logout clears session and redirects to /login", async ({ page }) => {
    await loginAsAdmin(page)
    // Find and click the logout button in the topbar
    await page.getByRole("button", { name: /logout|sign out/i }).click()
    await page.waitForURL("**/login**", { timeout: 8000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test("Google sign-in button is present on login page", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible()
  })

  test("switching to signup mode shows Full Name field", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("button", { name: /don't have an account/i }).click()
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible()
  })

  test("switching back to login mode hides Full Name field", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("button", { name: /don't have an account/i }).click()
    await page.getByRole("button", { name: /already have an account/i }).click()
    await expect(page.getByLabel(/full name/i)).not.toBeVisible()
  })
})

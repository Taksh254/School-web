import { test, expect, Page } from "@playwright/test"

async function clearAuth(page: Page) {
  await page.goto("/login")
  await page.evaluate(() => {
    localStorage.clear()
    document.cookie = "hk_bypass_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  })
}

async function loginAsAdmin(page: Page) {
  await page.goto("/login")
  await page.evaluate(() => {
    localStorage.setItem("hk_force_local", "1")
    localStorage.setItem("hk_seeded", "1")
  })
  await page.getByRole("button", { name: /bypass login \(enter as admin\)/i }).click()
  await page.waitForURL("**/dashboard/admin**", { timeout: 15000, waitUntil: "domcontentloaded" })
}

async function loginAsParent(page: Page) {
  await page.goto("/login")
  await page.evaluate(() => {
    localStorage.setItem("hk_force_local", "1")
    localStorage.setItem("hk_seeded", "1")
  })
  await page.getByRole("button", { name: /bypass login \(enter as parent\)/i }).click()
  await page.waitForURL("**/dashboard/parent**", { timeout: 15000, waitUntil: "domcontentloaded" })
}

test.describe("Route Protection", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page)
  })

  test("unauthenticated user accessing /dashboard/admin is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard/admin")
    await page.waitForURL("**/login**", { timeout: 8000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test("unauthenticated user accessing /dashboard/parent is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard/parent")
    await page.waitForURL("**/login**", { timeout: 8000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test("unauthenticated user accessing nested /dashboard/admin/students is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard/admin/students")
    await page.waitForURL("**/login**", { timeout: 8000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test("unauthenticated user accessing /dashboard/admin/fees is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard/admin/fees")
    await page.waitForURL("**/login**", { timeout: 8000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test("parent user accessing /dashboard/admin is redirected to /dashboard/parent", async ({ page }) => {
    await loginAsParent(page)
    await page.goto("/dashboard/admin")
    await page.waitForURL("**/dashboard/parent**", { timeout: 8000 })
    await expect(page).toHaveURL(/\/dashboard\/parent/)
  })

  test("admin user accessing /dashboard/parent is redirected to /dashboard/admin", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/dashboard/parent")
    await page.waitForURL("**/dashboard/admin**", { timeout: 8000 })
    await expect(page).toHaveURL(/\/dashboard\/admin/)
  })

  test("authenticated admin can access /dashboard/admin without redirect", async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page).toHaveURL(/\/dashboard\/admin/)
    await expect(page.getByText("Admin Dashboard")).toBeVisible({ timeout: 8000 })
  })

  test("authenticated parent can access /dashboard/parent without redirect", async ({ page }) => {
    await loginAsParent(page)
    await expect(page).toHaveURL(/\/dashboard\/parent/)
  })
})

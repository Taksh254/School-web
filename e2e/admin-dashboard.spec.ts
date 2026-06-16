import { test, expect, Page } from "@playwright/test"

async function loginAsAdmin(page: Page) {
  await page.goto("/login")
  await page.evaluate(() => {
    localStorage.setItem("hk_force_local", "1")
    localStorage.setItem("hk_seeded", "1")
  })
  await page.getByRole("button", { name: /bypass login \(enter as admin\)/i }).click()
  await page.waitForURL("**/dashboard/admin**", { timeout: 15000, waitUntil: "domcontentloaded" })
}

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("renders 'Admin Dashboard' heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible({ timeout: 10000 })
  })

  test("renders 'Total Students' stat card", async ({ page }) => {
    await expect(page.getByText("Total Students")).toBeVisible({ timeout: 10000 })
  })

  test("renders 'Fee Collected' stat card", async ({ page }) => {
    await expect(page.getByText("Fee Collected")).toBeVisible({ timeout: 10000 })
  })

  test("renders 'Pending Fees' stat card", async ({ page }) => {
    await expect(page.getByText("Pending Fees")).toBeVisible({ timeout: 10000 })
  })

  test("renders 'Programs' stat card", async ({ page }) => {
    const card = page.locator('a[href="/dashboard/admin/students"]').filter({ has: page.getByText(/^Programs$/) })
    await expect(card).toBeVisible({ timeout: 10000 })
  })

  test("shows 'Students by Program' breakdown section", async ({ page }) => {
    await expect(page.getByText("Students by Program")).toBeVisible({ timeout: 10000 })
  })

  test("shows program names in the breakdown", async ({ page }) => {
    await expect(page.getByText("Nursery")).toBeVisible({ timeout: 10000 })
  })

  test("shows 'Fee Collection Rate' bar", async ({ page }) => {
    await expect(page.getByText("Fee Collection Rate")).toBeVisible({ timeout: 10000 })
  })

  test("shows 'Quick Actions' section with links", async ({ page }) => {
    const quickActions = page.locator('h3:has-text("Quick Actions")').locator('..')
    await expect(quickActions).toBeVisible({ timeout: 10000 })
    await expect(quickActions.getByText("Manage Students")).toBeVisible()
    await expect(quickActions.getByText("Fee Records")).toBeVisible()
    await expect(quickActions.getByText("Announcements")).toBeVisible()
    await expect(quickActions.getByText("View Reports")).toBeVisible()
  })

  test("shows 'Recent Notices' section", async ({ page }) => {
    await expect(page.getByText("Recent Notices")).toBeVisible({ timeout: 10000 })
  })

  test("clicking 'Manage Students' navigates to students page", async ({ page }) => {
    await page.getByText("Manage Students").click()
    await expect(page).toHaveURL(/\/dashboard\/admin\/students/)
  })

  test("clicking 'Fee Records' navigates to fees page", async ({ page }) => {
    await page.getByText("Fee Records").click()
    await expect(page).toHaveURL(/\/dashboard\/admin\/fees/)
  })

  test("sidebar is visible on the dashboard", async ({ page, isMobile }) => {
    // DashboardSidebar should be visible on desktop, but hidden on mobile viewports
    const sidebar = page.locator("aside").first()
    if (isMobile) {
      await expect(sidebar).toBeHidden()
    } else {
      await expect(sidebar).toBeVisible()
    }
  })
})

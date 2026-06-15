import { test, expect, Page } from "@playwright/test"

async function loginAsParent(page: Page) {
  await page.goto("/login")
  await page.context().clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem("hk_force_local", "1")
  })
  await page.reload()
  await page.getByRole("button", { name: /bypass login \(enter as parent\)/i }).click()
  await page.waitForURL("**/dashboard/parent**", { timeout: 15000, waitUntil: "domcontentloaded" })
}

test.describe("Parent Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParent(page)
  })

  test("renders parent dashboard page successfully", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/parent/)
  })

  test("shows child's name (Aanya Sharma) — default parent is linked to s1", async ({ page }) => {
    // The demo parent@school.com has childId: "s1" (Aanya Sharma)
    await expect(page.getByText("Aanya Sharma")).toBeVisible({ timeout: 10000 })
  })

  test("shows child's program (Nursery)", async ({ page }) => {
    await expect(page.getByText(/nursery/i)).toBeVisible({ timeout: 10000 })
  })

  test("shows Attendance stat card", async ({ page }) => {
    await expect(page.getByText("Attendance")).toBeVisible({ timeout: 10000 })
  })

  test("shows Fee Status stat card", async ({ page }) => {
    await expect(page.getByText("Fee Status")).toBeVisible({ timeout: 10000 })
  })

  test("shows Announcements section", async ({ page }) => {
    await expect(page.getByText("Announcements")).toBeVisible({ timeout: 10000 })
  })

  test("shows at least one announcement title", async ({ page }) => {
    // seed data has announcements
    await expect(page.getByText("Annual Day Celebration 2026")).toBeVisible({ timeout: 10000 })
  })

  test("shows Teacher Notes section", async ({ page }) => {
    await expect(page.getByText("Teacher Notes")).toBeVisible({ timeout: 10000 })
  })

  test("shows Upcoming Events section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Upcoming Events" })).toBeVisible({ timeout: 10000 })
  })

  test("shows 'View all' links for Announcements", async ({ page }) => {
    const viewAllLinks = page.getByRole("link", { name: /view all/i })
    await expect(viewAllLinks.first()).toBeVisible({ timeout: 8000 })
  })

  test("navigating to /dashboard/parent/attendance works", async ({ page }) => {
    await page.goto("/dashboard/parent/attendance")
    await expect(page).toHaveURL(/\/dashboard\/parent\/attendance/)
  })

  test("navigating to /dashboard/parent/fees works", async ({ page }) => {
    await page.goto("/dashboard/parent/fees")
    await expect(page).toHaveURL(/\/dashboard\/parent\/fees/)
  })

  test("navigating to /dashboard/parent/announcements works", async ({ page }) => {
    await page.goto("/dashboard/parent/announcements")
    await expect(page).toHaveURL(/\/dashboard\/parent\/announcements/)
  })
})

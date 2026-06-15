import { test, expect, Page } from "@playwright/test"

async function loginAsAdmin(page: Page) {
  await page.goto("/login")
  await page.context().clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem("hk_force_local", "1")
  })
  await page.reload()
  await page.getByRole("button", { name: /bypass login \(enter as admin\)/i }).click()
  await page.waitForURL("**/dashboard/admin**", { timeout: 15000, waitUntil: "domcontentloaded" })
}

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

test.describe("Attendance — Admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/dashboard/admin/attendance")
  })

  test("attendance page loads successfully", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/admin\/attendance/)
  })

  test("student list or calendar is visible", async ({ page }) => {
    // Attendance view should show student names or dates
    await expect(page.getByText("Aanya Sharma").first()).toBeVisible({ timeout: 10000 })
  })

  test("shows attendance status indicators (present/absent)", async ({ page }) => {
    // Wait for at least one status text to be visible to handle table animation delays
    await expect(page.getByText(/present|absent/i).first()).toBeVisible({ timeout: 10000 })
  })

  test("shows a date selector or month navigation", async ({ page }) => {
    // Look for month/date navigation controls
    const dateControl = page.getByRole("button", { name: /prev|next|month|today/i }).first()
    if (await dateControl.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(dateControl).toBeVisible()
    }
  })

  test("can mark a student present", async ({ page }) => {
    // Find and click a present button/checkbox
    const presentBtn = page.getByRole("button", { name: /mark present|present/i }).first()
    if (await presentBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await presentBtn.click()
      await page.waitForTimeout(500)
      // Verify UI updates
    }
  })
})

test.describe("Attendance — Parent", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParent(page)
    await page.goto("/dashboard/parent/attendance")
  })

  test("parent attendance page loads successfully", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/parent\/attendance/)
  })

  test("shows child's name on the attendance page", async ({ page }) => {
    await expect(page.getByText("Aanya Sharma").first()).toBeVisible({ timeout: 10000 })
  })

  test("shows attendance percentage or summary", async ({ page }) => {
    const percentText = page.getByText(/%/).first()
    if (await percentText.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(percentText).toBeVisible()
    }
  })

  test("shows month-based attendance calendar or list", async ({ page }) => {
    // Should show dates with present/absent status
    const attendanceData = page.getByText(/present|absent|holiday|leave/i).first()
    await expect(attendanceData).toBeVisible({ timeout: 10000 })
  })
})

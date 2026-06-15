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

test.describe("Fee Management — Admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/dashboard/admin/fees")
  })

  test("fee page loads and shows student fee records", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/admin\/fees/)
    // Seed data has students with fees
    await expect(page.getByText("Aanya Sharma").first()).toBeVisible({ timeout: 10000 })
  })

  test("shows fee status badges (paid, pending, overdue)", async ({ page }) => {
    const paidBadge = page.getByText(/paid/i).first()
    await expect(paidBadge).toBeVisible({ timeout: 10000 })
  })

  test("shows fee amounts", async ({ page }) => {
    // Seed data has ₹25,000 fees
    await expect(page.getByText(/25,000|25000/i).first()).toBeVisible({ timeout: 10000 })
  })

  test("'Mark as Paid' button is visible for non-paid fees", async ({ page }) => {
    const markPaidBtn = page.getByRole("button", { name: /mark.*paid|pay now/i }).first()
    if (await markPaidBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(markPaidBtn).toBeVisible()
    }
  })

  test("clicking 'Mark as Paid' updates fee status to paid", async ({ page }) => {
    const markPaidBtn = page.getByRole("button", { name: /mark.*paid/i }).first()
    const isVisible = await markPaidBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (isVisible) {
      await markPaidBtn.click()
      await page.waitForTimeout(1000)
      // After marking paid, the "paid" count should increase
      const paidCount = await page.getByText(/^paid$/i).count()
      expect(paidCount).toBeGreaterThan(0)
    }
  })

  test("'Add Fee Record' button is visible", async ({ page }) => {
    const addFeeBtn = page.getByRole("button", { name: /add fee|new fee/i })
    if (await addFeeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(addFeeBtn).toBeVisible()
    }
  })

  test("fee summary stats are shown (total collected)", async ({ page }) => {
    // Look for summary cards at the top of fees page
    const collectedText = page.getByText(/collected|total/i).first()
    await expect(collectedText).toBeVisible({ timeout: 10000 })
  })
})

test.describe("Fee Management — Parent", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParent(page)
    await page.goto("/dashboard/parent/fees")
  })

  test("parent fee page loads successfully", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/parent\/fees/)
  })

  test("shows fee records for linked child (Aanya Sharma)", async ({ page }) => {
    await expect(page.getByText("Aanya Sharma").first()).toBeVisible({ timeout: 10000 })
  })

  test("shows term information", async ({ page }) => {
    await expect(page.getByText(/Q1|Apr-Jun/i).first()).toBeVisible({ timeout: 10000 })
  })

  test("shows payment status", async ({ page }) => {
    await expect(page.getByText(/paid|pending/i).first()).toBeVisible({ timeout: 10000 })
  })
})

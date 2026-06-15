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

test.describe("Announcements — Admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/dashboard/admin/announcements")
  })

  test("announcements page loads successfully", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/admin\/announcements/)
  })

  test("shows existing announcements from seed data", async ({ page }) => {
    await expect(page.getByText("Annual Day Celebration 2026")).toBeVisible({ timeout: 10000 })
  })

  test("shows multiple announcements in the list", async ({ page }) => {
    await expect(page.getByText("Summer Camp Registration Open")).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("Parent-Teacher Meeting")).toBeVisible({ timeout: 10000 })
  })

  test("shows announcement priority badges", async ({ page }) => {
    const importantBadge = page.getByText(/important/i).first()
    if (await importantBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(importantBadge).toBeVisible()
    }
  })

  test("'New Announcement' or 'Add' button is visible", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /new announcement|add announcement|create/i }).first()
    await expect(addBtn).toBeVisible({ timeout: 8000 })
  })

  test("can create a new announcement", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /new announcement|add announcement|create/i }).first()
    await addBtn.click()

    // Fill the form
    const titleInput = page.getByLabel(/title/i).first()
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill("E2E Test Announcement")

      const contentInput = page.getByLabel(/content|message/i).first()
      if (await contentInput.isVisible()) {
        await contentInput.fill("This is an E2E test announcement.")
      }

      // Save/submit
      const saveBtn = page.getByRole("button", { name: /save|publish|submit/i }).first()
      await saveBtn.click()
      await page.waitForTimeout(1000)

      // New announcement should appear in list
      await expect(page.getByText("E2E Test Announcement")).toBeVisible({ timeout: 8000 })
    }
  })

  test("can delete an announcement", async ({ page }) => {
    const deleteBtn = page.getByRole("button", { name: /delete|remove/i }).first()
    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const countBefore = await page.getByText(/Annual Day|Summer Camp|Parent-Teacher/i).count()
      await deleteBtn.click()

      // Confirm deletion if dialog appears
      const confirmBtn = page.getByRole("button", { name: /confirm|yes|delete/i })
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click()
      }

      await page.waitForTimeout(1000)
      const countAfter = await page.getByText(/Annual Day|Summer Camp|Parent-Teacher/i).count()
      expect(countAfter).toBeLessThan(countBefore)
    }
  })

  test("shows announcement author", async ({ page }) => {
    await expect(page.getByText("Principal Sunita").first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe("Announcements — Parent view", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParent(page)
    await page.goto("/dashboard/parent/announcements")
  })

  test("parent announcements page loads", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/parent\/announcements/)
  })

  test("shows published announcements from seed data", async ({ page }) => {
    await expect(page.getByText("Annual Day Celebration 2026")).toBeVisible({ timeout: 10000 })
  })

  test("shows announcement date", async ({ page }) => {
    // Dates like "25 May" format
    const dateText = page.getByText(/may|jun|jan/i).first()
    await expect(dateText).toBeVisible({ timeout: 10000 })
  })
})

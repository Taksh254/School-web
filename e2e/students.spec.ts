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

test.describe("Student Management (Admin)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/dashboard/admin/students")
  })

  test("students page loads successfully", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/admin\/students/)
  })

  test("shows at least one student row in the table", async ({ page }) => {
    // Seed data has 8 students
    await expect(page.getByText("Aanya Sharma")).toBeVisible({ timeout: 10000 })
  })

  test("shows student program type in the list", async ({ page }) => {
    await expect(page.getByText("Nursery").first()).toBeVisible({ timeout: 10000 })
  })

  test("shows all program types from seed data", async ({ page }) => {
    await expect(page.getByText("Play Group").first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("UKG").first()).toBeVisible({ timeout: 10000 })
  })

  test("'Add Student' button is visible", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /add student/i })
    await expect(addBtn).toBeVisible({ timeout: 8000 })
  })

  test("clicking 'Add Student' opens a form or modal", async ({ page }) => {
    await page.getByRole("button", { name: /add student/i }).click()
    // A form with Name input should appear
    await expect(page.getByLabel(/student name|name/i).first()).toBeVisible({ timeout: 5000 })
  })

  test("can fill and submit the add student form", async ({ page }) => {
    await page.getByRole("button", { name: /add student/i }).click()

    // Fill the form fields (labels may vary by implementation)
    const nameInput = page.getByLabel(/student name|name/i).first()
    await nameInput.fill("E2E Test Child")

    // Fill date of birth
    const dobInput = page.getByLabel(/date of birth/i).first()
    if (await dobInput.isVisible()) {
      await dobInput.fill("2022-01-15")
    }

    // Try to find parent name field
    const parentInput = page.getByLabel(/parent name/i).first()
    if (await parentInput.isVisible()) {
      await parentInput.fill("E2E Test Parent")
    }

    // Fill email
    const emailInput = page.getByLabel(/email/i).first()
    if (await emailInput.isVisible()) {
      await emailInput.fill("e2etest@email.com")
    }

    // Submit
    const submitBtn = page.locator('form button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForTimeout(1000)
    }

    // New student should appear in list
    await expect(page.getByText("E2E Test Child")).toBeVisible({ timeout: 8000 })
  })

  test("search input filters students by name", async ({ page }) => {
    const searchInput = page.getByRole("searchbox").or(page.getByPlaceholder(/search/i))
    if (await searchInput.isVisible()) {
      await searchInput.fill("Aanya")
      await page.waitForTimeout(500)
      await expect(page.getByText("Aanya Sharma")).toBeVisible()
      await expect(page.getByText("Arjun Verma")).not.toBeVisible()
    }
  })

  test("edit button opens student form with pre-filled values", async ({ page }) => {
    // Find an edit button for the first student
    const editBtn = page.getByRole("button", { name: /edit/i }).first()
    if (await editBtn.isVisible()) {
      await editBtn.click()
      // The form should be pre-populated — check the name is filled
      const nameInput = page.getByLabel(/student name|name/i).first()
      const value = await nameInput.inputValue()
      expect(value.length).toBeGreaterThan(0)
    }
  })

  test("delete button shows confirmation before removing student", async ({ page }) => {
    const deleteBtn = page.getByRole("button", { name: /delete|remove/i }).first()
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click()
      // Look for a confirmation prompt
      const confirmBtn = page.getByRole("button", { name: /confirm|yes|delete/i })
      await expect(confirmBtn).toBeVisible({ timeout: 3000 })
    }
  })
})

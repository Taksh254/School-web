import { generatePasswordFromDob, createParentAccount } from "@/lib/data-store"

describe("Parent Account Provisioning", () => {
  describe("generatePasswordFromDob", () => {
    it("generates correct DDMMYYYY password for standard ISO date", () => {
      // 15th August 2021
      expect(generatePasswordFromDob("2021-08-15")).toBe("15082021")
    })

    it("generates correct DDMMYYYY password for slash date formats", () => {
      expect(generatePasswordFromDob("2021/08/15")).toBe("15082021")
    })

    it("handles single-digit days and months with zero-padding", () => {
      // 5th May 2018
      expect(generatePasswordFromDob("2018-05-05")).toBe("05052018")
    })

    it("falls back to School@123 for invalid or missing dates", () => {
      expect(generatePasswordFromDob("")).toBe("School@123")
      expect(generatePasswordFromDob("invalid-date")).toBe("School@123")
      // @ts-ignore
      expect(generatePasswordFromDob(null)).toBe("School@123")
    })
  })

  describe("createParentAccount (offline client path)", () => {
    beforeEach(() => {
      // Mock global fetch
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ created: true, skipped: false }),
        })
      ) as jest.Mock
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it("returns error if email is invalid or missing", async () => {
      const result = await createParentAccount("s1", "", "Parent Name", "2021-08-15")
      expect(result.created).toBe(false)
      expect(result.skipped).toBe(true)
      expect(result.error).toBeDefined()
    })

    it("calls POST /api/create-parent-account with correct payload", async () => {
      const result = await createParentAccount("s1", "parent@example.com", "Parent Name", "2021-08-15")
      expect(global.fetch).toHaveBeenCalledWith("/api/create-parent-account", expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "parent@example.com",
          password: "15082021",
          studentId: "s1",
          parentName: "Parent Name",
        }),
      }))
      expect(result.created).toBe(true)
      expect(result.defaultPassword).toBe("15082021")
    })

    it("handles skipped responses successfully", async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ created: false, skipped: true }),
        })
      ) as jest.Mock

      const result = await createParentAccount("s1", "existing@example.com", "Parent Name", "2021-08-15")
      expect(result.created).toBe(false)
      expect(result.skipped).toBe(true)
      expect(result.defaultPassword).toBeUndefined()
    })

    it("handles API error responses gracefully", async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Failed to create user in auth" }),
        })
      ) as jest.Mock

      const result = await createParentAccount("s1", "error@example.com", "Parent Name", "2021-08-15")
      expect(result.created).toBe(false)
      expect(result.skipped).toBe(false)
      expect(result.error).toBe("Failed to create user in auth")
    })
  })
})

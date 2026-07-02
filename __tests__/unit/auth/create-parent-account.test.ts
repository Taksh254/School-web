import { generatePasswordFromEmail, createParentAccount } from "@/lib/data-store"

describe("Parent Account Provisioning", () => {
  describe("generatePasswordFromEmail", () => {
    it("generates correct Tak@123 password for email", () => {
      expect(generatePasswordFromEmail("takshsehrawat08@gmail.com")).toBe("Tak@123")
    })

    it("handles capitalized email usernames", () => {
      expect(generatePasswordFromEmail("TakshSehrawat@gmail.com")).toBe("Tak@123")
    })

    it("handles usernames with less than 3 letters by padding", () => {
      expect(generatePasswordFromEmail("ab@gmail.com")).toBe("Abx@123")
    })

    it("falls back to School@123 for invalid or missing emails", () => {
      expect(generatePasswordFromEmail("")).toBe("School@123")
      expect(generatePasswordFromEmail("invalid-email")).toBe("School@123")
      // @ts-ignore
      expect(generatePasswordFromEmail(null)).toBe("School@123")
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
      const result = await createParentAccount("s1", "", "Parent Name")
      expect(result.created).toBe(false)
      expect(result.skipped).toBe(true)
      expect(result.error).toBeDefined()
    })

    it("calls POST /api/create-parent-account with correct payload", async () => {
      const result = await createParentAccount("s1", "takshsehrawat08@gmail.com", "Parent Name")
      expect(global.fetch).toHaveBeenCalledWith("/api/create-parent-account", expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "takshsehrawat08@gmail.com",
          password: "Tak@123",
          studentId: "s1",
          parentName: "Parent Name",
        }),
      }))
      expect(result.created).toBe(true)
      expect(result.defaultPassword).toBe("Tak@123")
    })

    it("handles skipped responses successfully", async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ created: false, skipped: true }),
        })
      ) as jest.Mock

      const result = await createParentAccount("s1", "existing@example.com", "Parent Name")
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

      const result = await createParentAccount("s1", "error@example.com", "Parent Name")
      expect(result.created).toBe(false)
      expect(result.skipped).toBe(false)
      expect(result.error).toBe("Failed to create user in auth")
    })
  })
})

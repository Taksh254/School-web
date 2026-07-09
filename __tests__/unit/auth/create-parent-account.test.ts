import { createParentAccount } from "@/lib/data-store"

describe("Parent Account Provisioning", () => {
  describe("createParentAccount (offline client path)", () => {
    beforeEach(() => {
      // Mock global fetch
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ created: true, skipped: false, userId: "fake-id" }),
        })
      ) as jest.Mock
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it("returns error if email is invalid or missing", async () => {
      const result = await createParentAccount("", "Parent Name", "s1")
      expect(result.created).toBe(false)
      expect(result.skipped).toBe(true)
      expect(result.error).toBeDefined()
    })

    it("calls POST /api/create-parent-account with correct payload", async () => {
      const result = await createParentAccount("takshsehrawat08@gmail.com", "Parent Name", "s1")
      expect(global.fetch).toHaveBeenCalledWith("/api/create-parent-account", expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "takshsehrawat08@gmail.com",
          studentId: "s1",
          parentName: "Parent Name",
        }),
      }))
      expect(result.created).toBe(true)
      expect(result.userId).toBe("fake-id")
    })

    it("handles skipped responses successfully", async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ created: false, skipped: true }),
        })
      ) as jest.Mock

      const result = await createParentAccount("existing@example.com", "Parent Name", "s1")
      expect(result.created).toBe(false)
      expect(result.skipped).toBe(true)
    })

    it("handles API error responses gracefully", async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Failed to create user in auth" }),
        })
      ) as jest.Mock

      const result = await createParentAccount("error@example.com", "Parent Name", "s1")
      expect(result.created).toBe(false)
      expect(result.skipped).toBe(false)
      expect(result.error).toBe("Failed to create user in auth")
    })
  })
})

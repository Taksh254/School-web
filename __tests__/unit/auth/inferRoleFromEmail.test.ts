import { inferRoleFromEmail } from "@/lib/types"

describe("inferRoleFromEmail", () => {
  describe("Client side role inference", () => {
    it("always returns 'parent' as role is resolved from database on the server", () => {
      expect(inferRoleFromEmail("admin@school.com")).toBe("parent")
      expect(inferRoleFromEmail("parent@school.com")).toBe("parent")
      expect(inferRoleFromEmail("someone@gmail.com")).toBe("parent")
      expect(inferRoleFromEmail("")).toBe("parent")
    })
  })
})

import { inferRoleFromEmail, ADMIN_EMAILS } from "@/lib/types"

describe("inferRoleFromEmail", () => {
  describe("Admin emails", () => {
    test.each(ADMIN_EMAILS)(
      "returns 'admin' for known admin email: %s",
      (email) => {
        expect(inferRoleFromEmail(email)).toBe("admin")
      }
    )

    it("returns 'admin' for admin@school.com (lowercase)", () => {
      expect(inferRoleFromEmail("admin@school.com")).toBe("admin")
    })

    it("returns 'admin' for ADMIN@SCHOOL.COM (uppercase — case-insensitive)", () => {
      expect(inferRoleFromEmail("ADMIN@SCHOOL.COM")).toBe("admin")
    })

    it("returns 'admin' for mixed-case Admin@School.COM", () => {
      expect(inferRoleFromEmail("Admin@School.COM")).toBe("admin")
    })
  })

  describe("Parent emails", () => {
    it("returns 'parent' for a generic email", () => {
      expect(inferRoleFromEmail("parent@school.com")).toBe("parent")
    })

    it("returns 'parent' for a completely unrecognised email", () => {
      expect(inferRoleFromEmail("someone@gmail.com")).toBe("parent")
    })

    it("returns 'parent' for an empty string", () => {
      expect(inferRoleFromEmail("")).toBe("parent")
    })

    it("returns 'parent' for email containing 'admin' substring but not matching exactly", () => {
      // e.g. notadmin@school.com should NOT be admin
      expect(inferRoleFromEmail("notadmin@school.com")).toBe("parent")
    })

    it("returns 'parent' for a parent's school email", () => {
      expect(inferRoleFromEmail("priya.sharma@school.com")).toBe("parent")
    })
  })

  describe("ADMIN_EMAILS constant", () => {
    it("contains at least one entry", () => {
      expect(ADMIN_EMAILS.length).toBeGreaterThan(0)
    })

    it("contains admin@school.com", () => {
      expect(ADMIN_EMAILS).toContain("admin@school.com")
    })

    it("all entries are lowercase", () => {
      ADMIN_EMAILS.forEach((email) => {
        expect(email).toBe(email.toLowerCase())
      })
    })
  })
})

import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/lib/data-store"
import { mockAnnouncement, mockAnnouncementUrgent, seedLocalStorage } from "../../fixtures/test-data"
import type { Announcement } from "@/lib/types"

describe("Announcements CRUD — localStorage mode", () => {
  describe("getAnnouncements", () => {
    it("returns empty array when no announcements exist", async () => {
      const list = await getAnnouncements()
      expect(list).toEqual([])
    })

    it("returns all announcements after seeding", async () => {
      seedLocalStorage()
      const list = await getAnnouncements()
      expect(list.length).toBe(3)
    })

    it("each announcement has correct shape", async () => {
      seedLocalStorage()
      const list = await getAnnouncements()
      const ann = list[0]
      expect(ann).toHaveProperty("id")
      expect(ann).toHaveProperty("title")
      expect(ann).toHaveProperty("content")
      expect(ann).toHaveProperty("date")
      expect(ann).toHaveProperty("priority")
      expect(ann).toHaveProperty("published")
      expect(ann).toHaveProperty("author")
    })
  })

  describe("addAnnouncement", () => {
    it("creates an announcement with a generated id", async () => {
      const newAnn: Omit<Announcement, "id"> = {
        title: "New Test Announcement",
        content: "Test content here.",
        date: "2026-06-01",
        priority: "normal",
        published: true,
        author: "Test Author",
      }
      const added = await addAnnouncement(newAnn)
      expect(added.id).toBeDefined()
      expect(added.title).toBe("New Test Announcement")
    })

    it("prepends the new announcement to the front of the list (most-recent-first)", async () => {
      seedLocalStorage()
      const newAnn: Omit<Announcement, "id"> = {
        title: "Brand New",
        content: "Latest notice.",
        date: "2026-06-10",
        priority: "urgent",
        published: true,
        author: "Admin",
      }
      await addAnnouncement(newAnn)
      const list = await getAnnouncements()
      expect(list[0].title).toBe("Brand New")
    })

    it("persists so getAnnouncements returns it", async () => {
      const newAnn: Omit<Announcement, "id"> = {
        title: "Persist Test",
        content: "Should be found.",
        date: "2026-06-01",
        priority: "normal",
        published: false,
        author: "Test",
      }
      await addAnnouncement(newAnn)
      const list = await getAnnouncements()
      expect(list.some((a) => a.title === "Persist Test")).toBe(true)
    })
  })

  describe("updateAnnouncement", () => {
    beforeEach(() => seedLocalStorage())

    it("updates only the specified fields", async () => {
      await updateAnnouncement("a1", { title: "Updated Title" })
      const list = await getAnnouncements()
      const ann = list.find((a) => a.id === "a1")
      expect(ann?.title).toBe("Updated Title")
      expect(ann?.content).toBe(mockAnnouncement.content) // Unchanged
    })

    it("can toggle published status", async () => {
      await updateAnnouncement("a2", { published: true }) // was false
      const list = await getAnnouncements()
      const ann = list.find((a) => a.id === "a2")
      expect(ann?.published).toBe(true)
    })

    it("can change priority", async () => {
      await updateAnnouncement("a1", { priority: "urgent" })
      const list = await getAnnouncements()
      const ann = list.find((a) => a.id === "a1")
      expect(ann?.priority).toBe("urgent")
    })

    it("other announcements remain unchanged", async () => {
      await updateAnnouncement("a1", { title: "Changed" })
      const list = await getAnnouncements()
      const ann3 = list.find((a) => a.id === "a3")
      expect(ann3?.title).toBe(mockAnnouncementUrgent.title)
    })
  })

  describe("deleteAnnouncement", () => {
    beforeEach(() => seedLocalStorage())

    it("removes the announcement with the given id", async () => {
      await deleteAnnouncement("a1")
      const list = await getAnnouncements()
      expect(list.find((a) => a.id === "a1")).toBeUndefined()
    })

    it("list length decreases by 1", async () => {
      const before = (await getAnnouncements()).length
      await deleteAnnouncement("a1")
      const after = (await getAnnouncements()).length
      expect(after).toBe(before - 1)
    })

    it("does not remove other announcements", async () => {
      await deleteAnnouncement("a1")
      const list = await getAnnouncements()
      expect(list.find((a) => a.id === "a3")).toBeDefined()
    })

    it("does nothing when id does not exist", async () => {
      const before = (await getAnnouncements()).length
      await deleteAnnouncement("nonexistent-id")
      const after = (await getAnnouncements()).length
      expect(after).toBe(before)
    })
  })
})

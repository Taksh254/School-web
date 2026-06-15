import { getAttendance, bulkAddAttendance } from "@/lib/data-store"
import { seedLocalStorage } from "../../fixtures/test-data"
import type { AttendanceRecord } from "@/lib/types"

describe("Attendance — localStorage mode", () => {
  describe("getAttendance", () => {
    it("returns empty array when no records exist", async () => {
      const records = await getAttendance()
      expect(records).toEqual([])
    })

    it("returns all records when no studentId filter is given", async () => {
      seedLocalStorage()
      const records = await getAttendance()
      expect(records.length).toBe(3) // 3 records from seedLocalStorage
    })

    it("filters records by studentId", async () => {
      seedLocalStorage()
      const records = await getAttendance("s1")
      expect(records.every((r) => r.studentId === "s1")).toBe(true)
      expect(records.length).toBe(3)
    })

    it("returns empty array for unknown studentId", async () => {
      seedLocalStorage()
      const records = await getAttendance("nonexistent-student")
      expect(records).toEqual([])
    })

    it("records have correct shape", async () => {
      seedLocalStorage()
      const records = await getAttendance("s1")
      const record = records[0]
      expect(record).toHaveProperty("id")
      expect(record).toHaveProperty("studentId")
      expect(record).toHaveProperty("date")
      expect(record).toHaveProperty("status")
    })
  })

  describe("bulkAddAttendance", () => {
    it("returns empty array when given empty input", async () => {
      const result = await bulkAddAttendance([])
      expect(result).toEqual([])
    })

    it("inserts multiple records and returns them with generated ids", async () => {
      const newRecords: Omit<AttendanceRecord, "id">[] = [
        { studentId: "s1", date: "2026-06-01", status: "present" },
        { studentId: "s1", date: "2026-06-02", status: "absent" },
      ]
      const result = await bulkAddAttendance(newRecords)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBeDefined()
      expect(result[1].id).toBeDefined()
      expect(result[0].id).not.toBe(result[1].id)
    })

    it("persists records — getAttendance returns them", async () => {
      const newRecords: Omit<AttendanceRecord, "id">[] = [
        { studentId: "s99", date: "2026-06-01", status: "present" },
      ]
      await bulkAddAttendance(newRecords)
      const records = await getAttendance("s99")
      expect(records).toHaveLength(1)
      expect(records[0].date).toBe("2026-06-01")
    })

    it("deduplicates: replaces existing record for same student+date", async () => {
      seedLocalStorage()
      // s1 already has a record for 2026-05-01 (present) — now insert absent for same date
      const override: Omit<AttendanceRecord, "id">[] = [
        { studentId: "s1", date: "2026-05-01", status: "absent" },
      ]
      await bulkAddAttendance(override)
      const records = await getAttendance("s1")
      const may1Records = records.filter((r) => r.date === "2026-05-01")
      expect(may1Records).toHaveLength(1)
      expect(may1Records[0].status).toBe("absent") // Overwritten
    })

    it("does not modify records for other students", async () => {
      seedLocalStorage()
      const newRecords: Omit<AttendanceRecord, "id">[] = [
        { studentId: "s2", date: "2026-06-05", status: "present" },
      ]
      await bulkAddAttendance(newRecords)
      const s1Records = await getAttendance("s1")
      expect(s1Records.length).toBe(3) // s1 records unchanged
    })
  })
})

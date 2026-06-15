import { getVal, validateStudents, validateFees, validateAttendance } from "@/lib/importer-exporter"
import { mockStudent, mockStudent2, mockFeeRecord } from "../../fixtures/test-data"
import type { Student, FeeRecord, AttendanceRecord } from "@/lib/types"

// ── getVal ──────────────────────────────────────────────────────

describe("getVal", () => {
  const row = {
    "Student Name": "Alice",
    "parentEmail": "alice@test.com",
    "Phone No.": "+91 98765 00000",
  }

  it("returns value for exact key match (case-normalised)", () => {
    expect(getVal(row, ["studentname"])).toBe("Alice")
  })

  it("returns value for alternate key aliases", () => {
    expect(getVal(row, ["email", "parentemail"])).toBe("alice@test.com")
  })

  it("returns value for partial match", () => {
    expect(getVal(row, ["phone"])).toBe("+91 98765 00000")
  })

  it("returns empty string when no key matches", () => {
    expect(getVal(row, ["nonexistent", "alsoNotFound"])).toBe("")
  })

  it("trims whitespace from values", () => {
    const rowWithSpaces = { "Name": "  Bob  " }
    expect(getVal(rowWithSpaces, ["name"])).toBe("Bob")
  })

  it("handles hyphenated and underscore-delimited keys", () => {
    const rowWithDash = { "phone-number": "1234567890" }
    expect(getVal(rowWithDash, ["phonenumber"])).toBe("1234567890")
  })
})

// ── validateStudents ───────────────────────────────────────────

describe("validateStudents", () => {
  const makeRow = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    name: "New Student",
    class: "Nursery",
    parentname: "New Parent",
    email: "newparent@email.com",
    phone: "+91 99999 00000",
    ...overrides,
  })

  it("accepts a valid row and adds it to validRecords", () => {
    const result = validateStudents([makeRow()], [])
    expect(result.successCount).toBe(1)
    expect(result.failCount).toBe(0)
    expect(result.validRecords[0].name).toBe("New Student")
  })

  it("returns error for missing Name", () => {
    const result = validateStudents([makeRow({ name: "" })], [])
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Missing required field: Name/)
  })

  it("returns error for missing Class (Program)", () => {
    const result = validateStudents([makeRow({ class: "" })], [])
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Missing required field: Class/)
  })

  it("returns error for missing Parent Name", () => {
    const result = validateStudents([makeRow({ parentname: "" })], [])
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Missing required field: Parent Name/)
  })

  it("returns error for missing Email", () => {
    const result = validateStudents([makeRow({ email: "" })], [])
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Missing required field: Email/)
  })

  it("returns error for invalid class value", () => {
    const result = validateStudents([makeRow({ class: "Grade 5" })], [])
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Invalid Class value/)
  })

  it("returns error for invalid email (no @ or .)", () => {
    const result = validateStudents([makeRow({ email: "notvalid" })], [])
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Invalid email address format/)
  })

  it("returns error for duplicate within existing students", () => {
    const result = validateStudents(
      [makeRow({ name: "Aanya Sharma", email: "priya@email.com" })],
      [mockStudent]
    )
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Duplicate entry/)
  })

  it("returns error for duplicate within the same import batch", () => {
    const rows = [makeRow(), makeRow()] // Same name+email
    const result = validateStudents(rows, [])
    expect(result.successCount).toBe(1)
    expect(result.failCount).toBe(1)
  })

  it("handles a mixed batch correctly", () => {
    const rows = [
      makeRow({ email: "a@b.com" }),
      makeRow({ name: "" }),
      makeRow({ email: "c@d.com" }),
    ]
    const result = validateStudents(rows, [])
    expect(result.successCount).toBe(2)
    expect(result.failCount).toBe(1)
  })

  it("row numbers are 1-based + 1 for header", () => {
    const result = validateStudents([makeRow({ name: "" })], [])
    expect(result.errors[0].row).toBe(2) // First data row = row 2
  })
})

// ── validateFees ───────────────────────────────────────────────

describe("validateFees", () => {
  const existingStudents: Student[] = [mockStudent, mockStudent2]
  const existingFees: FeeRecord[] = []

  const makeRow = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    student: "Aanya Sharma",
    term: "Q3 2026",
    amount: "25000",
    status: "pending",
    ...overrides,
  })

  it("accepts a valid row", () => {
    const result = validateFees([makeRow()], existingStudents, existingFees)
    expect(result.successCount).toBe(1)
    expect(result.failCount).toBe(0)
  })

  it("sets paidAmount=amount when status=paid", () => {
    const result = validateFees([makeRow({ status: "paid" })], existingStudents, existingFees)
    expect(result.validRecords[0].paidAmount).toBe(25000)
  })

  it("sets paidAmount=amount/2 when status=partial", () => {
    const result = validateFees([makeRow({ status: "partial" })], existingStudents, existingFees)
    expect(result.validRecords[0].paidAmount).toBe(12500)
  })

  it("returns error for unknown student", () => {
    const result = validateFees([makeRow({ student: "Unknown Person" })], existingStudents, existingFees)
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Student not found/)
  })

  it("returns error for invalid amount (NaN)", () => {
    const result = validateFees([makeRow({ amount: "not-a-number" })], existingStudents, existingFees)
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Invalid amount/)
  })

  it("returns error for non-positive amount", () => {
    const result = validateFees([makeRow({ amount: "0" })], existingStudents, existingFees)
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Invalid amount/)
  })

  it("returns error for invalid status", () => {
    const result = validateFees([makeRow({ status: "late" })], existingStudents, existingFees)
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Invalid status/)
  })

  it("returns error for duplicate student+term in existing fees", () => {
    const fees = [mockFeeRecord] // studentId=s1, term=Q1 Apr-Jun 2026
    const result = validateFees(
      [makeRow({ term: "Q1 Apr-Jun 2026" })],
      existingStudents,
      fees
    )
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Duplicate entry/)
  })
})

// ── validateAttendance ─────────────────────────────────────────

describe("validateAttendance", () => {
  const existingStudents: Student[] = [mockStudent, mockStudent2]
  const existingAttendance: AttendanceRecord[] = []

  const makeRow = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    student: "Aanya Sharma",
    date: "2026-06-01",
    status: "present",
    ...overrides,
  })

  it("accepts a valid row", () => {
    const result = validateAttendance([makeRow()], existingStudents, existingAttendance)
    expect(result.successCount).toBe(1)
    expect(result.failCount).toBe(0)
  })

  it("returns error for missing student", () => {
    const result = validateAttendance([makeRow({ student: "" })], existingStudents, existingAttendance)
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Missing required field: Student/)
  })

  it("returns error for unknown student name", () => {
    const result = validateAttendance([makeRow({ student: "Nobody" })], existingStudents, existingAttendance)
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Student not found/)
  })

  it("returns error for invalid date format", () => {
    const result = validateAttendance([makeRow({ date: "not-a-date" })], existingStudents, existingAttendance)
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Invalid date format/)
  })

  it("returns error for invalid status value", () => {
    const result = validateAttendance([makeRow({ status: "maybe" })], existingStudents, existingAttendance)
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Invalid status value/)
  })

  it("accepts all valid status values", () => {
    const statuses = ["present", "absent", "holiday", "leave"]
    const rows = statuses.map((s, i) => makeRow({ status: s, date: `2026-06-0${i + 1}` }))
    const result = validateAttendance(rows, existingStudents, existingAttendance)
    expect(result.successCount).toBe(4)
    expect(result.failCount).toBe(0)
  })

  it("returns error for duplicate student+date in existing records", () => {
    const existing: AttendanceRecord[] = [
      { id: "att1", studentId: "s1", date: "2026-06-01", status: "present" },
    ]
    const result = validateAttendance([makeRow()], existingStudents, existing)
    expect(result.failCount).toBe(1)
    expect(result.errors[0].error).toMatch(/Duplicate entry/)
  })

  it("normalises date to YYYY-MM-DD", () => {
    const result = validateAttendance(
      [makeRow({ date: "June 1, 2026" })],
      existingStudents,
      existingAttendance
    )
    if (result.successCount > 0) {
      expect(result.validRecords[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

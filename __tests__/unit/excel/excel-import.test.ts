import { generatePreview, previewToStudentData } from "@/lib/excel-import"
import type { ImportedRow } from "@/lib/excel-import"

describe("generatePreview", () => {
  const existingAdmNos: string[] = []

  const makeRow = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    "Student Name": "Test Student",
    "Parents Name": "Test Parent",
    "Date of Birth": "2022-01-01",
    "Email": "test@parent.com",
    "Phone No.": "+91 99999 00000",
    "Admission No.": "ADM-TEST-001",
    "Class": "Nursery",
    ...overrides,
  })

  describe("Valid rows", () => {
    it("marks a complete, valid row as valid=true with no errors", () => {
      const preview = generatePreview([makeRow()], [])
      expect(preview.rows[0].valid).toBe(true)
      expect(preview.rows[0].errors).toHaveLength(0)
    })

    it("returns correct totalRows, validCount, invalidCount for all-valid input", () => {
      const rows = [makeRow(), makeRow({ "Admission No.": "ADM-TEST-002" })]
      const preview = generatePreview(rows, [])
      expect(preview.totalRows).toBe(2)
      expect(preview.validCount).toBe(2)
      expect(preview.invalidCount).toBe(0)
    })

    it("parses rowNumber as 1-based + 1 for header (row 2 for first data row)", () => {
      const preview = generatePreview([makeRow()], [])
      expect(preview.rows[0].rowNumber).toBe(2)
    })

    it("accepts all valid program types: Play Group, Nursery, Kindergarten", () => {
      const programs = ["Play Group", "Nursery", "Kindergarten"]
      const rows = programs.map((cls, i) =>
        makeRow({ "Class": cls, "Admission No.": `ADM-${i}` })
      )
      const preview = generatePreview(rows, [])
      expect(preview.validCount).toBe(3)
    })

    it("accepts 'KG' as a valid alias for Kindergarten", () => {
      const preview = generatePreview([makeRow({ "Class": "kg" })], [])
      expect(preview.rows[0].valid).toBe(true)
    })

    it("accepts 'playgroup' as a valid alias for Play Group", () => {
      const preview = generatePreview([makeRow({ "Class": "playgroup" })], [])
      expect(preview.rows[0].valid).toBe(true)
    })
  })

  describe("Missing required fields", () => {
    it("marks row invalid when Student Name is missing", () => {
      const preview = generatePreview([makeRow({ "Student Name": "" })], [])
      expect(preview.rows[0].valid).toBe(false)
      expect(preview.rows[0].errors).toContain("Student Name is required")
    })

    it("marks row invalid when Parent Name is missing", () => {
      const preview = generatePreview([makeRow({ "Parents Name": "" })], [])
      expect(preview.rows[0].valid).toBe(false)
      expect(preview.rows[0].errors).toContain("Parent Name is required")
    })

    it("marks row invalid when Admission No. is missing", () => {
      const preview = generatePreview([makeRow({ "Admission No.": "" })], [])
      expect(preview.rows[0].valid).toBe(false)
      expect(preview.rows[0].errors).toContain("Admission Number is required")
    })

    it("marks row invalid when Class is missing", () => {
      const preview = generatePreview([makeRow({ "Class": "" })], [])
      expect(preview.rows[0].valid).toBe(false)
      expect(preview.rows[0].errors).toContain("Class is required")
    })
  })

  describe("Invalid values", () => {
    it("marks row invalid for an unrecognised class value", () => {
      const preview = generatePreview([makeRow({ "Class": "Grade 1" })], [])
      expect(preview.rows[0].valid).toBe(false)
      expect(preview.rows[0].errors[0]).toMatch(/Invalid Class/)
    })

    it("marks row invalid for email without @", () => {
      const preview = generatePreview([makeRow({ "Email": "notanemail" })], [])
      expect(preview.rows[0].valid).toBe(false)
      expect(preview.rows[0].errors).toContain("Invalid email format")
    })
  })

  describe("Duplicate admission numbers", () => {
    it("marks row invalid when admission no. already exists in the system", () => {
      const preview = generatePreview([makeRow()], ["adm-test-001"]) // pre-existing
      expect(preview.rows[0].valid).toBe(false)
      expect(preview.rows[0].errors[0]).toMatch(/Duplicate admission number/)
    })

    it("marks second row invalid when two import rows share an admission number", () => {
      const rows = [makeRow(), makeRow()] // Same ADM-TEST-001
      const preview = generatePreview(rows, [])
      expect(preview.rows[0].valid).toBe(true) // First occurrence is fine
      expect(preview.rows[1].valid).toBe(false) // Duplicate
    })
  })

  describe("Mixed valid/invalid", () => {
    it("counts valid and invalid rows correctly in a mixed batch", () => {
      const rows = [
        makeRow({ "Admission No.": "ADM-001" }),
        makeRow({ "Student Name": "", "Admission No.": "ADM-002" }),
        makeRow({ "Admission No.": "ADM-003" }),
      ]
      const preview = generatePreview(rows, [])
      expect(preview.validCount).toBe(2)
      expect(preview.invalidCount).toBe(1)
    })
  })
})

describe("previewToStudentData", () => {
  const makeValidRow = (overrides: Partial<ImportedRow> = {}): ImportedRow => ({
    rowNumber: 2,
    studentName: "Test Student",
    parentName: "Test Parent",
    dob: "2022-06-15",
    email: "test@parent.com",
    phone: "+91 99999 00000",
    admissionNo: "ADM-001",
    className: "Nursery",
    valid: true,
    errors: [],
    ...overrides,
  })

  it("filters out invalid rows", () => {
    const rows: ImportedRow[] = [
      makeValidRow(),
      makeValidRow({ valid: false, errors: ["some error"] }),
    ]
    const result = previewToStudentData(rows)
    expect(result).toHaveLength(1)
  })

  it("calculates age from DOB correctly", () => {
    const thisYear = new Date().getFullYear()
    const dob = `${thisYear - 4}-01-01` // 4 years ago
    const rows = [makeValidRow({ dob })]
    const result = previewToStudentData(rows)
    expect(result[0].age).toBe(4)
  })

  it("sets default age by program when DOB is missing", () => {
    const rows = [makeValidRow({ dob: "", className: "Play Group" })]
    const result = previewToStudentData(rows)
    expect(result[0].age).toBe(3)
  })

  it("maps className to ProgramType correctly", () => {
    const rows = [
      makeValidRow({ className: "play group", admissionNo: "ADM-001" }),
      makeValidRow({ className: "Kindergarten", admissionNo: "ADM-002" }),
    ]
    const result = previewToStudentData(rows)
    expect(result[0].program).toBe("Play Group")
    expect(result[1].program).toBe("Kindergarten")
  })

  it("assigns correct teacher based on program", () => {
    const nursery = [makeValidRow({ className: "Nursery" })]
    const playgroup = [makeValidRow({ className: "play group", admissionNo: "ADM-002" })]
    const nurseryResult = previewToStudentData(nursery)
    const playgroupResult = previewToStudentData(playgroup)
    expect(nurseryResult[0].teacher).toBe("Ms. Anita Desai")
    expect(playgroupResult[0].teacher).toBe("Ms. Priya Kapoor")
  })

  it("returned objects have all required Student fields (except id)", () => {
    const rows = [makeValidRow()]
    const result = previewToStudentData(rows)
    const s = result[0]
    expect(s).toHaveProperty("name")
    expect(s).toHaveProperty("age")
    expect(s).toHaveProperty("dateOfBirth")
    expect(s).toHaveProperty("program")
    expect(s).toHaveProperty("section")
    expect(s).toHaveProperty("parentName")
    expect(s).toHaveProperty("parentEmail")
    expect(s).toHaveProperty("parentPhone")
    expect(s).toHaveProperty("admissionNo")
    expect(s).toHaveProperty("teacher")
  })
})

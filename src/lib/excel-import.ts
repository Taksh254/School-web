import type { Student, ProgramType } from "./types"

export interface ImportedRow {
  rowNumber: number
  studentName: string
  parentName: string
  dob: string
  email: string
  phone: string
  admissionNo: string
  className: string
  valid: boolean
  errors: string[]
}

export interface ImportPreview {
  rows: ImportedRow[]
  totalRows: number
  validCount: number
  invalidCount: number
}

export async function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
  const XLSX = await import("xlsx")
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" })
        resolve(rows)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsArrayBuffer(file)
  })
}

function getVal(row: Record<string, unknown>, keys: string[]): string {
  const rowKeys = Object.keys(row)
  const normalizedRow = rowKeys.map(k => ({
    original: k,
    normalized: k.toLowerCase().replace(/[\s_-]/g, "")
  }))

  const normalizedKeys = keys.map(k => k.toLowerCase().replace(/[\s_-]/g, ""))

  // 1. Exact match pass
  for (const targetKey of normalizedKeys) {
    const found = normalizedRow.find(rk => rk.normalized === targetKey)
    if (found) return String(row[found.original] ?? "").trim()
  }

  // 2. Partial match pass
  for (const targetKey of normalizedKeys) {
    const found = normalizedRow.find(rk => rk.normalized.includes(targetKey) || targetKey.includes(rk.normalized))
    if (found) return String(row[found.original] ?? "").trim()
  }

  return ""
}

function parseDate(raw: string): string {
  if (!raw) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const parsed = new Date(raw)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }
  return raw
}

const programMapping: Record<string, ProgramType> = {
  "play group": "Play group",
  "playgroup": "Play group",
  "nursery": "Nursery",
  "lkg": "LKG",
  "ukg": "UKG",
  "kindergarten": "UKG",
  "kg": "UKG",
}

export function generatePreview(rows: Record<string, unknown>[], existingAdmissionNos: string[]): ImportPreview {
  const previewRows: ImportedRow[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = i + 2
    const errs: string[] = []

    const studentName = getVal(row, ["studentname", "student name", "name"])
    const parentName = getVal(row, ["parentsname", "parents name", "parentname", "parent name", "fathername", "mothername"])
    const rawDob = getVal(row, ["dateofbirth", "date of birth", "dob", "birthdate"])
    const email = getVal(row, ["email", "emailaddress", "email address"])
    const phone = getVal(row, ["phone", "phonenumber", "phone number", "phoneno", "phone no", "mobile"])
    const admissionNo = getVal(row, ["admissionno", "admission no", "admissionnumber", "admission number", "rollno"])
    const rawClass = getVal(row, ["class", "classname", "class name", "program"])

    if (!studentName) errs.push("Student Name is required")
    if (!parentName) errs.push("Parent Name is required")
    if (!admissionNo) errs.push("Admission Number is required")
    if (!rawClass) {
      errs.push("Class is required")
    } else {
      const normalizedClass = rawClass.toLowerCase()
      const program = programMapping[normalizedClass]
      if (!program) {
        errs.push(`Invalid Class '${rawClass}'. Must be: Play group, Nursery, LKG, or UKG`)
      }
    }

    if (email && !email.includes("@")) {
      errs.push("Invalid email format")
    }

    const normalizedAdmissionNo = String(admissionNo || "").trim().toLowerCase()

    if (normalizedAdmissionNo && existingAdmissionNos.includes(normalizedAdmissionNo)) {
      errs.push(`Duplicate admission number: ${admissionNo}`)
    }

    previewRows.push({
      rowNumber,
      studentName,
      parentName,
      dob: parseDate(rawDob),
      email,
      phone,
      admissionNo,
      className: rawClass,
      valid: errs.length === 0,
      errors: errs,
    })

    if (normalizedAdmissionNo) {
      existingAdmissionNos.push(normalizedAdmissionNo)
    }
  }

  return {
    rows: previewRows,
    totalRows: rows.length,
    validCount: previewRows.filter((r) => r.valid).length,
    invalidCount: previewRows.filter((r) => !r.valid).length,
  }
}

function calcAge(dob: string): number {
  if (!dob) return 0
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function previewToStudentData(preview: ImportedRow[]): Omit<Student, "id">[] {
  return preview.filter((r) => r.valid).map((r) => {
    const normalizedClass = r.className.toLowerCase()
    const program = programMapping[normalizedClass] || "Nursery"

    let age: number
    let dateOfBirth: string

    if (r.dob) {
      dateOfBirth = r.dob
      age = calcAge(r.dob)
    } else {
      age = 4
      if (program === "Play group") age = 3
      if (program === "LKG") age = 5
      if (program === "UKG") age = 6
      const birthYear = new Date().getFullYear() - age
      dateOfBirth = `${birthYear}-01-01`
    }

    const section = "A"
    let teacher = "Ms. Anita Desai"
    if (program === "Play group") teacher = "Ms. Priya Kapoor"
    if (program === "UKG") teacher = "Mr. Rohan Joshi"

    return {
      name: r.studentName,
      age,
      dateOfBirth,
      program,
      section,
      parentName: r.parentName,
      parentEmail: r.email || "",
      parentPhone: r.phone || "",
      admissionNo: r.admissionNo,
      teacher,
    }
  })
}

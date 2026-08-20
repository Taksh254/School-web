import { z } from "zod"
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

// ── ZOD SCHEMAS ─────────────────────────────────────────────────────────────
export const importedStudentSchema = z.object({
  studentName: z.string().trim().min(1, "Student Name is required").max(100, "Student Name too long"),
  parentName: z.string().trim().min(1, "Parent Name is required").max(100, "Parent Name too long"),
  dob: z.string().optional().refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: "Invalid Date of Birth (expected YYYY-MM-DD)",
  }),
  email: z.string().trim().optional().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: "Invalid email format",
  }),
  phone: z.string().trim().optional(),
  admissionNo: z.string().trim().min(1, "Admission Number is required").max(50, "Admission Number too long"),
  className: z.string().trim().min(1, "Class is required"),
})

export const MAX_IMPORT_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export const ALLOWED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "text/plain",
  "application/vnd.oasis.opendocument.spreadsheet",
]

export function validateImportFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file provided" }
  }

  // 1. File size check (Cap at 2MB)
  if (file.size > MAX_IMPORT_FILE_SIZE) {
    return { valid: false, error: `File size exceeds 2MB limit (Actual: ${(file.size / (1024 * 1024)).toFixed(2)}MB)` }
  }

  // 2. MIME & extension check
  const ext = file.name.split(".").pop()?.toLowerCase() || ""
  const validExtensions = ["xlsx", "xls", "csv"]
  const mimeValid = ALLOWED_MIME_TYPES.includes(file.type) || validExtensions.includes(ext)

  if (!mimeValid && !validExtensions.includes(ext)) {
    return { valid: false, error: "Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file." }
  }

  return { valid: true }
}

export async function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
  const validation = validateImportFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const XLSX = await import("xlsx")
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        // cellDates: false → all date cells come back as Excel serial numbers (integers).
        // This prevents XLSX from converting them to JS Date objects whose
        // locale .toString() then gets mis-parsed by new Date(), producing the
        // "+044766-12" timezone displacement PostgreSQL error.
        const workbook = XLSX.read(data, { type: "array", cellDates: false })
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

function parseDate(raw: any): string | null {
  if (raw === undefined || raw === null || raw === "") return null

  // Check if it's an Excel serial date (e.g., 44766)
  if (typeof raw === "number" || (typeof raw === "string" && !isNaN(Number(raw)) && Number(raw) > 30000 && Number(raw) < 100000)) {
    const excelDate = Number(raw)
    // Excel dates are days since Dec 30, 1899
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000))
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10)
    }
  }

  const rawStr = String(raw).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawStr)) {
    const parsed = new Date(rawStr)
    if (!isNaN(parsed.getTime())) return rawStr
  }
  
  const parsed = new Date(rawStr)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }
  
  return null // Return null if totally invalid
}

const programMapping: Record<string, ProgramType> = {
  "play group": "Play Group",
  "playgroup": "Play Group",
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

    const rawStudentName = getVal(row, ["studentname", "student name", "name"])
    const rawParentName = getVal(row, ["parentsname", "parents name", "parentname", "parent name", "fathername", "mothername"])
    const rawDob = getVal(row, ["dateofbirth", "date of birth", "dob", "birthdate"])
    const rawEmail = getVal(row, ["email", "emailaddress", "email address"])
    const rawPhone = getVal(row, ["phone", "phonenumber", "phone number", "phoneno", "phone no", "mobile"])
    const rawAdmissionNo = getVal(row, ["admissionno", "admission no", "admissionnumber", "admission number", "rollno"])
    const rawClass = getVal(row, ["class", "classname", "class name", "program"])

    const parsedDob = parseDate(rawDob)
    if (rawDob && !parsedDob) {
      errs.push(`Invalid Date of Birth format: '${rawDob}'. Expected YYYY-MM-DD or valid date.`)
    }

    // Zod schema validation & field sanitization
    const zodResult = importedStudentSchema.safeParse({
      studentName: rawStudentName,
      parentName: rawParentName,
      dob: parsedDob || undefined,
      email: rawEmail || undefined,
      phone: rawPhone || undefined,
      admissionNo: rawAdmissionNo,
      className: rawClass,
    })

    if (!zodResult.success) {
      zodResult.error.issues.forEach((err) => {
        errs.push(err.message)
      })
    }

    const normalizedClass = rawClass.toLowerCase()
    const program = programMapping[normalizedClass]
    if (rawClass && !program) {
      errs.push(`Invalid Class '${rawClass}'. Must be: Play Group, Nursery, LKG, or UKG`)
    }

    const studentName = zodResult.success ? zodResult.data.studentName : rawStudentName
    const parentName = zodResult.success ? zodResult.data.parentName : rawParentName
    const email = zodResult.success ? zodResult.data.email || "" : rawEmail
    const phone = zodResult.success ? zodResult.data.phone || "" : rawPhone
    const admissionNo = zodResult.success ? zodResult.data.admissionNo : rawAdmissionNo

    const normalizedAdmissionNo = String(admissionNo || "").trim().toLowerCase()
    if (normalizedAdmissionNo && existingAdmissionNos.includes(normalizedAdmissionNo)) {
      errs.push(`Duplicate admission number: ${admissionNo}`)
    }

    previewRows.push({
      rowNumber,
      studentName,
      parentName,
      dob: parsedDob || "",
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
      if (program === "Play Group") age = 3
      if (program === "LKG") age = 5
      if (program === "UKG") age = 6
      const birthYear = new Date().getFullYear() - age
      dateOfBirth = `${birthYear}-01-01`
    }

    const section = "A"
    let teacher = "Ms. Anita Desai"
    if (program === "Play Group") teacher = "Ms. Priya Kapoor"
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

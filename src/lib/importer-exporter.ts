import type { Student, FeeRecord, AttendanceRecord, ProgramType, FeeStatus, AttendanceStatus, Announcement } from "./types"

export interface ImportError {
  row: number
  error: string
}

export interface ImportResult<T> {
  successCount: number
  failCount: number
  validRecords: T[]
  errors: ImportError[]
}

// ── Normalize Row Key Helper ───────────────────────────────────
export function getVal(row: Record<string, unknown>, keys: string[]): string {
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

// ── CSV Parsing Wrapper ─────────────────────────────────────────
export async function parseCsvFile(file: File): Promise<Record<string, unknown>[]> {
  const Papa = (await import("papaparse")).default
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data)
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

// ── Export Wrappers ─────────────────────────────────────────────
export async function exportToCSV(data: any[], fileName: string) {
  const Papa = (await import("papaparse")).default
  const csvContent = Papa.unparse(data)
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${fileName}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function exportToExcel(data: any[], fileName: string) {
  const XLSX = await import("xlsx")
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Data")
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

// ── Validate Students ───────────────────────────────────────────
export function validateStudents(
  rows: Record<string, unknown>[],
  existingStudents: Student[]
): ImportResult<Omit<Student, "id">> {
  const validRecords: Omit<Student, "id">[] = []
  const errors: ImportError[] = []

  const programMapping: Record<string, ProgramType> = {
    "play group": "Play Group",
    "playgroup": "Play Group",
    "nursery": "Nursery",
    "lkg": "LKG",
    "ukg": "UKG",
    "kindergarten": "UKG",
    "kg": "UKG",
  }

  rows.forEach((row, index) => {
    const rowNum = index + 2 // 1-based index + header row

    const name = getVal(row, ["name", "studentname", "student name"])
    const rawClass = getVal(row, ["class", "program", "programtype"])
    const parentName = getVal(row, ["parentname", "parent name", "fathername", "mothername"])
    const phone = getVal(row, ["phone", "phonenumber", "parentphone", "phone number"])
    const email = getVal(row, ["email", "parentemail", "emailaddress", "email address"])
    const rawDob = getVal(row, ["dateofbirth", "date of birth", "dob", "birthdate"])

    // 1. Required Fields
    if (!name) {
      errors.push({ row: rowNum, error: "Missing required field: Name" })
      return
    }
    if (!rawClass) {
      errors.push({ row: rowNum, error: "Missing required field: Class (Program)" })
      return
    }
    if (!parentName) {
      errors.push({ row: rowNum, error: "Missing required field: Parent Name" })
      return
    }
    if (!email) {
      errors.push({ row: rowNum, error: "Missing required field: Email" })
      return
    }

    // 2. Class/Program Check
    const normalizedClass = rawClass.toLowerCase()
    const program = programMapping[normalizedClass]
    if (!program) {
      errors.push({
        row: rowNum,
        error: `Invalid Class value '${rawClass}'. Must be one of: Play Group, Nursery, LKG, UKG`,
      })
      return
    }

    // 3. Email Format Check
    if (!email.includes("@") || !email.includes(".")) {
      errors.push({ row: rowNum, error: `Invalid email address format: '${email}'` })
      return
    }

    // 4. Duplicate Check
    const isDuplicate = existingStudents.some(
      (s) => s.name.toLowerCase() === name.toLowerCase() && s.parentEmail.toLowerCase() === email.toLowerCase()
    )
    const isAlreadyInImport = validRecords.some(
      (s) => s.name.toLowerCase() === name.toLowerCase() && s.parentEmail.toLowerCase() === email.toLowerCase()
    )

    if (isDuplicate || isAlreadyInImport) {
      errors.push({ row: rowNum, error: `Duplicate entry: Student '${name}' with parent email '${email}' already exists` })
      return
    }

    // 5. Generate Defaults
    function calcAge(dob: string): number {
      if (!dob) return 0
      const birth = new Date(dob)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
      return age
    }

    let age: number
    let dateOfBirth: string

    if (rawDob) {
      dateOfBirth = rawDob
      age = calcAge(rawDob)
    } else {
      age = 4
      if (program === "Play Group") age = 3
      if (program === "LKG") age = 5
      if (program === "UKG") age = 6
      const birthYear = 2026 - age
      dateOfBirth = `${birthYear}-01-01`
    }

    const section = "A"
    const admissionNo = `ADM-${String(Date.now()).slice(-6)}-${index + 1}`

    let teacher = "Ms. Anita Desai"
    if (program === "Play Group") teacher = "Ms. Priya Kapoor"
    if (program === "UKG") teacher = "Mr. Rohan Joshi"

    validRecords.push({
      name,
      age,
      dateOfBirth,
      program,
      section,
      parentName,
      parentEmail: email,
      parentPhone: phone || "",
      admissionNo,
      teacher,
    })
  })

  return {
    successCount: validRecords.length,
    failCount: errors.length,
    validRecords,
    errors,
  }
}

// ── Validate Fees ──────────────────────────────────────────────
export function validateFees(
  rows: Record<string, unknown>[],
  existingStudents: Student[],
  existingFees: FeeRecord[]
): ImportResult<Omit<FeeRecord, "id" | "createdAt">> {
  const validRecords: Omit<FeeRecord, "id" | "createdAt">[] = []
  const errors: ImportError[] = []

  const statusList: FeeStatus[] = ["paid", "pending", "overdue", "partial"]

  rows.forEach((row, index) => {
    const rowNum = index + 2

    const studentName = getVal(row, ["student", "studentname", "student name", "name"])
    const term = getVal(row, ["month", "term", "period"])
    const rawAmount = getVal(row, ["amount", "fee", "cost"])
    const rawStatus = getVal(row, ["status", "paymentstatus", "paidstatus"])

    // 1. Required Fields
    if (!studentName) {
      errors.push({ row: rowNum, error: "Missing required field: Student" })
      return
    }
    if (!term) {
      errors.push({ row: rowNum, error: "Missing required field: Month (Term)" })
      return
    }
    if (!rawAmount) {
      errors.push({ row: rowNum, error: "Missing required field: Amount" })
      return
    }
    if (!rawStatus) {
      errors.push({ row: rowNum, error: "Missing required field: Status" })
      return
    }

    // 2. Match Student
    const student = existingStudents.find((s) => s.name.toLowerCase() === studentName.toLowerCase())
    if (!student) {
      errors.push({ row: rowNum, error: `Student not found: '${studentName}'` })
      return
    }

    // 3. Amount Format
    const amount = Number(rawAmount)
    if (isNaN(amount) || amount <= 0) {
      errors.push({ row: rowNum, error: `Invalid amount value: '${rawAmount}'. Must be a positive number.` })
      return
    }

    // 4. Status Check
    const status = rawStatus.toLowerCase() as FeeStatus
    if (!statusList.includes(status)) {
      errors.push({
        row: rowNum,
        error: `Invalid status value '${rawStatus}'. Must be one of: paid, pending, overdue, partial`,
      })
      return
    }

    // 5. Duplicate Check
    const isDuplicate = existingFees.some(
      (f) => f.studentId === student.id && f.term.toLowerCase() === term.toLowerCase()
    )
    const isAlreadyInImport = validRecords.some(
      (f) => f.studentId === student.id && f.term.toLowerCase() === term.toLowerCase()
    )

    if (isDuplicate || isAlreadyInImport) {
      errors.push({ row: rowNum, error: `Duplicate entry: Fee record for '${student.name}' for term '${term}' already exists` })
      return
    }

    // 6. Generate Defaults
    let paidAmount = 0
    if (status === "paid") paidAmount = amount
    if (status === "partial") paidAmount = amount / 2

    // Due date default to 15 days from now
    const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    validRecords.push({
      studentId: student.id,
      studentName: student.name,
      term,
      amount,
      paidAmount,
      dueDate,
      status,
    })
  })

  return {
    successCount: validRecords.length,
    failCount: errors.length,
    validRecords,
    errors,
  }
}

// ── Validate Attendance ──────────────────────────────────────────
export function validateAttendance(
  rows: Record<string, unknown>[],
  existingStudents: Student[],
  existingAttendance: AttendanceRecord[]
): ImportResult<Omit<AttendanceRecord, "id">> {
  const validRecords: Omit<AttendanceRecord, "id">[] = []
  const errors: ImportError[] = []

  const statusList: AttendanceStatus[] = ["present", "absent", "holiday", "leave"]

  rows.forEach((row, index) => {
    const rowNum = index + 2

    const studentName = getVal(row, ["student", "studentname", "student name", "name"])
    const rawDate = getVal(row, ["date", "attendance_date", "day"])
    const rawStatus = getVal(row, ["status", "attendance_status", "present"])

    // 1. Required Fields
    if (!studentName) {
      errors.push({ row: rowNum, error: "Missing required field: Student" })
      return
    }
    if (!rawDate) {
      errors.push({ row: rowNum, error: "Missing required field: Date" })
      return
    }
    if (!rawStatus) {
      errors.push({ row: rowNum, error: "Missing required field: Status" })
      return
    }

    // 2. Match Student
    const student = existingStudents.find((s) => s.name.toLowerCase() === studentName.toLowerCase())
    if (!student) {
      errors.push({ row: rowNum, error: `Student not found: '${studentName}'` })
      return
    }

    // 3. Date Validation
    const parsedDate = new Date(rawDate)
    if (isNaN(parsedDate.getTime())) {
      errors.push({ row: rowNum, error: `Invalid date format: '${rawDate}'. Use YYYY-MM-DD.` })
      return
    }
    const date = parsedDate.toISOString().slice(0, 10)

    // 4. Status Check
    const status = rawStatus.toLowerCase() as AttendanceStatus
    if (!statusList.includes(status)) {
      errors.push({
        row: rowNum,
        error: `Invalid status value '${rawStatus}'. Must be one of: present, absent, holiday, leave`,
      })
      return
    }

    // 5. Duplicate Check
    const isDuplicate = existingAttendance.some(
      (a) => a.studentId === student.id && a.date === date
    )
    const isAlreadyInImport = validRecords.some(
      (a) => a.studentId === student.id && a.date === date
    )

    if (isDuplicate || isAlreadyInImport) {
      errors.push({ row: rowNum, error: `Duplicate entry: Attendance record for '${student.name}' on date '${date}' already exists` })
      return
    }

    validRecords.push({
      studentId: student.id,
      date,
      status,
    })
  })

  return {
    successCount: validRecords.length,
    failCount: errors.length,
    validRecords,
    errors,
  }
}

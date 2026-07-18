import type { Student } from "./types"

export async function exportStudentsCSV(students: Student[], fileName: string) {
  const Papa = (await import("papaparse")).default
  const data = students.map((s) => ({
    "Student Name": s.name,
    "Parents Name": s.parentName,
    "Date of Birth": s.dateOfBirth,
    "Email": s.parentEmail,
    "Phone No.": s.parentPhone,
    "Admission No.": s.admissionNo,
    "Class": s.program,
  }))
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
  URL.revokeObjectURL(url)
}

export async function exportStudentsExcel(students: Student[], fileName: string) {
  const XLSX = await import("xlsx")
  const data = students.map((s) => ({
    "Student Name": s.name,
    "Parents Name": s.parentName,
    "Date of Birth": s.dateOfBirth,
    "Email": s.parentEmail,
    "Phone No.": s.parentPhone,
    "Admission No.": s.admissionNo,
    "Class": s.program,
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Students")
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

export async function exportTeachersCSV(teachers: any[], fileName: string) {
  const Papa = (await import("papaparse")).default
  const data = teachers.map((t) => ({
    "Full Name": t.full_name,
    "Email": t.email,
    "Phone No.": t.phone,
    "Status": t.status,
    "Type": t.employment_type
  }))
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
  URL.revokeObjectURL(url)
}

export async function exportTeachersExcel(teachers: any[], fileName: string) {
  const XLSX = await import("xlsx")
  const data = teachers.map((t) => ({
    "Full Name": t.full_name,
    "Email": t.email,
    "Phone No.": t.phone,
    "Status": t.status,
    "Type": t.employment_type
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Teachers")
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

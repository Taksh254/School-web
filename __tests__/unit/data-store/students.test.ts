/**
 * Unit tests for student CRUD operations in data-store (localStorage mode).
 * Supabase is mocked to return errors, forcing all paths through localStorage.
 */
import { getStudents, addStudent, updateStudent, deleteStudent, bulkAddStudents, getAttendance, getFees, getPayments, getNotes } from "@/lib/data-store"
import { mockStudent, mockStudent2, mockNewStudentData, seedLocalStorage } from "../../fixtures/test-data"

describe("Student CRUD — localStorage mode", () => {
  describe("getStudents", () => {
    it("returns empty array when localStorage is empty", async () => {
      const students = await getStudents()
      expect(students).toEqual([])
    })

    it("returns seeded students when localStorage has data", async () => {
      seedLocalStorage()
      const students = await getStudents()
      expect(students).toHaveLength(2)
      expect(students[0].name).toBe("Aanya Sharma")
    })

    it("returns correct shape for each student", async () => {
      seedLocalStorage()
      const students = await getStudents()
      const student = students.find((s) => s.id === "s1")
      expect(student).toMatchObject({
        id: "s1",
        name: "Aanya Sharma",
        program: "Nursery",
        admissionNo: "ADM-001",
      })
    })
  })

  describe("addStudent", () => {
    it("adds a student and returns it with a generated id", async () => {
      const added = await addStudent(mockNewStudentData)
      expect(added.id).toBeDefined()
      expect(added.id.length).toBeGreaterThan(0)
      expect(added.name).toBe("Test Child")
      expect(added.program).toBe("Nursery")
    })

    it("persists the student so getStudents returns it", async () => {
      await addStudent(mockNewStudentData)
      const students = await getStudents()
      expect(students.some((s) => s.name === "Test Child")).toBe(true)
    })

    it("appends to existing students without overwriting", async () => {
      seedLocalStorage()
      await addStudent(mockNewStudentData)
      const students = await getStudents()
      expect(students).toHaveLength(3)
    })
  })

  describe("updateStudent", () => {
    beforeEach(() => seedLocalStorage())

    it("updates only the target student's fields", async () => {
      await updateStudent("s1", { name: "Aanya Updated" })
      const students = await getStudents()
      const s1 = students.find((s) => s.id === "s1")
      const s2 = students.find((s) => s.id === "s2")
      expect(s1?.name).toBe("Aanya Updated")
      expect(s2?.name).toBe("Arjun Verma") // Unchanged
    })

    it("can update partial fields — other fields remain intact", async () => {
      await updateStudent("s1", { section: "B" })
      const students = await getStudents()
      const s1 = students.find((s) => s.id === "s1")
      expect(s1?.section).toBe("B")
      expect(s1?.name).toBe("Aanya Sharma") // Unchanged
      expect(s1?.program).toBe("Nursery") // Unchanged
    })

    it("does nothing when id does not match any student", async () => {
      await updateStudent("nonexistent-id", { name: "Ghost" })
      const students = await getStudents()
      expect(students.every((s) => s.name !== "Ghost")).toBe(true)
    })
  })

  describe("deleteStudent", () => {
    beforeEach(() => seedLocalStorage())

    it("removes the student with the given id", async () => {
      await deleteStudent("s1")
      const students = await getStudents()
      expect(students.find((s) => s.id === "s1")).toBeUndefined()
      expect(students).toHaveLength(1)
    })

    it("cascades: removes related attendance records", async () => {
      await deleteStudent("s1")
      const attendance = await getAttendance("s1")
      expect(attendance).toHaveLength(0)
    })

    it("cascades: removes related fee records", async () => {
      await deleteStudent("s1")
      const fees = await getFees("s1")
      expect(fees).toHaveLength(0)
    })

    it("cascades: removes related payment records", async () => {
      await deleteStudent("s1")
      const payments = await getPayments("s1")
      expect(payments).toHaveLength(0)
    })

    it("cascades: removes related teacher notes", async () => {
      await deleteStudent("s1")
      const notes = await getNotes("s1")
      expect(notes).toHaveLength(0)
    })

    it("does not delete other students", async () => {
      await deleteStudent("s1")
      const students = await getStudents()
      expect(students.find((s) => s.id === "s2")).toBeDefined()
    })
  })

  describe("bulkAddStudents", () => {
    it("returns empty array when given empty input", async () => {
      const result = await bulkAddStudents([])
      expect(result).toEqual([])
    })

    it("inserts multiple students and assigns each a unique id", async () => {
      const result = await bulkAddStudents([mockNewStudentData, { ...mockNewStudentData, name: "Second Child", admissionNo: "ADM-TEST-002" }])
      expect(result).toHaveLength(2)
      expect(result[0].id).not.toBe(result[1].id)
    })

    it("all inserted students are retrievable via getStudents", async () => {
      await bulkAddStudents([mockNewStudentData])
      const students = await getStudents()
      expect(students.some((s) => s.name === "Test Child")).toBe(true)
    })
  })
})

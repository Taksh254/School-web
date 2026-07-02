// xlsx is mocked with a factory. Variables can't be referenced in the factory
// due to jest.mock hoisting — use jest.fn() inline and access via require after.
jest.mock("xlsx", () => ({
  writeFile: jest.fn(),
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
}))

import * as XLSX from "xlsx"
import { exportStudentsCSV, exportStudentsExcel } from "@/lib/excel-export"
import { mockStudent, mockStudent2 } from "../../fixtures/test-data"

// Typed references to the mocked functions
const mockWriteFile = XLSX.writeFile as jest.Mock
const mockJsonToSheet = XLSX.utils.json_to_sheet as jest.Mock
const mockBookAppendSheet = XLSX.utils.book_append_sheet as jest.Mock

// ── Mocks ──────────────────────────────────────────────────────
const mockClick = jest.fn()
const mockAppendChild = jest.fn()
const mockRemoveChild = jest.fn()
const mockCreateObjectURL = jest.fn(() => "blob:mock-url")
const mockRevokeObjectURL = jest.fn()

let createdLink: any

beforeEach(() => {
  mockClick.mockClear()
  mockAppendChild.mockClear()
  mockRemoveChild.mockClear()
  mockCreateObjectURL.mockClear()
  mockRevokeObjectURL.mockClear()

  // Mock document.createElement to track the anchor element
  jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "a") {
      createdLink = {
        setAttribute: jest.fn(),
        click: mockClick,
        style: { visibility: "" },
        href: "",
        download: "",
      }
      return createdLink as any
    }
    return document.createElement(tag)
  })

  jest.spyOn(document.body, "appendChild").mockImplementation(mockAppendChild)
  jest.spyOn(document.body, "removeChild").mockImplementation(mockRemoveChild)

  global.URL.createObjectURL = mockCreateObjectURL
  global.URL.revokeObjectURL = mockRevokeObjectURL
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("exportStudentsCSV", () => {
  it("creates an anchor element and triggers a click", async () => {
    await exportStudentsCSV([mockStudent], "test-export")
    expect(mockClick).toHaveBeenCalledTimes(1)
  })

  it("sets the download attribute to fileName.csv", async () => {
    await exportStudentsCSV([mockStudent], "students-report")
    expect(createdLink.setAttribute).toHaveBeenCalledWith("download", "students-report.csv")
  })

  it("sets the href to a blob URL", async () => {
    await exportStudentsCSV([mockStudent], "test-export")
    expect(createdLink.setAttribute).toHaveBeenCalledWith("href", "blob:mock-url")
  })

  it("appends and then removes the link from the DOM", async () => {
    await exportStudentsCSV([mockStudent], "test-export")
    expect(mockAppendChild).toHaveBeenCalledWith(createdLink)
    expect(mockRemoveChild).toHaveBeenCalledWith(createdLink)
  })

  it("revokes the object URL after download", async () => {
    await exportStudentsCSV([mockStudent], "test-export")
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url")
  })

  it("handles empty student array without throwing", async () => {
    await expect(exportStudentsCSV([], "empty-export")).resolves.not.toThrow()
  })

  it("creates a Blob with text/csv MIME type (verifies link href is set to a blob URL)", async () => {
    await exportStudentsCSV([mockStudent], "test")
    // If createObjectURL was called, a Blob was created
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)
    // The setAttribute call for href uses the URL returned by createObjectURL
    expect(createdLink.setAttribute).toHaveBeenCalledWith("href", "blob:mock-url")
  })
})

describe("exportStudentsExcel", () => {
  beforeEach(() => {
    mockWriteFile.mockClear()
    mockJsonToSheet.mockClear()
    mockBookAppendSheet.mockClear()
  })

  it("calls XLSX.writeFile with the correct filename (.xlsx extension)", async () => {
    await exportStudentsExcel([mockStudent, mockStudent2], "excel-export")
    expect(mockWriteFile).toHaveBeenCalledTimes(1)
    expect(mockWriteFile.mock.calls[0][1]).toBe("excel-export.xlsx")
  })

  it("handles empty array without throwing", async () => {
    await expect(exportStudentsExcel([], "empty")).resolves.not.toThrow()
  })

  it("creates a workbook with a sheet named 'Students'", async () => {
    await exportStudentsExcel([mockStudent], "test")
    expect(mockBookAppendSheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "Students"
    )
  })

  it("maps student fields to the correct Excel column names", async () => {
    await exportStudentsExcel([mockStudent], "test")
    const calledWith = mockJsonToSheet.mock.calls[0][0][0]
    expect(calledWith["Student Name"]).toBe("Aanya Sharma")
    expect(calledWith["Parents Name"]).toBe("Priya Sharma")
    expect(calledWith["Admission No."]).toBe("ADM-001")
    expect(calledWith["Class"]).toBe("Nursery")
  })
})

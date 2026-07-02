import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { mockAdminUser, mockAnnouncement, seedLocalStorage } from "../../fixtures/test-data"

// ── Mock data-store to return controlled data ──────────────────
jest.mock("@/lib/data-store", () => ({
  getStudents: jest.fn(),
  getFees: jest.fn(),
  getAnnouncements: jest.fn(),
  getStudentsBrief: jest.fn(),
  getFeesBrief: jest.fn(),
}))

import * as dataStore from "@/lib/data-store"
import AdminDashboard from "@/app/dashboard/admin/page"

const mockGetStudents = dataStore.getStudents as jest.MockedFunction<typeof dataStore.getStudents>
const mockGetFees = dataStore.getFees as jest.MockedFunction<typeof dataStore.getFees>
const mockGetAnnouncements = dataStore.getAnnouncements as jest.MockedFunction<typeof dataStore.getAnnouncements>
const mockGetStudentsBrief = dataStore.getStudentsBrief as jest.MockedFunction<typeof dataStore.getStudentsBrief>
const mockGetFeesBrief = dataStore.getFeesBrief as jest.MockedFunction<typeof dataStore.getFeesBrief>

beforeEach(() => {
  mockGetStudents.mockResolvedValue([
    { id: "s1", name: "Aanya", age: 4, dateOfBirth: "2022-03-15", program: "Nursery", section: "A", parentName: "P1", parentEmail: "p1@e.com", parentPhone: "1234", admissionNo: "A001", teacher: "T1" },
    { id: "s2", name: "Arjun", age: 3, dateOfBirth: "2023-01-01", program: "Play Group" as any, section: "A", parentName: "P2", parentEmail: "p2@e.com", parentPhone: "5678", admissionNo: "A002", teacher: "T2" },
    { id: "s3", name: "Riya", age: 5, dateOfBirth: "2021-06-01", program: "LKG", section: "A", parentName: "P3", parentEmail: "p3@e.com", parentPhone: "9012", admissionNo: "A003", teacher: "T3" },
  ])

  mockGetStudentsBrief.mockResolvedValue([
    { id: "s1", program: "Nursery" },
    { id: "s2", program: "Play Group" },
    { id: "s3", program: "LKG" },
  ])

  mockGetFees.mockResolvedValue([
    { id: "f1", studentId: "s1", studentName: "Aanya", term: "Q1", amount: 25000, paidAmount: 25000, dueDate: "2026-04-15", status: "paid", createdAt: "2026-03-20" },
    { id: "f2", studentId: "s2", studentName: "Arjun", term: "Q1", amount: 22000, paidAmount: 0, dueDate: "2026-04-15", status: "pending", createdAt: "2026-03-20" },
  ])

  mockGetFeesBrief.mockResolvedValue([
    { amount: 25000, paidAmount: 25000 },
    { amount: 22000, paidAmount: 0 },
  ])

  mockGetAnnouncements.mockResolvedValue([mockAnnouncement])
})

afterEach(() => {
  jest.clearAllMocks()
})

describe("AdminDashboard", () => {
  describe("Loading state", () => {
    it("shows a loading spinner initially", () => {
      // Don't resolve yet — keep promises pending
      mockGetStudents.mockReturnValue(new Promise(() => {}))
      mockGetFees.mockReturnValue(new Promise(() => {}))
      mockGetAnnouncements.mockReturnValue(new Promise(() => {}))
      mockGetStudentsBrief.mockReturnValue(new Promise(() => {}))
      mockGetFeesBrief.mockReturnValue(new Promise(() => {}))

      render(<AdminDashboard />)
      const spinner = document.querySelector(".animate-spin")
      expect(spinner).toBeInTheDocument()
    })
  })

  describe("After data loads", () => {
    it("renders the Admin Dashboard heading", async () => {
      render(<AdminDashboard />)
      await waitFor(() => {
        expect(screen.getByText("Admin Dashboard")).toBeInTheDocument()
      })
    })

    it("renders the 'Total Students' stat card", async () => {
      render(<AdminDashboard />)
      await waitFor(() => {
        expect(screen.getByText("Total Students")).toBeInTheDocument()
      })
    })

    it("renders the correct student count (3)", async () => {
      render(<AdminDashboard />)
      await waitFor(() => {
        // The stat card value '3' should be present
        const elements = screen.getAllByText("3")
        expect(elements.length).toBeGreaterThanOrEqual(1)
      })
    })

    it("renders the 'Fee Collected' stat card", async () => {
      render(<AdminDashboard />)
      await waitFor(() => {
        expect(screen.getByText("Fee Collected")).toBeInTheDocument()
      })
    })

    it("renders the 'Pending Fees' stat card", async () => {
      render(<AdminDashboard />)
      await waitFor(() => {
        expect(screen.getByText("Pending Fees")).toBeInTheDocument()
      })
    })

    it("renders the 'Programs' stat card", async () => {
      render(<AdminDashboard />)
      await waitFor(() => {
        expect(screen.getByText("Programs")).toBeInTheDocument()
      })
    })

    it("renders 'Students by Program' section", async () => {
      render(<AdminDashboard />)
      await waitFor(() => {
        expect(screen.getByText("Students by Program")).toBeInTheDocument()
      })
    })

    it("renders program names in the breakdown chart", async () => {
      render(<AdminDashboard />)
      await waitFor(() => {
        expect(screen.getByText("Nursery")).toBeInTheDocument()
        expect(screen.getByText("Play Group")).toBeInTheDocument()
        expect(screen.getByText("LKG")).toBeInTheDocument()
      })
    })

    it("renders 'Recent Notices' section", async () => {
      render(<AdminDashboard />)
      await waitFor(() => {
        expect(screen.getByText("Recent Notices")).toBeInTheDocument()
      })
    })

    it("shows announcement title in Recent Notices", async () => {
      render(<AdminDashboard />)
      await waitFor(() => {
        expect(screen.getByText("Annual Day Celebration 2026")).toBeInTheDocument()
      })
    })

    it("renders 'Quick Actions' section", async () => {
      render(<AdminDashboard />)
      await waitFor(() => {
        expect(screen.getByText("Quick Actions")).toBeInTheDocument()
      })
    })

    it("Quick Actions contains 'Manage Students' link", async () => {
      render(<AdminDashboard />)
      await waitFor(() => {
        expect(screen.getByText("Manage Students")).toBeInTheDocument()
      })
    })

    it("Quick Actions contains 'Fee Records' link", async () => {
      render(<AdminDashboard />)
      await waitFor(() => {
        expect(screen.getByText("Fee Records")).toBeInTheDocument()
      })
    })

    it("shows correct collection rate percentage", async () => {
      // 25000 paid out of 47000 total = 53%
      render(<AdminDashboard />)
      await waitFor(() => {
        // '53% collected' appears in the stat card sub-text
        expect(screen.getByText("53% collected")).toBeInTheDocument()
      })
    })
  })
})

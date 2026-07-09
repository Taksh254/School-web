import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { mockStudent, mockAnnouncement, mockEvent, mockNote } from "../../fixtures/test-data"

// ── Mock auth context ──────────────────────────────────────────
const mockUseAuth = jest.fn()
jest.mock("@/lib/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}))

// ── Mock data-store ────────────────────────────────────────────
jest.mock("@/lib/data-store", () => ({
  getStudentsByParent: jest.fn(),
  getAttendance: jest.fn(),
  getFees: jest.fn(),
  getAnnouncements: jest.fn(),
  getEvents: jest.fn(),
  getNotes: jest.fn(),
}))

import * as dataStore from "@/lib/data-store"
import ParentDashboard from "@/app/dashboard/parent/page"

const mockGetStudentsByParent = dataStore.getStudentsByParent as jest.MockedFunction<typeof dataStore.getStudentsByParent>
const mockGetAttendance = dataStore.getAttendance as jest.MockedFunction<typeof dataStore.getAttendance>
const mockGetFees = dataStore.getFees as jest.MockedFunction<typeof dataStore.getFees>
const mockGetAnnouncements = dataStore.getAnnouncements as jest.MockedFunction<typeof dataStore.getAnnouncements>
const mockGetEvents = dataStore.getEvents as jest.MockedFunction<typeof dataStore.getEvents>
const mockGetNotes = dataStore.getNotes as jest.MockedFunction<typeof dataStore.getNotes>

function setupLinkedParent() {
  mockUseAuth.mockReturnValue({ user: { id: "u2", email: "parent@school.com", role: "parent", childId: "s1", name: "Priya" } })
  mockGetStudentsByParent.mockResolvedValue([mockStudent])
  mockGetAttendance.mockResolvedValue([
    { id: "a1", studentId: "s1", date: "2026-05-01", status: "present" },
    { id: "a2", studentId: "s1", date: "2026-05-02", status: "present" },
    { id: "a3", studentId: "s1", date: "2026-05-03", status: "absent" },
  ])
  mockGetFees.mockResolvedValue([{ id: "f1", studentId: "s1", studentName: "Aanya", term: "Q1", amount: 25000, paidAmount: 25000, dueDate: "2026-04-15", status: "paid", createdAt: "2026-03-20" }])
  mockGetAnnouncements.mockResolvedValue([mockAnnouncement])
  mockGetEvents.mockResolvedValue([mockEvent])
  mockGetNotes.mockResolvedValue([mockNote])
}

function setupUnlinkedParent() {
  mockUseAuth.mockReturnValue({ user: { id: "u3", email: "nolink@parent.com", role: "parent", name: "Unlinked" } })
  mockGetStudentsByParent.mockResolvedValue([])
  mockGetAnnouncements.mockResolvedValue([mockAnnouncement])
  mockGetEvents.mockResolvedValue([mockEvent])
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("ParentDashboard — linked child", () => {
  beforeEach(() => setupLinkedParent())

  it("shows the child's name after data loads", async () => {
    render(<ParentDashboard />)
    await waitFor(() => {
      expect(screen.getByText("Aanya Sharma")).toBeInTheDocument()
    })
  })

  it("shows the child's program and section", async () => {
    render(<ParentDashboard />)
    await waitFor(() => {
      expect(screen.getByText(/nursery.*section a/i)).toBeInTheDocument()
    })
  })

  it("renders the Attendance stat card", async () => {
    render(<ParentDashboard />)
    await waitFor(() => {
      expect(screen.getByText("Attendance")).toBeInTheDocument()
    })
  })

  it("calculates and shows attendance rate correctly", async () => {
    // 2 present, 1 absent (all non-holiday) → 67%
    render(<ParentDashboard />)
    await waitFor(() => {
      expect(screen.getByText("67%")).toBeInTheDocument()
    })
  })

  it("shows 'All Paid' fee status when all fees are paid", async () => {
    render(<ParentDashboard />)
    await waitFor(() => {
      expect(screen.getByText("All Paid")).toBeInTheDocument()
    })
  })

  it("shows 'N Pending' fee status when there are pending fees", async () => {
    mockGetFees.mockResolvedValue([
      { id: "f1", studentId: "s1", studentName: "Aanya", term: "Q1", amount: 25000, paidAmount: 0, dueDate: "2026-04-15", status: "pending", createdAt: "2026-03-20" },
    ])
    render(<ParentDashboard />)
    await waitFor(() => {
      expect(screen.getByText("1 Pending")).toBeInTheDocument()
    })
  })

  it("renders the Announcements section", async () => {
    render(<ParentDashboard />)
    await waitFor(() => {
      expect(screen.getByText("Announcements")).toBeInTheDocument()
    })
  })

  it("shows announcement title", async () => {
    render(<ParentDashboard />)
    await waitFor(() => {
      expect(screen.getByText("Annual Day Celebration 2026")).toBeInTheDocument()
    })
  })

  it("renders the Teacher Notes section", async () => {
    render(<ParentDashboard />)
    await waitFor(() => {
      expect(screen.getByText("Teacher Notes")).toBeInTheDocument()
    })
  })

  it("shows a teacher note message", async () => {
    render(<ParentDashboard />)
    await waitFor(() => {
      expect(screen.getByText(/Aanya did wonderfully/)).toBeInTheDocument()
    })
  })

  it("renders the Upcoming Events section", async () => {
    render(<ParentDashboard />)
    await waitFor(() => {
      expect(screen.getByText("Upcoming Events")).toBeInTheDocument()
    })
  })
})

describe("ParentDashboard — no child linked", () => {
  beforeEach(() => setupUnlinkedParent())

  it("shows 'No Student Linked' warning", async () => {
    render(<ParentDashboard />)
    await waitFor(() => {
      expect(screen.getByText("No Student Linked")).toBeInTheDocument()
    })
  })

  it("shows contact admin message", async () => {
    render(<ParentDashboard />)
    await waitFor(() => {
      expect(screen.getByText(/contact the administrator/i)).toBeInTheDocument()
    })
  })

  it("does NOT render the child info card", async () => {
    render(<ParentDashboard />)
    await waitFor(() => {
      expect(screen.queryByText("Aanya Sharma")).not.toBeInTheDocument()
    })
  })

  it("does NOT render Teacher Notes section", async () => {
    render(<ParentDashboard />)
    await waitFor(() => {
      expect(screen.queryByText("Teacher Notes")).not.toBeInTheDocument()
    })
  })

  it("still shows Announcements even without a child", async () => {
    render(<ParentDashboard />)
    await waitFor(() => {
      expect(screen.getByText("Announcements")).toBeInTheDocument()
    })
  })
})

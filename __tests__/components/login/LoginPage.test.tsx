import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// ── Mocks ──────────────────────────────────────────────────────
const mockLogin = jest.fn()
const mockParentLogin = jest.fn()
const mockLoginWithGoogle = jest.fn()
const mockRouterReplace = jest.fn()

let mockAuthUser: any = null

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: mockAuthUser,
    loading: false,
    login: mockLogin,
    parentLogin: mockParentLogin,
    loginWithGoogle: mockLoginWithGoogle,
    logout: jest.fn(),
  }),
}))

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockRouterReplace }),
  usePathname: () => "/login",
  useSearchParams: () => ({ get: jest.fn() }),
}))

import LoginPage from "@/app/login/page"

beforeEach(() => {
  mockLogin.mockReset()
  mockParentLogin.mockReset()
  mockLoginWithGoogle.mockReset()
  mockRouterReplace.mockReset()
  mockAuthUser = null
})

describe("LoginPage", () => {
  describe("Initial render", () => {
    it("renders the school name heading", () => {
      render(<LoginPage />)
      expect(screen.getByText("Tiny Mind Play School")).toBeInTheDocument()
    })

    it("shows 'School Management Portal' subtitle by default", () => {
      render(<LoginPage />)
      expect(screen.getByText("School Management Portal")).toBeInTheDocument()
    })

    it("renders Teacher / Admin and Parent tabs", () => {
      render(<LoginPage />)
      expect(screen.getByRole("button", { name: /teacher \/ admin/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /parent/i })).toBeInTheDocument()
    })

    it("renders Back to Home link", () => {
      render(<LoginPage />)
      expect(screen.getByText(/back to home/i)).toBeInTheDocument()
    })
  })

  describe("Tab Switching", () => {
    it("switches to parent login tab when parent tab is clicked", async () => {
      const user = userEvent.setup({ delay: null })
      render(<LoginPage />)
      const parentTab = screen.getByRole("button", { name: /parent/i })
      await user.click(parentTab)
      await waitFor(() => {
        expect(screen.getByPlaceholderText("e.g. ADM-00125")).toBeInTheDocument()
      })
    })

    it("switches back to admin/teacher tab", async () => {
      const user = userEvent.setup({ delay: null })
      render(<LoginPage />)
      await user.click(screen.getByRole("button", { name: /parent/i }))
      await waitFor(() => screen.getByPlaceholderText("e.g. ADM-00125"))
      await user.click(screen.getByRole("button", { name: /teacher \/ admin/i }))
      await waitFor(() => {
        expect(screen.getByPlaceholderText("admin@school.com")).toBeInTheDocument()
      })
    })
  })

  describe("Admin / Teacher login submission", () => {
    it("calls login() with email and password", async () => {
      mockLogin.mockResolvedValue({ success: true })
      const user = userEvent.setup({ delay: null })
      render(<LoginPage />)

      const emailInput = screen.getByPlaceholderText("admin@school.com")
      const passwordInput = screen.getByPlaceholderText("Enter your password")
      const submitBtn = screen.getByRole("button", { name: /enter admin portal/i })

      await user.type(emailInput, "teacher@school.com")
      await user.type(passwordInput, "password123")
      await user.click(submitBtn)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("teacher@school.com", "password123")
      })
    }, 10000)
  })

  describe("Parent login submission", () => {
    it("calls parentLogin() with admission number and password", async () => {
      mockParentLogin.mockResolvedValue({ success: true, mustChangePassword: false })
      const user = userEvent.setup({ delay: null })
      render(<LoginPage />)

      await user.click(screen.getByRole("button", { name: /parent/i }))
      const admInput = await screen.findByPlaceholderText("e.g. ADM-00125")
      const passwordInput = screen.getByPlaceholderText("Enter your password")
      const submitBtn = screen.getByRole("button", { name: /enter parent portal/i })

      await user.type(admInput, "ADM-001")
      await user.type(passwordInput, "pass123")
      await user.click(submitBtn)

      await waitFor(() => {
        expect(mockParentLogin).toHaveBeenCalledWith("ADM-001", "pass123")
      })
    })
  })

  describe("Authenticated redirect", () => {
    it("calls router.replace('/dashboard/admin') when admin user is present", async () => {
      mockAuthUser = { id: "u1", email: "admin@school.com", role: "admin", name: "Admin" }
      render(<LoginPage />)
      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard/admin")
      })
    })

    it("calls router.replace('/dashboard/teacher') when teacher user is present", async () => {
      mockAuthUser = { id: "u2", email: "teacher@school.com", role: "teacher", name: "Teacher" }
      render(<LoginPage />)
      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard/teacher")
      })
    })

    it("calls router.replace('/dashboard/parent') when parent user is present", async () => {
      mockAuthUser = { id: "u3", email: "parent@school.com", role: "parent", name: "Parent" }
      render(<LoginPage />)
      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard/parent")
      })
    })
  })
})

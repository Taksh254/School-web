import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// ── Mocks ──────────────────────────────────────────────────────
const mockLogin = jest.fn()
const mockRegister = jest.fn()
const mockLoginWithGoogle = jest.fn()
const mockBypassLogin = jest.fn()
const mockForgotPassword = jest.fn()
const mockUpdatePassword = jest.fn()
const mockRouterReplace = jest.fn()

// We control what user state is returned via this variable
let mockAuthUser: any = null

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: mockAuthUser,
    loading: false,
    login: mockLogin,
    register: mockRegister,
    loginWithGoogle: mockLoginWithGoogle,
    bypassLogin: mockBypassLogin,
    forgotPassword: mockForgotPassword,
    updatePassword: mockUpdatePassword,
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
  mockRegister.mockReset()
  mockLoginWithGoogle.mockReset()
  mockForgotPassword.mockReset()
  mockUpdatePassword.mockReset()
  mockRouterReplace.mockReset()
  mockAuthUser = null // reset to unauthenticated
})

describe("LoginPage", () => {
  describe("Initial render", () => {
    it("renders the school name heading", () => {
      render(<LoginPage />)
      expect(screen.getByText("Tiny Mind Play School")).toBeInTheDocument()
    })

    it("shows 'Login to your portal' subtitle by default", () => {
      render(<LoginPage />)
      expect(screen.getByText("Login to your portal")).toBeInTheDocument()
    })

    it("renders Email Address label and input in login mode", () => {
      render(<LoginPage />)
      expect(screen.getByText("Email Address")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument()
    })

    it("renders Password label and input in login mode", () => {
      render(<LoginPage />)
      expect(screen.getByText("Password")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument()
    })

    it("renders the Enter Portal submit button", () => {
      render(<LoginPage />)
      expect(screen.getByRole("button", { name: /enter portal/i })).toBeInTheDocument()
    })

    it("renders the Google Continue button", () => {
      render(<LoginPage />)
      expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument()
    })

    it("renders Back to Home link", () => {
      render(<LoginPage />)
      expect(screen.getByText(/back to home/i)).toBeInTheDocument()
    })
  })

  describe("Mode switching — Login ↔ Sign Up", () => {
    it("switches to signup mode when toggle button is clicked", async () => {
      const user = userEvent.setup({ delay: null })
      render(<LoginPage />)
      const toggle = screen.getByRole("button", { name: /sign up/i })
      await user.click(toggle)
      await waitFor(() => {
        expect(screen.getByText("Create a parent account")).toBeInTheDocument()
      })
    })

    it("shows Full Name placeholder in signup mode", async () => {
      const user = userEvent.setup({ delay: null })
      render(<LoginPage />)
      await user.click(screen.getByRole("button", { name: /sign up/i }))
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument()
      })
    })

    it("shows 'Create Account' submit button in signup mode", async () => {
      const user = userEvent.setup({ delay: null })
      render(<LoginPage />)
      await user.click(screen.getByRole("button", { name: /sign up/i }))
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument()
      })
    })

    it("can switch back to login mode from signup", async () => {
      const user = userEvent.setup({ delay: null })
      render(<LoginPage />)
      await user.click(screen.getByRole("button", { name: /sign up/i }))
      await waitFor(() => screen.getByText("Create a parent account"))
      await user.click(screen.getByRole("button", { name: /log in/i }))
      await waitFor(() => {
        expect(screen.getByText("Login to your portal")).toBeInTheDocument()
      })
    })
  })

  describe("Login form submission", () => {
    it("calls login() with correct email and password on submit", async () => {
      mockLogin.mockResolvedValue({ success: true })
      const user = userEvent.setup()
      render(<LoginPage />)

      const passwordInput = screen.getByPlaceholderText("Enter your password")
      const form = passwordInput.closest("form")!
      const emailInput = within(form).getByPlaceholderText("you@example.com")

      await user.type(emailInput, "admin@school.com")
      await user.type(passwordInput, "password123")
      await user.click(within(form).getByRole("button", { name: /enter portal/i }))

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("admin@school.com", "password123")
      })
    })

    it("shows error message when login returns failure", async () => {
      mockLogin.mockResolvedValue({ success: false, error: "Invalid credentials" })
      const user = userEvent.setup()
      render(<LoginPage />)

      const passwordInput = screen.getByPlaceholderText("Enter your password")
      const form = passwordInput.closest("form")!
      const emailInput = within(form).getByPlaceholderText("you@example.com")

      await user.type(emailInput, "wrong@email.com")
      await user.type(passwordInput, "wrongpass")
      await user.click(within(form).getByRole("button", { name: /enter portal/i }))

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument()
      })
    })

    it("clears error when switching between login/signup modes", async () => {
      mockLogin.mockResolvedValue({ success: false, error: "Some error" })
      const user = userEvent.setup()
      render(<LoginPage />)

      const passwordInput = screen.getByPlaceholderText("Enter your password")
      const form = passwordInput.closest("form")!
      const emailInput = within(form).getByPlaceholderText("you@example.com")

      await user.type(emailInput, "x@x.com")
      await user.type(passwordInput, "wrong")
      await user.click(within(form).getByRole("button", { name: /enter portal/i }))
      await screen.findByText("Some error")

      await user.click(screen.getByRole("button", { name: /sign up/i }))
      await waitFor(() => {
        expect(screen.queryByText("Some error")).not.toBeInTheDocument()
      })
    })
  })

  describe("Signup form submission", () => {
    it("calls register() with name, email, password on signup submit", async () => {
      mockRegister.mockResolvedValue({ success: true })
      const user = userEvent.setup()
      render(<LoginPage />)

      // Switch to signup mode and wait for it to render
      await user.click(screen.getByRole("button", { name: /sign up/i }))
      
      // Find the signup form using the unique password input
      const passwordInput = await screen.findByPlaceholderText("Create a password")
      const form = passwordInput.closest("form")!
      const nameInput = within(form).getByPlaceholderText("Your name")
      const emailInput = within(form).getByPlaceholderText("you@example.com")

      await user.type(nameInput, "Jane Doe")
      await user.type(emailInput, "jane@email.com")
      await user.type(passwordInput, "pass1234")
      await user.click(within(form).getByRole("button", { name: /create account/i }))

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith("Jane Doe", "jane@email.com", "pass1234")
      })
    })
  })

  describe("Google login", () => {
    it("calls loginWithGoogle() when the Google button is clicked", async () => {
      mockLoginWithGoogle.mockResolvedValue({ success: true })
      const user = userEvent.setup()
      render(<LoginPage />)

      await user.click(screen.getByRole("button", { name: /continue with google/i }))
      await waitFor(() => {
        expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1)
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

    it("calls router.replace('/dashboard/parent') when parent user is present", async () => {
      mockAuthUser = { id: "u2", email: "parent@school.com", role: "parent", name: "Parent" }
      render(<LoginPage />)
      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard/parent")
      })
    })
  })

  describe("Forgot/Reset Password flow", () => {
    it("renders 'Forgot Password?' link and switches to forgot mode on click", async () => {
      const user = userEvent.setup({ delay: null })
      render(<LoginPage />)
      const link = screen.getByRole("button", { name: /forgot password\?/i })
      await user.click(link)
      await waitFor(() => {
        expect(screen.getByText("Reset your password")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument()
      })
    })

    it("calls forgotPassword() with email when forgot form is submitted", async () => {
      mockForgotPassword.mockResolvedValue({ success: true })
      const user = userEvent.setup({ delay: null })
      render(<LoginPage />)
      
      await user.click(screen.getByRole("button", { name: /forgot password\?/i }))
      const emailInput = await screen.findByPlaceholderText("you@example.com")
      await user.type(emailInput, "test@example.com")
      await user.click(screen.getByRole("button", { name: /send reset link/i }))

      await waitFor(() => {
        expect(mockForgotPassword).toHaveBeenCalledWith("test@example.com")
      })
    })
  })
})

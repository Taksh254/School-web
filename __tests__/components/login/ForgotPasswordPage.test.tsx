import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mockForgotPassword = jest.fn()

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    forgotPassword: mockForgotPassword,
  }),
}))

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}))

jest.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: () => true,
}))

import ForgotPasswordPage from "@/app/forgot-password/page"

beforeEach(() => {
  mockForgotPassword.mockReset()
})

describe("ForgotPasswordPage", () => {
  it("renders the page layout, inputs, and buttons", () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByText("Forgot Password")).toBeInTheDocument()
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /back to login/i })).toBeInTheDocument()
  })

  it("submits the form and calls forgotPassword with entered email", async () => {
    mockForgotPassword.mockResolvedValue({ success: true })
    const user = userEvent.setup()
    render(<ForgotPasswordPage />)

    const emailInput = screen.getByLabelText("Email Address")
    await user.type(emailInput, "user@school.com")
    await user.click(screen.getByRole("button", { name: /send reset link/i }))

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith("user@school.com")
    })

    expect(await screen.findByText(/If an account matches that email/i)).toBeInTheDocument()
  })

  it("displays error message when request fails", async () => {
    mockForgotPassword.mockResolvedValue({ success: false, error: "Network error occurred" })
    const user = userEvent.setup()
    render(<ForgotPasswordPage />)

    const emailInput = screen.getByLabelText("Email Address")
    await user.type(emailInput, "user@school.com")
    await user.click(screen.getByRole("button", { name: /send reset link/i }))

    expect(await screen.findByText("Network error occurred")).toBeInTheDocument()
  })
})

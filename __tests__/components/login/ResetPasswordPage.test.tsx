import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mockUpdatePassword = jest.fn()
const mockGetSession = jest.fn()
const mockSignOut = jest.fn()

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    updatePassword: mockUpdatePassword,
  }),
}))

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}))

jest.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      signOut: () => mockSignOut(),
    },
  },
}))

import ResetPasswordPage from "@/app/auth/reset-password/page"

beforeEach(() => {
  mockUpdatePassword.mockReset()
  mockGetSession.mockReset()
  mockSignOut.mockReset()
})

describe("ResetPasswordPage", () => {
  it("shows error message if no active Supabase session is found", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    render(<ResetPasswordPage />)

    expect(await screen.findByText(/Invalid or expired password reset link/i)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText("Enter new password (min 6 chars)")).not.toBeInTheDocument()
  })

  it("renders reset password form when active session is found", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "user123" } } }, error: null })
    render(<ResetPasswordPage />)

    expect(await screen.findByPlaceholderText("Enter new password (min 6 chars)")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Confirm new password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument()
  })

  it("validates that password and confirm password match", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "user123" } } }, error: null })
    const user = userEvent.setup()
    render(<ResetPasswordPage />)

    const passInput = await screen.findByPlaceholderText("Enter new password (min 6 chars)")
    const confirmInput = screen.getByPlaceholderText("Confirm new password")
    
    await user.type(passInput, "newPassword123")
    await user.type(confirmInput, "differentPassword")
    await user.click(screen.getByRole("button", { name: /update password/i }))

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument()
  })

  it("submits the form successfully and calls updatePassword", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "user123" } } }, error: null })
    mockUpdatePassword.mockResolvedValue({ success: true })
    mockSignOut.mockResolvedValue({ error: null })
    
    const user = userEvent.setup()
    render(<ResetPasswordPage />)

    const passInput = await screen.findByPlaceholderText("Enter new password (min 6 chars)")
    const confirmInput = screen.getByPlaceholderText("Confirm new password")
    
    await user.type(passInput, "secret123")
    await user.type(confirmInput, "secret123")
    await user.click(screen.getByRole("button", { name: /update password/i }))

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith("secret123")
    })

    expect(await screen.findByText("Password updated successfully!")).toBeInTheDocument()
    expect(mockSignOut).toHaveBeenCalled()
  })
})

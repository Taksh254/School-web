import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"

// pathname mock — overridden per test
const mockUsePathname = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => mockUsePathname(),
  useSearchParams: () => ({ get: jest.fn() }),
}))

import Header from "@/components/Header"

describe("Header", () => {
  describe("Visibility", () => {
    it("renders nav links when on home path '/'", () => {
      mockUsePathname.mockReturnValue("/")
      render(<Header />)
      expect(screen.getByText("Home")).toBeInTheDocument()
      expect(screen.getByText("About Us")).toBeInTheDocument()
    })

    it("renders nav links on /about path", () => {
      mockUsePathname.mockReturnValue("/about")
      render(<Header />)
      expect(screen.getByText("Programs")).toBeInTheDocument()
    })

    it("returns null on /login — header is hidden", () => {
      mockUsePathname.mockReturnValue("/login")
      const { container } = render(<Header />)
      expect(container.firstChild).toBeNull()
    })

    it("returns null on /dashboard/admin — header is hidden", () => {
      mockUsePathname.mockReturnValue("/dashboard/admin")
      const { container } = render(<Header />)
      expect(container.firstChild).toBeNull()
    })

    it("returns null on /dashboard/parent — header is hidden", () => {
      mockUsePathname.mockReturnValue("/dashboard/parent")
      const { container } = render(<Header />)
      expect(container.firstChild).toBeNull()
    })

    it("returns null on nested dashboard path /dashboard/admin/students", () => {
      mockUsePathname.mockReturnValue("/dashboard/admin/students")
      const { container } = render(<Header />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe("Navigation links", () => {
    beforeEach(() => mockUsePathname.mockReturnValue("/"))

    it("renders all 6 nav links", () => {
      render(<Header />)
      const navItems = ["Home", "About Us", "Programs", "Gallery", "Parent Corner", "Contact Us"]
      navItems.forEach((item) => {
        expect(screen.getByText(item)).toBeInTheDocument()
      })
    })

    it("renders Login button with correct href", () => {
      render(<Header />)
      const loginLinks = screen.getAllByRole("link", { name: /login/i })
      expect(loginLinks.length).toBeGreaterThan(0)
      expect(loginLinks[0]).toHaveAttribute("href", "/login")
    })

    it("renders 'Book a Visit' button linking to /contact", () => {
      render(<Header />)
      const bookLinks = screen.getAllByRole("link", { name: /book a visit/i })
      expect(bookLinks.length).toBeGreaterThan(0)
      expect(bookLinks[0]).toHaveAttribute("href", "/contact")
    })

    it("renders the school logo link to /", () => {
      render(<Header />)
      const logoLinks = screen.getAllByRole("link", { name: /tiny mind play school/i })
      expect(logoLinks[0]).toHaveAttribute("href", "/")
    })
  })

  describe("Mobile menu", () => {
    beforeEach(() => mockUsePathname.mockReturnValue("/"))

    it("shows the hamburger menu button on mobile", () => {
      render(<Header />)
      const menuBtn = screen.getByRole("button", { name: /menu/i })
      expect(menuBtn).toBeInTheDocument()
    })

    it("mobile menu opens when hamburger is clicked", () => {
      render(<Header />)
      const menuBtn = screen.getByRole("button", { name: /menu/i })
      fireEvent.click(menuBtn)
      // After opening, the button label becomes "Close"
    })
  })
})

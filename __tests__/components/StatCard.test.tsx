import React from "react"
import { render, screen } from "@testing-library/react"
import StatCard from "@/components/dashboard/StatCard"
import { Users } from "lucide-react"

describe("StatCard", () => {
  describe("Rendering", () => {
    it("renders the label", () => {
      render(<StatCard icon={Users} label="Total Students" value={42} />)
      expect(screen.getByText("Total Students")).toBeInTheDocument()
    })

    it("renders the value as a string", () => {
      render(<StatCard icon={Users} label="Fee Collected" value="₹125.0K" />)
      expect(screen.getByText("₹125.0K")).toBeInTheDocument()
    })

    it("renders a numeric value", () => {
      render(<StatCard icon={Users} label="Programs" value={3} />)
      expect(screen.getByText("3")).toBeInTheDocument()
    })

    it("renders sub-text when provided", () => {
      render(<StatCard icon={Users} label="Attendance" value="92%" sub="This month" />)
      expect(screen.getByText("This month")).toBeInTheDocument()
    })

    it("does not render sub-text when not provided", () => {
      render(<StatCard icon={Users} label="Label" value="Val" />)
      // No sub text in DOM
      expect(screen.queryByText("This month")).not.toBeInTheDocument()
    })
  })

  describe("Link behaviour", () => {
    it("wraps in a Link element when href is provided", () => {
      render(<StatCard icon={Users} label="Students" value={8} href="/dashboard/admin/students" />)
      const link = screen.getByRole("link")
      expect(link).toHaveAttribute("href", "/dashboard/admin/students")
    })

    it("does NOT render a link when href is not provided", () => {
      render(<StatCard icon={Users} label="Label" value="Val" />)
      expect(screen.queryByRole("link")).not.toBeInTheDocument()
    })
  })

  describe("Icon rendering", () => {
    it("renders an SVG icon (lucide icon is an SVG)", () => {
      const { container } = render(<StatCard icon={Users} label="Users" value={5} />)
      expect(container.querySelector("svg")).toBeInTheDocument()
    })
  })
})

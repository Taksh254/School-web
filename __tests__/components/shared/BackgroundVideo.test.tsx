import React from "react"
import { render } from "@testing-library/react"

// jsdom does not implement HTMLMediaElement methods — stub them out
beforeAll(() => {
  Object.defineProperty(HTMLVideoElement.prototype, "play", {
    configurable: true,
    writable: true,
    value: jest.fn().mockResolvedValue(undefined),
  })
  Object.defineProperty(HTMLVideoElement.prototype, "pause", {
    configurable: true,
    writable: true,
    value: jest.fn(),
  })
  Object.defineProperty(HTMLVideoElement.prototype, "load", {
    configurable: true,
    writable: true,
    value: jest.fn(),
  })
})

const mockUsePathname = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => mockUsePathname(),
}))

import BackgroundVideo from "@/components/BackgroundVideo"

describe("BackgroundVideo", () => {
  describe("Non-dashboard paths", () => {
    beforeEach(() => mockUsePathname.mockReturnValue("/"))

    it("renders a <video> element on the home page", () => {
      const { container } = render(<BackgroundVideo />)
      expect(container.querySelector("video")).toBeInTheDocument()
    })

    it("video has autoPlay, muted, loop, and playsInline attributes", () => {
      const { container } = render(<BackgroundVideo />)
      const video = container.querySelector("video") as HTMLVideoElement
      expect(video).toHaveAttribute("autoPlay")
      // muted is a boolean DOM property, not an HTML attribute in jsdom
      expect(video.muted).toBe(true)
      expect(video).toHaveAttribute("loop")
      expect(video).toHaveAttribute("playsInline")
    })

    it("has a <source> element pointing to the correct video URL", () => {
      const { container } = render(<BackgroundVideo />)
      const source = container.querySelector("source")
      expect(source).toHaveAttribute("src", expect.stringContaining("bg-video.mp4"))
      expect(source).toHaveAttribute("type", "video/mp4")
    })

    it("video has fixed positioning and full coverage classes", () => {
      const { container } = render(<BackgroundVideo />)
      const video = container.querySelector("video")
      expect(video?.className).toMatch(/fixed/)
      expect(video?.className).toMatch(/inset-0/)
      expect(video?.className).toMatch(/w-full/)
      expect(video?.className).toMatch(/h-full/)
    })

    it("video has pointer-events-none so it does not block interactions", () => {
      const { container } = render(<BackgroundVideo />)
      const video = container.querySelector("video")
      expect(video?.className).toMatch(/pointer-events-none/)
    })
  })

  describe("Dashboard paths", () => {
    it("returns null on /dashboard/admin (saves resources)", () => {
      mockUsePathname.mockReturnValue("/dashboard/admin")
      const { container } = render(<BackgroundVideo />)
      expect(container.firstChild).toBeNull()
    })

    it("returns null on /dashboard/parent", () => {
      mockUsePathname.mockReturnValue("/dashboard/parent")
      const { container } = render(<BackgroundVideo />)
      expect(container.firstChild).toBeNull()
    })

    it("returns null on nested dashboard path", () => {
      mockUsePathname.mockReturnValue("/dashboard/admin/students")
      const { container } = render(<BackgroundVideo />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe("Other public paths", () => {
    it.each(["/login", "/about", "/programs", "/contact"])(
      "renders the video on %s",
      (path) => {
        mockUsePathname.mockReturnValue(path)
        const { container } = render(<BackgroundVideo />)
        expect(container.querySelector("video")).toBeInTheDocument()
      }
    )
  })
})

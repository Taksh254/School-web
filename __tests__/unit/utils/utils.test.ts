import { cn } from "@/lib/utils"

describe("cn (className utility)", () => {
  it("concatenates two string class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles a single class name", () => {
    expect(cn("only-one")).toBe("only-one")
  })

  it("handles empty input", () => {
    expect(cn()).toBe("")
  })

  it("filters out falsy values (undefined, null, false, empty string)", () => {
    expect(cn("a", undefined, "b", null, false, "", "c")).toBe("a b c")
  })

  it("merges conflicting Tailwind classes (later one wins)", () => {
    // tailwind-merge behaviour: p-4 and p-2 → p-2 wins (last one)
    const result = cn("p-4", "p-2")
    expect(result).toBe("p-2")
  })

  it("handles conditional classes via object syntax (clsx)", () => {
    const active = true
    const disabled = false
    const result = cn("base-class", { "active-class": active, "disabled-class": disabled })
    expect(result).toContain("base-class")
    expect(result).toContain("active-class")
    expect(result).not.toContain("disabled-class")
  })

  it("handles array of classes", () => {
    const result = cn(["a", "b"], "c")
    expect(result).toContain("a")
    expect(result).toContain("b")
    expect(result).toContain("c")
  })
})

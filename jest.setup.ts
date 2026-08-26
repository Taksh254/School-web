import "@testing-library/jest-dom"

// ── Mock next/navigation ──────────────────────────────────────
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockBack = jest.fn()
const mockPathname = jest.fn(() => "/")
const mockSearchParams = { get: jest.fn(() => null) }

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: mockPathname,
  useSearchParams: () => mockSearchParams,
}))

// Export for individual test usage
export { mockPush, mockReplace, mockPathname }

// ── Mock next/link ─────────────────────────────────────────────
jest.mock("next/link", () => {
  const React = require("react")
  const MockLink = ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children)
  MockLink.displayName = "MockLink"
  return MockLink
})

// ── Mock next/font/google ──────────────────────────────────────
jest.mock("next/font/google", () => ({
  Nunito: () => ({ variable: "--font-nunito", className: "mock-nunito" }),
  Inter: () => ({ variable: "--font-inter", className: "mock-inter" }),
  Caveat: () => ({ variable: "--font-caveat", className: "mock-caveat" }),
}))

// ── Mock framer-motion (avoid animation issues in jsdom) ───────
jest.mock("framer-motion", () => {
  const React = require("react")
  const createMotionComponent = (tag: string) => {
    const Component = React.forwardRef(
      ({ children, ...props }: any, ref: any) => {
        // Strip framer-motion-specific props
        const {
          initial, animate, exit, transition, whileHover, whileTap,
          variants, custom, layoutId, layout, drag, ...domProps
        } = props
        return React.createElement(tag, { ...domProps, ref }, children)
      }
    )
    Component.displayName = `motion.${tag}`
    return Component
  }

  const AnimatePresence = ({ children }: any) => children ?? null
  AnimatePresence.displayName = "AnimatePresence"

  const cache: Record<string, any> = {}

  return {
    motion: new Proxy({}, {
      get: (_, tag: string) => {
        if (!cache[tag]) {
          cache[tag] = createMotionComponent(tag)
        }
        return cache[tag]
      },
    }),
    AnimatePresence,
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn() }),
    useInView: () => true,
  }
})

// ── Mock @supabase/ssr ─────────────────────────────────────────
// Forces the app into demo/localStorage mode in all tests.
jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: { message: "invalid", status: 400 } }),
      signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({}),
      signInWithOAuth: jest.fn().mockResolvedValue({ error: null }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    })),
    removeChannel: jest.fn(),
  })),
  createServerClient: jest.fn(),
}))

// ── In-memory localStorage mock ────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
  }
})()

Object.defineProperty(window, "localStorage", { value: localStorageMock })

// ── Clear localStorage between tests ──────────────────────────
beforeEach(() => {
  localStorageMock.clear()
})

// ── Global fetch mock ─────────────────────────────────────────
if (typeof global.fetch === "undefined") {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
      blob: () => Promise.resolve(new Blob()),
    })
  ) as any
}

// ── Suppress console warnings in tests ────────────────────────
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Supabase") || args[0].includes("Warning:"))
    ) return
    originalWarn(...args)
  }
})
afterAll(() => { console.warn = originalWarn })


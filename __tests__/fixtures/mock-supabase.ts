/**
 * Mock Supabase factory for testing Supabase-mode code paths.
 *
 * Usage:
 *   const { mockFrom, mockSelect } = createMockSupabase({ students: [mockStudent] })
 *   jest.mock("@/lib/supabase", () => ({ supabase: mockFrom, isSupabaseConfigured: () => true }))
 */

export interface SupabaseMockData {
  students?: any[]
  fees?: any[]
  payments?: any[]
  attendance?: any[]
  announcements?: any[]
  events?: any[]
  notes?: any[]
  profiles?: any[]
}

export function createMockSupabaseClient(data: SupabaseMockData = {}) {
  const tableData: Record<string, any[]> = {
    students: data.students ?? [],
    fees: data.fees ?? [],
    payments: data.payments ?? [],
    attendance: data.attendance ?? [],
    announcements: data.announcements ?? [],
    events: data.events ?? [],
    notes: data.notes ?? [],
    profiles: data.profiles ?? [],
  }

  let currentTable = ""
  let filterField = ""
  let filterValue: any = undefined
  let orderByField = ""

  const getFiltered = () => {
    let rows = [...(tableData[currentTable] ?? [])]
    if (filterField && filterValue !== undefined) {
      rows = rows.filter((row) => row[filterField] === filterValue)
    }
    if (orderByField) {
      rows.sort((a, b) => (a[orderByField] > b[orderByField] ? 1 : -1))
    }
    return rows
  }

  const builder: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn((field: string, value: any) => {
      filterField = field
      filterValue = value
      return builder
    }),
    order: jest.fn((field: string) => {
      orderByField = field
      return builder
    }),
    insert: jest.fn((rows: any[]) => {
      const inserted = rows.map((r: any) => ({ id: `mock-${Date.now()}`, ...r }))
      tableData[currentTable] = [...(tableData[currentTable] ?? []), ...inserted]
      return {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: inserted[0], error: null }),
        then: (resolve: any) => resolve({ data: inserted, error: null }),
      }
    }),
    update: jest.fn((updates: any) => {
      const rows = tableData[currentTable] ?? []
      const idx = filterField
        ? rows.findIndex((r) => r[filterField] === filterValue)
        : -1
      if (idx >= 0) Object.assign(rows[idx], updates)
      return {
        eq: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: rows[idx], error: null }),
      }
    }),
    delete: jest.fn(() => {
      if (filterField) {
        tableData[currentTable] = (tableData[currentTable] ?? []).filter(
          (r) => r[filterField] !== filterValue
        )
      }
      return {
        eq: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: null, error: null }),
      }
    }),
    single: jest.fn().mockImplementation(() => {
      const rows = getFiltered()
      return Promise.resolve({ data: rows[0] ?? null, error: rows.length === 0 ? { message: "not found" } : null })
    }),
    maybeSingle: jest.fn().mockImplementation(() => {
      const rows = getFiltered()
      return Promise.resolve({ data: rows[0] ?? null, error: null })
    }),
    then: jest.fn().mockImplementation((resolve: any) => {
      return resolve({ data: getFiltered(), error: null })
    }),
  }

  const mockFrom = jest.fn((table: string) => {
    currentTable = table
    filterField = ""
    filterValue = undefined
    orderByField = ""
    return builder
  })

  const mockAuth = {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "invalid login credentials", status: 400 },
    }),
    signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({}),
    signInWithOAuth: jest.fn().mockResolvedValue({ error: null }),
  }

  return {
    supabase: { from: mockFrom, auth: mockAuth },
    mockFrom,
    mockAuth,
    tableData,
    // Helpers to set responses
    setAuthSession: (session: any) => {
      mockAuth.getSession.mockResolvedValue({ data: { session }, error: null })
    },
    setSignInSuccess: (user: any) => {
      mockAuth.signInWithPassword.mockResolvedValue({ data: { user }, error: null })
    },
  }
}

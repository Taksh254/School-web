"use client"

import { useState, useMemo } from "react"
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import EmptyState from "./EmptyState"

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  searchKeys?: string[]
  searchPlaceholder?: string
  emptyTitle?: string
  emptyDescription?: string
  actions?: (row: T) => React.ReactNode
  initialPageSize?: number
  pageSizeOptions?: number[]
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchKeys = [],
  searchPlaceholder = "Search...",
  emptyTitle = "No data found",
  emptyDescription,
  actions,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const filtered = useMemo(() => {
    let result = data
    if (search && searchKeys.length > 0) {
      const q = search.toLowerCase()
      result = result.filter((row) =>
        searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(q))
      )
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const aVal = String(a[sortKey] ?? "")
        const bVal = String(b[sortKey] ?? "")
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      })
    }
    return result
  }, [data, search, searchKeys, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  return (
    <div>
      {searchKeys.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-olive/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-cream border border-beige/20 text-sm text-olive placeholder:text-olive/30 outline-none focus:border-pistachio focus:shadow-glow transition-all font-body"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="rounded-2xl border border-beige/20 overflow-hidden bg-soft-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream/60">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="text-left px-4 py-3 text-xs font-medium text-olive/50 uppercase tracking-wider font-body"
                    >
                      {col.sortable ? (
                        <button
                          onClick={() => handleSort(col.key)}
                          className="flex items-center gap-1 hover:text-olive transition-colors"
                        >
                          {col.label}
                          {sortKey === col.key ? (
                            sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          ) : null}
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                  {actions && <th className="text-left px-4 py-3 text-xs font-medium text-olive/50 uppercase tracking-wider font-body">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, i) => (
                  <tr
                    key={i}
                    className="border-t border-beige/10 hover:bg-cream/30 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3.5 text-olive/70 font-body">
                        {col.render ? col.render(row) : String(row[col.key] ?? "")}
                      </td>
                    ))}
                    {actions && <td className="px-4 py-3.5">{actions(row)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-beige/15 bg-cream/30 text-xs text-olive/60 font-body">
            <div className="flex items-center gap-3">
              <span>
                Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-2 py-1 rounded-lg bg-soft-white border border-beige/20 text-olive text-xs outline-none focus:border-pistachio cursor-pointer"
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-soft-white border border-beige/20 hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4 text-olive/70" />
              </button>

              <span className="px-3 py-1 font-medium text-olive">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-soft-white border border-beige/20 hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4 text-olive/70" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


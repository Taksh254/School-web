"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, ChevronUp, ChevronDown } from "lucide-react"
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
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchKeys = [],
  searchPlaceholder = "Search...",
  emptyTitle = "No data found",
  emptyDescription,
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

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

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-cream border border-beige/20 text-sm text-olive placeholder:text-olive/30 outline-none focus:border-pistachio focus:shadow-glow transition-all font-body"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-beige/20">
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
              {filtered.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-t border-beige/10 hover:bg-cream/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5 text-olive/70 font-body">
                      {col.render ? col.render(row) : String(row[col.key] ?? "")}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3.5">{actions(row)}</td>}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

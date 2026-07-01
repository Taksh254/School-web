"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, Search, Check } from "lucide-react"
import type { Student } from "@/lib/types"

interface SearchableStudentSelectProps {
  students: Student[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  required?: boolean
}

export default function SearchableStudentSelect({
  students,
  value,
  onChange,
  placeholder = "Select student...",
  required = false,
}: SearchableStudentSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedStudent = students.find((s) => s.id === value)

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.program.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Hidden input for HTML5 required check */}
      <input
        type="text"
        required={required}
        value={value}
        onChange={() => {}}
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        tabIndex={-1}
      />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body text-left hover:bg-cream/70"
      >
        <span className={selectedStudent ? "text-olive font-medium" : "text-olive/40"}>
          {selectedStudent ? `${selectedStudent.name} (${selectedStudent.program})` : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-olive/40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-soft-white border border-beige/20 rounded-2xl shadow-card p-2 space-y-2 max-h-[300px] flex flex-col focus-within:border-pistachio transition-all">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-olive/30" />
            <input
              type="text"
              placeholder="Type to search name or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-cream border border-beige/15 text-xs text-olive outline-none focus:border-pistachio transition-all font-body"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1 max-h-[200px] pr-1 space-y-0.5 custom-scrollbar">
            {filtered.length > 0 ? (
              filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onChange(s.id)
                    setIsOpen(false)
                    setSearchTerm("")
                  }}
                  className={`w-full text-left px-3 py-2.5 text-xs font-body transition-colors rounded-xl flex items-center justify-between ${
                    s.id === value ? "bg-pistachio/15 text-olive font-semibold" : "text-olive/70 hover:bg-cream"
                  }`}
                >
                  <span>{s.name} ({s.program})</span>
                  {s.id === value && <Check className="w-3.5 h-3.5 text-pistachio shrink-0" />}
                </button>
              ))
            ) : (
              <p className="text-[11px] text-olive/40 text-center py-6 font-body">No matching students found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

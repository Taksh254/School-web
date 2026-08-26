"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, Check } from "lucide-react"
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
  placeholder = "Search student by name or admission no...",
  required = false,
}: SearchableStudentSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Find currently selected student
  const selectedStudent = students.find((s) => s.id === value)

  // Track the text in the input
  const [inputValue, setInputValue] = useState("")

  // Synchronize input value with selected student
  useEffect(() => {
    if (selectedStudent) {
      setInputValue(selectedStudent.name)
    } else {
      setInputValue("")
    }
  }, [value, selectedStudent])

  // Filter students based on typed text
  const filtered = students.filter((s) => {
    // If the input value matches the currently selected student name, show all options on focus/click
    if (selectedStudent && inputValue === selectedStudent.name) {
      return true
    }
    const q = inputValue.toLowerCase().trim()
    return (
      s.name.toLowerCase().includes(q) ||
      (s.admissionNo && s.admissionNo.toLowerCase().includes(q)) ||
      s.program.toLowerCase().includes(q)
    )
  })

  // Handle outside clicks to close dropdown and reset input if invalid
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        const q = inputValue.trim().toLowerCase()
        // If the user typed a name or admission number that matches a student exactly, select them
        const exactMatch = students.find(
          (s) =>
            s.name.toLowerCase() === q ||
            (s.admissionNo && s.admissionNo.toLowerCase() === q)
        )
        if (exactMatch) {
          onChange(exactMatch.id)
        } else if (selectedStudent) {
          // Reset to selected student name
          setInputValue(selectedStudent.name)
        } else {
          // Reset to empty
          setInputValue("")
          onChange("")
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [inputValue, students, selectedStudent, onChange])

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

      <div className="relative w-full">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-3.5 text-olive/40 hover:text-olive transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-soft-white border border-beige/20 rounded-2xl shadow-card p-1.5 max-h-[250px] overflow-y-auto custom-scrollbar space-y-0.5">
          {filtered.length > 0 ? (
            filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onChange(s.id)
                  setInputValue(s.name)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-xs font-body transition-colors rounded-xl flex items-center justify-between ${
                  s.id === value ? "bg-pistachio/15 text-olive font-semibold" : "text-olive/70 hover:bg-cream"
                }`}
              >
                <div>
                  <p className="font-semibold flex items-center gap-1.5">
                    <span>{s.name}</span>
                    {s.admissionNo && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-pistachio/15 text-olive/70 font-mono font-normal">
                        {s.admissionNo}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-olive/40">{s.program}</p>
                </div>
                {s.id === value && <Check className="w-3.5 h-3.5 text-pistachio shrink-0" />}
              </button>
            ))
          ) : (
            <p className="text-[11px] text-olive/40 text-center py-6 font-body">No matching students found</p>
          )}
        </div>
      )}
    </div>
  )
}

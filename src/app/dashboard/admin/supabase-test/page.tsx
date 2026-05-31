"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

interface DebugInfo {
  supabaseUrl: string
  currentUser: string
  authStatus: string
  connectionStatus: string
  dbResponse: string
  lastError: string
}

export default function SupabaseTestPage() {
  const { user, sessionDebug } = useAuth()

  // Test 1: Connection
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [connectionError, setConnectionError] = useState("")

  // Test 2: Insert
  const [studentName, setStudentName] = useState("Test Student")
  const [studentClass, setStudentClass] = useState("Play Group")
  const [insertResult, setInsertResult] = useState<{ success?: boolean; id?: string; error?: string }>({})

  // Test 3: Fetch
  const [students, setStudents] = useState<any[]>([])
  const [fetchResult, setFetchResult] = useState<{ success?: boolean; count?: number; error?: string }>({})

  // Test 4: Update
  const [updateResult, setUpdateResult] = useState<{ success?: boolean; rows?: number; error?: string }>({})

  // Test 5: Delete
  const [deleteResult, setDeleteResult] = useState<{ success?: boolean; error?: string }>({})

  // Debug
  const [debug, setDebug] = useState<DebugInfo>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set",
    currentUser: "Loading...",
    authStatus: "Unknown",
    connectionStatus: "Not tested",
    dbResponse: "None",
    lastError: "None",
  })
  const [logs, setLogs] = useState<string[]>([])

  const addLog = useCallback((message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString()
    const entry = data ? `${timestamp} - ${message}: ${JSON.stringify(data, null, 2)}` : `${timestamp} - ${message}`
    setLogs((prev) => [entry, ...prev])
    if (data) {
      console.log(`[Supabase Test] ${message}:`, data)
    } else {
      console.log(`[Supabase Test] ${message}`)
    }
  }, [])

  useEffect(() => {
    setDebug((d) => ({
      ...d,
      currentUser: user ? `${user.email} (${user.role})` : "Not logged in",
      authStatus: user ? "Authenticated" : "Not authenticated",
    }))
    addLog(`User: ${user?.email || "none"}`, user)
  }, [user, addLog])

  // ── Test 1: Connection ──────────────────────────────────────

  const testConnection = useCallback(async () => {
    setConnectionStatus("testing")
    setConnectionError("")
    addLog("Testing Supabase connection...")

    if (!isSupabaseConfigured()) {
      const msg = "Supabase env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are not set"
      setConnectionStatus("error")
      setConnectionError(msg)
      setDebug((d) => ({ ...d, connectionStatus: "Failed", lastError: msg, dbResponse: "N/A" }))
      addLog(msg)
      return
    }

    try {
      const start = Date.now()
      const { data, error } = await supabase.from("students").select("id").limit(1)
      const elapsed = Date.now() - start

      if (error) {
        setConnectionStatus("error")
        setConnectionError(`[${elapsed}ms] ${error.message} (Code: ${error.code || "N/A"})`)
        setDebug((d) => ({ ...d, connectionStatus: "Failed", lastError: error.message, dbResponse: JSON.stringify(error) }))
        addLog("Connection failed", error)
      } else {
        setConnectionStatus("success")
        setDebug((d) => ({ ...d, connectionStatus: `Connected (${elapsed}ms)`, lastError: "None", dbResponse: "OK" }))
        addLog(`Connection OK (${elapsed}ms)`, data)
      }
    } catch (err: any) {
      setConnectionStatus("error")
      const msg = err.message || "Unknown error"
      setConnectionError(msg)
      setDebug((d) => ({ ...d, connectionStatus: "Failed", lastError: msg, dbResponse: "Exception thrown" }))
      addLog("Connection threw exception", err)
    }
  }, [addLog])

  useEffect(() => {
    testConnection()
  }, [testConnection])

  // ── Test 2: Insert ──────────────────────────────────────────

  const insertStudent = async () => {
    setInsertResult({})
    addLog(`Inserting student: ${studentName}, ${studentClass}`)

    try {
      const { data, error } = await supabase
        .from("students")
        .insert([{
          name: studentName,
          age: 4,
          date_of_birth: "2022-01-01",
          program: studentClass,
          section: "A",
          parent_name: "Test Parent",
          parent_email: "test@example.com",
          parent_phone: "+91 99999 99999",
          admission_date: new Date().toISOString().slice(0, 10),
          teacher: "Test Teacher",
        }])
        .select()

      if (error) {
        setInsertResult({ success: false, error: error.message })
        setDebug((d) => ({ ...d, lastError: error.message, dbResponse: JSON.stringify(error) }))
        addLog("Insert failed", error)
      } else {
        setInsertResult({ success: true, id: data?.[0]?.id })
        setDebug((d) => ({ ...d, lastError: "None", dbResponse: "Insert OK" }))
        addLog("Insert succeeded", data)
        await fetchStudents()
      }
    } catch (err: any) {
      setInsertResult({ success: false, error: err.message })
      addLog("Insert threw exception", err)
    }
  }

  // ── Test 3: Fetch ───────────────────────────────────────────

  const fetchStudents = async () => {
    setFetchResult({})
    addLog("Fetching all students...")

    try {
      const { data, error } = await supabase.from("students").select("*")

      if (error) {
        setFetchResult({ success: false, error: error.message })
        setDebug((d) => ({ ...d, lastError: error.message, dbResponse: JSON.stringify(error) }))
        addLog("Fetch failed", error)
      } else {
        setStudents(data || [])
        setFetchResult({ success: true, count: data?.length || 0 })
        setDebug((d) => ({ ...d, lastError: "None", dbResponse: `${data?.length || 0} rows` }))
        addLog(`Fetched ${data?.length || 0} students`, data)
      }
    } catch (err: any) {
      setFetchResult({ success: false, error: err.message })
      addLog("Fetch threw exception", err)
    }
  }

  // ── Test 4: Update ──────────────────────────────────────────

  const updateStudent = async () => {
    setUpdateResult({})
    addLog("Updating first student...")

    try {
      const { data: first, error: fetchErr } = await supabase.from("students").select("id").limit(1)
      if (fetchErr) {
        setUpdateResult({ success: false, error: `Cannot find student to update: ${fetchErr.message}` })
        addLog("Update fetch failed", fetchErr)
        return
      }
      if (!first || first.length === 0) {
        setUpdateResult({ success: false, error: "No students found to update. Insert a student first." })
        addLog("No student to update")
        return
      }

      const { data, error } = await supabase
        .from("students")
        .update({ name: `${studentName} (Updated)` })
        .eq("id", first[0].id)
        .select()

      if (error) {
        setUpdateResult({ success: false, error: error.message })
        setDebug((d) => ({ ...d, lastError: error.message, dbResponse: JSON.stringify(error) }))
        addLog("Update failed", error)
      } else {
        setUpdateResult({ success: true, rows: data?.length || 0 })
        setDebug((d) => ({ ...d, lastError: "None", dbResponse: `${data?.length || 0} rows affected` }))
        addLog("Update succeeded", data)
        await fetchStudents()
      }
    } catch (err: any) {
      setUpdateResult({ success: false, error: err.message })
      addLog("Update threw exception", err)
    }
  }

  // ── Test 5: Delete ──────────────────────────────────────────

  const deleteStudent = async () => {
    setDeleteResult({})
    addLog("Deleting test student...")

    try {
      const { data: first, error: fetchErr } = await supabase
        .from("students")
        .select("id")
        .like("name", `%${studentName}%`)
        .limit(1)

      if (fetchErr) {
        setDeleteResult({ success: false, error: `Cannot find student to delete: ${fetchErr.message}` })
        addLog("Delete fetch failed", fetchErr)
        return
      }
      if (!first || first.length === 0) {
        setDeleteResult({ success: false, error: `No student named "${studentName}" found. Insert one first.` })
        addLog("No student to delete")
        return
      }

      const { error } = await supabase.from("students").delete().eq("id", first[0].id)

      if (error) {
        setDeleteResult({ success: false, error: error.message })
        setDebug((d) => ({ ...d, lastError: error.message, dbResponse: JSON.stringify(error) }))
        addLog("Delete failed", error)
      } else {
        setDeleteResult({ success: true })
        setDebug((d) => ({ ...d, lastError: "None", dbResponse: "Delete OK" }))
        addLog("Delete succeeded", { id: first[0].id })
        await fetchStudents()
      }
    } catch (err: any) {
      setDeleteResult({ success: false, error: err.message })
      addLog("Delete threw exception", err)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-olive">Supabase Test Dashboard</h1>
        <p className="text-sm text-olive/50 font-body">Verify Supabase connection and CRUD operations</p>
      </div>

      {/* Test 1: Connection Status */}
      <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
        <h2 className="text-base font-display font-semibold text-olive mb-4">Test 1: Connection Status</h2>
        {connectionStatus === "testing" && <p className="text-olive/60 text-sm">Testing connection...</p>}
        {connectionStatus === "success" && (
          <p className="text-green-600 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Supabase Connected ✅
          </p>
        )}
        {connectionStatus === "error" && (
          <div>
            <p className="text-red-600 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Supabase Failed ❌
            </p>
            <pre className="mt-2 text-xs text-red-700 bg-red-50 rounded-xl p-3 overflow-auto max-h-32">{connectionError}</pre>
          </div>
        )}
        {connectionStatus === "idle" && (
          <button onClick={testConnection} className="px-4 py-2 rounded-xl bg-pistachio/10 text-olive text-sm font-medium hover:bg-pistachio/20 transition-colors">
            Test Connection
          </button>
        )}
      </div>

      {/* Test 2: Insert */}
      <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
        <h2 className="text-base font-display font-semibold text-olive mb-4">Test 2: Insert Record</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Student Name"
            className="px-4 py-2 rounded-xl bg-cream border border-white/60 text-olive text-sm outline-none focus:bg-white focus:border-pistachio transition-all font-body"
          />
          <select
            value={studentClass}
            onChange={(e) => setStudentClass(e.target.value)}
            className="px-4 py-2 rounded-xl bg-cream border border-white/60 text-olive text-sm outline-none focus:bg-white focus:border-pistachio transition-all font-body"
          >
            <option value="Play Group">Play Group</option>
            <option value="Nursery">Nursery</option>
            <option value="Kindergarten">Kindergarten</option>
          </select>
          <button
            onClick={insertStudent}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all"
          >
            Insert Test Student
          </button>
        </div>
        {insertResult.success && (
          <p className="text-sm text-green-600">Inserted! Record ID: <code className="bg-green-50 px-1.5 py-0.5 rounded">{insertResult.id}</code></p>
        )}
        {insertResult.error && <p className="text-sm text-red-600">Error: {insertResult.error}</p>}
      </div>

      {/* Test 3: Fetch */}
      <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
        <h2 className="text-base font-display font-semibold text-olive mb-4">Test 3: Fetch Records</h2>
        <button
          onClick={fetchStudents}
          className="mb-4 px-5 py-2 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all"
        >
          Fetch Students
        </button>
        {fetchResult.success && (
          <p className="text-sm text-green-600 mb-3">Fetched {fetchResult.count} record(s) ✅</p>
        )}
        {fetchResult.error && <p className="text-sm text-red-600 mb-3">Error: {fetchResult.error}</p>}
        {students.length > 0 && (
          <div className="overflow-auto max-h-96 rounded-xl border border-beige/20">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream text-olive/70 text-xs uppercase tracking-wider">
                <tr>
                  {Object.keys(students[0]).map((key) => (
                    <th key={key} className="px-3 py-2 font-medium">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/10">
                {students.map((s, i) => (
                  <tr key={s.id || i} className="hover:bg-cream/50">
                    {Object.values(s).map((val: any, j) => (
                      <td key={j} className="px-3 py-2 text-olive/70 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis">
                        {typeof val === "object" ? JSON.stringify(val) : String(val ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Test 4: Update */}
      <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
        <h2 className="text-base font-display font-semibold text-olive mb-4">Test 4: Update Record</h2>
        <p className="text-xs text-olive/40 mb-3">Updates the first student&apos;s name to &ldquo;{studentName} (Updated)&rdquo;</p>
        <button
          onClick={updateStudent}
          className="mb-3 px-5 py-2 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all"
        >
          Update Test Student
        </button>
        {updateResult.success && <p className="text-sm text-green-600">{updateResult.rows} row(s) updated ✅</p>}
        {updateResult.error && <p className="text-sm text-red-600">Error: {updateResult.error}</p>}
      </div>

      {/* Test 5: Delete */}
      <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
        <h2 className="text-base font-display font-semibold text-olive mb-4">Test 5: Delete Record</h2>
        <p className="text-xs text-olive/40 mb-3">Deletes a student whose name contains &ldquo;{studentName}&rdquo;</p>
        <button
          onClick={deleteStudent}
          className="mb-3 px-5 py-2 rounded-xl bg-gradient-to-r from-red-400 to-red-500 text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all"
        >
          Delete Test Student
        </button>
        {deleteResult.success && <p className="text-sm text-green-600">Deleted successfully ✅</p>}
        {deleteResult.error && <p className="text-sm text-red-600">Error: {deleteResult.error}</p>}
      </div>

      {/* Debug Panel */}
      <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
        <h2 className="text-base font-display font-semibold text-olive mb-4">Debugging</h2>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm font-body mb-4">
          {[
            ["Supabase URL", debug.supabaseUrl],
            ["Current User", debug.currentUser],
            ["Auth Status", debug.authStatus],
            ["User ID", sessionDebug.userId || "N/A"],
            ["Email", sessionDebug.email || "N/A"],
            ["Role", sessionDebug.role || "N/A"],
            ["Session Provider", sessionDebug.provider],
            ["Connection Status", debug.connectionStatus],
            ["Database Response", debug.dbResponse],
            ["Last Error", debug.lastError],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-2 py-1 border-b border-beige/10">
              <span className="text-olive/50 shrink-0">{label}:</span>
              <span className="text-olive text-right break-all max-w-[300px]">{value}</span>
            </div>
          ))}
        </div>

        {/* Console Log */}
        <h3 className="text-sm font-display font-semibold text-olive mb-2">Console Log</h3>
        <div className="bg-olive text-cream text-xs rounded-xl p-4 max-h-64 overflow-auto font-mono">
          {logs.length === 0 ? (
            <span className="text-olive/40">No logs yet</span>
          ) : (
            logs.map((log, i) => <div key={i} className="py-0.5 break-all">{log}</div>)
          )}
        </div>
      </div>
    </div>
  )
}

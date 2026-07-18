"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Search, Shield, User, Activity, Edit, MoreVertical, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { UserProfile } from "@/lib/types"
import DataTable from "@/components/dashboard/DataTable"
import { getAllProfiles, toggleAccountStatus } from "@/app/actions/profile-actions"

export default function UsersManagementPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const res = await getAllProfiles()
      if ('error' in res) {
        setError(res.error)
      } else {
        setProfiles(res as UserProfile[])
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this account?`)) return
    const res = await toggleAccountStatus(id, !currentStatus)
    if ('error' in res) {
      alert("Failed: " + res.error)
    } else {
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p))
    }
  }

  const filteredProfiles = profiles.filter(p => {
    const q = searchQuery.toLowerCase()
    return (
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.role?.toLowerCase().includes(q)
    )
  })

  // Quick stats
  const totalUsers = profiles.length
  const activeUsers = profiles.filter(p => p.is_active !== false).length
  const parents = profiles.filter(p => p.role === 'parent').length
  const teachers = profiles.filter(p => p.role === 'teacher').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-olive">User Management</h1>
          <p className="text-sm text-olive/60 font-body mt-1">Manage all system profiles and access levels.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex justify-between items-center font-body">
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-beige/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-pistachio/10 flex items-center justify-center text-pistachio"><User className="w-5 h-5"/></div>
          <div><p className="text-xs font-bold text-olive/50 uppercase">Total Users</p><p className="text-lg font-bold text-olive">{totalUsers}</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-beige/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center text-sage"><Activity className="w-5 h-5"/></div>
          <div><p className="text-xs font-bold text-olive/50 uppercase">Active</p><p className="text-lg font-bold text-olive">{activeUsers}</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-beige/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><User className="w-5 h-5"/></div>
          <div><p className="text-xs font-bold text-olive/50 uppercase">Parents</p><p className="text-lg font-bold text-olive">{parents}</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-beige/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><Shield className="w-5 h-5"/></div>
          <div><p className="text-xs font-bold text-olive/50 uppercase">Teachers</p><p className="text-lg font-bold text-olive">{teachers}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-beige/20 shadow-soft">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-olive/40" />
            <input 
              type="text" 
              placeholder="Search by name, email, phone, or role..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-soft-white border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" /></div>
        ) : (
          <DataTable
            columns={[
              { 
                key: "name", 
                label: "User", 
                render: (r: any) => (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pistachio/15 flex items-center justify-center text-xs font-bold text-olive overflow-hidden">
                      {r.photo_url ? <img src={r.photo_url} className="w-full h-full object-cover"/> : r.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-medium text-olive">{r.name || 'Unnamed'}</p>
                      <p className="text-xs text-olive/50">{r.email}</p>
                    </div>
                  </div>
                )
              },
              { 
                key: "role", 
                label: "Role",
                render: (r: any) => <span className="capitalize px-2 py-1 rounded-md text-xs font-medium bg-cream/50 text-olive">{r.role}</span>
              },
              { key: "phone", label: "Phone", render: (r: any) => r.phone || '—' },
              { 
                key: "is_active", 
                label: "Status", 
                render: (r: any) => (
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${r.is_active !== false ? 'text-pistachio bg-pistachio/10' : 'text-red-500 bg-red-50'}`}>
                    {r.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                ) 
              },
              { 
                key: "actions", 
                label: "Actions", 
                render: (r: any) => (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleToggleStatus(r.id, r.is_active !== false)} 
                      className={`text-xs hover:underline ${r.is_active !== false ? 'text-red-500' : 'text-pistachio'}`}
                    >
                      {r.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <Link href={`/dashboard/admin/users/${r.id}`} className="p-1.5 rounded-lg hover:bg-cream text-olive transition-colors" title="Edit User">
                      <Edit className="w-4 h-4" />
                    </Link>
                  </div>
                ) 
              }
            ]}
            data={filteredProfiles as any}
            emptyTitle="No users found"
          />
        )}
      </div>
    </div>
  )
}

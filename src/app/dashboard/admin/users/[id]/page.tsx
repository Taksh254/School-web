"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { getProfile, updateProfile, getUserActivity, toggleAccountStatus } from "@/app/actions/profile-actions"
import { supabase } from "@/lib/supabase"
import { UserProfile, UserActivity } from "@/lib/types"
import { User, Shield, Activity, Upload, ArrowLeft } from "lucide-react"
import Link from "next/link"

type TabType = "Personal" | "Security" | "Activity"

export default function AdminUserProfileEditor() {
  const { id } = useParams()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<TabType>("Personal")
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activities, setActivities] = useState<UserActivity[]>([])
  
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Forms
  const [personalForm, setPersonalForm] = useState<Partial<UserProfile>>({})

  useEffect(() => {
    async function loadData() {
      if (!id || typeof id !== "string") return
      setLoading(true)
      const [profRes, actRes] = await Promise.all([
        getProfile(id),
        getUserActivity(id)
      ])
      
      if (!('error' in profRes)) {
        setProfile(profRes as UserProfile)
        setPersonalForm(profRes as UserProfile)
      } else {
        router.push("/dashboard/admin/users")
      }
      
      if (!('error' in actRes)) {
        setActivities(actRes as UserActivity[])
      }
      setLoading(false)
    }
    loadData()
  }, [id, router])

  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSubmitting(true)
    setMessage(null)
    const { id, created_at, last_login_at, email, ...updateData } = personalForm as any
    const res = await updateProfile(profile.id, updateData)
    if ('error' in res) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: "Profile updated successfully!" })
      setProfile(res as UserProfile)
    }
    setSubmitting(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setSubmitting(true)
    setMessage(null)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}_${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
      if (uploadError) throw new Error("Upload failed: " + uploadError.message)
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const res = await updateProfile(profile.id, { photo_url: data.publicUrl })
      if ('error' in res) throw new Error(res.error)
      setProfile(res as UserProfile)
      setMessage({ type: 'success', text: "Photo updated!" })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!profile) return
    if (!confirm(`Are you sure you want to ${profile.is_active !== false ? 'deactivate' : 'activate'} this account?`)) return
    const res = await toggleAccountStatus(profile.id, profile.is_active === false)
    if ('error' in res) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setProfile({ ...profile, is_active: profile.is_active === false })
      setMessage({ type: 'success', text: `Account ${profile.is_active === false ? 'activated' : 'deactivated'}!` })
    }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" /></div>
  if (!profile) return null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/users" className="p-2 rounded-xl bg-cream hover:bg-beige/40 text-olive transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-display font-bold text-olive">Edit User Profile</h1>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 border border-beige/20 shadow-soft flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-pistachio/10 to-transparent rounded-bl-full pointer-events-none" />
        
        <div className="relative group shrink-0">
          <div className="w-32 h-32 rounded-3xl bg-pistachio/10 flex items-center justify-center text-4xl font-display font-bold text-olive shadow-inner border border-white/50 overflow-hidden relative">
            {profile.photo_url ? (
              <Image src={profile.photo_url} alt={profile.name || "User profile photo"} width={128} height={128} className="w-full h-full object-cover" />
            ) : (
              profile.name?.charAt(0) || "U"
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <label className="cursor-pointer text-white flex flex-col items-center">
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">Change</span>
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={submitting} />
              </label>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 z-10 w-full">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-olive mb-1">{profile.name}</h1>
              <p className="text-olive/60 font-body capitalize">{profile.role} Account</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${profile.is_active !== false ? 'bg-pistachio/20 text-pistachio' : 'bg-red-100 text-red-600'}`}>
                {profile.is_active !== false ? 'Active' : 'Deactivated'}
              </span>
              <button onClick={handleToggleStatus} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${profile.is_active !== false ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-pistachio text-pistachio hover:bg-pistachio/10'}`}>
                {profile.is_active !== false ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-beige/20">
            <div>
              <p className="text-xs text-olive/50 font-bold uppercase tracking-wider mb-1">Email</p>
              <p className="text-sm font-medium text-olive truncate">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs text-olive/50 font-bold uppercase tracking-wider mb-1">Phone</p>
              <p className="text-sm font-medium text-olive">{profile.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-olive/50 font-bold uppercase tracking-wider mb-1">Member Since</p>
              <p className="text-sm font-medium text-olive">{new Date(profile.created_at || "").toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex justify-between items-center ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-pistachio/10 text-pistachio border-pistachio/20'} border`}>
          <span className="text-sm font-medium font-body">{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold ml-2 opacity-50 hover:opacity-100">×</button>
        </div>
      )}

      <div className="flex border-b border-beige/20 overflow-x-auto hide-scrollbar">
        {[
          { id: "Personal", label: "Profile Information", icon: User },
          { id: "Security", label: "Security & Access", icon: Shield },
          { id: "Activity", label: "User Activity", icon: Activity },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 font-body whitespace-nowrap ${
              activeTab === tab.id ? "border-pistachio text-olive" : "border-transparent text-olive/50 hover:text-olive hover:bg-cream/30"
            }`}>
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-pistachio" : ""}`} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-soft-white rounded-3xl p-6 md:p-8 border border-beige/20 shadow-soft min-h-[400px]">
        {activeTab === "Personal" && (
          <form onSubmit={handlePersonalSubmit} className="space-y-6">
            <h3 className="text-lg font-display font-bold text-olive mb-4">Edit Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div><label className="block text-xs font-medium text-olive mb-1">Full Name</label><input type="text" value={personalForm.name || ""} onChange={e=>setPersonalForm({...personalForm, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none" required /></div>
              <div><label className="block text-xs font-medium text-olive mb-1">Role</label><select value={personalForm.role || "parent"} onChange={e=>setPersonalForm({...personalForm, role: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none"><option value="admin">Admin</option><option value="parent">Parent</option><option value="teacher">Teacher</option><option value="student">Student</option><option value="staff">Staff</option></select></div>
              <div><label className="block text-xs font-medium text-olive mb-1">Phone Number</label><input type="text" value={personalForm.phone || ""} onChange={e=>setPersonalForm({...personalForm, phone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none" /></div>
              <div><label className="block text-xs font-medium text-olive mb-1">Alternate Phone</label><input type="text" value={personalForm.alt_phone || ""} onChange={e=>setPersonalForm({...personalForm, alt_phone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none" /></div>
              <div><label className="block text-xs font-medium text-olive mb-1">Date of Birth</label><input type="date" value={personalForm.date_of_birth || ""} onChange={e=>setPersonalForm({...personalForm, date_of_birth: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none" /></div>
              <div><label className="block text-xs font-medium text-olive mb-1">Gender</label><select value={personalForm.gender || ""} onChange={e=>setPersonalForm({...personalForm, gender: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none"><option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
            </div>
            
            <h4 className="text-sm font-bold text-olive mt-8 mb-4 border-b border-beige/20 pb-2">Address Details</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2"><label className="block text-xs font-medium text-olive mb-1">Address</label><input type="text" value={personalForm.address || ""} onChange={e=>setPersonalForm({...personalForm, address: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none" /></div>
              <div><label className="block text-xs font-medium text-olive mb-1">City</label><input type="text" value={personalForm.city || ""} onChange={e=>setPersonalForm({...personalForm, city: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none" /></div>
              <div><label className="block text-xs font-medium text-olive mb-1">State</label><input type="text" value={personalForm.state || ""} onChange={e=>setPersonalForm({...personalForm, state: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none" /></div>
              <div><label className="block text-xs font-medium text-olive mb-1">Country</label><input type="text" value={personalForm.country || ""} onChange={e=>setPersonalForm({...personalForm, country: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none" /></div>
              <div><label className="block text-xs font-medium text-olive mb-1">PIN Code</label><input type="text" value={personalForm.pin_code || ""} onChange={e=>setPersonalForm({...personalForm, pin_code: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none" /></div>
              <div className="md:col-span-2"><label className="block text-xs font-medium text-olive mb-1">Emergency Contact</label><input type="text" value={personalForm.emergency_contact || ""} onChange={e=>setPersonalForm({...personalForm, emergency_contact: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none" /></div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all disabled:opacity-50">
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "Security" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-display font-bold text-olive mb-4">Admin Password Reset</h3>
              <div className="bg-white p-6 rounded-2xl border border-beige/20 max-w-md">
                <p className="text-sm text-olive/60 mb-4">Send a password reset email to this user, or administratively set a temporary password.</p>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Admin reset link sent to user (mock).") }}>
                  <button type="submit" className="w-full py-2.5 rounded-xl border border-olive text-olive text-sm font-medium hover:bg-olive hover:text-white transition-all">Send Password Reset Link</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Activity" && (
          <div className="space-y-6">
            <h3 className="text-lg font-display font-bold text-olive mb-4">User Activity Log</h3>
            <div className="bg-white rounded-2xl border border-beige/20 overflow-hidden">
              <table className="w-full text-left text-sm font-body">
                <thead className="bg-cream/50 text-olive/60 border-b border-beige/20">
                  <tr><th className="px-6 py-3 font-medium">Action</th><th className="px-6 py-3 font-medium">Device</th><th className="px-6 py-3 font-medium">Time</th></tr>
                </thead>
                <tbody className="divide-y divide-beige/20">
                  {activities.map(a => (
                    <tr key={a.id} className="hover:bg-cream/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-olive">{a.action}</td>
                      <td className="px-6 py-4 text-olive/60">{a.device || 'System'}</td>
                      <td className="px-6 py-4 text-olive/60">{new Date(a.created_at || "").toLocaleString()}</td>
                    </tr>
                  ))}
                  {activities.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-olive/50">No activity recorded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getProfile, updateProfile, getUserActivity } from "@/app/actions/profile-actions"
import { supabase } from "@/lib/supabase"
import { UserProfile, UserActivity } from "@/lib/types"
import { User, Shield, Bell, Settings, Activity, Upload, Pencil, LogIn, MonitorSmartphone } from "lucide-react"

type TabType = "Overview" | "Personal" | "Security" | "Notifications" | "Preferences" | "Activity"

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: "Overview", label: "Overview", icon: Activity },
  { id: "Personal", label: "Personal Information", icon: User },
  { id: "Security", label: "Security", icon: Shield },
  { id: "Notifications", label: "Notifications", icon: Bell },
  { id: "Preferences", label: "Preferences", icon: Settings },
  { id: "Activity", label: "Activity", icon: MonitorSmartphone },
]

function ProfileContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get("tab") as TabType) || "Overview"
  
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activities, setActivities] = useState<UserActivity[]>([])
  
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Forms
  const [personalForm, setPersonalForm] = useState<Partial<UserProfile>>({})
  const [prefsForm, setPrefsForm] = useState<{theme: string, language: string, timezone: string, date_format: string}>({
    theme: "system", language: "en", timezone: "UTC", date_format: "DD/MM/YYYY"
  })

  useEffect(() => {
    async function loadData() {
      if (!user) return
      setLoading(true)
      const [profRes, actRes] = await Promise.all([
        getProfile(user.id),
        getUserActivity(user.id)
      ])
      
      if (!('error' in profRes)) {
        setProfile(profRes as UserProfile)
        setPersonalForm(profRes as UserProfile)
        setPrefsForm({
          theme: profRes.theme || "system",
          language: profRes.language || "en",
          timezone: profRes.timezone || "UTC",
          date_format: profRes.date_format || "DD/MM/YYYY"
        })
      }
      if (!('error' in actRes)) {
        setActivities(actRes as UserActivity[])
      }
      setLoading(false)
    }
    loadData()
  }, [user])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    window.history.replaceState(null, '', `?tab=${tab}`)
  }

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

  const handlePrefsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSubmitting(true)
    setMessage(null)
    const res = await updateProfile(profile.id, prefsForm)
    if ('error' in res) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: "Preferences updated!" })
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

  if (loading) return <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" /></div>
  if (!profile) return <div className="p-12 text-center text-olive/50">Profile not found.</div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-beige/20 shadow-soft flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-pistachio/10 to-transparent rounded-bl-full pointer-events-none" />
        
        <div className="relative group shrink-0">
          <div className="w-32 h-32 rounded-3xl bg-pistachio/10 flex items-center justify-center text-4xl font-display font-bold text-olive shadow-inner border border-white/50 overflow-hidden relative">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              profile.name?.charAt(0) || "U"
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <label className="cursor-pointer text-white flex flex-col items-center">
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">Upload</span>
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={submitting} />
              </label>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 z-10 w-full">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-olive mb-1">{profile.name}</h1>
              <p className="text-olive/60 font-body flex items-center gap-2 capitalize">
                {profile.role} Account
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${profile.is_active !== false ? 'bg-pistachio/20 text-pistachio' : 'bg-red-100 text-red-600'}`}>
                {profile.is_active !== false ? 'Active' : 'Deactivated'}
              </span>
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

      {/* Tabs */}
      <div className="flex border-b border-beige/20 overflow-x-auto hide-scrollbar">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 font-body whitespace-nowrap ${
              activeTab === tab.id ? "border-pistachio text-olive" : "border-transparent text-olive/50 hover:text-olive hover:bg-cream/30"
            }`}>
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-pistachio" : ""}`} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-soft-white rounded-3xl p-6 md:p-8 border border-beige/20 shadow-soft min-h-[400px]">
        {/* OVERVIEW */}
        {activeTab === "Overview" && (
          <div className="space-y-6">
            <h3 className="text-lg font-display font-bold text-olive mb-4">Account Overview</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-beige/20">
                <h4 className="text-sm font-bold text-olive mb-4 flex items-center gap-2"><User className="w-4 h-4 text-pistachio"/> Snapshot</h4>
                <ul className="space-y-3 text-sm text-olive/70 font-medium">
                  <li className="flex justify-between"><span>Role:</span> <span className="capitalize">{profile.role}</span></li>
                  <li className="flex justify-between"><span>Last Login:</span> <span>{profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : 'Just now'}</span></li>
                  <li className="flex justify-between"><span>Profile Completion:</span> <span>{profile.phone && profile.address ? '100%' : '60%'}</span></li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-beige/20">
                <h4 className="text-sm font-bold text-olive mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-pistachio"/> Recent Activity</h4>
                <ul className="space-y-3 text-sm text-olive/70">
                  {activities.slice(0,3).map(a => (
                    <li key={a.id} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-pistachio" /> {a.action}
                    </li>
                  ))}
                  {activities.length === 0 && <li>No recent activity.</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* PERSONAL */}
        {activeTab === "Personal" && (
          <form onSubmit={handlePersonalSubmit} className="space-y-6">
            <h3 className="text-lg font-display font-bold text-olive mb-4">Personal Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div><label className="block text-xs font-medium text-olive mb-1">Full Name</label><input type="text" value={personalForm.name || ""} onChange={e=>setPersonalForm({...personalForm, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none" required /></div>
              <div><label className="block text-xs font-medium text-olive mb-1">Email Address</label><input type="email" value={profile.email} disabled className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none opacity-60 cursor-not-allowed" /></div>
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

        {/* SECURITY */}
        {activeTab === "Security" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-display font-bold text-olive mb-4">Change Password</h3>
              <div className="bg-white p-6 rounded-2xl border border-beige/20 max-w-md">
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Password reset link sent to email (mock).") }}>
                  <div><label className="block text-xs font-medium text-olive mb-1">Current Password</label><input type="password" required className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
                  <div><label className="block text-xs font-medium text-olive mb-1">New Password</label><input type="password" required className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
                  <div><label className="block text-xs font-medium text-olive mb-1">Confirm New Password</label><input type="password" required className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-olive text-white text-sm font-medium hover:bg-olive/90 transition-all">Update Password</button>
                </form>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-display font-bold text-olive mb-4">Recent Logins</h3>
              <div className="bg-white rounded-2xl border border-beige/20 overflow-hidden">
                <table className="w-full text-left text-sm font-body">
                  <thead className="bg-cream/50 text-olive/60">
                    <tr><th className="px-6 py-3 font-medium">Device</th><th className="px-6 py-3 font-medium">IP Address</th><th className="px-6 py-3 font-medium">Time</th></tr>
                  </thead>
                  <tbody className="divide-y divide-beige/20">
                    {activities.filter(a => a.action.toLowerCase().includes('login')).slice(0,3).map(a => (
                      <tr key={a.id}>
                        <td className="px-6 py-4 flex items-center gap-2"><MonitorSmartphone className="w-4 h-4 text-olive/40"/> {a.device || 'Unknown'}</td>
                        <td className="px-6 py-4">{a.ip_address || '—'}</td>
                        <td className="px-6 py-4 text-olive/60">{new Date(a.created_at || "").toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === "Notifications" && (
          <div className="space-y-6 max-w-xl">
            <h3 className="text-lg font-display font-bold text-olive mb-4">Notification Settings</h3>
            {[
              { id: 'email', title: 'Email Notifications', desc: 'Receive system updates and reports via email' },
              { id: 'announcements', title: 'Announcements', desc: 'Alerts for new school announcements' },
              { id: 'fee', title: 'Fee Alerts', desc: 'Reminders for upcoming or overdue fees' },
              { id: 'attendance', title: 'Attendance Alerts', desc: 'Daily attendance summaries' },
            ].map((n) => (
              <div key={n.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-beige/20">
                <div>
                  <h4 className="text-sm font-bold text-olive">{n.title}</h4>
                  <p className="text-xs text-olive/60">{n.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-beige/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pistachio"></div>
                </label>
              </div>
            ))}
            <div className="pt-4">
              <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft">Save Preferences</button>
            </div>
          </div>
        )}

        {/* PREFERENCES */}
        {activeTab === "Preferences" && (
          <form onSubmit={handlePrefsSubmit} className="space-y-6 max-w-xl">
            <h3 className="text-lg font-display font-bold text-olive mb-4">Display & Regional Preferences</h3>
            <div className="space-y-4">
              <div><label className="block text-xs font-medium text-olive mb-1">Theme</label><select value={prefsForm.theme} onChange={e=>setPrefsForm({...prefsForm, theme: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none"><option value="system">System Default</option><option value="light">Light Mode</option><option value="dark">Dark Mode</option></select></div>
              <div><label className="block text-xs font-medium text-olive mb-1">Language</label><select value={prefsForm.language} onChange={e=>setPrefsForm({...prefsForm, language: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none"><option value="en">English (US)</option><option value="en-gb">English (UK)</option><option value="hi">Hindi</option></select></div>
              <div><label className="block text-xs font-medium text-olive mb-1">Timezone</label><select value={prefsForm.timezone} onChange={e=>setPrefsForm({...prefsForm, timezone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none"><option value="UTC">UTC</option><option value="Asia/Kolkata">Asia/Kolkata (IST)</option></select></div>
              <div><label className="block text-xs font-medium text-olive mb-1">Date Format</label><select value={prefsForm.date_format} onChange={e=>setPrefsForm({...prefsForm, date_format: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-white border border-beige/20 text-sm outline-none"><option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="YYYY-MM-DD">YYYY-MM-DD</option></select></div>
            </div>
            <div className="pt-4">
              <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft">
                {submitting ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </form>
        )}

        {/* ACTIVITY */}
        {activeTab === "Activity" && (
          <div className="space-y-6">
            <h3 className="text-lg font-display font-bold text-olive mb-4">Activity Log</h3>
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

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" /></div>}>
      <ProfileContent />
    </Suspense>
  )
}

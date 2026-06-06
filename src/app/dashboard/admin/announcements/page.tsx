"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/lib/data-store"
import type { Announcement, AnnouncementPriority } from "@/lib/types"
import Modal from "@/components/dashboard/Modal"
import { exportToCSV, exportToExcel } from "@/lib/importer-exporter"
import { Bell, Plus, Pencil, Trash2, Eye, EyeOff, Download, FileSpreadsheet } from "lucide-react"

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState({ title: "", content: "", priority: "normal" as AnnouncementPriority, published: true, author: "Principal Sunita" })
  const [loading, setLoading] = useState(true)

  const handleExportCSV = () => {
    const exportData = announcements.map((a) => ({
      "Title": a.title,
      "Content": a.content,
      "Date": a.date,
      "Priority": a.priority,
      "Published": a.published ? "Yes" : "No",
      "Author": a.author,
    }))
    exportToCSV(exportData, "announcements_export")
  }

  const handleExportExcel = () => {
    const exportData = announcements.map((a) => ({
      "Title": a.title,
      "Content": a.content,
      "Date": a.date,
      "Priority": a.priority,
      "Published": a.published ? "Yes" : "No",
      "Author": a.author,
    }))
    exportToExcel(exportData, "announcements_export")
  }


  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAnnouncements()
      setAnnouncements(data)
    } catch (err) {
      console.error("Refresh announcements error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const openAdd = () => {
    setEditing(null)
    setForm({ title: "", content: "", priority: "normal", published: true, author: "Principal Sunita" })
    setModalOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditing(a)
    setForm({ title: a.title, content: a.content, priority: a.priority, published: a.published, author: a.author })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await updateAnnouncement(editing.id, form)
    } else {
      await addAnnouncement({ ...form, date: new Date().toISOString().slice(0, 10) })
    }
    setModalOpen(false)
    refresh()
  }

  const togglePublish = async (a: Announcement) => {
    await updateAnnouncement(a.id, { published: !a.published })
    refresh()
  }

  const handleDelete = async (id: string) => {
    await deleteAnnouncement(id)
    refresh()
  }

  if (loading && announcements.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  const priorityColors: Record<string, string> = {
    urgent: "bg-red-50 text-red-500",
    important: "bg-pistachio/10 text-olive",
    normal: "bg-cream text-olive/50",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-olive">Announcements</h1>
          <p className="text-sm text-olive/50 font-body">Create and manage school announcements</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cream hover:bg-beige/40 text-olive text-xs font-medium border border-beige/20 transition-all shadow-soft font-body"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cream hover:bg-beige/40 text-olive text-xs font-medium border border-beige/20 transition-all shadow-soft font-body"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>
          <button onClick={openAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300 font-body">
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`bg-soft-white rounded-2xl p-5 border border-beige/20 shadow-soft ${!a.published ? "opacity-60" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h3 className="text-base font-display font-semibold text-olive">{a.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize font-body ${priorityColors[a.priority]}`}>
                    {a.priority}
                  </span>
                  {!a.published && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-beige/30 text-olive/40 font-body">Draft</span>
                  )}
                </div>
                <p className="text-sm text-olive/60 leading-relaxed mb-2 font-body line-clamp-2">{a.content}</p>
                <div className="flex items-center gap-3 text-xs text-olive/40 font-body">
                  <span>{new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                  <span>·</span>
                  <span>{a.author}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => togglePublish(a)}
                  className="p-1.5 rounded-lg hover:bg-cream text-olive/40 hover:text-olive transition-colors" aria-label={a.published ? "Unpublish" : "Publish"}>
                  {a.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => openEdit(a)}
                  className="p-1.5 rounded-lg hover:bg-cream text-olive/40 hover:text-olive transition-colors" aria-label="Edit">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(a.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-olive/40 hover:text-red-500 transition-colors" aria-label="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {announcements.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 text-olive/25" />
            </div>
            <p className="text-sm text-olive/40 font-body">No announcements yet</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Announcement" : "New Announcement"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-olive mb-1 font-body">Title *</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
          </div>
          <div>
            <label className="block text-xs font-medium text-olive mb-1 font-body">Content *</label>
            <textarea required rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body resize-none" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as AnnouncementPriority })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body">
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Author</label>
              <input type="text" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="w-4 h-4 rounded border-beige accent-pistachio" />
            <span className="text-sm text-olive font-body">Publish immediately</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all font-body">
              {editing ? "Save Changes" : "Publish"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

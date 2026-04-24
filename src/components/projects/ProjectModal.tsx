'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import type { Project } from '@/types'
import { X, FolderKanban } from 'lucide-react'

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#3b82f6', '#8b5e3c']

interface Props {
  project?: Project | null
  onClose: () => void
  onSaved: (project: Project) => void
}

export default function ProjectModal({ project, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: '', description: '', color: '#8b5cf6',
    priority: 'medium', status: 'active', dueDate: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        description: project.description || '',
        color: project.color || '#8b5cf6',
        priority: project.priority,
        status: project.status,
        dueDate: project.dueDate ? project.dueDate.split('T')[0] : ''
      })
    }
  }, [project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, dueDate: form.dueDate || undefined }
      let res
      if (project) {
        res = await api.put(`/projects/${project._id}`, payload)
      } else {
        res = await api.post('/projects', payload)
      }
      toast.success(project ? 'Project updated' : 'Project created!')
      onSaved(res.data.project)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-card border border-bg-border rounded-2xl w-full max-w-md shadow-card animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-bg-border">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-accent-purple" />
            {project ? 'Edit Project' : 'New Project'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Project Name *</label>
            <input className="input" placeholder="My Awesome Project" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
            <textarea className="input min-h-[80px] resize-none" placeholder="What is this project about?"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Due Date</label>
            <input type="date" className="input" value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button"
                  className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-offset-bg-card ring-white scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : (project ? 'Save Changes' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

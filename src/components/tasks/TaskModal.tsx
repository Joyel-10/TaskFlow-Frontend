'use client'
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import type { Task, Comment, ProjectMember } from '@/types'
import { formatRelative, formatDate, PRIORITY_COLORS, STATUS_LABELS, generateAvatarColor, getInitials } from '@/lib/utils'
import { X, Send, Paperclip, Trash2, Bot, Calendar, User, Flag, CheckSquare } from 'lucide-react'

interface Props {
  task?: Task | null
  projectId: string
  defaultStatus?: string
  members: ProjectMember[]
  onClose: () => void
  onSaved: (task: Task) => void
}

export default function TaskModal({ task, projectId, defaultStatus = 'todo', members, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    title: '', description: '', status: defaultStatus,
    priority: 'medium', dueDate: '', assignedTo: ''
  })
  const [saving, setSaving] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'files'>('details')

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        assignedTo: task.assignedTo?._id || ''
      })
      loadComments()
    }
  }, [task])

  const loadComments = useCallback(async () => {
    if (!task) return
    try {
      const res = await api.get(`/comments/task/${task._id}`)
      setComments(res.data.comments)
    } catch { /* silent */ }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        project: projectId,
        dueDate: form.dueDate || undefined,
        assignedTo: form.assignedTo || undefined
      }
      let res
      if (task) {
        res = await api.put(`/tasks/${task._id}`, payload)
      } else {
        res = await api.post('/tasks', payload)
      }
      toast.success(task ? 'Task updated' : 'Task created!')
      onSaved(res.data.task)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || 'Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  const postComment = async () => {
    if (!newComment.trim() || !task) return
    setPostingComment(true)
    try {
      const res = await api.post('/comments', { content: newComment.trim(), taskId: task._id })
      setComments(prev => [...prev, res.data.comment])
      setNewComment('')
    } catch { toast.error('Failed to post comment') }
    finally { setPostingComment(false) }
  }

  const deleteComment = async (commentId: string) => {
    try {
      await api.delete(`/comments/${commentId}`)
      setComments(prev => prev.filter(c => c._id !== commentId))
    } catch { toast.error('Failed to delete comment') }
  }

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !task) return
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await api.post(`/files/upload/${task._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('File uploaded!')
      // Refresh task
      const res = await api.get(`/tasks/${task._id}`)
      onSaved(res.data.task)
    } catch { toast.error('Failed to upload file') }
    finally { setUploadingFile(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-card border border-bg-border rounded-2xl w-full max-w-2xl shadow-card animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-bg-border">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-accent-purple" />
            {task ? 'Edit Task' : 'New Task'}
            {task?.aiGenerated && <span className="badge bg-accent-purple/10 text-accent-purple border-accent-purple/20 text-xs"><Bot className="w-3 h-3" /> AI</span>}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs (only when editing) */}
        {task && (
          <div className="flex border-b border-bg-border px-5">
            {(['details', 'comments', 'files'] as const).map(tab => (
              <button key={tab}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-accent-purple text-accent-purple' : 'border-transparent text-text-muted hover:text-text-secondary'}`}
                onClick={() => setActiveTab(tab)}>
                {tab} {tab === 'comments' ? `(${comments.length})` : tab === 'files' ? `(${task.attachments?.length || 0})` : ''}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {/* Details tab */}
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-4" id="task-form">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Title *</label>
                <input className="input" placeholder="What needs to be done?"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
                <textarea className="input min-h-[100px] resize-none" placeholder="Add details..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    <Flag className="w-3.5 h-3.5 inline mr-1" />Priority
                  </label>
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
                    {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />Due Date
                  </label>
                  <input type="date" className="input" value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    <User className="w-3.5 h-3.5 inline mr-1" />Assignee
                  </label>
                  <select className="input" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
          )}

          {/* Comments tab */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8">No comments yet. Be the first!</p>
              ) : comments.map(c => (
                <div key={c._id} className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: generateAvatarColor(c.author.name) }}>
                    {getInitials(c.author.name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-text-primary">{c.author.name}</span>
                      <span className="text-xs text-text-muted">{formatRelative(c.createdAt)}</span>
                      {c.isEdited && <span className="text-xs text-text-muted">(edited)</span>}
                    </div>
                    <div className="bg-bg-secondary border border-bg-border rounded-xl px-3 py-2.5 relative">
                      <p className="text-sm text-text-secondary">{c.content}</p>
                      <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-bg-hover rounded text-red-400 transition-all"
                        onClick={() => deleteComment(c._id)}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2 border-t border-bg-border">
                <input className="input flex-1" placeholder="Write a comment..."
                  value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()} />
                <button className="btn-primary px-3" onClick={postComment} disabled={!newComment.trim() || postingComment}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Files tab */}
          {activeTab === 'files' && (
            <div>
              <label className="btn-secondary cursor-pointer mb-4 w-full justify-center">
                <Paperclip className="w-4 h-4" />
                {uploadingFile ? 'Uploading...' : 'Upload File'}
                <input type="file" className="hidden" onChange={uploadFile} disabled={uploadingFile} />
              </label>
              {task && task.attachments?.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8">No files attached</p>
              ) : (
                <div className="space-y-2">
                  {task?.attachments?.map(att => (
                    <div key={att.filename} className="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary border border-bg-border">
                      <Paperclip className="w-4 h-4 text-text-muted flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{att.originalName}</p>
                        <p className="text-xs text-text-muted">{(att.size / 1024).toFixed(1)} KB · {formatDate(att.uploadedAt)}</p>
                      </div>
                      <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${att.url}`} target="_blank" rel="noreferrer"
                        className="text-xs text-accent-purple hover:underline">Download</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'details' && (
          <div className="flex gap-3 p-5 border-t border-bg-border">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" form="task-form" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : (task ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

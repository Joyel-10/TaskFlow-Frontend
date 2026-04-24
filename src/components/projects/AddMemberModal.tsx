'use client'
import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import type { Project, User } from '@/types'
import { X, Search, UserPlus } from 'lucide-react'
import { generateAvatarColor, getInitials } from '@/lib/utils'

interface Props {
  projectId: string
  onClose: () => void
  onAdded: (project: Project) => void
}

export default function AddMemberModal({ projectId, onClose, onAdded }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)

  const search = useCallback(async (q: string) => {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await api.get('/users/search', { params: { q } })
      setResults(res.data.users)
    } finally { setLoading(false) }
  }, [])

  const addMember = async (email: string) => {
    setAdding(email)
    try {
      const res = await api.post(`/projects/${projectId}/members`, { email, role: 'member' })
      toast.success('Member added!')
      onAdded(res.data.project)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || 'Failed to add member')
    } finally { setAdding(null) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-card border border-bg-border rounded-2xl w-full max-w-md shadow-card animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-bg-border">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-accent-cyan" /> Add Team Member
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input className="input pl-10" placeholder="Search by name or email..."
              value={query} onChange={e => search(e.target.value)} autoFocus />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4 text-text-muted text-sm">Searching...</div>
            ) : results.length === 0 && query.length >= 2 ? (
              <div className="text-center py-4 text-text-muted text-sm">No users found</div>
            ) : results.map(user => (
              <div key={user._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: generateAvatarColor(user.name) }}>
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{user.name}</p>
                  <p className="text-xs text-text-muted truncate">{user.email}</p>
                </div>
                <button className="btn-secondary text-xs py-1.5 px-3"
                  onClick={() => addMember(user.email)}
                  disabled={adding === user.email}>
                  {adding === user.email ? 'Adding...' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

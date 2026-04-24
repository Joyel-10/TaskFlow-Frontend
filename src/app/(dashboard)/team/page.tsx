'use client'
import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import type { User } from '@/types'
import { generateAvatarColor, getInitials, formatDate } from '@/lib/utils'
import { Users, Search, Shield, User as UserIcon } from 'lucide-react'

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users')
      setUsers(res.data.users)
    } catch {
      toast.error('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Team</h1>
          <p className="text-text-secondary mt-1">{users.length} members in your organization</p>
        </div>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input className="input pl-10" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-40 card animate-pulse bg-bg-hover" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">No members found</h3>
          <p className="text-text-secondary">Team members will appear here</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(user => (
            <div key={user._id} className="card p-5 flex flex-col items-center text-center hover:border-bg-hover transition-all">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white mb-3"
                style={{ backgroundColor: generateAvatarColor(user.name) }}>
                {getInitials(user.name)}
              </div>
              <h3 className="font-semibold text-text-primary">{user.name}</h3>
              <p className="text-xs text-text-muted mt-0.5 mb-3 truncate w-full">{user.email}</p>
              <span className={`badge text-xs ${user.role === 'admin' ? 'bg-accent-purple/10 text-accent-purple border-accent-purple/20' : 'bg-bg-hover text-text-secondary border-bg-border'}`}>
                {user.role === 'admin' ? <><Shield className="w-3 h-3" /> Admin</> : <><UserIcon className="w-3 h-3" /> Member</>}
              </span>
              <p className="text-xs text-text-muted mt-3">Joined {formatDate(user.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

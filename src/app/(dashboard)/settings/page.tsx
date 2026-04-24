'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { generateAvatarColor, getInitials } from '@/lib/utils'
import { User, Lock, Save } from 'lucide-react'

export default function SettingsPage() {
  const { user, updateProfile } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [changingPw, setChangingPw] = useState(false)

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile({ name })
      toast.success('Profile updated')
    } catch { toast.error('Failed to update profile') }
    finally { setSaving(false) }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.newPass !== passwords.confirm) { toast.error('Passwords do not match'); return }
    if (passwords.newPass.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setChangingPw(true)
    try {
      await api.put('/auth/password', { currentPassword: passwords.current, newPassword: passwords.newPass })
      toast.success('Password changed successfully')
      setPasswords({ current: '', newPass: '', confirm: '' })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally { setChangingPw(false) }
  }

  if (!user) return null
  const avatarColor = generateAvatarColor(user.name)

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-text-primary flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-accent-purple" /> Profile
        </h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
            style={{ backgroundColor: avatarColor }}>
            {getInitials(user.name)}
          </div>
          <div>
            <p className="font-semibold text-text-primary">{user.name}</p>
            <p className="text-sm text-text-muted">{user.email}</p>
            <span className={`badge text-xs mt-1 ${user.role === 'admin' ? 'bg-accent-purple/10 text-accent-purple border-accent-purple/20' : 'bg-bg-hover text-text-secondary border-bg-border'}`}>
              {user.role}
            </span>
          </div>
        </div>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Full Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
            <input className="input opacity-60" value={user.email} disabled />
            <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Changes</>}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="card p-6">
        <h2 className="font-semibold text-text-primary flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-accent-cyan" /> Change Password
        </h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Current Password</label>
            <input type="password" className="input" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">New Password</label>
            <input type="password" className="input" value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Confirm New Password</label>
            <input type="password" className="input" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} required />
          </div>
          <button type="submit" className="btn-primary" disabled={changingPw}>
            {changingPw ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</> : <><Lock className="w-4 h-4" />Change Password</>}
          </button>
        </form>
      </div>
    </div>
  )
}

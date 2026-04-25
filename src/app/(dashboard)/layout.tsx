'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { getInitials, generateAvatarColor } from '@/lib/utils'
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  Users, Bot, Settings, LogOut, Zap, Menu,
  X, ChevronRight, Bell
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/tasks', icon: CheckSquare, label: 'My Tasks' },
  { href: '/team', icon: Users, label: 'Team' },
  { href: '/ai-assistant', icon: Bot, label: 'AI Assistant' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isInitialized, initAuth, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    initAuth()
  }, [initAuth])

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isInitialized, isAuthenticated, router])

  // Show spinner until auth is checked
  if (!isInitialized) return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
        <span className="text-text-secondary">Loading...</span>
      </div>
    </div>
  )

  if (!user) return null

  const avatarColor = generateAvatarColor(user.name)

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-bg-secondary border-r border-bg-border flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-5 border-b border-bg-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center shadow-glow-purple flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-text-primary tracking-tight">
            TaskFlow AI
          </span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 mb-3">
            Workspace
          </p>
          {NAV.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            )
          })}

          <div className="pt-4 mt-4 border-t border-bg-border">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 mb-3">
              Account
            </p>
            <Link
              href="/settings"
              className={`sidebar-link ${pathname === '/settings' ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              <Settings className="w-4 h-4" /> Settings
            </Link>
            <button
              onClick={logout}
              className="sidebar-link w-full text-left hover:text-red-400">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-bg-border">
          <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg-hover transition-colors">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ backgroundColor: avatarColor }}>
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
              <p className="text-xs text-text-muted capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-bg-primary/80 backdrop-blur-md border-b border-bg-border px-4 lg:px-6 py-3 flex items-center gap-4">
          <button
            className="lg:hidden text-text-secondary hover:text-text-primary"
            onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button className="btn-ghost p-2 relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent-purple rounded-full" />
          </button>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: avatarColor }}>
              {getInitials(user.name)}
            </div>
            <span className="text-sm font-medium text-text-primary hidden sm:block">
              {user.name}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
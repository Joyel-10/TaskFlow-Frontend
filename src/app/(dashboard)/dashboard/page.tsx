'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatRelative, formatDate, isOverdue, PRIORITY_COLORS, STATUS_LABELS, generateAvatarColor, getInitials } from '@/lib/utils'
import type { DashboardData } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import {
  FolderKanban, CheckSquare, Clock, AlertTriangle,
  TrendingUp, ArrowRight, Zap, Activity, Calendar
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/dashboard')
      setData(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  if (loading) return (
    <div className="p-6 lg:p-8 space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 card animate-pulse bg-bg-hover" />
      ))}
    </div>
  )

  if (!data) return null
  const { stats, activities, upcomingTasks, projects, taskTrend } = data

  const statCards = [
    { label: 'Active Projects', value: stats.activeProjects, icon: FolderKanban, color: 'text-accent-purple', bg: 'bg-accent-purple/10', href: '/projects' },
    { label: 'Total Tasks', value: stats.totalTasks, icon: CheckSquare, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10', href: '/tasks' },
    { label: 'Completed', value: stats.completedTasks, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10', href: '/tasks?status=done' },
    { label: 'Overdue', value: stats.overdueTasks, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10', href: '/tasks?filter=overdue' },
  ]

  const getActivityText = (act: DashboardData['activities'][0]) => {
    const map: Record<string, string> = {
      task_created: `created task "${act.meta?.taskTitle}"`,
      task_completed: `completed "${act.meta?.taskTitle}"`,
      task_deleted: `deleted task "${act.meta?.taskTitle}"`,
      status_changed: `moved "${act.meta?.taskTitle}" to ${STATUS_LABELS[act.meta?.to as string] || act.meta?.to}`,
      project_created: `created project "${act.meta?.projectName}"`,
      member_added: `added ${act.meta?.addedUser} to ${act.project?.name}`,
      comment_added: 'added a comment',
      ai_task_generated: `AI generated ${act.meta?.count} tasks`,
    }
    return map[act.type] || act.type.replace(/_/g, ' ')
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-text-secondary mt-1">Here&apos;s what&apos;s happening with your projects today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} className="card p-5 hover:border-bg-hover transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
            </div>
            <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
            <div className="text-sm text-text-secondary">{label}</div>
          </Link>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent-purple" /> Task Activity (7 days)
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={taskTrend} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a38" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#9090a8', fontSize: 11 }}
                tickFormatter={v => new Date(v).toLocaleDateString('en', { weekday: 'short' })} />
              <YAxis tick={{ fill: '#9090a8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#16161e', border: '1px solid #2a2a38', borderRadius: '8px', color: '#f0f0f8' }}
                labelFormatter={v => new Date(v).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })} />
              <Bar dataKey="created" name="Created" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-accent-cyan" /> Recent Activity
          </h2>
          <div className="space-y-3 overflow-y-auto max-h-[220px]">
            {activities.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-8">No recent activity</p>
            ) : activities.slice(0, 10).map(act => (
              <div key={act._id} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: generateAvatarColor(act.user?.name || 'U') }}>
                  {getInitials(act.user?.name || 'U')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    <span className="text-text-primary font-medium">{act.user?.name}</span>{' '}{getActivityText(act)}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{formatRelative(act.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects + Upcoming tasks */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Projects */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text-primary">Projects Overview</h2>
            <Link href="/projects" className="text-xs text-accent-purple hover:text-purple-400 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-text-muted text-sm">No projects yet</p>
                <Link href="/projects" className="text-accent-purple text-sm mt-1 block">Create your first project →</Link>
              </div>
            ) : projects.slice(0, 5).map(p => (
              <Link key={p._id} href={`/projects/${p._id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors group">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color || '#8b5cf6' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary truncate">{p.name}</span>
                    <span className="text-xs text-text-muted ml-2">{p.progress || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${p.progress || 0}%`, backgroundColor: p.color || '#8b5cf6' }} />
                  </div>
                </div>
                <span className="text-xs text-text-muted">{p.taskCount} tasks</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-orange" /> Upcoming Deadlines
            </h2>
            <Link href="/tasks" className="text-xs text-accent-purple hover:text-purple-400 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-text-muted text-sm">No upcoming deadlines</p>
              </div>
            ) : upcomingTasks.slice(0, 5).map(task => {
              const project = task.project as { name: string; color: string }
              return (
                <div key={task._id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: project?.color || '#8b5cf6' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{task.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{project?.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-medium ${isOverdue(task.dueDate, task.status) ? 'text-red-400' : 'text-text-secondary'}`}>
                      {formatDate(task.dueDate)}
                    </p>
                    <span className={`badge text-xs mt-0.5 ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

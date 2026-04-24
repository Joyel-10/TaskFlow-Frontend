'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import type { Task, Project } from '@/types'
import { formatDate, isOverdue, isDueSoon, PRIORITY_COLORS, STATUS_COLORS, STATUS_LABELS, generateAvatarColor, getInitials } from '@/lib/utils'
import { CheckSquare, Filter, Search, Calendar, AlertTriangle, ExternalLink, CheckCircle2 } from 'lucide-react'

export default function TasksPage() {
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const fetchTasks = useCallback(async () => {
    try {
      const params: Record<string, string> = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (priorityFilter !== 'all') params.priority = priorityFilter
      const res = await api.get('/tasks/my-tasks', { params })
      setTasks(res.data.tasks)
    } catch { toast.error('Failed to load tasks') }
    finally { setLoading(false) }
  }, [statusFilter, priorityFilter])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const updateStatus = async (taskId: string, status: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status })
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: status as Task['status'] } : t))
      toast.success(status === 'done' ? 'Task completed! 🎉' : 'Status updated')
    } catch { toast.error('Failed to update') }
  }

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  )

  const overdueTasks = filtered.filter(t => isOverdue(t.dueDate, t.status))
  const dueSoonTasks = filtered.filter(t => isDueSoon(t.dueDate) && !isOverdue(t.dueDate, t.status) && t.status !== 'done')
  const regularTasks = filtered.filter(t => !isOverdue(t.dueDate, t.status) && !(isDueSoon(t.dueDate) && t.status !== 'done'))

  const TaskRow = ({ task }: { task: Task }) => {
    const project = task.project as Project
    const overdue = isOverdue(task.dueDate, task.status)
    const soon = isDueSoon(task.dueDate) && task.status !== 'done'

    return (
      <div className={`card p-4 flex items-start gap-4 hover:border-bg-hover transition-all ${overdue ? 'border-red-500/20' : ''}`}>
        <button
          onClick={() => updateStatus(task._id, task.status === 'done' ? 'todo' : 'done')}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.status === 'done' ? 'border-emerald-400 bg-emerald-400' : 'border-bg-border hover:border-accent-purple'}`}>
          {task.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-text-muted' : 'text-text-primary'}`}>{task.title}</p>
          </div>
          {task.description && <p className="text-xs text-text-muted line-clamp-1 mb-2">{task.description}</p>}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge text-xs ${STATUS_COLORS[task.status]}`}>{STATUS_LABELS[task.status]}</span>
            <span className={`badge text-xs ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
            {project?.name && (
              <Link href={`/projects/${project._id}`} className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-purple transition-colors">
                <ExternalLink className="w-3 h-3" /> {project.name}
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-400' : soon ? 'text-yellow-400' : 'text-text-muted'}`}>
              {overdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
              {formatDate(task.dueDate)}
            </div>
          )}
          {task.assignedTo && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: generateAvatarColor(task.assignedTo.name) }}>
              {getInitials(task.assignedTo.name)}
            </div>
          )}
        </div>
      </div>
    )
  }

  const TaskGroup = ({ title, tasks, color }: { title: string; tasks: Task[]; color: string }) => {
    if (tasks.length === 0) return null
    return (
      <div className="mb-6">
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${color}`}>{title} ({tasks.length})</h3>
        <div className="space-y-2">
          {tasks.map(t => <TaskRow key={t._id} task={t} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Tasks</h1>
          <p className="text-text-secondary mt-1">{tasks.length} tasks assigned to you</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input className="input pl-10" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select className="input w-auto" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 card animate-pulse bg-bg-hover" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <CheckSquare className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">No tasks found</h3>
          <p className="text-text-secondary">Tasks assigned to you will appear here</p>
        </div>
      ) : (
        <div>
          <TaskGroup title="🔴 Overdue" tasks={overdueTasks} color="text-red-400" />
          <TaskGroup title="🟡 Due Soon" tasks={dueSoonTasks} color="text-yellow-400" />
          <TaskGroup title="Tasks" tasks={regularTasks} color="text-text-secondary" />
        </div>
      )}
    </div>
  )
}

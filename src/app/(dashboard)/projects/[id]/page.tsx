'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import type { Project, Task, User } from '@/types'
import { formatDate, PRIORITY_COLORS, STATUS_LABELS, generateAvatarColor, getInitials } from '@/lib/utils'
import { ArrowLeft, Plus, Users, Trash2, Bot, Calendar } from 'lucide-react'
import TaskModal from '@/components/tasks/TaskModal'
import AddMemberModal from '@/components/projects/AddMemberModal'
import AITaskGenerator from '@/components/ai/AITaskGenerator'

const COLUMNS = ['todo', 'in-progress', 'done'] as const

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<string>('todo')
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`)
      ])
      setProject(projRes.data.project)
      setTasks(tasksRes.data.tasks)
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } }
      if (error.response?.status === 404 || error.response?.status === 403) {
        setNotFound(true)
      } else {
        toast.error('Failed to load project')
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) fetchData()
  }, [id, fetchData])

  const handleDrop = async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t._id === taskId)
    if (!task || task.status === newStatus) return
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus as Task['status'] } : t))
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus })
    } catch {
      fetchData()
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${taskId}`)
      setTasks(prev => prev.filter(t => t._id !== taskId))
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const removeMember = async (userId: string) => {
    try {
      await api.delete(`/projects/${id}/members/${userId}`)
      setProject(prev =>
        prev ? { ...prev, members: prev.members.filter(m => m.user._id !== userId) } : prev
      )
      toast.success('Member removed')
    } catch {
      toast.error('Failed to remove member')
    }
  }

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-text-secondary">
      <div className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      Loading project...
    </div>
  )

  if (notFound) return (
    <div className="p-8 text-center">
      <p className="text-text-secondary mb-4">Project not found or you do not have access.</p>
      <button onClick={() => router.push('/projects')} className="btn-primary">
        Back to Projects
      </button>
    </div>
  )

  if (!project) return null

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: (project.color || '#8b5cf6') + '22' }}>
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color || '#8b5cf6' }} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">{project.name}</h1>
          <p className="text-sm text-text-secondary">{project.description || 'No description'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary gap-2"
            onClick={() => setShowAIGenerator(true)}>
            <Bot className="w-4 h-4 text-accent-purple" /> AI Generate
          </button>
          <button
            className="btn-primary"
            onClick={() => { setEditTask(null); setDefaultStatus('todo'); setShowTaskModal(true) }}>
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {COLUMNS.map(col => {
          const count = tasks.filter(t => t.status === col).length
          return (
            <div key={col} className="card p-4 text-center">
              <div className="text-2xl font-bold text-text-primary">{count}</div>
              <div className="text-xs text-text-secondary mt-1">{STATUS_LABELS[col]}</div>
            </div>
          )
        })}
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-accent-purple">{tasks.length}</div>
          <div className="text-xs text-text-secondary mt-1">Total Tasks</div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid lg:grid-cols-3 gap-5 mb-8">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col)
          return (
            <div
              key={col}
              className="bg-bg-secondary border border-bg-border rounded-xl p-4 min-h-[400px]"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                if (dragging) handleDrop(dragging, col)
              }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col === 'todo' ? 'bg-slate-400' : col === 'in-progress' ? 'bg-accent-purple' : 'bg-emerald-400'}`} />
                  <span className="text-sm font-semibold text-text-primary">{STATUS_LABELS[col]}</span>
                  <span className="text-xs text-text-muted bg-bg-border px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                <button
                  className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-text-secondary"
                  onClick={() => { setEditTask(null); setDefaultStatus(col); setShowTaskModal(true) }}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                {colTasks.map(task => {
                  const assignee = task.assignedTo as User | undefined
                  return (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={() => setDragging(task._id)}
                      onDragEnd={() => setDragging(null)}
                      className="card p-3.5 cursor-grab active:cursor-grabbing hover:border-bg-hover transition-all group"
                      onClick={() => { setEditTask(task); setShowTaskModal(true) }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-text-primary line-clamp-2 flex-1">
                          {task.title}
                        </p>
                        <button
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-bg-hover rounded text-red-400 transition-all flex-shrink-0"
                          onClick={e => { e.stopPropagation(); deleteTask(task._id) }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-xs text-text-muted mb-2.5 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <span className={`badge text-xs ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                        <div className="flex items-center gap-2">
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-text-muted">
                              <Calendar className="w-3 h-3" />
                              {formatDate(task.dueDate)}
                            </div>
                          )}
                          {assignee && (
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ backgroundColor: generateAvatarColor(assignee.name) }}
                              title={assignee.name}>
                              {getInitials(assignee.name)}
                            </div>
                          )}
                        </div>
                      </div>

                      {task.aiGenerated && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-accent-purple/70">
                          <Bot className="w-3 h-3" /> AI generated
                        </div>
                      )}
                    </div>
                  )
                })}

                {colTasks.length === 0 && (
                  <div className="text-center py-8 text-text-muted text-sm border border-dashed border-bg-border rounded-lg">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Members */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-accent-cyan" />
            Team Members ({project.members.length})
          </h2>
          <button className="btn-secondary text-sm" onClick={() => setShowMemberModal(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Member
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {project.members.map(m => (
            <div
              key={m.user._id}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-bg-secondary border border-bg-border group">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: generateAvatarColor(m.user.name) }}>
                {getInitials(m.user.name)}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{m.user.name}</p>
                <p className="text-xs text-text-muted capitalize">{m.role}</p>
              </div>
              {m.role !== 'admin' && (
                <button
                  className="ml-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-bg-hover rounded text-red-400 transition-all"
                  onClick={() => removeMember(m.user._id)}>
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          task={editTask}
          projectId={id}
          defaultStatus={defaultStatus}
          members={project.members}
          onClose={() => setShowTaskModal(false)}
          onSaved={(task) => {
            if (editTask) {
              setTasks(prev => prev.map(t => t._id === task._id ? task : t))
            } else {
              setTasks(prev => [task, ...prev])
            }
            setShowTaskModal(false)
          }}
        />
      )}

      {showMemberModal && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowMemberModal(false)}
          onAdded={(updated) => {
            setProject(updated)
            setShowMemberModal(false)
          }}
        />
      )}

      {showAIGenerator && (
        <AITaskGenerator
          project={project}
          onClose={() => setShowAIGenerator(false)}
          onTasksCreated={(newTasks) => {
            setTasks(prev => [...newTasks, ...prev])
            setShowAIGenerator(false)
          }}
        />
      )}
    </div>
  )
}
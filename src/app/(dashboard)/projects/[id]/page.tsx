


'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import type { Project, Task, User } from '@/types'
import { formatDate, PRIORITY_COLORS, STATUS_COLORS, STATUS_LABELS, generateAvatarColor, getInitials } from '@/lib/utils'
import { ArrowLeft, Plus, Users, Trash2, Bot, Calendar, CheckSquare, Clock } from 'lucide-react'
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
    } catch { fetchData() }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${taskId}`)
      setTasks(prev => prev.filter(t => t._id !== taskId))
      toast.success('Task deleted')
    } catch { toast.error('Failed to delete') }
  }

  const removeMember = async (userId: string) => {
    try {
      await api.delete(`/projects/${id}/members/${userId}`)
      setProject(prev => prev ? { ...prev, members: prev.members.filter(m => m.user._id !== userId) } : prev)
      toast.success('Member removed')
    } catch { toast.error('Failed to remove member') }
  }

  // Loading state
  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-text-secondary">
      <div className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      Loading project...
    </div>
  )

 
  if (notFound) return (
    <div className="p-8 text-center">
      <p className="text-text-secondary mb-4">Project not found or you don't have access.</p>
      <button onClick={() => router.push('/projects')} className="btn-primary">
        Back to Projects
      </button>
    </div>
  )

  if (!project) return null
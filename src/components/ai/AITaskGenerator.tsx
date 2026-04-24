'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import type { Project, Task } from '@/types'
import { X, Bot, Sparkles, CheckSquare, RefreshCw } from 'lucide-react'
import { PRIORITY_COLORS } from '@/lib/utils'

interface Props {
  project: Project
  onClose: () => void
  onTasksCreated: (tasks: Task[]) => void
}

export default function AITaskGenerator({ project, onClose, onTasksCreated }: Props) {
  const [generatedTasks, setGeneratedTasks] = useState<Partial<Task>[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [count, setCount] = useState(5)
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())

  const generate = async () => {
    setLoading(true)
    try {
      const res = await api.post('/ai/generate-tasks', {
        projectName: project.name,
        projectDescription: customPrompt || project.description,
        count
      })
      setGeneratedTasks(res.data.tasks)
      setSelectedTasks(new Set(res.data.tasks.map((_: unknown, i: number) => i)))
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || 'Failed to generate tasks')
    } finally {
      setLoading(false)
    }
  }

  const createSelected = async () => {
    const toCreate = generatedTasks.filter((_, i) => selectedTasks.has(i))
    if (!toCreate.length) { toast.error('Select at least one task'); return }
    setCreating(true)
    try {
      const res = await api.post('/tasks/bulk', { tasks: toCreate, projectId: project._id })
      toast.success(`Created ${res.data.tasks.length} AI tasks! 🤖`)
      onTasksCreated(res.data.tasks)
    } catch { toast.error('Failed to create tasks') }
    finally { setCreating(false) }
  }

  const toggleTask = (i: number) => {
    setSelectedTasks(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-card border border-bg-border rounded-2xl w-full max-w-xl shadow-card animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-bg-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">AI Task Generator</h2>
              <p className="text-xs text-text-muted">for {project.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Generate controls */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Context / Focus Area</label>
              <textarea className="input resize-none min-h-[80px]"
                placeholder={`Describe what you want to build or focus on (e.g. "user authentication system", "landing page redesign")...`}
                value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Number of tasks</label>
                <select className="input" value={count} onChange={e => setCount(Number(e.target.value))}>
                  {[3, 5, 8, 10, 15].map(n => <option key={n} value={n}>{n} tasks</option>)}
                </select>
              </div>
              <button className="btn-primary mt-5" onClick={generate} disabled={loading}>
                {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate</>}
              </button>
            </div>
          </div>

          {/* Generated tasks */}
          {generatedTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary">
                  Generated Tasks ({selectedTasks.size}/{generatedTasks.length} selected)
                </h3>
                <button className="text-xs text-accent-purple hover:underline"
                  onClick={() => setSelectedTasks(selectedTasks.size === generatedTasks.length ? new Set() : new Set(generatedTasks.map((_, i) => i)))}>
                  {selectedTasks.size === generatedTasks.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="space-y-2">
                {generatedTasks.map((task, i) => (
                  <div key={i}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedTasks.has(i) ? 'border-accent-purple/40 bg-accent-purple/5' : 'border-bg-border bg-bg-secondary hover:border-bg-hover'}`}
                    onClick={() => toggleTask(i)}>
                    <div className="flex items-start gap-3">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${selectedTasks.has(i) ? 'border-accent-purple bg-accent-purple' : 'border-bg-border'}`}>
                        {selectedTasks.has(i) && <CheckSquare className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{task.title}</p>
                        {task.description && <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{task.description}</p>}
                        <div className="flex items-center gap-2 mt-1.5">
                          {task.priority && <span className={`badge text-xs ${PRIORITY_COLORS[task.priority as string]}`}>{task.priority}</span>}
                          {task.dueDate && <span className="text-xs text-text-muted">Due: {task.dueDate as string}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {generatedTasks.length > 0 && (
          <div className="flex gap-3 p-5 border-t border-bg-border">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={createSelected} className="btn-primary flex-1 justify-center" disabled={creating || selectedTasks.size === 0}>
              {creating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : <><Bot className="w-4 h-4" />Create {selectedTasks.size} Tasks</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

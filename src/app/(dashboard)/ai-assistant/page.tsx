'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import type { AIMessage, Project } from '@/types'
import { Bot, Send, Sparkles, FolderKanban, Plus, Trash2, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { formatRelative } from '@/lib/utils'

const SUGGESTIONS = [
  'Create tasks for building a website',
  'What are my pending tasks?',
  'Suggest a project workflow for mobile app development',
  'Help me prioritize my work this week',
  'Generate tasks for a marketing campaign',
]

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data.projects)).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))

      const res = await api.post('/ai/chat', {
        message: text.trim(),
        projectId: selectedProject || undefined,
        conversationHistory: history,
      })

      const assistantMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.response,
        timestamp: new Date(),
        parsed: res.data.parsed,
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || 'AI request failed')
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, messages, selectedProject])

  const handleCreateTasks = async (msg: AIMessage) => {
    if (!selectedProject) {
      toast.error('Please select a project first')
      return
    }
    const tasks = msg.parsed?.tasks
    if (!tasks?.length) return

    try {
      await api.post('/tasks/bulk', { tasks, projectId: selectedProject })
      toast.success(`Created ${tasks.length} tasks! 🎉`)
    } catch { toast.error('Failed to create tasks') }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-65px)]">
      {/* Header */}
      <div className="border-b border-bg-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-text-primary">TaskFlow AI</h1>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input py-1.5 text-sm w-48"
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}>
            <option value="">No project context</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <button className="btn-ghost p-2" onClick={() => setMessages([])} title="Clear chat">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-cyan/20 border border-accent-purple/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-accent-purple" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">How can I help you?</h2>
            <p className="text-text-secondary text-sm mb-8">Ask me to create tasks, analyze projects, suggest priorities, or anything about your work.</p>

            <div className="grid gap-2 w-full">
              {SUGGESTIONS.map(s => (
                <button key={s}
                  className="text-left p-3 rounded-lg border border-bg-border bg-bg-card hover:border-accent-purple/40 hover:bg-bg-hover transition-all text-sm text-text-secondary hover:text-text-primary"
                  onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-accent-purple' : 'bg-gradient-to-br from-accent-purple to-accent-cyan'}`}>
                {msg.role === 'user' ? <span className="text-xs font-bold text-white">You</span> : <Bot className="w-4 h-4 text-white" />}
              </div>

              <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-accent-purple text-white rounded-tr-sm' : 'bg-bg-card border border-bg-border rounded-tl-sm'}`}>
                  {msg.role === 'user' ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <div className="prose-dark text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Task creation action */}
                {msg.parsed?.action === 'create_tasks' && msg.parsed.tasks && (
                  <div className="bg-bg-secondary border border-accent-purple/20 rounded-xl p-4 mt-2 max-w-full">
                    <p className="text-xs font-semibold text-accent-purple mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> {msg.parsed.tasks.length} tasks ready to create
                    </p>
                    <div className="space-y-1.5 mb-3">
                      {msg.parsed.tasks.slice(0, 5).map((t, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                          <span className="text-accent-purple mt-0.5">•</span>
                          <span>{t.title}</span>
                        </div>
                      ))}
                      {msg.parsed.tasks.length > 5 && <p className="text-xs text-text-muted">+{msg.parsed.tasks.length - 5} more...</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedProject ? (
                        <button className="btn-primary text-xs py-1.5 px-3" onClick={() => handleCreateTasks(msg)}>
                          <Plus className="w-3.5 h-3.5" /> Create in {projects.find(p => p._id === selectedProject)?.name}
                        </button>
                      ) : (
                        <p className="text-xs text-yellow-400 flex items-center gap-1">
                          <FolderKanban className="w-3.5 h-3.5" /> Select a project above to create tasks
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <span className="text-xs text-text-muted px-1">{formatRelative(msg.timestamp)}</span>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-bg-card border border-bg-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-bg-border px-4 lg:px-8 py-4">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              className="input pr-12 resize-none min-h-[44px] max-h-32 py-3"
              placeholder="Ask AI to create tasks, analyze projects, suggest priorities..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ height: 'auto' }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 128) + 'px'
              }}
            />
          </div>
          <button
            className="btn-primary px-4 py-3 flex-shrink-0"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}>
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-text-muted text-center mt-2">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  )
}

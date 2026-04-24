import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast, isWithinInterval, addDays } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | undefined) {
  if (!date) return 'No date'
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function isOverdue(date: string | Date | undefined, status: string) {
  if (!date || status === 'done') return false
  return isPast(new Date(date))
}

export function isDueSoon(date: string | Date | undefined) {
  if (!date) return false
  const d = new Date(date)
  return isWithinInterval(d, { start: new Date(), end: addDays(new Date(), 3) })
}

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  critical: 'text-red-400 bg-red-400/10 border-red-400/20',
}

export const STATUS_COLORS: Record<string, string> = {
  todo: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  'in-progress': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  done: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
}

export const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function generateAvatarColor(name: string) {
  const colors = ['#8b5cf6','#06b6d4','#10b981','#f59e0b','#ec4899','#ef4444','#3b82f6']
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

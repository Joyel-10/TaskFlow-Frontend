'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-purple animate-pulse" />
        <span className="text-text-secondary">Loading TaskFlow AI...</span>
      </div>
    </div>
  )
}

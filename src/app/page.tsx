'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect when on exact root path /
    if (pathname === '/') {
      const token = localStorage.getItem('token')
      if (token) {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
    }
  }, [router, pathname])

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-purple animate-pulse" />
        <span className="text-text-secondary">Loading TaskFlow AI...</span>
      </div>
    </div>
  )
}
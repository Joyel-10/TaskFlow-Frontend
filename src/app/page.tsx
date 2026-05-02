'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // ONLY redirect when exactly on /
    if (pathname !== '/') return
    
    const token = localStorage.getItem('token')
    if (token) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [router, pathname])

  return null
}
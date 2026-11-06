'use client'

import { useEffect, useState } from 'react'
import { LoginView } from '@/components/login-view'
import { TeacherDashboard } from '@/components/teacher/teacher-dashboard'
import { StudentDashboard } from '@/components/student/student-dashboard'
import type { SessionUser } from '@/lib/types'

const STORAGE_KEY = 'testarena_user'

export default function Page() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // localStorage dan foydalanuvchini o'qish (hydrate dan keyin)
    const t = setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) setUser(JSON.parse(saved) as SessionUser)
      } catch {
        // e'tiborsiz
      }
      setHydrated(true)
    }, 0)
    return () => clearTimeout(t)
  }, [])

  function handleLogin(u: SessionUser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUser(u)
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" aria-label="Yuklanmoqda" />
      </div>
    )
  }

  if (!user) return <LoginView onLogin={handleLogin} />

  return user.role === 'TEACHER' ? (
    <TeacherDashboard user={user} onLogout={handleLogout} />
  ) : (
    <StudentDashboard user={user} onLogout={handleLogout} />
  )
}

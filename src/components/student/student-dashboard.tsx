'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { HomeTab } from '@/components/student/home-tab'
import { TestsTab } from '@/components/student/tests-tab'
import { ShopView } from '@/components/student/shop-view'
import { RankingTab } from '@/components/student/ranking-tab'
import { Progress } from '@/components/ui/progress'
import { LevelBadge } from '@/components/level-badge'
import { Home, ListChecks, Store, Trophy, LogOut, Coins, Target, GraduationCap, Loader2 } from 'lucide-react'
import { apiGet } from '@/lib/client'
import { cn } from '@/lib/utils'
import type { SessionUser, MeResponse } from '@/lib/types'

const TABS = [
  { key: 'home', label: 'Bosh sahifa', icon: Home },
  { key: 'tests', label: 'Testlar', icon: ListChecks },
  { key: 'shop', label: 'Do‘kon', icon: Store },
  { key: 'ranking', label: 'Reyting', icon: Trophy },
] as const

type TabKey = (typeof TABS)[number]['key']

export function StudentDashboard({ user: initialUser, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const [tab, setTab] = useState<TabKey>('home')
  const [me, setMe] = useState<MeResponse | null>(null)
  const [user, setUser] = useState(initialUser)

  const refreshMe = useCallback(async () => {
    try {
      const res = await apiGet<MeResponse>(`/api/me?userId=${user.id}`)
      setMe(res)
      setUser(res.user)
    } catch {
      // foydalanuvchi o'chirilgan bo'lishi mumkin
    }
  }, [user.id])

  useEffect(() => {
    // Boshlang'ich yuklanish va muntazam yangilanish (guruh testi mukofotlari)
    const t = setInterval(() => {
      void refreshMe()
    }, 8000)
    const initial = setTimeout(() => {
      void refreshMe()
    }, 0)
    return () => {
      clearInterval(t)
      clearTimeout(initial)
    }
  }, [refreshMe])

  const level = me?.level
  const nextLevel = me?.nextLevel
  const progress = nextLevel ? Math.min(100, Math.round((user.points / Math.max(1, nextLevel.requiredPoints)) * 100)) : 100

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <GraduationCap className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight sm:text-base">{user.name}</p>
                <p className="text-xs text-muted-foreground">TestArena o‘quvchi paneli</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700 border border-amber-200">
                <Coins className="h-4 w-4" aria-hidden /> {user.money}
              </span>
              <Button variant="outline" size="icon" onClick={onLogout} aria-label="Chiqish">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {me && level && (
            <div className="mt-3 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <LevelBadge
                  order={level.order}
                  name={level.name}
                  icon={level.icon}
                  size="sm"
                />
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Target className="h-3.5 w-3.5" aria-hidden />
                  {nextLevel ? (
                    <>
                      <span className="font-semibold text-emerald-700">{user.points}</span> / {nextLevel.requiredPoints} ball —{' '}
                      {nextLevel.name} darajasi
                    </>
                  ) : (
                    <>Eng yuqori darajaga yetdingiz! 🎉</>
                  )}
                </p>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Tab nav */}
          <nav className="mt-3" aria-label="O'quvchi bo'limlari">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {TABS.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    aria-current={tab === t.key ? 'page' : undefined}
                    className={cn(
                      'flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                      tab === t.key ? 'bg-emerald-600 text-white shadow' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {!me ? (
          <div className="flex items-center justify-center p-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Yuklanmoqda...
          </div>
        ) : (
          <>
            {tab === 'home' && <HomeTab me={me} user={user} onGoTests={() => setTab('tests')} />}
            {tab === 'tests' && <TestsTab user={user} onDataChanged={refreshMe} />}
            {tab === 'shop' && <ShopView user={user} onDataChanged={refreshMe} />}
            {tab === 'ranking' && <RankingTab user={user} />}
          </>
        )}
      </main>

      <footer className="mt-auto border-t bg-white py-4">
        <p className="text-center text-xs text-muted-foreground">TestArena — o‘qing, test ishla, darajangizni oshir!</p>
      </footer>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { OverviewTab } from '@/components/teacher/overview-tab'
import { ModulesTab } from '@/components/teacher/modules-tab'
import { QuestionsTab } from '@/components/teacher/questions-tab'
import { GroupTestTab } from '@/components/teacher/group-test-tab'
import { ShopTab } from '@/components/teacher/shop-tab'
import { LevelsTab } from '@/components/teacher/levels-tab'
import { StudentsTab } from '@/components/teacher/students-tab'
import {
  LayoutDashboard,
  FolderTree,
  FileQuestion,
  PlayCircle,
  Store,
  Settings2,
  Users,
  LogOut,
  GraduationCap,
} from 'lucide-react'
import type { SessionUser } from '@/lib/types'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'overview', label: 'Statistika', icon: LayoutDashboard },
  { key: 'modules', label: 'Modullar', icon: FolderTree },
  { key: 'questions', label: 'Savollar', icon: FileQuestion },
  { key: 'group-test', label: 'Guruh testi', icon: PlayCircle },
  { key: 'shop', label: 'Do‘kon', icon: Store },
  { key: 'levels', label: 'Darajalar', icon: Settings2 },
  { key: 'students', label: 'O‘quvchilar', icon: Users },
] as const

type TabKey = (typeof TABS)[number]['key']

export function TeacherDashboard({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const [tab, setTab] = useState<TabKey>('overview')

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <GraduationCap className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight sm:text-base">TestArena · Ustoz paneli</p>
              <p className="text-xs text-muted-foreground">{user.name}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout} className="gap-1.5">
            <LogOut className="h-4 w-4" aria-hidden /> Chiqish
          </Button>
        </div>

        {/* Tab nav */}
        <nav className="mx-auto max-w-7xl overflow-x-auto px-4" aria-label="Ustoz bo'limlari">
          <div className="flex gap-1 pb-2">
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
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'modules' && <ModulesTab />}
        {tab === 'questions' && <QuestionsTab />}
        {tab === 'group-test' && <GroupTestTab user={user} />}
        {tab === 'shop' && <ShopTab user={user} />}
        {tab === 'levels' && <LevelsTab user={user} />}
        {tab === 'students' && <StudentsTab />}
      </main>

      <footer className="mt-auto border-t bg-white py-4">
        <p className="text-center text-xs text-muted-foreground">
          TestArena — o‘quvchilar uchun gamifikatsiyali test platformasi
        </p>
      </footer>
    </div>
  )
}

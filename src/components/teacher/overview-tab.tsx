'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { LevelBadge } from '@/components/level-badge'
import { apiGet } from '@/lib/client'
import { iconForOrder, fmtDate } from '@/lib/visual'
import {
  Users,
  FolderTree,
  CheckSquare,
  FileQuestion,
  History,
  Target,
  Trophy,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import type { OverviewResponse } from '@/lib/types'

export function OverviewTab() {
  const [data, setData] = useState<OverviewResponse | null>(null)

  useEffect(() => {
    apiGet<OverviewResponse>('/api/overview').then(setData).catch(() => {})
  }, [])

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  const cards: { label: string; value: string | number; icon: LucideIcon; hint?: string }[] = [
    { label: 'O‘quvchilar', value: data.studentCount, icon: Users },
    { label: 'Modullar', value: data.moduleCount, icon: FolderTree },
    {
      label: 'O‘tilgan mavzular',
      value: `${data.coveredTopicCount} / ${data.topicCount}`,
      icon: CheckSquare,
      hint: 'galochka belgilangan',
    },
    { label: 'Savollar bazasi', value: data.questionCount, icon: FileQuestion },
    { label: 'Guruh testlari', value: data.groupSessionCount, icon: History },
    { label: 'Bajarilgan testlar', value: data.attemptCount, icon: Target },
    { label: 'O‘rtacha natija', value: `${data.avgPercent}%`, icon: Trophy },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{c.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
                  {c.hint && <p className="text-xs text-muted-foreground/70">{c.hint}</p>}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top o'quvchilar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-amber-500" aria-hidden /> Reyting (top 5)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topStudents.length === 0 && <p className="text-sm text-muted-foreground">Hozircha o‘quvchilar yo‘q.</p>}
            {data.topStudents.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sm font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{s.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <LevelBadge order={s.levelOrder} name={s.levelName} icon={iconForOrder(s.levelOrder)} size="sm" />
                  <span className="text-sm font-bold text-emerald-700">{s.points} ball</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* So'nggi guruh testlari */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-emerald-600" aria-hidden /> So‘nggi guruh testlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentSessions.length === 0 && (
              <p className="text-sm text-muted-foreground">Hozircha guruh testi o‘tkazilmagan.</p>
            )}
            {data.recentSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{fmtDate(s.date)}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.questionCount} savol · {s.participants} o‘quvchi
                  </p>
                </div>
                <span className="font-bold text-emerald-700">{s.avgPercent}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

// Reyting va test tarixi
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { apiGet } from '@/lib/client'
import { iconForOrder, fmtDate } from '@/lib/visual'
import { LevelBadge } from '@/components/level-badge'
import { Trophy, History, Users, Coins, Target, Loader2 } from 'lucide-react'
import type { LeaderRow, HistoryRow, SessionUser } from '@/lib/types'

export function RankingTab({ user }: { user: SessionUser }) {
  const [leaders, setLeaders] = useState<LeaderRow[] | null>(null)
  const [history, setHistory] = useState<HistoryRow[] | null>(null)

  useEffect(() => {
    apiGet<LeaderRow[]>('/api/leaderboard').then(setLeaders).catch(() => setLeaders([]))
    apiGet<HistoryRow[]>(`/api/history?userId=${user.id}`)
      .then(setHistory)
      .catch(() => setHistory([]))
  }, [user.id])

  if (leaders === null || history === null) {
    return (
      <div className="flex items-center gap-2 p-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Yuklanmoqda...
      </div>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Reyting */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-amber-500" aria-hidden /> O‘quvchilar reytingi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {leaders.length === 0 && <p className="text-sm text-muted-foreground">Hozircha o‘quvchilar yo‘q.</p>}
          {leaders.map((s, i) => (
            <div
              key={s.id}
              className={`flex flex-wrap items-center gap-2.5 rounded-lg border px-3 py-2.5 ${
                s.id === user.id ? 'border-emerald-400 bg-emerald-50/60' : ''
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-medium">{s.name}</span>
              <LevelBadge order={s.levelOrder} name={s.levelName} icon={iconForOrder(s.levelOrder)} size="sm" />
              <span className="text-sm font-bold text-emerald-700">{s.points} ball</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tarix */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-emerald-600" aria-hidden /> Test tarixim
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 && <p className="text-sm text-muted-foreground">Hozircha test ishlamadingiz.</p>}
          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {history.map((h) => (
              <div key={h.id} className="rounded-lg border px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={h.type === 'GROUP' ? 'default' : 'secondary'} className={h.type === 'GROUP' ? 'bg-emerald-600 hover:bg-emerald-600' : ''}>
                    {h.type === 'GROUP' ? 'Guruh testi' : 'Individual'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{fmtDate(h.date)}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-medium">
                    {h.correct}/{h.total} ({h.percent}%)
                  </span>
                  {h.pointsEarned > 0 && (
                    <span className="flex items-center gap-1 text-emerald-700">
                      <Target className="h-3.5 w-3.5" aria-hidden /> +{h.pointsEarned} ball
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-amber-700">
                    <Coins className="h-3.5 w-3.5" aria-hidden /> +{h.moneyEarned} tanga
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

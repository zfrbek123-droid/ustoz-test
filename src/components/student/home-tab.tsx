'use client'

// O'quvchi bosh sahifasi: daraja holati, keyingi daraja shartlari, faol guruh testi
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { apiGet } from '@/lib/client'
import { DynIcon } from '@/components/dyn-icon'
import {
  Coins,
  Target,
  ShoppingBag,
  PlayCircle,
  CheckCircle2,
  Circle,
  Sparkles,
  Lock,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { MeResponse, SessionUser, SessionBrief } from '@/lib/types'

export function HomeTab({ me, user, onGoTests }: { me: MeResponse; user: SessionUser; onGoTests: () => void }) {
  const [activeGroup, setActiveGroup] = useState<SessionBrief | null>(null)

  useEffect(() => {
    apiGet<SessionBrief | null>('/api/group-test')
      .then(setActiveGroup)
      .catch(() => {})
  }, [])

  const { level, nextLevel } = me
  const progress = nextLevel
    ? Math.min(100, Math.round((user.points / Math.max(1, nextLevel.requiredPoints)) * 100))
    : 100

  const stats: { label: string; value: string; icon: LucideIcon; color: string }[] = [
    { label: 'Umumiy ball', value: String(user.points), icon: Target, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Tangalar', value: String(user.money), icon: Coins, color: 'bg-amber-50 text-amber-700' },
    { label: 'Jihozlar', value: String(me.ownedItemIds.length), icon: ShoppingBag, color: 'bg-teal-50 text-teal-700' },
  ]

  return (
    <div className="space-y-5">
      {/* Faol guruh testi banneri */}
      {activeGroup && (
        <Card className="border-emerald-400 bg-emerald-50 shadow-md">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <PlayCircle className="h-8 w-8 animate-pulse text-emerald-600" aria-hidden />
              <div>
                <p className="font-bold text-emerald-900">Guruh testi boshlandi!</p>
                <p className="text-sm text-emerald-800">
                  {activeGroup.questionCount} savol · {activeGroup.attemptCount} o‘quvchi qo‘shildi · ball + tanga beriladi
                </p>
              </div>
            </div>
            <Button onClick={onGoTests} className="gap-1.5">
              Qo‘shilish <Users className="h-4 w-4" aria-hidden />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Statistika kartalari */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{s.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Daraja kartasi */}
      {level && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-emerald-600" aria-hidden /> Mening darajam
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
                <DynIcon name={level.icon} className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {level.order}-daraja: {level.name}
                </p>
                {nextLevel ? (
                  <p className="text-sm text-muted-foreground">
                    Keyingi daraja: <strong className="text-foreground">{nextLevel.name}</strong>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Eng yuqori daraja — Legenda! 🏆</p>
                )}
              </div>
            </div>

            {nextLevel && (
              <>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ball taraqqiyoti</span>
                    <span className="font-semibold text-emerald-700">
                      {user.points} / {nextLevel.requiredPoints}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2.5" />
                </div>

                {/* Shartli jihozlar */}
                {me.nextRequired.length > 0 && (
                  <div className="rounded-lg border p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                      <Lock className="h-4 w-4 text-amber-600" aria-hidden />
                      {nextLevel.name} darajasiga o‘tish uchun shartli jihozlar ({me.nextRequiredOwnedCount}/
                      {me.nextRequired.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {me.nextRequired.map((r) => (
                        <Badge
                          key={r.item.id}
                          variant="outline"
                          className={`gap-1 py-1 text-xs ${r.owned ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-600'}`}
                        >
                          {r.owned ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <Circle className="h-3.5 w-3.5" aria-hidden />}
                          {r.item.icon} {r.item.name} · {r.item.price}🪙
                        </Badge>
                      ))}
                    </div>
                    {me.canLevelUpNow ? (
                      <p className="mt-2 text-sm font-medium text-emerald-700">
                        Hamma shart bajarildi — keyingi guruh testida ball to‘plang va darajangiz oshadi! 🚀
                      </p>
                    ) : (
                      <p className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                        Jihozlar do‘konida sotib olinadi —{' '}
                        <button onClick={onGoTests} className="underline hover:text-foreground">
                          test ishlab tanga to‘plang
                        </button>
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

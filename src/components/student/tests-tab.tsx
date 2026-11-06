'use client'

// Testlar bo'limi: guruh testiga qo'shilish va individual (uyda) test ishlash
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { TestRunner } from '@/components/test-runner'
import { apiGet, apiPost } from '@/lib/client'
import { cn } from '@/lib/utils'
import {
  PlayCircle,
  Home,
  Loader2,
  Users,
  Coins,
  Target,
  PartyPopper,
  CheckCircle2,
  BookOpenCheck,
  Info,
} from 'lucide-react'
import type { AttemptState, SessionBrief, SessionUser } from '@/lib/types'

interface TakingState {
  attempt: AttemptState
}

interface ResultState {
  type: 'GROUP' | 'INDIVIDUAL'
  correct: number
  total: number
  moneyEarned: number
  pointsEarned: number
  levelUp: { from: number; to: number } | null
  newLevel: { name: string; order: number; icon: string } | null
}

export function TestsTab({ user, onDataChanged }: { user: SessionUser; onDataChanged: () => void }) {
  const [activeGroup, setActiveGroup] = useState<SessionBrief | null>(null)
  const [taking, setTaking] = useState<TakingState | null>(null)
  const [result, setResult] = useState<ResultState | null>(null)
  const [questionCount, setQuestionCount] = useState('10')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadActiveGroup = useCallback(async () => {
    try {
      setActiveGroup(await apiGet<SessionBrief | null>(`/api/group-test?userId=${user.id}`))
    } catch {
      // e'tiborsiz
    }
  }, [user.id])

  useEffect(() => {
    loadActiveGroup()
    if (!taking) {
      pollRef.current = setInterval(loadActiveGroup, 4000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [loadActiveGroup, taking])

  // Hozir davom etayotgan guruh urinishi bor-yo'qligini tekshirish
  useEffect(() => {
    if (taking || !activeGroup) return
    ;(async () => {
      try {
        const state = await apiGet<AttemptState | null>(
          `/api/attempt?sessionId=${activeGroup.id}&userId=${user.id}`
        )
        if (state && state.status === 'IN_PROGRESS' && state.sessionStatus === 'ACTIVE') {
          setTaking({ attempt: state })
        }
      } catch {
        // e'tiborsiz
      }
    })()
  }, [activeGroup, taking, user.id])

  // Hozir davom etayotgan individual urinish (localStorage)
  useEffect(() => {
    if (taking) return
    const savedSession = localStorage.getItem(`ta_individual_${user.id}`)
    if (!savedSession) return
    ;(async () => {
      try {
        const state = await apiGet<AttemptState | null>(`/api/attempt?sessionId=${savedSession}&userId=${user.id}`)
        if (state && state.status === 'IN_PROGRESS') {
          setTaking({ attempt: state })
        } else {
          localStorage.removeItem(`ta_individual_${user.id}`)
        }
      } catch {
        localStorage.removeItem(`ta_individual_${user.id}`)
      }
    })()
  }, [taking, user.id])

  async function joinGroup() {
    if (!activeGroup) return
    setLoading(true)
    try {
      await apiPost('/api/attempt', { action: 'join-group', sessionId: activeGroup.id, userId: user.id })
      const state = await apiGet<AttemptState>(`/api/attempt?sessionId=${activeGroup.id}&userId=${user.id}`)
      setTaking({ attempt: state })
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function generateIndividual() {
    setLoading(true)
    try {
      const res = await apiPost<{ sessionId: string; questionCount: number }>('/api/attempt', {
        action: 'generate-individual',
        userId: user.id,
        questionCount: Number(questionCount),
      })
      localStorage.setItem(`ta_individual_${user.id}`, res.sessionId)
      const state = await apiGet<AttemptState>(`/api/attempt?sessionId=${res.sessionId}&userId=${user.id}`)
      setTaking({ attempt: state })
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = useCallback(
    async (sessionQuestionId: string, selected: string) => {
      if (!taking) return
      try {
        await apiPost('/api/attempt', {
          action: 'answer',
          attemptId: taking.attempt.attemptId,
          sessionQuestionId,
          selected,
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : ''
        if (msg.includes('yakunlangan')) {
          // Ustoz testni yakunladi — o'quvchi natijasini yakunlaymiz
          toast({ title: 'Ustoz testni yakunladi', description: 'Natijangiz hisoblanmoqda...' })
          await doFinish(true)
          return
        }
        if (!msg.includes('allaqachon')) {
          toast({ title: 'Xatolik', description: msg, variant: 'destructive' })
        }
      }
    },
    [taking]
  )

  const doFinish = useCallback(
    async (silent = false) => {
      if (!taking) return
      try {
        const res = await apiPost<{
          correct: number
          total: number
          moneyEarned: number
          pointsEarned: number
          levelUp: { from: number; to: number } | null
          newLevel: { name: string; order: number; icon: string } | null
        }>('/api/attempt', { action: 'finish', attemptId: taking.attempt.attemptId })
        localStorage.removeItem(`ta_individual_${user.id}`)
        setResult({
          type: taking.attempt.sessionType,
          correct: res.correct,
          total: res.total,
          moneyEarned: res.moneyEarned,
          pointsEarned: res.pointsEarned,
          levelUp: res.levelUp,
          newLevel: res.newLevel,
        })
        setTaking(null)
        onDataChanged()
        loadActiveGroup()
        if (!silent) {
          toast({
            title: 'Test yakunlandi!',
            description: `${res.correct}/${res.total} to‘g‘ri · +${res.moneyEarned} tanga${res.pointsEarned > 0 ? ` · +${res.pointsEarned} ball` : ''}`,
          })
        }
      } catch (e) {
        toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
      }
    },
    [taking, user.id, onDataChanged, loadActiveGroup, toast]
  )

  // ---------- Test o'ynatish rejimi ----------
  if (taking) {
    const isGroup = taking.attempt.sessionType === 'GROUP'
    return (
      <div>
        <TestRunner
          questions={taking.attempt.questions}
          title={isGroup ? 'Guruh testi' : 'Uyda individual test'}
          subtitle={isGroup ? 'Har to‘g‘ri javob uchun ball + tanga olasiz' : 'Har to‘g‘ri javob uchun tanga olasiz (ball berilmaydi)'}
          onSubmitAnswer={submitAnswer}
          onFinish={() => doFinish()}
        />
      </div>
    )
  }

  // ---------- Natija oynasi ----------
  if (result) {
    const percent = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="space-y-4 p-8 text-center">
          {result.levelUp ? (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <PartyPopper className="h-10 w-10 text-amber-600" aria-hidden />
            </div>
          ) : percent >= 50 ? (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden />
            </div>
          ) : (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <BookOpenCheck className="h-10 w-10 text-amber-600" aria-hidden />
            </div>
          )}

          <h2 className="text-2xl font-bold">Test yakunlandi!</h2>
          <p className="text-muted-foreground">
            {result.correct} / {result.total} to‘g‘ri ({percent}%)
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {result.type === 'GROUP' ? (
              <>
                <div className="rounded-lg border bg-emerald-50 p-4">
                  <p className="flex items-center justify-center gap-1.5 text-2xl font-bold text-emerald-700">
                    <Target className="h-5 w-5" aria-hidden /> +{result.pointsEarned}
                  </p>
                  <p className="text-sm text-emerald-800">ball (guruh testi)</p>
                </div>
                <div className="rounded-lg border bg-amber-50 p-4">
                  <p className="flex items-center justify-center gap-1.5 text-2xl font-bold text-amber-700">
                    <Coins className="h-5 w-5" aria-hidden /> +{result.moneyEarned}
                  </p>
                  <p className="text-sm text-amber-800">tanga</p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg border bg-amber-50 p-4">
                  <p className="flex items-center justify-center gap-1.5 text-2xl font-bold text-amber-700">
                    <Coins className="h-5 w-5" aria-hidden /> +{result.moneyEarned}
                  </p>
                  <p className="text-sm text-amber-800">tanga (individual test)</p>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <p className="flex items-center justify-center gap-1.5 text-2xl font-bold text-slate-600">
                    <Target className="h-5 w-5" aria-hidden /> +0
                  </p>
                  <p className="text-sm text-slate-600">ball — faqat guruh testidan</p>
                </div>
              </>
            )}
          </div>

          {result.levelUp && result.newLevel && (
            <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-white p-4">
              <p className="font-bold text-amber-800">🎉 Tabriklaymiz — darajangiz oshdi!</p>
              <p className="mt-1 text-sm text-amber-700">
                Endi siz <strong>{result.levelUp.to}-daraja: {result.newLevel.name}</strong> darajasidasiz!
              </p>
            </div>
          )}

          <Button onClick={() => setResult(null)} className="min-h-11 w-full">
            Yopish
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ---------- Test tanlash ----------
  const groupDone = activeGroup && activeGroup.myAttemptStatus === 'FINISHED'

  return (
    <div className="space-y-5">
      {/* Guruh testi */}
      <Card className={cn(activeGroup && 'border-emerald-300 bg-emerald-50/50')}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-emerald-600" aria-hidden /> Guruh testi
            <Badge className="bg-emerald-600 hover:bg-emerald-600">ball + tanga</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeGroup ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <PlayCircle className="h-8 w-8 animate-pulse text-emerald-600" aria-hidden />
                <div>
                  <p className="font-semibold text-emerald-900">
                    Guruh testi faol — {activeGroup.questionCount} savol
                  </p>
                  <p className="text-sm text-emerald-800">
                    {activeGroup.attemptCount} o‘quvchi qo‘shildi · mavzular: {activeGroup.topicTitles.join(', ') || '—'}
                  </p>
                </div>
              </div>
              {groupDone ? (
                <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> Siz bu testni ishlab bo‘ldingiz — natijangiz ustoza
                  ko‘rinib turadi.
                </p>
              ) : (
                <Button onClick={joinGroup} disabled={loading} className="min-h-11 w-full sm:w-auto">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />} Testga qo‘shilish
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Hozircha faol guruh testi yo‘q. Ustoz guruh testini boshlaganda bu yerda bildirishnoma paydo bo‘ladi.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Individual test */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Home className="h-4 w-4 text-emerald-600" aria-hidden /> Uyda individual test
            <Badge variant="secondary">faqat tanga</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Individual test <strong className="text-foreground">faqat o‘tilgan (galochka belgilangan) mavzulardan</strong>{' '}
            generatsiya qilinadi. O‘tmagan mavzudan test ishlay olmaysiz. Ball berilmaydi — faqat tanga.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={questionCount} onValueChange={setQuestionCount}>
              <SelectTrigger className="min-h-11 sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} ta savol
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={generateIndividual} disabled={loading} className="min-h-11 flex-1 gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpenCheck className="h-4 w-4" aria-hidden />}
              Test generatsiya qilish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

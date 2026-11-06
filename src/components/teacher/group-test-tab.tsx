'use client'

// Guruh testi: faqat ustoz boshlaydi, jonli statistika monitori, yakunlash va eksport
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { apiGet, apiPost, apiPatch } from '@/lib/client'
import { downloadCsv, fmtDate } from '@/lib/visual'
import { cn } from '@/lib/utils'
import {
  Play,
  Square,
  Download,
  Radio,
  CheckCircle2,
  XCircle,
  MinusCircle,
  History,
  Loader2,
  Users,
} from 'lucide-react'
import type { ModuleTree, MonitorData, SessionBrief } from '@/lib/types'

export function GroupTestTab({ user }: { user: { id: string } }) {
  const [modules, setModules] = useState<ModuleTree[]>([])
  const [activeSession, setActiveSession] = useState<SessionBrief | null>(null)
  const [monitorId, setMonitorId] = useState<string | null>(null)
  const [monitor, setMonitor] = useState<MonitorData | null>(null)
  const [questionCount, setQuestionCount] = useState('10')
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [starting, setStarting] = useState(false)
  const [history, setHistory] = useState<
    { id: string; date: string; questionCount: number; participants: number; avgPercent: number; status: string }[]
  >([])
  const { toast } = useToast()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadModules = useCallback(async () => {
    const tree = await apiGet<ModuleTree[]>('/api/modules')
    setModules(tree)
    setSelectedTopics((prev) => {
      // Standart: barcha o'tilgan (galochka belgilangan) mavzular
      const covered = new Set(tree.flatMap((m) => m.topics.filter((t) => t.isCovered && t.questionCount > 0).map((t) => t.id)))
      return prev.size > 0 ? prev : covered
    })
  }, [])

  const loadActive = useCallback(async () => {
    const active = await apiGet<SessionBrief | null>('/api/group-test')
    setActiveSession(active)
    setMonitorId((prev) => active?.id ?? (prev && !active ? prev : prev))
  }, [])

  const loadHistory = useCallback(async () => {
    setHistory(await apiGet('/api/group-test?history=1'))
  }, [])

  const loadMonitor = useCallback(async (id: string) => {
    try {
      setMonitor(await apiGet<MonitorData>(`/api/group-test?id=${id}`))
    } catch {
      // sessiya o'chirilgan bo'lishi mumkin
    }
  }, [])

  useEffect(() => {
    Promise.all([loadModules(), loadActive(), loadHistory()]).catch(() => {})
  }, [loadModules, loadActive, loadHistory])

  // Jonli monitor: har 2.5 soniyada yangilanadi
  useEffect(() => {
    if (!monitorId) {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }
    loadMonitor(monitorId)
    pollRef.current = setInterval(() => loadMonitor(monitorId), 2500)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [monitorId, loadMonitor])

  useEffect(() => {
    if (monitor?.session.id && monitor.session.status === 'ACTIVE') {
      const t = setInterval(() => loadActive(), 4000)
      return () => clearInterval(t)
    }
  }, [monitor?.session.id, monitor?.session.status, loadActive])

  async function startTest() {
    setStarting(true)
    try {
      const topicIds = Array.from(selectedTopics)
      const res = await apiPost<{ sessionId: string; questionCount: number }>('/api/group-test', {
        teacherId: user.id,
        questionCount: Number(questionCount),
        topicIds,
      })
      toast({ title: `Guruh testi boshlandi!`, description: `${res.questionCount} ta savol generatsiya qilindi` })
      setMonitorId(res.sessionId)
      loadActive()
      loadHistory()
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    } finally {
      setStarting(false)
    }
  }

  async function finishTest() {
    if (!monitor) return
    if (!confirm('Test yakunlansinmi? Ishlanmay qolgan o‘quvchilar ham yakunlanadi.')) return
    try {
      await apiPatch('/api/group-test', { id: monitor.session.id, teacherId: user.id })
      toast({ title: 'Guruh testi yakunlandi' })
      loadMonitor(monitor.session.id)
      loadActive()
      loadHistory()
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    }
  }

  function exportCsv() {
    if (!monitor) return
    const header = [
      'O‘quvchi',
      ...monitor.questions.map((q) => `${q.order}-savol`),
      'To‘g‘ri',
      'Foiz',
      'Ball',
      'Tanga',
      'Holat',
    ]
    const rows = monitor.rows.map((r) => [
      r.name,
      ...r.cells.map((c) => (c.isCorrect === null ? '-' : c.isCorrect ? '✔' : '✘')),
      r.score,
      `${r.percent}%`,
      r.pointsEarned,
      r.moneyEarned,
      r.status === 'FINISHED' ? 'yakunlangan' : 'jarayonda',
    ])
    downloadCsv(`guruh-testi-natijalari-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows])
  }

  function toggleTopic(id: string, checked: boolean) {
    setSelectedTopics((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const coveredTopics = modules.flatMap((m) =>
    m.topics.filter((t) => t.isCovered).map((t) => ({ ...t, moduleTitle: m.title }))
  )
  const selectedQuestionsTotal = modules
    .flatMap((m) => m.topics)
    .filter((t) => selectedTopics.has(t.id))
    .reduce((sum, t) => sum + t.questionCount, 0)

  return (
    <div className="space-y-5">
      {/* ---------- Test boshlash (faol test yo'q bo'lsa) ---------- */}
      {!activeSession && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Play className="h-4 w-4 text-emerald-600" aria-hidden /> Guruh testini boshlash
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Test <strong className="text-foreground">faqat o‘tilgan (galochka belgilangan) mavzulardan</strong> generatsiya
              qilinadi. Guruhda ishlangan test uchun o‘quvchi <strong className="text-foreground">ball + tanga</strong> oladi.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Savollar soni</label>
                <Select value={questionCount} onValueChange={setQuestionCount}>
                  <SelectTrigger className="min-h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20, 25, 30].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} ta savol
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tanlangan mavzularda {selectedQuestionsTotal} ta savol bor.
                  {selectedQuestionsTotal < Number(questionCount) && selectedQuestionsTotal > 0 && (
                    <span className="text-amber-600"> Bazadagi barcha savollar ishlatiladi ({selectedQuestionsTotal} ta).</span>
                  )}
                </p>
              </div>
              <div className="flex items-end">
                <Button onClick={startTest} disabled={starting || selectedTopics.size === 0} className="min-h-11 w-full gap-2">
                  {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" aria-hidden />}
                  Testni boshlash
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Mavzular (galochka belgilanganlar tanlangan):</p>
              {coveredTopics.length === 0 && (
                <p className="text-sm text-muted-foreground">O‘tilgan mavzu yo‘q. Avval „Modullar“ bo‘limida galochka belgilang.</p>
              )}
              <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {coveredTopics.map((t) => (
                  <div key={t.id} className="flex items-center gap-2.5 rounded-lg border px-3 py-2">
                    <Checkbox
                      id={`gt-${t.id}`}
                      checked={selectedTopics.has(t.id)}
                      onCheckedChange={(v) => toggleTopic(t.id, v === true)}
                      disabled={t.questionCount === 0}
                    />
                    <label htmlFor={`gt-${t.id}`} className="flex-1 cursor-pointer text-sm">
                      {t.title} <span className="text-xs text-muted-foreground">· {t.moduleTitle}</span>
                    </label>
                    <Badge variant="outline" className="text-xs">{t.questionCount} savol</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---------- Faol test ogohlantirishi ---------- */}
      {activeSession && !monitorId && (
        <Card className="border-emerald-300 bg-emerald-50">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5 animate-pulse text-emerald-600" aria-hidden />
              <div>
                <p className="font-semibold text-emerald-900">Guruh testi o‘ynatilmoqda</p>
                <p className="text-sm text-emerald-800">{activeSession.questionCount} savol · {activeSession.attemptCount} o‘quvchi qo‘shildi</p>
              </div>
            </div>
            <Button onClick={() => setMonitorId(activeSession.id)} className="gap-1.5">
              Monitorni ochish
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ---------- Jonli monitor ---------- */}
      {monitor && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {monitor.session.status === 'ACTIVE' ? (
                  <Radio className="h-4 w-4 animate-pulse text-emerald-600" aria-hidden />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-slate-500" aria-hidden />
                )}
                {monitor.session.status === 'ACTIVE' ? 'Jonli statistika' : 'Yakuniy natijalar'}
                <span className="text-sm font-normal text-muted-foreground">
                  · {monitor.session.questionCount} savol
                </span>
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5">
                  <Download className="h-4 w-4" aria-hidden /> Natijalarni yuklab olish (CSV)
                </Button>
                {monitor.session.status === 'ACTIVE' && (
                  <Button variant="destructive" size="sm" onClick={finishTest} className="gap-1.5">
                    <Square className="h-4 w-4" aria-hidden /> Testni yakunlash
                  </Button>
                )}
              </div>
            </div>
            {monitor.session.topicTitles.length > 0 && (
              <p className="text-xs text-muted-foreground">Mavzular: {monitor.session.topicTitles.join(', ')}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {monitor.rows.length === 0 ? (
              <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Users className="h-4 w-4" aria-hidden /> Hozircha hech kim qo‘shilmagan. O‘quvchilar panelida
                „Guruh testi“ paydo bo‘ldi.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left">
                      <th className="px-3 py-2.5 font-semibold">O‘quvchi</th>
                      {monitor.questions.map((q) => (
                        <th
                          key={q.id}
                          className="px-2 py-2.5 text-center font-semibold"
                          title={`${q.order}-savol: ${q.text} (to‘g‘ri: ${q.correct})`}
                        >
                          {q.order}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 text-center font-semibold">Natija</th>
                      <th className="px-3 py-2.5 text-center font-semibold">Ball</th>
                      <th className="px-3 py-2.5 text-center font-semibold">Tanga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitor.rows.map((r) => (
                      <tr key={r.attemptId} className="border-b last:border-0">
                        <td className="px-3 py-2.5 font-medium">{r.name}</td>
                        {r.cells.map((c) => (
                          <td key={c.sessionQuestionId} className="px-2 py-2.5 text-center">
                            {c.isCorrect === null ? (
                              <MinusCircle className="mx-auto h-4 w-4 text-slate-300" aria-label="javob yo'q" />
                            ) : c.isCorrect ? (
                              <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" aria-label="to'g'ri" />
                            ) : (
                              <XCircle className="mx-auto h-4 w-4 text-rose-500" aria-label="xato" />
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-bold',
                              r.percent >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.percent >= 50
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-700'
                            )}
                          >
                            {r.score}/{monitor.session.questionCount} · {r.percent}%
                          </span>
                          {r.status !== 'FINISHED' && (
                            <span className="ml-1 text-xs text-muted-foreground">· jarayonda</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center font-medium text-emerald-700">+{r.pointsEarned}</td>
                        <td className="px-3 py-2.5 text-center font-medium text-amber-700">+{r.moneyEarned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Savollar bo'yicha statistika */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {monitor.questions.map((q) => {
                const totalAnswers = q.correctCount + q.wrongCount
                const pct = totalAnswers > 0 ? Math.round((q.correctCount / totalAnswers) * 100) : 0
                return (
                  <div key={q.id} className="rounded-lg border p-3">
                    <p className="line-clamp-2 text-xs font-medium">
                      {q.order}. {q.text}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      To‘g‘ri: <span className="font-semibold text-emerald-700">{q.correctCount}</span> · Xato:{' '}
                      <span className="font-semibold text-rose-600">{q.wrongCount}</span> · {pct}%
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---------- Yakunlangan testlar tarixi ---------- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-emerald-600" aria-hidden /> Yakunlangan guruh testlari
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 && <p className="text-sm text-muted-foreground">Hozircha yakunlangan test yo‘q.</p>}
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium">{fmtDate(h.date)}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.questionCount} savol · {h.participants} o‘quvchi
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      h.avgPercent >= 80 ? 'bg-emerald-100 text-emerald-800' : h.avgPercent >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'
                    )}
                  >
                    o‘rtacha {h.avgPercent}%
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => setMonitorId(h.id)}>
                    Natijalar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monitor yuklanish holati */}
      {monitorId && !monitor && (
        <div className="flex items-center gap-2 p-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Monitor yuklanmoqda...
          <Skeleton className="ml-2 h-4 w-24" />
        </div>
      )}
    </div>
  )
}

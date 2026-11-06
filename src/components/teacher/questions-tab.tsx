'use client'

// Savollar bazasi: mavzuni tanlab savol qo'shish / ko'rish / o'chirish
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { apiGet, apiPost, apiDelete } from '@/lib/client'
import { Plus, Trash2, Loader2, CheckCircle2, FileQuestion } from 'lucide-react'
import type { ModuleTree, QuestionView } from '@/lib/types'
import { cn } from '@/lib/utils'

export function QuestionsTab() {
  const [modules, setModules] = useState<ModuleTree[]>([])
  const [questions, setQuestions] = useState<QuestionView[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Yangi savol formasi
  const [text, setText] = useState('')
  const [opts, setOpts] = useState({ A: '', B: '', C: '', D: '' })
  const [correct, setCorrect] = useState('A')
  const [saving, setSaving] = useState(false)

  const topicMap = useMemo(() => {
    const map = new Map<string, { title: string; covered: boolean; moduleTitle: string }>()
    for (const m of modules) {
      for (const t of m.topics) {
        map.set(t.id, { title: t.title, covered: t.isCovered, moduleTitle: m.title })
      }
    }
    return map
  }, [modules])

  const loadModules = useCallback(async () => {
    try {
      const tree = await apiGet<ModuleTree[]>('/api/modules')
      setModules(tree)
      setSelectedTopic((prev) => {
        if (prev && tree.some((m) => m.topics.some((t) => t.id === prev))) return prev
        return tree[0]?.topics[0]?.id ?? ''
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const loadQuestions = useCallback(async (topicId: string) => {
    if (!topicId) {
      setQuestions([])
      return
    }
    setQuestions(await apiGet<QuestionView[]>(`/api/questions?topicId=${topicId}`))
  }, [])

  useEffect(() => {
    loadModules()
  }, [loadModules])

  useEffect(() => {
    loadQuestions(selectedTopic).catch(() => {})
  }, [selectedTopic, loadQuestions])

  async function addQuestion() {
    if (!selectedTopic) return
    if (!text.trim() || !opts.A.trim() || !opts.B.trim() || !opts.C.trim() || !opts.D.trim()) {
      toast({ title: 'Barcha maydonlarni to‘ldiring', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      await apiPost('/api/questions', { topicId: selectedTopic, text, ...opts, correct })
      setText('')
      setOpts({ A: '', B: '', C: '', D: '' })
      setCorrect('A')
      toast({ title: 'Savol qo‘shildi' })
      loadQuestions(selectedTopic)
      loadModules()
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function removeQuestion(id: string) {
    try {
      await apiDelete(`/api/questions?id=${id}`)
      loadQuestions(selectedTopic)
      loadModules()
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Yuklanmoqda...
      </div>
    )
  }

  const topicInfo = topicMap.get(selectedTopic)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Yangi savol qo'shish */}
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-emerald-600" aria-hidden /> Yangi savol qo‘shish
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Mavzu</Label>
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="min-h-11">
                <SelectValue placeholder="Mavzuni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((m) => (
                  <div key={m.id}>
                    <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{m.title}</p>
                    {m.topics.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title} {t.isCovered ? '✔' : ''} ({t.questionCount})
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {topicInfo && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {topicInfo.moduleTitle} · {topicInfo.covered ? 'o‘tilgan (galochka belgilangan)' : 'o‘tilmagan'}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="q-text">Savol matni</Label>
            <Input
              id="q-text"
              placeholder="Masalan: 24 × 6 nechaga teng?"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {(['A', 'B', 'C', 'D'] as const).map((k) => (
              <div key={k} className="space-y-1">
                <Label htmlFor={`opt-${k}`} className="text-xs">
                  Variant {k} {correct === k && '(to‘g‘ri javob)'}
                </Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrect(k)}
                    aria-label={`${k} ni to'g'ri javob deb belgilash`}
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors',
                      correct === k ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-border text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {k}
                  </button>
                  <Input
                    id={`opt-${k}`}
                    value={opts[k]}
                    onChange={(e) => setOpts((o) => ({ ...o, [k]: e.target.value }))}
                    placeholder={`${k} variant javobi`}
                    className="h-9"
                  />
                </div>
              </div>
            ))}
          </div>

          <Button onClick={addQuestion} disabled={saving} className="w-full min-h-11 gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" aria-hidden />} Savolni saqlash
          </Button>
        </CardContent>
      </Card>

      {/* Mavzudagi savollar ro'yxati */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileQuestion className="h-4 w-4 text-emerald-600" aria-hidden />
            Savollar {topicInfo && <span className="text-sm font-normal text-muted-foreground">— {topicInfo.title}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedTopic && <p className="text-sm text-muted-foreground">Avval mavzu tanlang.</p>}
          {selectedTopic && questions.length === 0 && (
            <p className="text-sm text-muted-foreground">Bu mavzuda hozircha savol yo‘q. Chapdan qo‘shing.</p>
          )}
          <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div key={q.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">
                    {idx + 1}. {q.text}
                  </p>
                  <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)} aria-label="Savolni o'chirish" className="shrink-0">
                    <Trash2 className="h-4 w-4 text-rose-400" />
                  </Button>
                </div>
                <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                  {([['A', 'optionA'], ['B', 'optionB'], ['C', 'optionC'], ['D', 'optionD']] as const).map(
                    ([k, field]) => (
                      <p
                        key={k}
                        className={cn(
                          'flex items-center gap-1 rounded px-1.5 py-0.5',
                          q.correct === k ? 'bg-emerald-50 font-semibold text-emerald-800' : 'text-muted-foreground'
                        )}
                      >
                        <Badge variant="outline" className="h-4 min-w-4 px-0.5 text-[10px]">
                          {k}
                        </Badge>
                        {q[field]}
                        {q.correct === k && <CheckCircle2 className="h-3 w-3" aria-hidden />}
                      </p>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

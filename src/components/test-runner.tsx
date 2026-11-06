'use client'

// Savolni birma-bir ko'rsatib javob olish komponenti (guruh va individual test uchun umumiy)
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, ChevronRight, Send, Loader2 } from 'lucide-react'
import type { AttemptQuestion } from '@/lib/types'

export function TestRunner({
  questions,
  title,
  subtitle,
  onSubmitAnswer,
  onFinish,
}: {
  questions: AttemptQuestion[]
  title: string
  subtitle?: string
  onSubmitAnswer: (sessionQuestionId: string, selected: string) => Promise<void>
  onFinish: () => void
}) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [lastResult, setLastResult] = useState<boolean | null>(null)

  const question = questions[index]
  const total = questions.length
  const isLast = index === total - 1

  if (!question) return null

  const options: { key: string; label: string }[] = [
    { key: 'A', label: question.optionA },
    { key: 'B', label: question.optionB },
    { key: 'C', label: question.optionC },
    { key: 'D', label: question.optionD },
  ]

  async function handleConfirm() {
    if (!selected || sending) return
    setSending(true)
    try {
      await onSubmitAnswer(question.id, selected)
      setLastResult(null) // javob to'g'ri/xato ekranda darhol ko'rsatilmaydi (odil baholash)
      setSelected(null)
      if (isLast) {
        onFinish()
      } else {
        setIndex((i) => i + 1)
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <Badge variant="secondary" className="text-sm">
          {index + 1} / {total}
        </Badge>
      </div>

      <Progress value={((index + 1) / total) * 100} className="h-2" />

      <Card>
        <CardContent className="p-6">
          <p className="mb-5 text-base font-medium leading-relaxed sm:text-lg">{question.text}</p>
          <div className="grid gap-2.5">
            {options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSelected(opt.key)}
                disabled={sending}
                className={`flex min-h-11 items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors sm:text-base ${
                  selected === opt.key
                    ? 'border-emerald-600 bg-emerald-50 font-medium text-emerald-800'
                    : 'border-border bg-background hover:bg-accent'
                }`}
                aria-pressed={selected === opt.key}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                    selected === opt.key ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-border'
                  }`}
                >
                  {opt.key}
                </span>
                {opt.label}
              </button>
            ))}
          </div>

          {lastResult === true && <p className="mt-3 flex items-center gap-1 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" /> To‘g‘ri!</p>}
          {lastResult === false && <p className="mt-3 flex items-center gap-1 text-sm text-rose-700"><XCircle className="h-4 w-4" /> Xato.</p>}

          <div className="mt-6 flex justify-end">
            <Button onClick={handleConfirm} disabled={!selected || sending} className="min-h-11 px-6">
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLast ? (
                <>
                  Tugatish <Send className="h-4 w-4" />
                </>
              ) : (
                <>
                  Keyingi <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

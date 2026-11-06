'use client'

// Modullar va mavzular: "galochka" (o'tilgan belgisi) shu yerda qo'yiladi
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/client'
import {
  Plus,
  Trash2,
  FolderTree,
  CheckSquare,
  Square,
  FileQuestion,
  Loader2,
  Info,
} from 'lucide-react'
import type { ModuleTree } from '@/lib/types'

export function ModulesTab() {
  const [modules, setModules] = useState<ModuleTree[]>([])
  const [loading, setLoading] = useState(true)
  const [newModule, setNewModule] = useState('')
  const [topicDrafts, setTopicDrafts] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const load = useCallback(async () => {
    try {
      setModules(await apiGet<ModuleTree[]>('/api/modules'))
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  async function addModule() {
    if (!newModule.trim()) return
    try {
      await apiPost('/api/modules', { title: newModule })
      setNewModule('')
      toast({ title: 'Modul qo‘shildi' })
      load()
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    }
  }

  async function addTopic(moduleId: string) {
    const title = topicDrafts[moduleId]?.trim()
    if (!title) return
    try {
      await apiPost('/api/topics', { moduleId, title })
      setTopicDrafts((d) => ({ ...d, [moduleId]: '' }))
      load()
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    }
  }

  async function toggleCovered(topicId: string, isCovered: boolean) {
    try {
      await apiPatch('/api/topics', { id: topicId, isCovered })
      load()
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    }
  }

  async function removeModule(id: string) {
    if (!confirm('Modulni barcha mavzu va savollari bilan o‘chirilsinmi?')) return
    try {
      await apiDelete(`/api/modules?id=${id}`)
      toast({ title: 'Modul o‘chirildi' })
      load()
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    }
  }

  async function removeTopic(id: string) {
    if (!confirm('Mavzu va undagi savollar o‘chirilsinmi?')) return
    try {
      await apiDelete(`/api/topics?id=${id}`)
      load()
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

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-emerald-600" aria-hidden /> Qanday ishlaydi?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Har darsda yangi mavzu qo‘shing va o‘tilgan mavzuga <strong className="text-foreground">galochka</strong> belgilang.
          Testlar <strong className="text-foreground">faqat galochka belgilangan mavzulardan</strong> generatsiya qilinadi —
          shu sababli o‘quvchi o‘tmagan mavzudan test ishlay olmaydi.
        </CardContent>
      </Card>

      {/* Yangi modul */}
      <Card>
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row">
          <Input
            placeholder="Yangi modul nomi (masalan: 7-modul: Kasrlar)"
            value={newModule}
            onChange={(e) => setNewModule(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addModule()}
          />
          <Button onClick={addModule} className="gap-1.5 whitespace-nowrap">
            <Plus className="h-4 w-4" aria-hidden /> Modul qo‘shish
          </Button>
        </CardContent>
      </Card>

      {modules.length === 0 && (
        <p className="p-8 text-center text-sm text-muted-foreground">Hozircha modullar yo‘q. Yuqoridan qo‘shing.</p>
      )}

      <div className="space-y-4">
        {modules.map((m) => {
          const coveredCount = m.topics.filter((t) => t.isCovered).length
          return (
            <Card key={m.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FolderTree className="h-4 w-4 text-emerald-600" aria-hidden /> {m.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <CheckSquare className="h-3 w-3" aria-hidden /> {coveredCount}/{m.topics.length}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => removeModule(m.id)} aria-label="Modulni o'chirish">
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {m.topics.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                  >
                    <Checkbox
                      id={`topic-${t.id}`}
                      checked={t.isCovered}
                      onCheckedChange={(v) => toggleCovered(t.id, v === true)}
                      className="h-5 w-5"
                      aria-label={`${t.title} o'tilgan belgisi`}
                    />
                    <label
                      htmlFor={`topic-${t.id}`}
                      className="flex-1 cursor-pointer text-sm font-medium leading-snug"
                    >
                      {t.title}
                    </label>
                    <Badge variant="outline" className="gap-1 text-xs">
                      <FileQuestion className="h-3 w-3" aria-hidden /> {t.questionCount} savol
                    </Badge>
                    {!t.isCovered && (
                      <Badge variant="secondary" className="hidden gap-1 text-xs sm:inline-flex">
                        <Square className="h-3 w-3" aria-hidden /> o‘tilmagan
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => removeTopic(t.id)} aria-label="Mavzuni o'chirish">
                      <Trash2 className="h-4 w-4 text-rose-400" />
                    </Button>
                  </div>
                ))}

                {/* Yangi mavzu */}
                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder="Yangi mavzu nomi"
                    value={topicDrafts[m.id] ?? ''}
                    onChange={(e) => setTopicDrafts((d) => ({ ...d, [m.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addTopic(m.id)}
                    className="h-9"
                  />
                  <Button variant="outline" size="sm" onClick={() => addTopic(m.id)} className="gap-1 whitespace-nowrap">
                    <Plus className="h-3.5 w-3.5" aria-hidden /> Mavzu
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

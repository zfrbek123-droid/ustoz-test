'use client'

// O'quvchilar boshqaruvi: ro'yxat, qo'shish, natijalarni nolga qaytarish, o'chirish
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/client'
import { iconForOrder } from '@/lib/visual'
import { LevelBadge } from '@/components/level-badge'
import { Plus, Trash2, Loader2, RotateCcw, Users } from 'lucide-react'
import type { StudentRow } from '@/lib/types'

export function StudentsTab() {
  const [rows, setRows] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const load = useCallback(async () => {
    try {
      setRows(await apiGet<StudentRow[]>('/api/students'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  async function add() {
    if (!name.trim() || !login.trim() || !password.trim()) {
      toast({ title: 'Barcha maydonlarni to‘ldiring', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      await apiPost('/api/students', { name, login, password })
      setName('')
      setLogin('')
      setPassword('')
      toast({ title: 'O‘quvchi qo‘shildi' })
      load()
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function resetProgress(id: string) {
    if (!confirm('O‘quvchining balli, tangasi, jihozlari va test tarixi nolga qaytarilsinmi?')) return
    try {
      await apiPatch('/api/students', { id, resetProgress: true })
      toast({ title: 'Natijalar nolga qaytarildi' })
      load()
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    }
  }

  async function remove(id: string) {
    if (!confirm('O‘quvchi o‘chirilsinmi?')) return
    try {
      await apiDelete(`/api/students?id=${id}`)
      toast({ title: 'O‘quvchi o‘chirildi' })
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
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Qo'shish formasi */}
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-emerald-600" aria-hidden /> Yangi o‘quvchi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="st-name">Ism familiya</Label>
            <Input id="st-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ali Valiyev" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-login">Login</Label>
            <Input id="st-login" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="ali" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-pass">Parol</Label>
            <Input id="st-pass" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="1234" />
          </div>
          <Button onClick={add} disabled={saving} className="min-h-11 w-full gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" aria-hidden />} Qo‘shish
          </Button>
        </CardContent>
      </Card>

      {/* Ro'yxat */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-emerald-600" aria-hidden /> O‘quvchilar ({rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {rows.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    login: {s.login} · {s.testsTaken} test · o‘rtacha {s.avgPercent}%
                  </p>
                </div>
                <LevelBadge order={s.levelOrder} name={s.levelName} icon={iconForOrder(s.levelOrder)} size="sm" />
                <div className="flex gap-1.5 text-xs">
                  <Badge variant="secondary" className="text-emerald-700">{s.points} ball</Badge>
                  <Badge variant="secondary" className="text-amber-700">{s.money} 🪙</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => resetProgress(s.id)} aria-label="Natijalarni nolga qaytarish" title="Natijalarni nolga qaytarish">
                    <RotateCcw className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(s.id)} aria-label="O'chirish" title="O'chirish">
                    <Trash2 className="h-4 w-4 text-rose-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

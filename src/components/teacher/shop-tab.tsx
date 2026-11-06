'use client'

// Do'kon boshqaruvi: jihozlar ro'yxati, qo'shish/tahrirlash/o'chirish
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { apiGet, apiPut, apiDelete } from '@/lib/client'
import { Plus, Trash2, Store, Pencil, Loader2, Info } from 'lucide-react'
import type { ShopItemView, LevelsResponse } from '@/lib/types'

interface EditState {
  id?: string
  name: string
  icon: string
  price: string
  minLevel: string
  requiredForLevel: string
}

const EMPTY: EditState = { name: '', icon: '📦', price: '', minLevel: '1', requiredForLevel: '0' }

export function ShopTab({ user }: { user: { id: string } }) {
  const [items, setItems] = useState<ShopItemView[]>([])
  const [levels, setLevels] = useState<LevelsResponse['levels']>([])
  const [edit, setEdit] = useState<EditState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const load = useCallback(async () => {
    const [shopRes, levelsRes] = await Promise.all([
      apiGet<{ items: ShopItemView[] }>(`/api/shop?userId=${user.id}`),
      apiGet<LevelsResponse>('/api/levels'),
    ])
    setItems(shopRes.items)
    setLevels(levelsRes.levels)
  }, [user.id])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  async function save() {
    if (!edit.name.trim() || !edit.price) {
      toast({ title: 'Nom va narxni kiriting', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      await apiPut('/api/shop', { teacherId: user.id, ...edit, price: Number(edit.price) })
      setEdit(EMPTY)
      toast({ title: 'Jihoz saqlandi' })
      load()
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Jihoz o‘chirilsinmi?')) return
    try {
      await apiDelete(`/api/shop?teacherId=${user.id}&id=${id}`)
      load()
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    }
  }

  function startEdit(item: ShopItemView) {
    setEdit({
      id: item.id,
      name: item.name,
      icon: item.icon,
      price: String(item.price),
      minLevel: String(item.minLevel),
      requiredForLevel: String(item.requiredForLevel),
    })
  }

  const levelName = (order: number) => levels.find((l) => l.order === order)?.name ?? `${order}`

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Forma */}
      <Card className="h-fit lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4 text-emerald-600" aria-hidden /> {edit.id ? 'Jihozni tahrirlash' : 'Yangi jihoz'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3.5">
          <div className="grid grid-cols-[70px_1fr] gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="si-icon">Emoji</Label>
              <Input id="si-icon" value={edit.icon} onChange={(e) => setEdit((s) => ({ ...s, icon: e.target.value }))} className="text-center" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="si-name">Nomi</Label>
              <Input id="si-name" value={edit.name} onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))} placeholder="Kalkulyator" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="si-price">Narxi (tanga)</Label>
            <Input id="si-price" type="number" min={1} value={edit.price} onChange={(e) => setEdit((s) => ({ ...s, price: e.target.value }))} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nechinchi darajadan</Label>
              <Select value={edit.minLevel} onValueChange={(v) => setEdit((s) => ({ ...s, minLevel: v }))}>
                <SelectTrigger className="min-h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (
                    <SelectItem key={l.id} value={String(l.order)}>{l.order} · {l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Qaysi daraja uchun shart</Label>
              <Select value={edit.requiredForLevel} onValueChange={(v) => setEdit((s) => ({ ...s, requiredForLevel: v }))}>
                <SelectTrigger className="min-h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Ixtiyoriy (shart emas)</SelectItem>
                  {levels.filter((l) => l.order > 1).map((l) => (
                    <SelectItem key={l.id} value={String(l.order)}>{l.order} · {l.name} ga o'tish uchun</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="min-h-11 flex-1 gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" aria-hidden />}
              {edit.id ? 'Saqlash' : 'Qo‘shish'}
            </Button>
            {edit.id && (
              <Button variant="outline" onClick={() => setEdit(EMPTY)} className="min-h-11">
                Bekor
              </Button>
            )}
          </div>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Darajaga o‘tish uchun 3-4 ta jihoz shart qilib belgilanadi. O‘quvchi shartli jihozlarni olmasa, balli yetsa ham
            darajasi oshmaydi.
          </p>
        </CardContent>
      </Card>

      {/* Ro'yxat */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Jihozlar ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5">
                <span className="text-2xl" aria-hidden>{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.price} tanga · {item.minLevel}-darajadan sotib olinadi
                  </p>
                </div>
                {item.requiredForLevel > 0 ? (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    {item.requiredForLevel}-daraja uchun shart
                  </Badge>
                ) : (
                  <Badge variant="secondary">ixtiyoriy</Badge>
                )}
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(item)} aria-label="Tahrirlash">
                    <Pencil className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(item.id)} aria-label="O'chirish">
                    <Trash2 className="h-4 w-4 text-rose-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {items.length > 0 && levels.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Joriy shartli jihozlar:{' '}
              {levels
                .filter((l) => l.order > 1)
                .map((l) => `${l.name} ga: ${items.filter((i) => i.requiredForLevel === l.order).length} ta`)
                .join(' · ')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

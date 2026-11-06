'use client'

// Darajalar va ball sozlamalari: avtomatik hisoblash + qo'lda tahrirlash + mukofot stavkalari
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { apiGet, apiPatch } from '@/lib/client'
import { DynIcon } from '@/components/dyn-icon'
import { Settings2, Calculator, Coins, Loader2, Save, Info } from 'lucide-react'
import type { LevelsResponse } from '@/lib/types'

export function LevelsTab({ user }: { user: { id: string } }) {
  const [levels, setLevels] = useState<LevelsResponse['levels']>([])
  const [settings, setSettings] = useState<LevelsResponse['settings'] | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const load = useCallback(async () => {
    const res = await apiGet<LevelsResponse>('/api/levels')
    setLevels(res.levels)
    setSettings(res.settings)
  }, [])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  async function save(payload: { levels?: typeof levels; settings?: Partial<LevelsResponse['settings']> }) {
    setSaving(true)
    try {
      await apiPatch('/api/levels', { teacherId: user.id, ...payload })
      toast({ title: 'Sozlamalar saqlandi' })
      await load()
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Modul bo'yicha avtomatik hisoblash: har bir daraja chegirasi = k × (modulesPerLevel × avgPoints)
  function autoCalculate() {
    if (!settings) return
    const step = settings.modulesPerLevel * settings.avgPointsPerModule
    const updated = levels.map((l) => ({
      ...l,
      requiredPoints: l.order === 1 ? 0 : step * (l.order - 1),
    }))
    setLevels(updated)
    toast({
      title: 'Hisoblandi — saqlash tugmasini bosing',
      description: `Har ${settings.modulesPerLevel} modulda daraja oshadi (qadam = ${step} ball)`,
    })
  }

  if (!settings) {
    return (
      <div className="flex items-center gap-2 p-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Yuklanmoqda...
      </div>
    )
  }

  const totalModules = settings.totalModules
  const perLevel = settings.modulesPerLevel
  const impliedLevels = Math.min(6, Math.ceil(totalModules / Math.max(1, perLevel)) + 1)

  return (
    <div className="space-y-5">
      {/* Modulga qarab taqsimlash */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4 text-emerald-600" aria-hidden /> Ballarni modulga qarab taqsimlash
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Masalan: <strong className="text-foreground">30 ta dars modul</strong>, har{' '}
            <strong className="text-foreground">5 modulda</strong> daraja oshsa va bir modul testidan o‘quvchi o‘rtacha{' '}
            <strong className="text-foreground">60 ball</strong> to‘plasa — daraja qadami{' '}
            <strong className="text-foreground">{perLevel * settings.avgPointsPerModule} ball</strong> bo‘ladi.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="st-total">Jami modullar soni</Label>
              <Input
                id="st-total"
                type="number"
                min={1}
                value={settings.totalModules}
                onChange={(e) => setSettings((s) => (s ? { ...s, totalModules: Number(e.target.value) } : s))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-per">Bir daraja uchun modullar</Label>
              <Input
                id="st-per"
                type="number"
                min={1}
                value={settings.modulesPerLevel}
                onChange={(e) => setSettings((s) => (s ? { ...s, modulesPerLevel: Number(e.target.value) } : s))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-avg">Bir moduldan o‘rtacha ball</Label>
              <Input
                id="st-avg"
                type="number"
                min={1}
                value={settings.avgPointsPerModule}
                onChange={(e) => setSettings((s) => (s ? { ...s, avgPointsPerModule: Number(e.target.value) } : s))}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={autoCalculate} className="gap-1.5">
              <Calculator className="h-4 w-4" aria-hidden /> Hisoblash
            </Button>
            <Button onClick={() => save({ settings })} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" aria-hidden />} Saqlash
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Joriy qiymat bo‘yicha {totalModules} modul ≈ {impliedLevels} darajaga to‘g‘ri keladi (6 darajali tizimda har{' '}
            {perLevel} modulda bir daraja).
          </p>
        </CardContent>
      </Card>

      {/* Mukofot stavkalari */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="h-4 w-4 text-emerald-600" aria-hidden /> Mukofot stavkalari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="st-pg">Guruh: har to‘g‘ri javobga ball</Label>
              <Input
                id="st-pg"
                type="number"
                min={0}
                value={settings.pointsPerCorrectGroup}
                onChange={(e) => setSettings((s) => (s ? { ...s, pointsPerCorrectGroup: Number(e.target.value) } : s))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-mg">Guruh: har to‘g‘ri javobga tanga</Label>
              <Input
                id="st-mg"
                type="number"
                min={0}
                value={settings.moneyPerCorrectGroup}
                onChange={(e) => setSettings((s) => (s ? { ...s, moneyPerCorrectGroup: Number(e.target.value) } : s))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-mi">Individual: har to‘g‘ri javobga tanga</Label>
              <Input
                id="st-mi"
                type="number"
                min={0}
                value={settings.moneyPerCorrectIndividual}
                onChange={(e) => setSettings((s) => (s ? { ...s, moneyPerCorrectIndividual: Number(e.target.value) } : s))}
              />
            </div>
          </div>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Individual (uyda) test uchun <strong className="text-foreground">ball berilmaydi — faqat tanga</strong>. Ball faqat
            guruh testidan beriladi.
          </p>
          <Button onClick={() => save({ settings })} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" aria-hidden />} Saqlash
          </Button>
        </CardContent>
      </Card>

      {/* Darajalar jadvali */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4 text-emerald-600" aria-hidden /> Darajalar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {levels.map((l) => {
            return (
              <div key={l.id} className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <DynIcon name={l.icon} className="h-5 w-5" />
                </div>
                <div className="min-w-[120px] flex-1">
                  <Input value={l.name} onChange={(e) => setLevels((arr) => arr.map((x) => (x.id === l.id ? { ...x, name: e.target.value } : x)))} className="h-9" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="shrink-0 text-xs text-muted-foreground">Chegara (umumiy ball):</Label>
                  <Input
                    type="number"
                    min={0}
                    className="w-24 h-9"
                    value={l.requiredPoints}
                    onChange={(e) =>
                      setLevels((arr) => arr.map((x) => (x.id === l.id ? { ...x, requiredPoints: Number(e.target.value) } : x)))
                    }
                  />
                </div>
              </div>
            )
          })}
          <Button onClick={() => save({ levels })} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" aria-hidden />} Darajalarni saqlash
          </Button>
          <p className="text-xs text-muted-foreground">
            O‘quvchi darajadan darajaga o‘tish uchun chegara ballini to‘plashi <em>va</em> shu daraja uchun shartli
            jihozlarni do‘kondan sotib olishi kerak.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

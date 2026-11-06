'use client'

// Do'kon: jihozlar, sotib olish, keyingi daraja shartli jihozlari
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { apiGet, apiPost } from '@/lib/client'
import { cn } from '@/lib/utils'
import { Coins, CheckCircle2, Lock, Store, PartyPopper, Loader2 } from 'lucide-react'
import type { SessionUser, ShopResponse } from '@/lib/types'

export function ShopView({ user, onDataChanged }: { user: SessionUser; onDataChanged: () => void }) {
  const [data, setData] = useState<ShopResponse | null>(null)
  const [buying, setBuying] = useState<string | null>(null)
  const [levelUpMsg, setLevelUpMsg] = useState<string | null>(null)
  const { toast } = useToast()

  const load = useCallback(async () => {
    setData(await apiGet<ShopResponse>(`/api/shop?userId=${user.id}`))
  }, [user.id])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  async function buy(itemId: string, itemName: string) {
    setBuying(itemId)
    try {
      const res = await apiPost<{ ok: boolean; levelUp: { from: number; to: number } | null }>('/api/shop', {
        userId: user.id,
        itemId,
      })
      if (res.levelUp) {
        setLevelUpMsg(`${res.levelUp.to}-darajaga o‘tdingiz — ${itemName} sotib olindi va shart bajarildi! 🎉`)
      }
      toast({ title: 'Jihoz sotib olindi', description: `${itemName} endi sizniki ✔` })
      await load()
      onDataChanged()
    } catch (e) {
      toast({ title: 'Xatolik', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    } finally {
      setBuying(null)
    }
  }

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    )
  }

  const nextRequiredIds = new Set(data.nextRequired.map((r) => r.item.id))
  const ownedSet = new Set(data.ownedItemIds)

  const groups: { title: string; hint?: string; items: typeof data.items }[] = [
    {
      title: 'Keyingi daraja uchun shartli jihozlar',
      hint: data.nextLevel ? `${data.nextLevel.name} darajasiga o‘tish uchun barchasini sotib olish shart` : undefined,
      items: data.nextRequired.map((r) => r.item),
    },
    {
      title: 'Barcha jihozlar',
      items: data.items.filter((i) => !nextRequiredIds.has(i.id)),
    },
  ]

  return (
    <div className="space-y-5">
      {levelUpMsg && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <p className="flex items-center gap-2 font-medium text-amber-800">
              <PartyPopper className="h-5 w-5" aria-hidden /> {levelUpMsg}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setLevelUpMsg(null)}>
              OK
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Store className="h-5 w-5 text-emerald-600" aria-hidden /> Do‘kon
        </h2>
        <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 font-bold text-amber-700">
          <Coins className="h-5 w-5" aria-hidden /> {data.money} tanga
        </span>
      </div>

      {groups.map((g) =>
        g.items.length === 0 ? null : (
          <section key={g.title} className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">{g.title}</h3>
              {g.hint && <p className="text-xs text-muted-foreground/80">{g.hint}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((item) => {
                const owned = ownedSet.has(item.id)
                const lockedByLevel = item.minLevel > data.levelOrder
                const notEnoughMoney = data.money < item.price
                const isRequired = nextRequiredIds.has(item.id)
                const requiredOwned = data.nextRequired.find((r) => r.item.id === item.id)?.owned
                return (
                  <Card
                    key={item.id}
                    className={cn(
                      'relative overflow-hidden transition-shadow hover:shadow-md',
                      isRequired && 'border-amber-300',
                      owned && 'border-emerald-300 bg-emerald-50/40'
                    )}
                  >
                    {isRequired && (
                      <Badge className="absolute right-2 top-2 bg-amber-500 hover:bg-amber-500">shart</Badge>
                    )}
                    <CardContent className="p-4">
                      <div className="mb-2 text-4xl" aria-hidden>
                        {item.icon}
                      </div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-0.5 text-sm font-bold text-amber-700">{item.price} tanga</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.minLevel > 1 ? `${item.minLevel}-darajadan sotib olinadi` : 'Har qanday darajada sotib olinadi'}
                      </p>
                      <div className="mt-3">
                        {owned || requiredOwned ? (
                          <p className="flex items-center gap-1 text-sm font-medium text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" aria-hidden /> Sizda bor
                          </p>
                        ) : lockedByLevel ? (
                          <p className="flex items-center gap-1 text-sm text-slate-500">
                            <Lock className="h-4 w-4" aria-hidden /> {item.minLevel}-daraja kerak
                          </p>
                        ) : (
                          <Button
                            size="sm"
                            className="min-h-9 w-full gap-1"
                            disabled={buying === item.id || notEnoughMoney}
                            onClick={() => buy(item.id, item.name)}
                          >
                            {buying === item.id && <Loader2 className="h-4 w-4 animate-spin" />}
                            {notEnoughMoney ? 'Tanga yetarli emas' : 'Sotib olish'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )
      )}
    </div>
  )
}

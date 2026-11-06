import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLevels } from '@/lib/game'
import type { MeResponse } from '@/lib/types'

// O'quvchi (yoki ustoz) ning joriy holati: daraja, ball, tanga, keyingi daraja shartlari
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId kerak' }, { status: 400 })

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 })

    const levels = await getLevels()
    const purchases = await db.purchase.findMany({ where: { userId } })
    const ownedItemIds = purchases.map((p) => p.itemId)
    const ownedSet = new Set(ownedItemIds)

    const level = levels.find((l) => l.order === user.levelOrder) ?? null
    const nextLevel = levels.find((l) => l.order === user.levelOrder + 1) ?? null

    let nextRequired: MeResponse['nextRequired'] = []
    if (nextLevel) {
      const items = await db.shopItem.findMany({ where: { requiredForLevel: nextLevel.order } })
      nextRequired = items.map((item) => ({ item, owned: ownedSet.has(item.id) }))
    }
    const nextRequiredOwnedCount = nextRequired.filter((r) => r.owned).length
    const canLevelUpNow =
      !!nextLevel && user.points >= nextLevel.requiredPoints && nextRequired.length > 0 && nextRequiredOwnedCount === nextRequired.length

    const res: MeResponse = {
      user: {
        id: user.id,
        name: user.name,
        login: user.login,
        role: user.role as 'TEACHER' | 'STUDENT',
        points: user.points,
        money: user.money,
        levelOrder: user.levelOrder,
      },
      level,
      nextLevel,
      ownedItemIds,
      nextRequired,
      nextRequiredOwnedCount,
      canLevelUpNow,
    }
    return NextResponse.json(res)
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

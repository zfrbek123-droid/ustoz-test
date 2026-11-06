import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLevels, checkLevelUp } from '@/lib/game'
import type { ShopResponse } from '@/lib/types'

// Do'kon: jihozlar + o'quvchining egaligi
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId kerak' }, { status: 400 })

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 })

    const [items, purchases, levels] = await Promise.all([
      db.shopItem.findMany({ orderBy: [{ requiredForLevel: 'asc' }, { price: 'asc' }] }),
      db.purchase.findMany({ where: { userId } }),
      getLevels(),
    ])
    const ownedItemIds = purchases.map((p) => p.itemId)
    const ownedSet = new Set(ownedItemIds)
    const nextLevel = levels.find((l) => l.order === user.levelOrder + 1) ?? null
    const nextRequired = nextLevel
      ? (await db.shopItem.findMany({ where: { requiredForLevel: nextLevel.order } })).map((item) => ({
          item,
          owned: ownedSet.has(item.id),
        }))
      : []

    const res: ShopResponse = {
      money: user.money,
      levelOrder: user.levelOrder,
      items,
      ownedItemIds,
      nextLevel,
      nextRequired,
    }
    return NextResponse.json(res)
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// Jihoz qo'shish / tahrirlash (ustoz)
export async function PUT(req: NextRequest) {
  try {
    const { teacherId, id, name, icon, price, minLevel, requiredForLevel } = await req.json()
    const teacher = await db.user.findUnique({ where: { id: teacherId } })
    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Faqat ustoz jihoz qo‘shadi' }, { status: 403 })
    }
    if (!name?.trim() || !Number.isFinite(Number(price))) {
      return NextResponse.json({ error: 'Nomi va narxini kiriting' }, { status: 400 })
    }
    const data = {
      name: String(name).trim(),
      icon: String(icon || '📦'),
      price: Math.max(1, Number(price)),
      minLevel: Math.min(6, Math.max(1, Number(minLevel) || 1)),
      requiredForLevel: Math.min(6, Math.max(0, Number(requiredForLevel) || 0)),
    }
    if (id) {
      await db.shopItem.update({ where: { id }, data })
    } else {
      await db.shopItem.create({ data })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// Jihozni o'chirish (ustoz)
export async function DELETE(req: NextRequest) {
  try {
    const teacherId = req.nextUrl.searchParams.get('teacherId')
    const id = req.nextUrl.searchParams.get('id')
    if (!teacherId || !id) return NextResponse.json({ error: 'teacherId va id kerak' }, { status: 400 })
    const teacher = await db.user.findUnique({ where: { id: teacherId } })
    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Faqat ustoz o‘chiradi' }, { status: 403 })
    }
    await db.shopItem.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'O‘chirib bo‘lmadi — avval sotib olingan bo‘lishi mumkin' }, { status: 500 })
  }
}

// Jihoz sotib olish
export async function POST(req: NextRequest) {
  try {
    const { userId, itemId } = await req.json()
    const user = await db.user.findUnique({ where: { id: userId } })
    const item = await db.shopItem.findUnique({ where: { id: itemId } })
    if (!user || !item) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
    if (user.role !== 'STUDENT') return NextResponse.json({ error: 'Faqat o‘quvchi sotib oladi' }, { status: 403 })

    const owned = await db.purchase.findUnique({
      where: { userId_itemId: { userId, itemId } },
    })
    if (owned) return NextResponse.json({ error: 'Bu jihoz allaqachon sizda bor' }, { status: 400 })
    if (item.minLevel > user.levelOrder) {
      return NextResponse.json({ error: `Bu jihoz ${item.minLevel}-darajadan boshlab sotib olinadi` }, { status: 400 })
    }
    if (user.money < item.price) {
      return NextResponse.json({ error: 'Tanga yetarli emas' }, { status: 400 })
    }

    await db.$transaction([
      db.user.update({ where: { id: userId }, data: { money: { decrement: item.price } } }),
      db.purchase.create({ data: { userId, itemId } }),
    ])
    const levelUp = await checkLevelUp(userId)
    return NextResponse.json({ ok: true, levelUp })
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

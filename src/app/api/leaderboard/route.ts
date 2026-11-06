import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLevels } from '@/lib/game'
import type { LeaderRow } from '@/lib/types'

// Reyting: ball bo'yicha o'quvchilar
export async function GET() {
  try {
    const [users, levels] = await Promise.all([
      db.user.findMany({ where: { role: 'STUDENT' }, orderBy: { points: 'desc' }, take: 50 }),
      getLevels(),
    ])
    const rows: LeaderRow[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      points: u.points,
      money: u.money,
      levelOrder: u.levelOrder,
      levelName: levels.find((l) => l.order === u.levelOrder)?.name ?? '-',
    }))
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

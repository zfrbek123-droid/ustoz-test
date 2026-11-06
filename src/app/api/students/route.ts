import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLevels } from '@/lib/game'
import type { StudentRow } from '@/lib/types'

// O'quvchilar ro'yxati statistika bilan (ustoz)
export async function GET() {
  try {
    const [users, levels] = await Promise.all([
      db.user.findMany({
        where: { role: 'STUDENT' },
        orderBy: { name: 'asc' },
        include: { attempts: { include: { session: { select: { questionCount: true } } } } },
      }),
      getLevels(),
    ])
    const rows: StudentRow[] = users.map((u) => {
      const finished = u.attempts.filter((a) => a.status === 'FINISHED')
      const avgPercent =
        finished.length > 0
          ? Math.round(
              (finished.reduce((sum, a) => sum + (a.session.questionCount > 0 ? a.score / a.session.questionCount : 0), 0) /
                finished.length) *
                100
            )
          : 0
      return {
        id: u.id,
        name: u.name,
        login: u.login,
        points: u.points,
        money: u.money,
        levelOrder: u.levelOrder,
        levelName: levels.find((l) => l.order === u.levelOrder)?.name ?? '-',
        testsTaken: finished.length,
        avgPercent,
      }
    })
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// Yangi o'quvchi qo'shish (ustoz)
export async function POST(req: NextRequest) {
  try {
    const { name, login, password } = await req.json()
    if (!name?.trim() || !login?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Ism, login va parolni kiriting' }, { status: 400 })
    }
    const exists = await db.user.findUnique({ where: { login: String(login).trim().toLowerCase() } })
    if (exists) return NextResponse.json({ error: 'Bu login band qilingan' }, { status: 400 })
    const user = await db.user.create({
      data: {
        name: String(name).trim(),
        login: String(login).trim().toLowerCase(),
        password: String(password),
        role: 'STUDENT',
      },
    })
    return NextResponse.json({ id: user.id })
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// O'quvchini o'chirish yoki ballarini nolga qaytarish (ustoz)
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id kerak' }, { status: 400 })
    await db.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'O‘quvchini o‘chirib bo‘lmadi' }, { status: 500 })
  }
}

// O'quvchi ma'lumotlarini tahrirlash (ball/tanga nolga tushirish)
export async function PATCH(req: NextRequest) {
  try {
    const { id, resetProgress } = await req.json()
    if (!id) return NextResponse.json({ error: 'id kerak' }, { status: 400 })
    if (resetProgress) {
      await db.$transaction([
        db.answer.deleteMany({ where: { attempt: { userId: id } } }),
        db.attempt.deleteMany({ where: { userId: id } }),
        db.purchase.deleteMany({ where: { userId: id } }),
        db.user.update({ where: { id }, data: { points: 0, money: 0, levelOrder: 1 } }),
      ])
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Amalni bajarib bo‘lmadi' }, { status: 500 })
  }
}

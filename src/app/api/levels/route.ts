import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLevels, getSettings } from '@/lib/game'
import type { LevelsResponse } from '@/lib/types'

export async function GET() {
  try {
    const [levels, settings] = await Promise.all([getLevels(), getSettings()])
    const res: LevelsResponse = { levels, settings }
    return NextResponse.json(res)
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// Sozlamalarni yangilash (faqat ustoz):
// - daraja chegiralarini (ball) tahrirlash
// - avtomatik hisoblash: modullar soni, bir daraja uchun modullar soni, o'rtacha ball
// - mukofot stavkalari
export async function PATCH(req: NextRequest) {
  try {
    const { teacherId, levels, settings } = await req.json()
    const teacher = await db.user.findUnique({ where: { id: teacherId } })
    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Faqat ustoz sozlamalarni o‘zgartiradi' }, { status: 403 })
    }

    if (Array.isArray(levels)) {
      for (const l of levels) {
        const order = Number(l.order)
        const requiredPoints = Math.max(0, Number(l.requiredPoints) || 0)
        const name = String(l.name ?? '').trim()
        const existing = await db.level.findUnique({ where: { order } })
        if (existing) {
          await db.level.update({
            where: { order },
            data: {
              requiredPoints,
              ...(name ? { name } : {}),
            },
          })
        }
      }
    }

    if (settings) {
      const allowed = [
        'pointsPerCorrectGroup',
        'moneyPerCorrectGroup',
        'moneyPerCorrectIndividual',
        'totalModules',
        'modulesPerLevel',
        'avgPointsPerModule',
      ]
      for (const key of allowed) {
        if (settings[key] !== undefined && !Number.isNaN(Number(settings[key]))) {
          await db.setting.upsert({
            where: { key },
            update: { value: String(Math.max(0, Number(settings[key]))) },
            create: { key, value: String(Math.max(0, Number(settings[key]))) },
          })
        }
      }
    }

    const [newLevels, newSettings] = await Promise.all([getLevels(), getSettings()])
    const res: LevelsResponse = { levels: newLevels, settings: newSettings }
    return NextResponse.json(res)
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

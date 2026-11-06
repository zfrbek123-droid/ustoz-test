import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { HistoryRow } from '@/lib/types'

// O'quvchining test tarixi
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId kerak' }, { status: 400 })

    const attempts = await db.attempt.findMany({
      where: { userId, status: 'FINISHED' },
      orderBy: { finishedAt: 'desc' },
      take: 50,
      include: { session: { select: { type: true, questionCount: true } } },
    })
    const rows: HistoryRow[] = attempts.map((a) => ({
      id: a.id,
      type: a.session.type as 'GROUP' | 'INDIVIDUAL',
      date: (a.finishedAt ?? a.createdAt).toISOString(),
      correct: a.score,
      total: a.session.questionCount,
      percent: a.session.questionCount > 0 ? Math.round((a.score / a.session.questionCount) * 100) : 0,
      moneyEarned: a.moneyEarned,
      pointsEarned: a.pointsEarned,
    }))
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

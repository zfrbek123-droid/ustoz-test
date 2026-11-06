import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLevels } from '@/lib/game'
import type { OverviewResponse } from '@/lib/types'

// Ustoz boshqaruv paneli: umumiy statistika
export async function GET() {
  try {
    const [studentCount, moduleCount, topics, questionCount, groupSessions, attempts, users, levels] =
      await Promise.all([
        db.user.count({ where: { role: 'STUDENT' } }),
        db.module.count(),
        db.topic.findMany({ select: { isCovered: true } }),
        db.question.count(),
        db.testSession.count({ where: { type: 'GROUP' } }),
        db.attempt.findMany({
          where: { status: 'FINISHED' },
          include: { session: { select: { questionCount: true, type: true } } },
        }),
        db.user.findMany({ where: { role: 'STUDENT' }, orderBy: { points: 'desc' }, take: 5 }),
        getLevels(),
      ])

    const groupAttempts = attempts.filter((a) => a.session.type === 'GROUP')
    const avgPercent =
      groupAttempts.length > 0
        ? Math.round(
            (groupAttempts.reduce(
              (sum, a) => sum + (a.session.questionCount > 0 ? a.score / a.session.questionCount : 0),
              0
            ) /
              groupAttempts.length) *
              100
          )
        : 0

    const recentSessionsRaw = await db.testSession.findMany({
      where: { type: 'GROUP', status: 'FINISHED' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { attempts: true },
    })

    const recentSessions = recentSessionsRaw.map((s) => {
      const finished = s.attempts.filter((a) => a.status === 'FINISHED')
      return {
        id: s.id,
        date: s.createdAt.toISOString(),
        questionCount: s.questionCount,
        participants: finished.length,
        avgPercent:
          finished.length > 0
            ? Math.round(
                (finished.reduce((sum, a) => sum + (s.questionCount > 0 ? a.score / s.questionCount : 0), 0) /
                  finished.length) *
                  100
              )
            : 0,
        status: s.status,
      }
    })

    const res: OverviewResponse = {
      studentCount,
      moduleCount,
      topicCount: topics.length,
      coveredTopicCount: topics.filter((t) => t.isCovered).length,
      questionCount,
      groupSessionCount: groupSessions,
      attemptCount: attempts.length,
      avgPercent,
      topStudents: users.map((u) => ({
        id: u.id,
        name: u.name,
        points: u.points,
        money: u.money,
        levelOrder: u.levelOrder,
        levelName: levels.find((l) => l.order === u.levelOrder)?.name ?? '-',
      })),
      recentSessions,
    }
    return NextResponse.json(res)
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

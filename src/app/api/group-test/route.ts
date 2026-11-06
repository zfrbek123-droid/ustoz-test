import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { finishAttempt } from '@/lib/game'
import type { MonitorData, SessionBrief } from '@/lib/types'

// ?history=1 — yakunlangan guruh testlari ro'yxati
// ?id=... — bitta guruh testining jonli monitori (ustoz)
// parametrsiz — hozirgi faol guruh testi (hamma uchun)
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams

    if (sp.get('history') === '1') {
      const sessions = await db.testSession.findMany({
        where: { type: 'GROUP', status: 'FINISHED' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { attempts: { include: { session: true } } },
      })
      const history = sessions.map((s) => {
        const finished = s.attempts.filter((a) => a.status === 'FINISHED')
        const avgPercent =
          finished.length > 0
            ? Math.round(
                (finished.reduce((sum, a) => sum + (s.questionCount > 0 ? a.score / s.questionCount : 0), 0) /
                  finished.length) *
                  100
              )
            : 0
        return {
          id: s.id,
          date: s.createdAt.toISOString(),
          questionCount: s.questionCount,
          participants: finished.length,
          avgPercent,
          status: s.status,
        }
      })
      return NextResponse.json(history)
    }

    if (sp.get('id')) {
      const id = sp.get('id')!
      const session = await db.testSession.findUnique({
        where: { id },
        include: {
          questions: { orderBy: { order: 'asc' }, include: { question: true, answers: true } },
          attempts: { include: { user: { select: { name: true } }, answers: true } },
        },
      })
      if (!session) return NextResponse.json({ error: 'Test topilmadi' }, { status: 404 })

      const topicIds: string[] = JSON.parse(session.topicIds || '[]')
      const topics = await db.topic.findMany({ where: { id: { in: topicIds } }, select: { title: true } })

      const questions = session.questions.map((sq) => {
        const answers = sq.answers
        const correctCount = answers.filter((a) => a.isCorrect).length
        const wrongCount = answers.filter((a) => !a.isCorrect).length
        return {
          id: sq.id,
          order: sq.order,
          text: sq.question.text,
          correct: sq.question.correct,
          correctCount,
          wrongCount,
        }
      })

      const rows = session.attempts
        .map((at) => {
          const bySq = new Map(at.answers.map((a) => [a.sessionQuestionId, a]))
          const cells = session.questions.map((sq) => {
            const a = bySq.get(sq.id)
            return {
              sessionQuestionId: sq.id,
              selected: a?.selected ?? '',
              isCorrect: a ? a.isCorrect : null,
            }
          })
          const answered = at.answers.length
          return {
            attemptId: at.id,
            userId: at.userId,
            name: at.user.name,
            status: at.status,
            answered,
            score: at.status === 'FINISHED' ? at.score : at.answers.filter((a) => a.isCorrect).length,
            percent: session.questionCount > 0 ? Math.round(((at.status === 'FINISHED' ? at.score : at.answers.filter((a) => a.isCorrect).length) / session.questionCount) * 100) : 0,
            moneyEarned: at.moneyEarned,
            pointsEarned: at.pointsEarned,
            cells,
          }
        })
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

      const data: MonitorData = {
        session: {
          id: session.id,
          status: session.status,
          questionCount: session.questionCount,
          createdAt: session.createdAt.toISOString(),
          finishedAt: session.finishedAt ? session.finishedAt.toISOString() : null,
          topicTitles: topics.map((t) => t.title),
        },
        questions,
        rows,
      }
      return NextResponse.json(data)
    }

    // Faol guruh testi
    const active = await db.testSession.findFirst({
      where: { type: 'GROUP', status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { attempts: true } } },
    })
    if (!active) return NextResponse.json(null)

    const topicIds: string[] = JSON.parse(active.topicIds || '[]')
    const topics = await db.topic.findMany({ where: { id: { in: topicIds } }, select: { title: true } })

    // So'rovda userId berilsa — o'sha o'quvchining urinish holati ham qaytariladi
    const viewerId = sp.get('userId')
    let myAttemptId: string | null = null
    let myAttemptStatus: string | null = null
    if (viewerId) {
      const mine = await db.attempt.findUnique({
        where: { sessionId_userId: { sessionId: active.id, userId: viewerId } },
      })
      if (mine) {
        myAttemptId = mine.id
        myAttemptStatus = mine.status
      }
    }

    const brief: SessionBrief = {
      id: active.id,
      type: 'GROUP',
      status: active.status as 'ACTIVE',
      questionCount: active.questionCount,
      createdAt: active.createdAt.toISOString(),
      topicTitles: topics.map((t) => t.title),
      attemptCount: active._count.attempts,
      myAttemptId,
      myAttemptStatus,
    }
    return NextResponse.json(brief)
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// Guruh testini boshlash (faqat ustoza ruxsat berilgan)
export async function POST(req: NextRequest) {
  try {
    const { teacherId, questionCount, topicIds } = await req.json()
    const teacher = await db.user.findUnique({ where: { id: teacherId } })
    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Faqat ustoz guruh testini boshlashi mumkin' }, { status: 403 })
    }

    const activeExists = await db.testSession.findFirst({ where: { type: 'GROUP', status: 'ACTIVE' } })
    if (activeExists) {
      return NextResponse.json({ error: 'Avval faol guruh testini yakunlang' }, { status: 400 })
    }

    const count = Math.max(1, Math.min(30, Number(questionCount) || 10))

    // Faqat galochka belgilangan (o'tilgan) mavzulardan test generatsiya qilinadi
    const coveredTopics = await db.topic.findMany({
      where: { isCovered: true, id: topicIds && topicIds.length > 0 ? { in: topicIds } : undefined },
      include: { questions: { select: { id: true } } },
    })
    const usableTopics = coveredTopics.filter((t) => t.questions.length > 0)
    if (usableTopics.length === 0) {
      return NextResponse.json({ error: 'Belgilangan mavzularda savollar yo‘q. Avval savol qo‘shing.' }, { status: 400 })
    }

    // Savollarni aralashtirib kerakli sonni tanlaymiz
    const allQuestions = usableTopics.flatMap((t) => t.questions.map((q) => q.id))
    const shuffled = allQuestions.sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, Math.min(count, shuffled.length))

    const session = await db.testSession.create({
      data: {
        type: 'GROUP',
        status: 'ACTIVE',
        questionCount: picked.length,
        createdById: teacherId,
        topicIds: JSON.stringify(usableTopics.map((t) => t.id)),
      },
    })
    await db.sessionQuestion.createMany({
      data: picked.map((qid, i) => ({ sessionId: session.id, questionId: qid, order: i + 1 })),
    })

    return NextResponse.json({ sessionId: session.id, questionCount: picked.length })
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// Guruh testini yakunlash (ustoz) — ishlanmay qolgan urinishlar ham yakunlanadi
export async function PATCH(req: NextRequest) {
  try {
    const { id, teacherId } = await req.json()
    const teacher = await db.user.findUnique({ where: { id: teacherId } })
    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Faqat ustoz testni yakunlashi mumkin' }, { status: 403 })
    }
    const session = await db.testSession.findUnique({
      where: { id },
      include: { attempts: { where: { status: 'IN_PROGRESS' } } },
    })
    if (!session) return NextResponse.json({ error: 'Test topilmadi' }, { status: 404 })

    for (const attempt of session.attempts) {
      await finishAttempt(attempt.id)
    }
    await db.testSession.update({
      where: { id },
      data: { status: 'FINISHED', finishedAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

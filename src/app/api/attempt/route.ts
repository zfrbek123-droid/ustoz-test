import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { finishAttempt } from '@/lib/game'
import type { AttemptState } from '@/lib/types'

// Urinish holatini olish (o'quvchi testni davom ettirishi uchun)
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId')
    const userId = req.nextUrl.searchParams.get('userId')
    if (!sessionId || !userId) return NextResponse.json({ error: 'sessionId va userId kerak' }, { status: 400 })

    const attempt = await db.attempt.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
      include: {
        session: true,
        answers: true,
      },
    })
    if (!attempt) return NextResponse.json(null)

    const sessionQuestions = await db.sessionQuestion.findMany({
      where: { sessionId },
      orderBy: { order: 'asc' },
      include: { question: true },
    })

    const state: AttemptState = {
      attemptId: attempt.id,
      status: attempt.status,
      sessionId,
      sessionType: attempt.session.type as 'GROUP' | 'INDIVIDUAL',
      sessionStatus: attempt.session.status as 'ACTIVE' | 'FINISHED',
      questions: sessionQuestions.map((sq) => ({
        id: sq.id,
        order: sq.order,
        text: sq.question.text,
        optionA: sq.question.optionA,
        optionB: sq.question.optionB,
        optionC: sq.question.optionC,
        optionD: sq.question.optionD,
      })),
      answered: Object.fromEntries(attempt.answers.map((a) => [a.sessionQuestionId, { selected: a.selected, isCorrect: a.isCorrect }])),
    }
    return NextResponse.json(state)
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// Barcha o'quvchi amallari: join-group, generate-individual, answer, finish
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const action = body.action as string

    // ---------- Guruh testiga qo'shilish ----------
    if (action === 'join-group') {
      const { sessionId, userId } = body
      const session = await db.testSession.findUnique({ where: { id: sessionId } })
      if (!session || session.type !== 'GROUP') {
        return NextResponse.json({ error: 'Guruh testi topilmadi' }, { status: 404 })
      }
      if (session.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Bu test allaqachon yakunlangan' }, { status: 400 })
      }
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user || user.role !== 'STUDENT') {
        return NextResponse.json({ error: 'Faqat o‘quvchi qo‘shilishi mumkin' }, { status: 403 })
      }
      const existing = await db.attempt.findUnique({
        where: { sessionId_userId: { sessionId, userId } },
      })
      if (existing && existing.status === 'FINISHED') {
        return NextResponse.json({ error: 'Siz bu testni allaqachon ishlagansiz' }, { status: 400 })
      }
      if (!existing) {
        await db.attempt.create({ data: { sessionId, userId, status: 'IN_PROGRESS' } })
      }
      return NextResponse.json({ ok: true })
    }

    // ---------- Individual (uyda) test generatsiya qilish — faqat o'tilgan mavzulardan ----------
    if (action === 'generate-individual') {
      const { userId, questionCount } = body
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user || user.role !== 'STUDENT') {
        return NextResponse.json({ error: 'Faqat o‘quvchi test ishlashi mumkin' }, { status: 403 })
      }
      const count = Math.max(1, Math.min(30, Number(questionCount) || 10))

      const coveredTopics = await db.topic.findMany({
        where: { isCovered: true },
        include: { questions: { select: { id: true } } },
      })
      const usable = coveredTopics.filter((t) => t.questions.length > 0)
      if (usable.length === 0) {
        return NextResponse.json({ error: 'Hozircha o‘tilgan mavzularda savollar yo‘q' }, { status: 400 })
      }
      const allQ = usable.flatMap((t) => t.questions.map((q) => q.id))
      const picked = allQ.sort(() => Math.random() - 0.5).slice(0, Math.min(count, allQ.length))

      const session = await db.testSession.create({
        data: {
          type: 'INDIVIDUAL',
          status: 'ACTIVE',
          questionCount: picked.length,
          createdById: userId,
          topicIds: JSON.stringify(usable.map((t) => t.id)),
        },
      })
      await db.sessionQuestion.createMany({
        data: picked.map((qid, i) => ({ sessionId: session.id, questionId: qid, order: i + 1 })),
      })
      await db.attempt.create({
        data: { sessionId: session.id, userId, status: 'IN_PROGRESS' },
      })
      return NextResponse.json({ sessionId: session.id, questionCount: picked.length })
    }

    // ---------- Javobni qayd etish ----------
    if (action === 'answer') {
      const { attemptId, sessionQuestionId, selected } = body
      if (!['A', 'B', 'C', 'D'].includes(selected)) {
        return NextResponse.json({ error: 'Variant noto‘g‘ri' }, { status: 400 })
      }
      const attempt = await db.attempt.findUnique({ where: { id: attemptId }, include: { session: true } })
      if (!attempt) return NextResponse.json({ error: 'Urinish topilmadi' }, { status: 404 })
      if (attempt.status !== 'IN_PROGRESS') {
        return NextResponse.json({ error: 'Test yakunlangan' }, { status: 400 })
      }
      if (attempt.session.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Test ustoz tomonidan yakunlangan' }, { status: 400 })
      }
      const sq = await db.sessionQuestion.findUnique({ where: { id: sessionQuestionId } })
      if (!sq || sq.sessionId !== attempt.sessionId) {
        return NextResponse.json({ error: 'Savol topilmadi' }, { status: 404 })
      }
      const already = await db.answer.findUnique({
        where: { attemptId_sessionQuestionId: { attemptId, sessionQuestionId } },
      })
      if (already) return NextResponse.json({ error: 'Bu savolga javob berilgan' }, { status: 400 })

      const question = await db.question.findUnique({ where: { id: sq.questionId } })
      if (!question) return NextResponse.json({ error: 'Savol topilmadi' }, { status: 404 })

      const isCorrect = question.correct === selected
      await db.answer.create({
        data: { attemptId, sessionQuestionId, selected, isCorrect },
      })
      return NextResponse.json({ isCorrect })
    }

    // ---------- Testni tugatish ----------
    if (action === 'finish') {
      const { attemptId } = body
      const attempt = await db.attempt.findUnique({ where: { id: attemptId }, include: { session: true } })
      if (!attempt) return NextResponse.json({ error: 'Urinish topilmadi' }, { status: 404 })
      if (attempt.status === 'FINISHED') {
        return NextResponse.json({ error: 'Allaqachon yakunlangan' }, { status: 400 })
      }
      const result = await finishAttempt(attemptId)
      if (!result) return NextResponse.json({ error: 'Yakunlab bo‘lmadi' }, { status: 400 })

      // Individual sessiyani ham yakunlaymiz
      if (attempt.session.type === 'INDIVIDUAL') {
        await db.testSession.update({
          where: { id: attempt.sessionId },
          data: { status: 'FINISHED', finishedAt: new Date() },
        })
      }

      const level = await db.level.findUnique({ where: { order: (await db.user.findUnique({ where: { id: attempt.userId } }))!.levelOrder } })
      return NextResponse.json({
        correct: result.correct,
        total: result.total,
        moneyEarned: result.moneyEarned,
        pointsEarned: result.pointsEarned,
        levelUp: result.levelUp,
        newLevel: level ? { name: level.name, order: level.order, icon: level.icon } : null,
      })
    }

    return NextResponse.json({ error: 'Noma‘lum amal' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Savollarni olish (mavzu bo'yicha yoki hammasi — usto uchun to'g'ri javob bilan)
export async function GET(req: NextRequest) {
  try {
    const topicId = req.nextUrl.searchParams.get('topicId')
    const questions = await db.question.findMany({
      where: topicId ? { topicId } : undefined,
      include: { topic: { select: { title: true } } },
      orderBy: { id: 'asc' },
    })
    return NextResponse.json(
      questions.map((q) => ({
        id: q.id,
        topicId: q.topicId,
        topicTitle: q.topic.title,
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correct: q.correct,
      }))
    )
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// Yangi savol qo'shish (ustoz)
export async function POST(req: NextRequest) {
  try {
    const { topicId, text, optionA, optionB, optionC, optionD, correct } = await req.json()
    if (!topicId || !text?.trim() || !optionA?.trim() || !optionB?.trim() || !optionC?.trim() || !optionD?.trim()) {
      return NextResponse.json({ error: 'Barcha maydonlarni to‘ldiring' }, { status: 400 })
    }
    if (!['A', 'B', 'C', 'D'].includes(correct)) {
      return NextResponse.json({ error: 'To‘g‘ri javobni belgilang' }, { status: 400 })
    }
    const question = await db.question.create({
      data: {
        topicId,
        text: String(text).trim(),
        optionA: String(optionA).trim(),
        optionB: String(optionB).trim(),
        optionC: String(optionC).trim(),
        optionD: String(optionD).trim(),
        correct,
      },
    })
    return NextResponse.json(question)
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// Savolni o'chirish
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id kerak' }, { status: 400 })
    await db.question.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Savolni o‘chirib bo‘lmadi' }, { status: 500 })
  }
}

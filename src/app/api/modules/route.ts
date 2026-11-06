import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { ModuleTree } from '@/lib/types'

// Modullar daraxti (ustoz va o'quvchilar uchun)
export async function GET() {
  try {
    const modules = await db.module.findMany({
      orderBy: { order: 'asc' },
      include: {
        topics: {
          orderBy: { id: 'asc' },
          include: { _count: { select: { questions: true } } },
        },
      },
    })
    const tree: ModuleTree[] = modules.map((m) => ({
      id: m.id,
      title: m.title,
      order: m.order,
      topics: m.topics.map((t) => ({
        id: t.id,
        title: t.title,
        isCovered: t.isCovered,
        questionCount: t._count.questions,
      })),
    }))
    return NextResponse.json(tree)
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// Yangi modul qo'shish (ustoz)
export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json()
    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: 'Modul nomini kiriting' }, { status: 400 })
    }
    const last = await db.module.findFirst({ orderBy: { order: 'desc' } })
    const created = await db.module.create({
      data: { title: String(title).trim(), order: (last?.order ?? 0) + 1 },
    })
    return NextResponse.json(created)
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// Modulni o'chirish
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id kerak' }, { status: 400 })
    await db.module.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Modulni o‘chirib bo‘lmadi' }, { status: 500 })
  }
}

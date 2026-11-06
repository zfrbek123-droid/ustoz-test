import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Yangi mavzu qo'shish (ustoz)
export async function POST(req: NextRequest) {
  try {
    const { moduleId, title } = await req.json()
    if (!moduleId || !title || !String(title).trim()) {
      return NextResponse.json({ error: 'Modul va mavzu nomi kerak' }, { status: 400 })
    }
    const topic = await db.topic.create({
      data: { moduleId, title: String(title).trim(), isCovered: false },
    })
    return NextResponse.json(topic)
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

// Mavzuni yangilash — asosiy amal: "galochka" (o'tilgan belgisi) qo'yish/olib tashlash
export async function PATCH(req: NextRequest) {
  try {
    const { id, isCovered, title } = await req.json()
    if (!id) return NextResponse.json({ error: 'id kerak' }, { status: 400 })
    const data: { isCovered?: boolean; title?: string } = {}
    if (typeof isCovered === 'boolean') data.isCovered = isCovered
    if (typeof title === 'string' && title.trim()) data.title = title.trim()
    const topic = await db.topic.update({ where: { id }, data })
    return NextResponse.json(topic)
  } catch {
    return NextResponse.json({ error: 'Mavzuni yangilab bo‘lmadi' }, { status: 500 })
  }
}

// Mavzuni o'chirish
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id kerak' }, { status: 400 })
    await db.topic.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Mavzuni o‘chirib bo‘lmadi' }, { status: 500 })
  }
}

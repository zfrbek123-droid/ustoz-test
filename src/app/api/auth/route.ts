import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { login, password } = await req.json()
    if (!login || !password) {
      return NextResponse.json({ error: 'Login va parolni kiriting' }, { status: 400 })
    }
    const user = await db.user.findUnique({ where: { login: String(login).trim().toLowerCase() } })
    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Login yoki parol xato' }, { status: 401 })
    }
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        login: user.login,
        role: user.role,
        points: user.points,
        money: user.money,
        levelOrder: user.levelOrder,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

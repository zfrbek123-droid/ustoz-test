'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { apiPost } from '@/lib/client'
import { GraduationCap, BookOpenCheck, Loader2, Users } from 'lucide-react'
import type { SessionUser } from '@/lib/types'

export function LoginView({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [teacherLogin, setTeacherLogin] = useState('')
  const [teacherPassword, setTeacherPassword] = useState('')
  const [studentLogin, setStudentLogin] = useState('')
  const [studentPassword, setStudentPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function login(l: string, p: string) {
    setError('')
    setLoading(true)
    try {
      const res = await apiPost<{ user: SessionUser }>('/api/auth', { login: l, password: p })
      onLogin(res.user)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 via-background to-background px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
          <GraduationCap className="h-9 w-9" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">TestArena — gamifikatsiyali test platformasi</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Guruh va individual testlar · Ball va darajalar · Do‘kon va jihozlar
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">Tizimga kirish</CardTitle>
          <CardDescription>Rolni tanlab, login va parolni kiriting</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="teacher">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="teacher" className="gap-1.5">
                <GraduationCap className="h-4 w-4" aria-hidden /> Ustoz
              </TabsTrigger>
              <TabsTrigger value="student" className="gap-1.5">
                <BookOpenCheck className="h-4 w-4" aria-hidden /> O‘quvchi
              </TabsTrigger>
            </TabsList>

            <TabsContent value="teacher" className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-login">Login</Label>
                <Input
                  id="t-login"
                  placeholder="ustoz"
                  value={teacherLogin}
                  onChange={(e) => setTeacherLogin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && login(teacherLogin, teacherPassword)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-pass">Parol</Label>
                <Input
                  id="t-pass"
                  type="password"
                  placeholder="ustoz123"
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && login(teacherLogin, teacherPassword)}
                />
              </div>
              <Button className="w-full min-h-11" onClick={() => login(teacherLogin, teacherPassword)} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Kirish
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Demo: <Badge variant="secondary">ustoz / ustoz123</Badge>
              </p>
            </TabsContent>

            <TabsContent value="student" className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-login">Login</Label>
                <Input
                  id="s-login"
                  placeholder="ali"
                  value={studentLogin}
                  onChange={(e) => setStudentLogin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && login(studentLogin, studentPassword)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-pass">Parol</Label>
                <Input
                  id="s-pass"
                  type="password"
                  placeholder="1234"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && login(studentLogin, studentPassword)}
                />
              </div>
              <Button className="w-full min-h-11" onClick={() => login(studentLogin, studentPassword)} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Kirish
              </Button>
              <p className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" aria-hidden /> O‘quvchilar: ali, malika, bekzod... / parol: <Badge variant="secondary">1234</Badge>
              </p>
            </TabsContent>
          </Tabs>

          {error && <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-center text-sm text-rose-700">{error}</p>}
        </CardContent>
      </Card>
    </main>
  )
}

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { User } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

async function getAppUser(supabaseUser: {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}): Promise<User | null> {
  const appUser = await prisma.user.findUnique({ where: { id: supabaseUser.id } })
  if (appUser) return appUser

  if (supabaseUser.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: supabaseUser.email } })
    if (byEmail) return byEmail

    return prisma.user.create({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name:
          typeof supabaseUser.user_metadata?.name === 'string'
            ? supabaseUser.user_metadata.name
            : null,
        displayName:
          typeof supabaseUser.user_metadata?.display_name === 'string'
            ? supabaseUser.user_metadata.display_name
            : typeof supabaseUser.user_metadata?.name === 'string'
              ? supabaseUser.user_metadata.name
              : null,
      },
    })
  }

  return null
}

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  const refreshToken = cookieStore.get('sb-refresh-token')?.value

  if (!accessToken && !refreshToken) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // アクセストークンが有効か確認
  if (accessToken) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser(accessToken)
      if (user) return getAppUser(user)
    } catch {
      // 期限切れの場合はリフレッシュへ
    }
  }

  // アクセストークンが無効 or 不在 → リフレッシュトークンで更新
  if (refreshToken) {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      })
      if (!error && data.session && data.user) {
        cookieStore.set('sb-access-token', data.session.access_token, {
          ...COOKIE_OPTIONS,
          maxAge: 60 * 60 * 24 * 7, // 7日
        })
        cookieStore.set('sb-refresh-token', data.session.refresh_token, {
          ...COOKIE_OPTIONS,
          maxAge: 60 * 60 * 24 * 30, // 30日
        })
        return getAppUser(data.user)
      }
    } catch {
      // リフレッシュ失敗 → 未認証
    }
  }

  return null
}

export async function requireAuth(): Promise<User> {
  const user = await getSessionUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

export function isUnauthorizedError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === 'Unauthorized' || error.name === 'UnauthorizedError')
  )
}

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { User } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value

  if (!accessToken) {
    return null
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser(accessToken)

    if (!user) {
      return null
    }

    // Prismaからユーザー情報を取得
    const appUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (appUser) {
      return appUser
    }

    // 既存データとの不整合に備え、emailでフォールバック検索
    if (user.email) {
      const appUserByEmail = await prisma.user.findUnique({
        where: { email: user.email },
      })

      if (appUserByEmail) {
        return appUserByEmail
      }

      // 初回ログイン時にアプリDB側ユーザーを自動作成
      const createdUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name:
            typeof user.user_metadata?.name === 'string'
              ? user.user_metadata.name
              : null,
          displayName:
            typeof user.user_metadata?.display_name === 'string'
              ? user.user_metadata.display_name
              : typeof user.user_metadata?.name === 'string'
                ? user.user_metadata.name
                : null,
        },
      })

      return createdUser
    }

    return null
  } catch (error) {
    console.error('Error getting session user:', error)
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getSessionUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

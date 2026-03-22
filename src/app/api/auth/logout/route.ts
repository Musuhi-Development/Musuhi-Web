import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    accessToken
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      : undefined
  )

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return new NextResponse(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const response = NextResponse.json({ message: 'Logout successful' })
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')

    return response
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

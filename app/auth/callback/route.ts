import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Create user record if this is their first login (phone nullable after migration)
        await supabase.from('users').upsert(
          { id: user.id },
          { onConflict: 'id', ignoreDuplicates: true }
        )

        const { data: profile } = await supabase
          .from('users')
          .select('phone')
          .eq('id', user.id)
          .single()

        if (!profile?.phone) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}/`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

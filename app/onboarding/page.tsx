import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingClient from '@/components/OnboardingClient'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('phone')
    .eq('id', user.id)
    .single()

  if (profile?.phone) redirect('/')

  return <OnboardingClient userId={user.id} />
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FeedbackClient from '@/components/FeedbackClient'

export const dynamic = 'force-dynamic'

export default async function FeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <FeedbackClient userId={user.id} userEmail={user.email ?? ''} />
}

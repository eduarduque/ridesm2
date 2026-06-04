import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminFeedbackClient from '@/components/AdminFeedbackClient'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'eduarduque_18@hotmail.com'

export default async function AdminFeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  const { data: entries } = await supabase
    .from('feedback')
    .select('id, user_email, category, message, created_at')
    .order('created_at', { ascending: false })

  return <AdminFeedbackClient entries={entries ?? []} />
}

'use client'

const CATEGORY_STYLES: Record<string, string> = {
  bug: 'bg-red-50 text-red-700 border-red-200',
  suggestion: 'bg-blue-50 text-blue-700 border-blue-200',
  general: 'bg-neutral-100 text-neutral-600 border-neutral-200',
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  suggestion: 'Suggestion',
  general: 'General',
}

interface FeedbackEntry {
  id: string
  user_email: string
  category: string
  message: string
  created_at: string
}

interface Props {
  entries: FeedbackEntry[]
}

export default function AdminFeedbackClient({ entries }: Props) {
  return (
    <div className="min-h-screen bg-white pb-32 max-w-md mx-auto w-full border-x border-neutral-100">
      <div className="px-4 pt-6 pb-4 border-b border-neutral-100">
        <h1 className="text-xl font-bold text-neutral-900">Feedback</h1>
        <p className="text-xs text-neutral-400 mt-0.5">{entries.length} submission{entries.length !== 1 ? 's' : ''} — private</p>
      </div>

      {entries.length === 0 ? (
        <div className="px-4 py-16 text-center text-neutral-400 text-sm">
          No feedback yet.
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {entries.map((entry) => (
            <li key={entry.id} className="px-4 py-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${CATEGORY_STYLES[entry.category] ?? CATEGORY_STYLES.general}`}>
                  {CATEGORY_LABELS[entry.category] ?? entry.category}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {new Date(entry.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">{entry.message}</p>
              <p className="text-[11px] text-neutral-400">{entry.user_email}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

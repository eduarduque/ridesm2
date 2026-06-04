import type { Message } from '@/lib/types'

interface Props {
  message: Message
  isMe: boolean
}

export default function ChatBubble({ message, isMe }: Props) {
  const time = new Date(message.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2.5`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isMe
            ? 'bg-brand text-white rounded-tr-none shadow-sm'
            : 'bg-neutral-100 text-neutral-900 rounded-tl-none border border-neutral-200/30'
        }`}
      >
        <p className="break-words font-medium">{message.body}</p>
        <p className={`text-[9px] font-bold mt-1 tracking-tight ${isMe ? 'text-white/75 text-right' : 'text-neutral-400'}`}>
          {time}
        </p>
      </div>
    </div>
  )
}

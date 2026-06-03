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
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
          isMe
            ? 'bg-brand text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        }`}
      >
        <p className="break-words">{message.body}</p>
        <p className={`text-[10px] mt-1 ${isMe ? 'text-white/70 text-right' : 'text-gray-400'}`}>
          {time}
        </p>
      </div>
    </div>
  )
}

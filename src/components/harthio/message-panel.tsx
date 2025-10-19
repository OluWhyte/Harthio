'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { type Message } from '@/hooks/use-message-panel'

interface MessagePanelProps {
  isOpen: boolean
  onClose: () => void
  messages?: Message[]
  onSendMessage?: (message: string) => void
  className?: string
}

export function MessagePanel({ 
  isOpen, 
  onClose, 
  messages = [], 
  onSendMessage,
  className 
}: MessagePanelProps) {
  const [inputValue, setInputValue] = useState('')
  const messageAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = () => {
    const message = inputValue.trim()
    if (message && onSendMessage) {
      onSendMessage(message)
      setInputValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div
      className={cn(
        // Base styles - fixed positioning from right side
        'fixed right-0 top-[60px] bottom-[60px] bg-white border-l border-gray-300 shadow-lg flex flex-col overflow-hidden transition-transform duration-300 ease-in-out rounded-l-lg z-50',
        // Responsive widths - exactly matching your original CSS
        'w-[400px]', // Default width
        'max-[1024px]:w-[350px] max-[1024px]:ml-[5px]', // Tablet: 350px width with 5px margin from left
        'max-[768px]:w-[320px] max-[768px]:ml-[5px]',   // Small tablet: 320px width with 5px margin from left  
        'max-[480px]:w-[280px] max-[480px]:ml-[5px]',   // Mobile: 280px width with 5px margin from left
        // Transform for slide animation
        isOpen ? 'translate-x-0' : 'translate-x-full',
        className
      )}
    >
      {/* Header */}
      <div className="p-2.5 border-b border-gray-300 flex justify-between items-center bg-rose-50">
        <h2 className="text-lg font-bold text-gray-900 max-[480px]:text-base">Chat</h2>
        <button
          onClick={onClose}
          className="text-xl cursor-pointer text-gray-600 hover:text-rose-600 border-none bg-none p-1 max-[480px]:text-lg"
        >
          ×
        </button>
      </div>

      {/* Message Area */}
      <div 
        ref={messageAreaRef}
        className="flex-1 overflow-y-auto p-2.5 bg-gray-50 flex flex-col space-y-1.5 max-[480px]:p-2 max-[480px]:space-y-1"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'w-full flex',
                message.sender === 'System' 
                  ? 'justify-center' 
                  : message.isOwn 
                    ? 'justify-end' 
                    : 'justify-start'
              )}
            >
              <div className={cn(
                'flex flex-col break-words max-w-[80%]'
              )}
            >
                {message.sender === 'System' ? (
                  <div className="text-center">
                    <span className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-full border border-rose-200">
                      {message.content}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      "text-xs opacity-70 mb-0.5",
                      message.isOwn ? "text-right" : "text-left"
                    )}>
                      {message.sender} - {formatTime(message.timestamp)}
                    </div>
                    <div
                      className={cn(
                        'px-3 py-2 text-sm break-words max-[480px]:px-2 max-[480px]:py-1.5 max-[480px]:text-xs',
                        message.isOwn
                          ? 'bg-rose-500 text-white rounded-tl-2.5 rounded-tr-none rounded-bl-2.5 rounded-br-2.5' // Sent: flat on right, rose brand color
                          : 'bg-gray-200 text-gray-800 border border-gray-300 rounded-tl-none rounded-tr-2.5 rounded-bl-2.5 rounded-br-2.5' // Received: flat on left
                      )}
                    >
                      {message.content}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-2.5 border-t border-gray-300 bg-white flex gap-2.5">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 px-2 py-2 border border-gray-300 rounded text-sm box-border focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent max-[480px]:text-xs"
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputValue.trim()}
          className="px-4 py-2 bg-rose-500 text-white border-none rounded cursor-pointer text-sm hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed max-[480px]:px-3 max-[480px]:text-xs"
        >
          Send
        </button>
      </div>
    </div>
  )
}
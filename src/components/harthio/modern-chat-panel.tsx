'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Message } from '@/hooks/use-message-panel'

interface ModernChatPanelProps {
  isOpen: boolean
  onToggle: () => void
  messages?: Message[]
  onSendMessage?: (message: string) => void
  otherUserName?: string
  otherUserInitials?: string
  className?: string
}

export function ModernChatPanel({ 
  isOpen, 
  onToggle, 
  messages = [], 
  onSendMessage,
  otherUserName = 'Other User',
  otherUserInitials = 'OU',
  className 
}: ModernChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
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
      
      // Simulate typing indicator
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
      }, 2000)
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
      hour12: false 
    })
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[999]"
          onClick={onToggle}
        />
      )}

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-white flex flex-col transition-transform duration-400 ease-out z-[1000]',
          'h-[70vh] max-h-[600px] rounded-t-[20px] shadow-[0_-5px_25px_rgba(0,0,0,0.2)]',
          // Mobile responsive
          'max-md:h-[80vh] max-md:rounded-t-[15px]',
          'max-sm:h-[85vh]',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          className
        )}
      >
        {/* Chat Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-[20px] max-md:p-4 max-sm:p-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
              {otherUserInitials}
            </div>
            
            {/* User Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1 max-sm:text-base">
                {otherUserName}
              </h2>
              <p className="text-xs text-gray-600 m-0">
                Online • Last seen just now
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onToggle}
            className="w-10 h-10 rounded-full bg-gray-100 border-none flex justify-center items-center cursor-pointer text-gray-600 text-lg transition-all duration-200 hover:bg-red-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Area */}
        <div 
          ref={messageAreaRef}
          className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-[#f5f7fb] max-md:p-4 max-sm:p-3"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#c5c5c5 #f1f1f1'
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'max-w-[75%] animate-in slide-in-from-bottom-2 duration-300',
                'max-sm:max-w-[85%]',
                message.sender === 'System' 
                  ? 'self-center w-full text-center' 
                  : message.isOwn 
                    ? 'self-end' 
                    : 'self-start'
              )}
            >
              {message.sender === 'System' ? (
                <div className="text-center">
                  <span className="text-xs text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    {message.content}
                  </span>
                </div>
              ) : (
                <>
                  <div
                    className={cn(
                      'p-3 rounded-[18px] break-words shadow-sm',
                      message.isOwn
                        ? 'bg-gradient-to-r from-rose-500 to-teal-500 text-white rounded-br-[5px]'
                        : 'bg-white text-gray-800 rounded-bl-[5px] shadow-[0_2px_5px_rgba(0,0,0,0.05)]'
                    )}
                  >
                    {message.content}
                  </div>
                  
                  <div className={cn(
                    'flex justify-between text-xs mt-1 px-2 text-gray-400',
                    message.isOwn ? 'justify-end' : 'justify-start'
                  )}>
                    <span>{message.isOwn ? 'You' : message.sender}</span>
                    <span className="ml-2">{formatTime(message.timestamp)}</span>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="self-start max-w-[75%]">
              <div className="p-3 bg-white rounded-[18px] rounded-bl-[5px] shadow-[0_2px_5px_rgba(0,0,0,0.05)] mb-1">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.32s]"></span>
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.16s]"></span>
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white flex gap-3 items-center max-md:p-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 p-3 border border-gray-300 rounded-[24px] outline-none text-sm transition-colors duration-300 focus:border-rose-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="w-11 h-11 rounded-full bg-gradient-to-r from-rose-500 to-teal-500 text-white border-none flex justify-center items-center cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )
}
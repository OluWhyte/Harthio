'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, MessageCircle, Shield, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Message } from '@/hooks/use-message-panel'
import { SessionSafetyReminder } from '@/components/session/session-safety-reminder'

interface ModernChatPanelProps {
  isOpen: boolean
  onToggle: () => void
  messages?: Message[]
  onSendMessage?: (message: string) => void
  otherUserName?: string
  otherUserInitials?: string
  className?: string
  sessionTitle?: string
}

export function ModernChatPanel({ 
  isOpen, 
  onToggle, 
  messages = [], 
  onSendMessage,
  otherUserName = 'Other User',
  otherUserInitials = 'OU',
  className,
  sessionTitle
}: ModernChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSafetyReminder, setShowSafetyReminder] = useState(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const messageAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive (smart behavior)
  useEffect(() => {
    if (messageAreaRef.current) {
      const scrollElement = messageAreaRef.current;
      const isScrolledToBottom = scrollElement.scrollHeight - scrollElement.clientHeight <= scrollElement.scrollTop + 50;
      
      // Only auto-scroll if user is near the bottom (don't interrupt reading older messages)
      if (isScrolledToBottom || messages.length === 1) {
        setTimeout(() => {
          scrollElement.scrollTo({
            top: scrollElement.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [messages])

  // Handle scroll detection for scroll-to-bottom button
  useEffect(() => {
    const scrollElement = messageAreaRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const isScrolledToBottom = scrollElement.scrollHeight - scrollElement.clientHeight <= scrollElement.scrollTop + 50;
      setShowScrollToBottom(!isScrolledToBottom && messages.length > 5);
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [messages.length])

  const scrollToBottom = () => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTo({
        top: messageAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

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
          'fixed bottom-0 bg-white flex flex-col transition-transform duration-400 ease-out z-[1000]',
          'h-[70vh] max-h-[600px] rounded-t-[20px] shadow-[0_-5px_25px_rgba(0,0,0,0.2)]',
          // Responsive width constraints
          'left-0 right-0', // Full width on mobile (default)
          'md:left-1/2 md:transform md:-translate-x-1/2 md:w-[400px]', // Phone-like width on tablet
          'lg:w-[450px]', // Slightly larger on laptop
          // Mobile responsive height
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

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {/* Safety Reminder Button */}
            <button
              onClick={() => setShowSafetyReminder(true)}
              className="w-9 h-9 rounded-full bg-blue-100 border-none flex justify-center items-center cursor-pointer text-blue-600 transition-all duration-200 hover:bg-blue-500 hover:text-white"
              title="Safety & Privacy Guidelines"
            >
              <Shield className="w-4 h-4" />
            </button>
            
            {/* Close Button */}
            <button
              onClick={onToggle}
              className="w-10 h-10 rounded-full bg-gray-100 border-none flex justify-center items-center cursor-pointer text-gray-600 text-lg transition-all duration-200 hover:bg-red-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div 
          ref={messageAreaRef}
          className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-[#f5f7fb] max-md:p-2 max-sm:p-2 scroll-smooth"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#c5c5c5 #f1f1f1',
            WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
            overscrollBehavior: 'contain' // Prevent page scroll when reaching top/bottom
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'max-w-[80%] animate-in slide-in-from-bottom-2 duration-300',
                'max-sm:max-w-[90%]',
                message.sender === 'System' 
                  ? 'self-center w-full text-center' 
                  : message.isOwn 
                    ? 'self-end ml-auto' 
                    : 'self-start mr-auto'
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
                      'p-2 rounded-[12px] break-words shadow-sm text-sm',
                      message.isOwn
                        ? 'bg-rose-500 text-white rounded-br-[5px]'
                        : 'bg-teal-500 text-white rounded-bl-[5px]'
                    )}
                  >
                    {message.content}
                  </div>
                  
                  <div className={cn(
                    'flex justify-between text-xs mt-1 px-1 text-gray-400',
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

          {/* Scroll to Bottom Button */}
          {showScrollToBottom && (
            <div className="absolute bottom-20 right-4">
              <button
                onClick={scrollToBottom}
                className="w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
                title="Scroll to bottom"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
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

      {/* Safety Reminder Modal */}
      <SessionSafetyReminder
        isOpen={showSafetyReminder}
        onClose={() => setShowSafetyReminder(false)}
        sessionTitle={sessionTitle}
      />
    </>
  )
}
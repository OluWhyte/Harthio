'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, User, AlertCircle, Phone, MessageSquare as MessageSquareIcon, ThumbsUp, ThumbsDown } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { type Message } from '@/hooks/use-message-panel'
import { Alert, AlertDescription } from '@/components/ui/alert'

type ChatMode = 'peer' | 'ai';

interface ModernChatPanelProps {
  isOpen: boolean
  onToggle: () => void
  messages?: Message[]
  onSendMessage?: (message: string) => void
  otherUserName?: string
  otherUserInitials?: string
  className?: string
  mode?: ChatMode
  isLoading?: boolean
  showCrisisAlert?: boolean
  onDismissCrisisAlert?: () => void
  onFeedback?: (messageId: string, feedbackType: 'positive' | 'negative', reason?: string, details?: string) => void
}

export function ModernChatPanel({
  isOpen,
  onToggle,
  messages = [],
  onSendMessage,
  otherUserName = 'Other User',
  otherUserInitials = 'OU',
  className,
  mode = 'peer',
  isLoading = false,
  showCrisisAlert = false,
  onDismissCrisisAlert,
  onFeedback
}: ModernChatPanelProps) {
  const router = useRouter()
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messageAreaRef = useRef<HTMLDivElement>(null)
  const [feedbackMessageId, setFeedbackMessageId] = useState<string | null>(null)
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set())

  // AI mode specific
  const isAIMode = mode === 'ai'
  const displayName = isAIMode ? 'Harthio AI' : otherUserName
  const displayInitials = isAIMode ? 'AI' : otherUserInitials

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

      // Show typing indicator for AI mode
      if (isAIMode) {
        setIsTyping(true)
      }
    }
  }

  // Hide typing indicator when new message arrives in AI mode
  useEffect(() => {
    if (isAIMode && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (!lastMessage.isOwn) {
        setIsTyping(false)
      }
    }
  }, [messages, isAIMode])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
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
          className="fixed inset-0 bg-black/50 z-[999] md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Chat Panel - Mobile First */}
      <div
        className={cn(
          // Base styles
          'fixed bg-background flex flex-col transition-all duration-300 ease-out z-[1000]',
          // Mobile (< 768px) - Full screen bottom sheet
          'bottom-0 left-0 right-0',
          'h-[85vh] rounded-t-[20px] shadow-[0_-5px_25px_rgba(0,0,0,0.2)]',
          // Tablet (768px - 1024px) - Side panel
          'md:top-0 md:right-0 md:left-auto md:bottom-0',
          'md:w-[400px] md:h-full md:rounded-none md:shadow-[-5px_0_25px_rgba(0,0,0,0.2)]',
          // Desktop (> 1024px) - Larger side panel
          'lg:w-[500px]',
          // Animation
          isOpen
            ? 'translate-y-0 md:translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-full',
          className
        )}
      >
        {/* Chat Header */}
        <div className={cn(
          "p-4 md:p-5 border-b flex justify-between items-center",
          "bg-card border-border",
          "rounded-t-[20px] md:rounded-none",
          // Minimum touch target for mobile
          "min-h-[60px]"
        )}>
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className={cn(
              "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 relative",
              isAIMode ? "bg-transparent" : "bg-primary text-primary-foreground font-bold text-sm"
            )}>
              {isAIMode ? (
                <>
                  <img
                    src="/logo.svg"
                    alt="Harthio AI"
                    width={40}
                    height={40}
                    className={cn(
                      "rounded-full",
                      isLoading && "animate-pulse"
                    )}
                  />
                </>
              ) : (
                displayInitials
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-0.5 truncate flex items-center gap-2">
                {displayName}
                {isAIMode && (
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20">
                    AI
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {isAIMode ? '24/7 Support Companion' : 'Online • Last seen just now'}
              </p>
            </div>
          </div>

          {/* Close Button - Larger touch target for mobile */}
          <button
            onClick={onToggle}
            className={cn(
              "w-10 h-10 md:w-11 md:h-11 rounded-full",
              "bg-muted hover:bg-destructive",
              "flex justify-center items-center",
              "text-muted-foreground hover:text-destructive-foreground",
              "transition-all duration-200",
              "touch-manipulation" // Better mobile touch
            )}
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crisis Alert */}
        {showCrisisAlert && (
          <div className="p-3 md:p-4 border-b border-destructive/20 bg-destructive/5">
            <Alert variant="destructive" className="border-destructive/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-sm">We're concerned about you. Please reach out for immediate help:</p>
                  <div className="space-y-1 text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span>988 Suicide & Crisis Lifeline</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquareIcon className="h-3 w-3 flex-shrink-0" />
                      <span>Text HOME to 741741</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span>911 for emergencies</span>
                    </div>
                  </div>
                  {onDismissCrisisAlert && (
                    <button
                      onClick={onDismissCrisisAlert}
                      className="mt-2 text-xs underline hover:no-underline touch-manipulation"
                    >
                      I understand
                    </button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Message Area */}
        <div
          ref={messageAreaRef}
          className={cn(
            "flex-1 overflow-y-auto p-3 md:p-4 lg:p-5",
            "flex flex-col gap-3 md:gap-4",
            "bg-muted/30",
            "scrollbar-hide" // Hide scrollbar but keep functionality
          )}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'max-w-[85%] md:max-w-[80%]',
                'animate-in slide-in-from-bottom-2 duration-300',
                message.sender === 'System'
                  ? 'self-center w-full text-center'
                  : message.isOwn
                    ? 'self-end'
                    : 'self-start'
              )}
            >
              {message.sender === 'System' ? (
                <div className="text-center">
                  <span className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 inline-block">
                    {message.content}
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  {/* Avatar for non-own messages */}
                  {!message.isOwn && (
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      isAIMode ? "bg-transparent" : "bg-accent text-accent-foreground text-xs font-bold"
                    )}>
                      {isAIMode ? (
                        <img
                          src="/logo.svg"
                          alt="Harthio AI"
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        displayInitials
                      )}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        'px-4 py-2.5 rounded-[20px] shadow-sm',
                        'transition-all duration-200',
                        'text-[15px] md:text-[16px] leading-[1.4]',
                        message.isOwn
                          ? 'bg-accent text-white rounded-br-md ml-auto shadow-md'
                          : isAIMode
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                      )}
                      style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        hyphens: 'auto'
                      }}
                    >
                      {(() => {
                        const content = message.content.trim();
                        console.log('Message content:', JSON.stringify(content), 'Match:', content === '[UPGRADE_BUTTON]');

                        if (content === '[UPGRADE_BUTTON]') {
                          return (
                            <button
                              onClick={() => router.push('/upgrade')}
                              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl w-full text-center cursor-pointer"
                            >
                              Upgrade to Pro - Start Free Trial
                            </button>
                          );
                        }
                        return message.content;
                      })()}
                    </div>

                    <div className={cn(
                      'flex items-center justify-between text-xs mt-1 px-2',
                      message.isOwn ? 'flex-row-reverse' : 'flex-row'
                    )}>
                      <div className={cn(
                        'flex items-center text-muted-foreground',
                        message.isOwn ? 'flex-row-reverse' : 'flex-row'
                      )}>
                        <span className="truncate">{message.isOwn ? 'You' : message.sender}</span>
                        <span className={cn('flex-shrink-0', message.isOwn ? 'mr-2' : 'ml-2')}>{formatTime(message.timestamp)}</span>
                      </div>

                      {/* Feedback buttons for AI messages only */}
                      {!message.isOwn && isAIMode && onFeedback && !feedbackGiven.has(message.id) && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onFeedback(message.id, 'positive');
                              setFeedbackGiven(prev => new Set(prev).add(message.id));
                            }}
                            className="p-1 rounded hover:bg-muted transition-colors"
                            title="Helpful"
                          >
                            <ThumbsUp className="h-3 w-3 text-muted-foreground hover:text-green-600" />
                          </button>
                          <button
                            onClick={() => {
                              setFeedbackMessageId(message.id);
                            }}
                            className="p-1 rounded hover:bg-muted transition-colors"
                            title="Not helpful"
                          >
                            <ThumbsDown className="h-3 w-3 text-muted-foreground hover:text-red-600" />
                          </button>
                        </div>
                      )}

                      {/* Show checkmark if feedback given */}
                      {!message.isOwn && isAIMode && feedbackGiven.has(message.id) && (
                        <span className="text-xs text-green-600">✓ Thanks!</span>
                      )}
                    </div>
                  </div>

                  {/* Avatar for own messages */}
                  {message.isOwn && (
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {(isTyping || isLoading) && (
            <div className="self-start max-w-[75%] flex items-start gap-2">
              {/* Avatar */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                isAIMode ? "bg-transparent" : "bg-accent text-accent-foreground text-xs font-bold"
              )}>
                {isAIMode ? (
                  <img
                    src="/logo.svg"
                    alt="Harthio AI"
                    width={32}
                    height={32}
                    className="rounded-full animate-pulse"
                  />
                ) : (
                  displayInitials
                )}
              </div>

              <div className="p-3 rounded-[18px] rounded-bl-[5px] shadow-sm bg-card border border-border">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.32s]"></span>
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.16s]"></span>
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={cn(
          "p-3 md:p-4 border-t border-border bg-card",
          "flex gap-2 md:gap-3 items-center",
          // Safe area for mobile devices with notches
          "pb-safe"
        )}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isAIMode ? "Share what's on your mind..." : "Type a message..."}
            disabled={isLoading}
            className={cn(
              "flex-1 p-3 md:p-3.5",
              "border border-input rounded-[24px]",
              "bg-background text-foreground",
              "text-sm md:text-base",
              "outline-none transition-colors duration-200",
              "focus:border-ring focus:ring-2 focus:ring-ring/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "placeholder:text-muted-foreground",
              // Prevent zoom on iOS
              "text-[16px]"
            )}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={cn(
              // Larger touch target for mobile
              "w-11 h-11 md:w-12 md:h-12",
              "rounded-full",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "flex justify-center items-center",
              "transition-all duration-200",
              "hover:scale-105 hover:shadow-lg",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
              "touch-manipulation"
            )}
            aria-label="Send message"
          >
            <Send className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* AI Disclaimer */}
        {isAIMode && (
          <div className="px-4 py-2 text-center bg-muted/50 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Harthio AI is here to support you, but is not a replacement for professional help.
            </p>
          </div>
        )}
      </div>
    </>
  )
}

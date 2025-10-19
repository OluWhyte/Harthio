'use client'

import { useState, useCallback } from 'react'

interface Message {
  id: string
  content: string
  sender: string
  timestamp: Date
  isOwn: boolean
}

export function useMessagePanel() {
  const [isOpen, setIsOpen] = useState(false) // Start closed
  const [messages, setMessages] = useState<Message[]>([])

  const openPanel = useCallback(() => setIsOpen(true), [])
  const closePanel = useCallback(() => setIsOpen(false), [])
  const togglePanel = useCallback(() => setIsOpen(prev => !prev), [])

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }, [])

  const sendMessage = useCallback((content: string, sender: string = 'You') => {
    addMessage({
      content,
      sender,
      isOwn: true
    })
  }, [addMessage])

  const receiveMessage = useCallback((content: string, sender: string) => {
    addMessage({
      content,
      sender,
      isOwn: false
    })
  }, [addMessage])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    isOpen,
    messages,
    openPanel,
    closePanel,
    togglePanel,
    addMessage,
    sendMessage,
    receiveMessage,
    clearMessages
  }
}

export type { Message }
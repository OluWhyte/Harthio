'use client'

import { useEffect } from 'react'
import { MessagePanel } from '@/components/harthio/message-panel'
import { Button } from '@/components/ui/button'
import { useMessagePanel } from '@/hooks/use-message-panel'

export default function MessagePanelDemo() {
  const { 
    isOpen, 
    messages, 
    openPanel, 
    closePanel, 
    togglePanel, 
    sendMessage, 
    receiveMessage 
  } = useMessagePanel()

  // Add some initial demo messages
  useEffect(() => {
    receiveMessage('Hello! How can I assist you today?', 'John')
    setTimeout(() => {
      sendMessage('This is a test message from me.')
    }, 1000)
    setTimeout(() => {
      receiveMessage('Another message here to see the layout.', 'Sarah')
    }, 2000)
    setTimeout(() => {
      sendMessage('A longer message to test the wider space for two people chatting with proper message alignment.')
    }, 3000)
    setTimeout(() => {
      receiveMessage('Perfect! The messages are now properly positioned - received messages are flat on the left, sent messages are flat on the right, just like your original design!', 'System')
    }, 4000)
  }, [sendMessage, receiveMessage])

  const handleSendMessage = (content: string) => {
    sendMessage(content)

    // Simulate a reply after 1 second
    setTimeout(() => {
      receiveMessage('Thanks for your message!', 'Bot')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Message Panel Demo</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Controls</h2>
          <Button 
            onClick={togglePanel}
            variant={isOpen ? "destructive" : "default"}
          >
            {isOpen ? 'Close' : 'Open'} Message Panel
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Responsive Features</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• <strong>Desktop (default):</strong> 400px width, positioned from right edge</li>
            <li>• <strong>Tablet (≤1024px):</strong> 350px width with 5px margin from left</li>
            <li>• <strong>Small tablet (≤768px):</strong> 320px width with 5px margin from left</li>
            <li>• <strong>Mobile (≤480px):</strong> 280px width with 5px margin from left</li>
            <li>• <strong>Message positioning:</strong> Received messages flat on left, sent messages flat on right</li>
            <li>• <strong>Brand colors:</strong> Rose theme for sent messages and accents</li>
            <li>• Smooth slide-in/slide-out animation</li>
            <li>• Auto-scroll to bottom when new messages arrive</li>
            <li>• System message support with rose-themed styling</li>
            <li>• Responsive text sizes and padding</li>
            <li>• Send messages with Enter key or button click</li>
          </ul>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Test responsive behavior:</strong> Resize your browser window to see how the message panel adapts to different screen sizes!
            </p>
          </div>
        </div>
      </div>

      <MessagePanel
        isOpen={isOpen}
        onClose={closePanel}
        messages={messages}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}
'use client'

import { useState } from 'react'
import { MessageCircle, Video, Mic, MicOff, VideoOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessagePanel } from '@/components/harthio/message-panel'
import { useMessagePanel } from '@/hooks/use-message-panel'

interface SessionWithChatProps {
  sessionId: string
  participantName?: string
}

export function SessionWithChat({ sessionId, participantName = 'Participant' }: SessionWithChatProps) {
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  
  const { 
    isOpen: isChatOpen, 
    messages, 
    togglePanel, 
    closePanel, 
    sendMessage, 
    receiveMessage 
  } = useMessagePanel()

  const handleSendMessage = (content: string) => {
    sendMessage(content)
    
    // In a real app, you'd send this through WebRTC or WebSocket
    // For demo, simulate receiving a message
    setTimeout(() => {
      receiveMessage(`I received: "${content}"`, participantName)
    }, 1000)
  }

  return (
    <div className="relative h-screen bg-gray-900 flex flex-col">
      {/* Video Area */}
      <div className="flex-1 relative bg-black">
        {/* Main video feed */}
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-white text-xl">Video Feed Area</div>
        </div>
        
        {/* Participant video (picture-in-picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg border-2 border-white flex items-center justify-center">
          <div className="text-white text-sm">{participantName}</div>
        </div>

        {/* Session info overlay */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
          <div className="text-sm font-medium">Session: {sessionId}</div>
          <div className="text-xs opacity-75">Connected with {participantName}</div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
        <Button
          variant={isAudioOn ? "default" : "destructive"}
          size="lg"
          onClick={() => setIsAudioOn(!isAudioOn)}
          className="rounded-full w-12 h-12 p-0"
        >
          {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        <Button
          variant={isVideoOn ? "default" : "destructive"}
          size="lg"
          onClick={() => setIsVideoOn(!isVideoOn)}
          className="rounded-full w-12 h-12 p-0"
        >
          {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        <Button
          variant={isChatOpen ? "secondary" : "outline"}
          size="lg"
          onClick={togglePanel}
          className="rounded-full w-12 h-12 p-0"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>

        <Button
          variant="destructive"
          size="lg"
          className="px-6"
        >
          End Session
        </Button>
      </div>

      {/* Message Panel */}
      <MessagePanel
        isOpen={isChatOpen}
        onClose={closePanel}
        messages={messages}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}
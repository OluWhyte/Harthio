'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, MessageCircle, TrendingUp, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WelcomeBannerProps {
  firstName?: string
}

export function WelcomeBanner({ firstName }: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem('harthio_welcome_dismissed')
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('harthio_welcome_dismissed', 'true')
    setIsVisible(false)
  }

  const handleStartChat = () => {
    localStorage.setItem('harthio_welcome_dismissed', 'true')
    router.push('/harthio')
  }

  if (!isVisible) return null

  return (
    <Card className="relative bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-sm mb-6 overflow-hidden">
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/50 transition-colors"
        aria-label="Dismiss welcome message"
      >
        <X className="h-4 w-4 text-gray-600" />
      </button>

      <div className="p-6 pr-12">
        {/* Greeting */}
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          👋 Welcome to Harthio{firstName ? `, ${firstName}` : ''}!
        </h2>

        {/* Description */}
        <p className="text-gray-700 mb-4">
          Your safe space for mental health support and recovery. Here's how to get started:
        </p>

        {/* Features */}
        <div className="space-y-2 mb-5">
          <div className="flex items-start gap-3">
            <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Chat with AI</p>
              <p className="text-sm text-gray-600">Get 24/7 support and guidance</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Track Your Journey</p>
              <p className="text-sm text-gray-600">Monitor your progress and milestones</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Connect with Peers</p>
              <p className="text-sm text-gray-600">Join video sessions with others</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleStartChat}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Start AI Chat
          </Button>
          <Button 
            variant="outline"
            onClick={handleDismiss}
          >
            I'll explore on my own
          </Button>
        </div>
      </div>
    </Card>
  )
}
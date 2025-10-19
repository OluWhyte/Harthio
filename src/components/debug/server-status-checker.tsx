'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ServerStatus {
  status: 'online' | 'offline' | 'checking'
  latency?: number
  lastChecked?: Date
}

export function ServerStatusChecker() {
  const [status, setStatus] = useState<ServerStatus>({ status: 'checking' })

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const startTime = Date.now()
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache'
        })
        const endTime = Date.now()
        
        if (response.ok) {
          setStatus({
            status: 'online',
            latency: endTime - startTime,
            lastChecked: new Date()
          })
        } else {
          setStatus({
            status: 'offline',
            lastChecked: new Date()
          })
        }
      } catch (error) {
        setStatus({
          status: 'offline',
          lastChecked: new Date()
        })
      }
    }

    // Check immediately
    checkServerStatus()

    // Check every 30 seconds
    const interval = setInterval(checkServerStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    switch (status.status) {
      case 'online': return 'bg-green-500'
      case 'offline': return 'bg-red-500'
      case 'checking': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (status.status) {
      case 'online': return 'Online'
      case 'offline': return 'Offline'
      case 'checking': return 'Checking...'
      default: return 'Unknown'
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Server Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <span className="text-sm">{getStatusText()}</span>
          </div>
          {status.latency && (
            <Badge variant="outline" className="text-xs">
              {status.latency}ms
            </Badge>
          )}
        </div>
        {status.lastChecked && (
          <p className="text-xs text-muted-foreground mt-2">
            Last checked: {status.lastChecked.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
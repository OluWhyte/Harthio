'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NotificationService } from '@/lib/services/notification-service'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { useAdminUserId } from '@/contexts/admin-context'
import { LoadingSpinner } from '@/components/common/loading-spinner'

interface Notification {
  id: string
  notification_type: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  read_by: string[] | null
  created_at: string
  target_url?: string
  expires_at?: string
}

// Notification Bell Component for Header
export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const adminUserId = useAdminUserId()

  useEffect(() => {
    if (!adminUserId) return
    
    loadNotifications()
    
    // Set up real-time subscription
    const unsubscribe = NotificationService.subscribeToNotifications(adminUserId, (notification) => {
      setNotifications(prev => [notification as any, ...prev])
      setUnreadCount(prev => prev + 1)
      
      // Show toast for new notifications
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.severity === 'error' ? 'destructive' : 'default'
      })
    })

    return unsubscribe
  }, [toast, adminUserId])

  const loadNotifications = async () => {
    if (!adminUserId) return
    
    try {
      const result = await NotificationService.getNotifications(adminUserId, 5, 0, false)
      const notifications = result.notifications || []
      setNotifications(notifications as any[])
      setUnreadCount(notifications.filter(n => !n.read_by?.includes(adminUserId)).length)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  const markAsRead = async (id: string) => {
    if (!adminUserId) return
    
    try {
      await NotificationService.markAsRead(id, adminUserId)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read_by: [...(n.read_by || []), adminUserId] } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!adminUserId) return
    
    try {
      await NotificationService.markAllAsRead(adminUserId)
      setNotifications(prev => prev.map(n => ({ ...n, read_by: [...(n.read_by || []), adminUserId] })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const getNotificationIcon = (severity: string) => {
    switch (severity) {
      case 'error': 
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.read_by?.includes(adminUserId || '') ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.severity)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read_by?.includes(adminUserId || '') && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 border-t">
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <a href="/admin-v2/notifications">View All Notifications</a>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Full Notification Center Page
export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'critical'>('all')
  const { toast } = useToast()
  const adminUserId = useAdminUserId()

  useEffect(() => {
    if (adminUserId) {
      loadNotifications()
    }
  }, [filter, typeFilter, adminUserId])

  const loadNotifications = async () => {
    if (!adminUserId) return
    
    try {
      setLoading(true)
      const result = await NotificationService.getNotifications(adminUserId)
      const data = result.notifications || []
      
      // Apply client-side filtering for now
      let filteredData = data
      
      if (filter === 'read') {
        filteredData = data.filter(n => n.read_by?.includes(adminUserId))
      } else if (filter === 'unread') {
        filteredData = data.filter(n => !n.read_by?.includes(adminUserId))
      }
      
      if (typeFilter !== 'all') {
        filteredData = filteredData.filter(n => n.severity === typeFilter)
      }

      setNotifications(filteredData as any[])
    } catch (error) {
      console.error('Failed to load notifications:', error)
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    if (!adminUserId) return
    
    try {
      await NotificationService.markAsRead(id, adminUserId)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read_by: [...(n.read_by || []), adminUserId] } : n)
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!adminUserId) return
    
    try {
      const unreadIds = notifications.filter(n => !n.read_by?.includes(adminUserId)).map(n => n.id)
      if (unreadIds.length === 0) return
      
      await NotificationService.markAllAsRead(adminUserId)
      setNotifications(prev => prev.map(n => ({ ...n, read_by: [...(n.read_by || []), adminUserId] })))
      toast({
        title: 'Success',
        description: 'All notifications marked as read'
      })
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive'
      })
    }
  }

  const deleteNotification = async (id: string) => {
    if (!adminUserId) return
    
    try {
      await NotificationService.deleteNotification(id, adminUserId)
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast({
        title: 'Success',
        description: 'Notification deleted'
      })
    } catch (error) {
      console.error('Failed to delete notification:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive'
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      default: return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const unreadCount = notifications.filter(n => !n.read_by?.includes(adminUserId || '')).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notification Center</h1>
          <p className="text-gray-600">
            Manage your admin notifications and alerts
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <Check className="h-4 w-4 mr-2" />
              Mark All Read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Notifications</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="md" text="Loading notifications..." fullScreen={false} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No notifications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg ${
                    !notification.read_by?.includes(adminUserId || '') ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{notification.title}</h3>
                          {!notification.read_by?.includes(adminUserId || '') && (
                            <Badge variant="secondary" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{notification.message}</p>
                        <p className="text-sm text-gray-400">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!notification.read_by?.includes(adminUserId || '') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
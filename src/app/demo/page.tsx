'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TestTube, ArrowRight, Shield } from 'lucide-react'

export default function DemoRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      router.push('/admin/testing')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
            <TestTube className="w-6 h-6 text-rose-600" />
          </div>
          <CardTitle>Demo Pages Moved</CardTitle>
          <CardDescription>
            Demo and testing features have been moved to the admin panel for better organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600">
            <p>You'll be redirected automatically in a few seconds...</p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => router.push('/admin/testing')}
              className="w-full bg-rose-500 hover:bg-rose-600"
            >
              <Shield className="w-4 h-4 mr-2" />
              Go to Admin Testing
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <Button 
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
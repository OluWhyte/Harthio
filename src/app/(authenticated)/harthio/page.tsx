'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ModernChatPanel } from '@/components/harthio/modern-chat-panel';
import { aiService, type ChatMessage } from '@/lib/ai-service';
import { sobrietyService } from '@/lib/sobriety-service';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type Message } from '@/hooks/use-message-panel';

export default function HarthioAIPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [resetTrackerId, setResetTrackerId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [trackerData, setTrackerData] = useState<{
    type: 'alcohol' | 'smoking' | 'drugs' | 'gambling' | 'other';
    name: string;
    startDate: Date;
  } | null>(null);
  const [isCreatingTracker, setIsCreatingTracker] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check for actions in URL
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const trackerId = params.get('tracker');

    // Initialize with welcome message
    if (messages.length === 0) {
      let welcomeMessage = `Hi ${userProfile?.first_name || 'there'}! 👋 I'm Harthio AI, your 24/7 support companion. I'm here to listen, support you through tough times, and help with your recovery journey.\n\nHow are you feeling today?`;

      // AI-Guarded Reset: Special message for tracker reset
      if (action === 'reset' && trackerId) {
        setResetTrackerId(trackerId);
        welcomeMessage = `Hi ${userProfile?.first_name || 'there'}. I see you want to reset your tracker. Before we do that, I want to check in with you.\n\nRelapses are part of recovery, and you're not alone. Can you tell me what happened? What led to this moment?\n\nI'm here to support you, not judge you. 💙`;
      }
      
      // AI-Powered Tracker Creation
      if (action === 'create-tracker') {
        welcomeMessage = `Hi ${userProfile?.first_name || 'there'}! 👋 I'd love to help you set up a recovery tracker.\n\nWhat would you like to track? For example:\n• Alcohol sobriety\n• Smoking cessation\n• Drug recovery\n• Gambling abstinence\n• Or something else?\n\nJust tell me in your own words.`;
      }
      
      // Pattern Detection Intervention
      if (action === 'intervention') {
        welcomeMessage = `Hi ${userProfile?.first_name || 'there'}. I've noticed you've been struggling for a few days now, and I want you to know that I'm here for you. 💙\n\nYou don't have to go through this alone. Can you tell me what's been going on? What's making things tough right now?`;
      }

      const initialMessages: Message[] = [
        {
          id: Date.now().toString(),
          content: welcomeMessage,
          sender: 'Harthio AI',
          timestamp: new Date(),
          isOwn: false,
        },
      ];

      // Add disclaimer on first use (check localStorage)
      const hasSeenDisclaimer = localStorage.getItem('harthio-ai-disclaimer-seen');
      if (!hasSeenDisclaimer) {
        initialMessages.push({
          id: (Date.now() + 1).toString(),
          content: "Quick note: I provide evidence-based self-help tools and support. For clinical diagnosis or treatment, please consult a licensed mental health professional. In crisis, call 988 Suicide & Crisis Lifeline. 💙",
          sender: 'Harthio AI',
          timestamp: new Date(),
          isOwn: false,
        });
        localStorage.setItem('harthio-ai-disclaimer-seen', 'true');
      }

      setMessages(initialMessages);
    }
  }, [user, router, userProfile, messages.length]);

  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    // Check for crisis keywords
    if (aiService.detectCrisis(userMessage)) {
      setShowCrisisAlert(true);
    }

    // Check if user needs CBT tools
    const cbtNeed = aiService.detectCBTNeed(userMessage);
    
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      content: userMessage,
      sender: userProfile?.display_name || 'You',
      timestamp: new Date(),
      isOwn: true,
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Check for tracker creation intent
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    
    if (action === 'create-tracker' && !trackerData) {
      const trackerIntent = aiService.detectTrackerIntent(userMessage);
      const startDate = aiService.extractStartDate(userMessage) || new Date();
      
      if (trackerIntent.hasIntent && trackerIntent.type) {
        // Prepare tracker data
        const typeNames = {
          alcohol: 'Alcohol Free',
          smoking: 'Smoke Free',
          drugs: 'Drug Free',
          gambling: 'Gambling Free',
          other: 'Recovery Tracker',
        };
        
        setTrackerData({
          type: trackerIntent.type,
          name: typeNames[trackerIntent.type],
          startDate,
        });
        
        setIsLoading(false);
        
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          content: `Perfect! I'll help you set up a "${typeNames[trackerIntent.type]}" tracker starting from ${startDate.toLocaleDateString()}.\n\nThis will track your progress and celebrate your milestones. Ready to create it?`,
          sender: 'Harthio AI',
          timestamp: new Date(),
          isOwn: false,
        };
        
        setMessages(prev => [...prev, aiMsg]);
        return;
      }
    }

    // Convert messages to ChatMessage format for AI
    const chatMessages: ChatMessage[] = messages
      .filter(m => m.sender !== 'System')
      .map(m => ({
        role: m.isOwn ? 'user' as const : 'assistant' as const,
        content: m.content,
      }));

    // Add current user message
    chatMessages.push({ role: 'user', content: userMessage });

    // Get AI response with CBT context if needed
    let systemPrompt = aiService.getSystemPrompt();
    
    if (cbtNeed.needsHelp) {
      systemPrompt += `\n\n**IMPORTANT:** The user just expressed ${cbtNeed.keywords.join(', ')}. After validating their feelings, offer relevant CBT tools: ${cbtNeed.suggestedTools.join(', ')}. Guide them through the exercise step-by-step.`;
    }
    
    const response = await aiService.chat([
      { role: 'system', content: systemPrompt },
      ...chatMessages,
    ]);

    setIsLoading(false);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      content: response.success && response.message
        ? response.message
        : "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. If you're in crisis, please call 988 or text HOME to 741741.",
      sender: 'Harthio AI',
      timestamp: new Date(),
      isOwn: false,
    };

    setMessages(prev => [...prev, aiMsg]);
  };

  const handleResetTracker = async () => {
    if (!resetTrackerId || !user) return;

    setIsResetting(true);
    const result = await sobrietyService.resetTracker(resetTrackerId, new Date());

    if (result.success) {
      toast({
        title: 'Counter Reset',
        description: 'Your tracker has been reset. Remember, recovery is progress, not perfection. 💪',
      });

      // Add AI message acknowledging the reset
      const aiMsg: Message = {
        id: Date.now().toString(),
        content: "I've reset your tracker. Remember, this is just a setback, not a failure. You've learned from this experience, and you're already taking steps forward by being here.\n\nWhat's one thing you can do differently moving forward?",
        sender: 'Harthio AI',
        timestamp: new Date(),
        isOwn: false,
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setResetTrackerId(null);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to reset tracker. Please try again.',
        variant: 'destructive',
      });
    }

    setIsResetting(false);
  };

  const handleCreateTracker = async () => {
    if (!trackerData || !user) return;

    setIsCreatingTracker(true);
    const result = await sobrietyService.createTracker(
      user.uid,
      trackerData.type,
      trackerData.name,
      trackerData.startDate
    );

    if (result.success) {
      toast({
        title: 'Tracker Created! 🎉',
        description: `Your ${trackerData.name} tracker is now active.`,
      });

      // Add AI message acknowledging creation
      const aiMsg: Message = {
        id: Date.now().toString(),
        content: `Awesome! Your ${trackerData.name} tracker is now live. I'll be here to support you every step of the way. 💪\n\nYou can see your progress on the Home page. How are you feeling about this journey?`,
        sender: 'Harthio AI',
        timestamp: new Date(),
        isOwn: false,
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setTrackerData(null);
      
      // Clear URL params
      window.history.replaceState({}, '', '/harthio');
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to create tracker.',
        variant: 'destructive',
      });
    }

    setIsCreatingTracker(false);
  };

  if (!user || !userProfile) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold">💬 Harthio AI</h1>
          <p className="text-[15px] text-muted-foreground mt-1">Your 24/7 support companion</p>
        </div>
      </div>

      {/* Reset Tracker Button (if in reset mode) */}
      {resetTrackerId && messages.length > 2 && (
        <div className="max-w-4xl mx-auto p-6">
          <Alert>
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span className="text-sm">Ready to reset your tracker?</span>
                <Button
                  onClick={handleResetTracker}
                  disabled={isResetting}
                  size="sm"
                  variant="outline"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Tracker
                    </>
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Create Tracker Button (if tracker data ready) */}
      {trackerData && (
        <div className="max-w-4xl mx-auto p-6">
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10">
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Ready to create your tracker?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {trackerData.name} • Starting {trackerData.startDate.toLocaleDateString()}
                  </p>
                </div>
                <Button
                  onClick={handleCreateTracker}
                  disabled={isCreatingTracker}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCreatingTracker ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Tracker'
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto p-6 pb-32">
        <p className="text-center text-muted-foreground text-sm mb-4">
          Chat with Harthio AI below for 24/7 support
        </p>
      </div>

      {/* Unified Chat Panel */}
      <ModernChatPanel
        isOpen={true}
        onToggle={() => router.push('/home')} // Go back to home
        messages={messages}
        onSendMessage={handleSendMessage}
        mode="ai"
        isLoading={isLoading}
        showCrisisAlert={showCrisisAlert}
        onDismissCrisisAlert={() => setShowCrisisAlert(false)}
      />
    </div>
  );
}

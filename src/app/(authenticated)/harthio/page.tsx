'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ModernChatPanel } from '@/components/harthio/modern-chat-panel';
import { aiService, type ChatMessage } from '@/ai/ai-service';
import { sobrietyService } from '@/lib/sobriety-service';
import { aiChatHistoryService } from '@/ai/services/ai-chat-history-service';
import { aiFeedbackService } from '@/ai/services/ai-feedback-service';
import { checkinService } from '@/lib/checkin-service';
import { topicService } from '@/lib/supabase-services';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RotateCcw, Bell, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type Message } from '@/hooks/use-message-panel';
import { MobilePageHeader } from '@/components/harthio/mobile-page-header';

export default function HarthioAIPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [resetTrackerId, setResetTrackerId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [trackerData, setTrackerData] = useState<{
    type: 'alcohol' | 'smoking' | 'drugs' | 'gambling' | 'other';
    name: string;
    startDate: Date;
  } | null>(null);
  const [showCBTOptions, setShowCBTOptions] = useState(false);
  const [currentCBTFlow, setCurrentCBTFlow] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [feedbackStates, setFeedbackStates] = useState<Record<string, 'positive' | 'negative' | null>>({});
  const [showFeedbackDialog, setShowFeedbackDialog] = useState<{messageId: string, type: 'positive' | 'negative'} | null>(null);
  const { toast } = useToast();

  // Load chat history on mount
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const loadChatHistory = async () => {
      setIsLoadingHistory(true);
      
      // Check for actions in URL first
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      
      // If ANY action parameter exists, always show welcome message (ignore history)
      // This ensures proactive AI notifications work correctly
      if (action) {
        await initializeWelcomeMessage();
        setIsLoadingHistory(false);
        return;
      }
      
      const history = await aiChatHistoryService.getChatHistory(user.uid);
      
      if (history.length > 0) {
        // Convert database messages to UI messages
        const loadedMessages: Message[] = history.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.role === 'user' ? (userProfile?.display_name || 'You') : 'Harthio AI',
          timestamp: new Date(msg.created_at),
          isOwn: msg.role === 'user',
        }));
        setMessages(loadedMessages);
      } else {
        // No history - show welcome message
        await initializeWelcomeMessage();
      }
      
      setIsLoadingHistory(false);
    };

    loadChatHistory();
  }, [user, router]);

  // Initialize welcome message for new users or special actions
  const initializeWelcomeMessage = async () => {
    // Check for actions in URL
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const trackerId = params.get('tracker');
    
    // Special handling for tracker creation when rate-limited
    if (action === 'create-tracker' && user) {
      // Get CSRF token
      const { getCSRFHeaders } = await import('@/lib/csrf-utils');
      const csrfHeaders = await getCSRFHeaders();

      // Check if user is rate-limited
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeaders,
        },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: 'test' }],
          checkOnly: true // Just check rate limit, don't send message
        }),
      });
      
      if (response.status === 429) {
        // User is rate-limited - show direct tracker creation message
        const initialMessages: Message[] = [{
          id: Date.now().toString(),
          content: "You've reached your daily AI message limit, but you can still create trackers! 💙\n\nGo to your Home page and tap the '+' button to add a tracker directly - no AI needed.\n\nOr upgrade to Pro for unlimited AI-guided tracker creation!",
          sender: 'Harthio AI',
          timestamp: new Date(),
          isOwn: false,
        }, {
          id: (Date.now() + 1).toString(),
          content: '[UPGRADE_BUTTON]',
          sender: 'Harthio AI',
          timestamp: new Date(),
          isOwn: false,
        }];
        
        setMessages(initialMessages);
        return;
      }
    }
    
    // Check if user has chat history (returning user)
    const hasHistory = user ? (await aiChatHistoryService.getChatHistory(user.uid)).length > 0 : false;
    
    // Only show welcome message for new users (no history) OR if there's a specific action
    if (hasHistory && !action) {
      // Returning user with no action - don't show welcome message
      return;
    }
    
    let welcomeMessage = `Hi ${userProfile?.first_name || 'there'}! 👋 I'm Harthio AI, your 24/7 support companion. I'm here to listen, support you through tough times, and help with your recovery journey.\n\nHow are you feeling today?`;

    // Proactive AI Actions - Context-aware responses
    let userMessage = '';
    
    // 1. Find Session Support
    if (action === 'find-session') {
      userMessage = "I need help finding a session";
      welcomeMessage = `Hi ${userProfile?.first_name || 'there'}! I'd love to help you find the perfect session. 💙\n\nWhat kind of support are you looking for right now? For example:\n\n• Someone to talk about recovery with\n• Help with anxiety or stress\n• Support for a specific addiction\n• Just want to connect with others\n\nTell me what you need, and I'll help you find the right session.`;
    }
    
    // 2. Mood Support
    if (action === 'mood-support') {
      userMessage = "I'm struggling today";
      welcomeMessage = `Hi ${userProfile?.first_name || 'there'}. I'm here for you. 💙\n\nI noticed your mood changed, and I want you to know that's completely okay. Tough days are part of the journey.\n\nWhat's making today difficult? I'm here to listen and support you.`;
    }
    
    // 3. Check-in Support
    if (action === 'check-in') {
      userMessage = "I want to check in";
      welcomeMessage = `Hi ${userProfile?.first_name || 'there'}! 👋 I'm glad you're here.\n\nHow are you feeling today? What's on your mind?`;
    }
    
    // 4. Relapse Support
    if (action === 'relapse-support') {
      userMessage = "I've been struggling with relapses";
      welcomeMessage = `Hi ${userProfile?.first_name || 'there'}. Thank you for being honest about this. 💙\n\nRelapses are part of recovery, not a failure. They're opportunities to learn and grow stronger.\n\nWhat's been triggering these moments? Let's work through this together.`;
    }
    
    // 5. Session Debrief
    if (action === 'session-debrief') {
      const sessionTitle = params.get('session_title');
      const sessionTopic = params.get('session_topic');
      
      if (sessionTitle) {
        userMessage = `I just finished a session about "${sessionTitle}"`;
        welcomeMessage = `Hi ${userProfile?.first_name || 'there'}! How did your "${sessionTitle}" session go? 💙\n\n${sessionTopic ? `You discussed ${sessionTopic}. ` : ''}Sometimes it helps to process what came up. Want to talk about it?`;
      } else {
        userMessage = "I just finished a session";
        welcomeMessage = `Hi ${userProfile?.first_name || 'there'}! How did your session go? 💙\n\nSometimes it helps to process what came up. Want to talk about it?`;
      }
    }
    
    // 6. Progress Review - Generate detailed summary
    if (action === 'progress-review' && user) {
      userMessage = "I'm looking at my progress";
      
      try {
        // Get all progress data
        const existingTrackers = await sobrietyService.getActiveTrackers(user.uid);
        const checkInStreak = await checkinService.getCheckInStreak(user.uid);
        const checkInHistory = await checkinService.getCheckInHistory(user.uid);
        const recentCheckIns = checkInHistory.slice(0, 7);
        
        const allTopics = await topicService.getAllTopics();
        const userSessions = allTopics.filter(topic => {
          const isAuthor = topic.author_id === user.uid;
          const isParticipant = topic.participants?.includes(user.uid);
          const isPast = new Date(topic.end_time) < new Date();
          return (isAuthor || isParticipant) && isPast;
        });
        
        // Build comprehensive summary
        let summary = `Hi ${userProfile?.first_name || 'there'}! Let me show you your journey so far. 💙\n\n`;
        
        // Trackers
        if (existingTrackers.length > 0) {
          summary += '**Your Trackers:**\n';
          existingTrackers.forEach(t => {
            const breakdown = sobrietyService.calculateTimeBreakdown(t.start_date);
            summary += `• ${t.tracker_name}: ${breakdown.totalDays} days strong (started ${new Date(t.start_date).toLocaleDateString()})\n`;
          });
          summary += '\n';
        }
        
        // Check-ins
        summary += `**Check-ins:**\n`;
        summary += `• Current streak: ${checkInStreak} days\n`;
        summary += `• Total check-ins: ${checkInHistory.length}\n\n`;
        
        // Recent moods
        if (recentCheckIns.length > 0) {
          const strugglingDays = recentCheckIns.filter(c => c.mood === 'struggling').length;
          const goodDays = recentCheckIns.filter(c => c.mood === 'good' || c.mood === 'great').length;
          
          summary += `**Recent Mood (Last 7 days):**\n`;
          if (strugglingDays > 3) {
            summary += `• You've had ${strugglingDays} struggling days recently. That's tough, but you're still showing up. 💪\n\n`;
          } else if (goodDays > 4) {
            summary += `• You've had ${goodDays} good days! You're building real momentum. 🎉\n\n`;
          } else {
            summary += `• Mix of ups and downs - that's normal in recovery. You're doing great. 💙\n\n`;
          }
        }
        
        // Sessions
        if (userSessions.length > 0) {
          summary += `**Sessions Joined:** ${userSessions.length}\n`;
          if (userSessions.length >= 3) {
            summary += `You're actively connecting with others. That's huge for recovery! 🌟\n\n`;
          } else {
            summary += '\n';
          }
        }
        
        summary += `What stands out to you when you see this? What are you most proud of?`;
        
        welcomeMessage = summary;
      } catch (error) {
        console.error('Error generating progress summary:', error);
        welcomeMessage = `Hi ${userProfile?.first_name || 'there'}! 💙\n\nLooking at your journey? That takes courage. What stands out to you when you see your progress?`;
      }
    }
    
    // 7. General Support
    if (action === 'support') {
      userMessage = "I need support";
      welcomeMessage = `Hi ${userProfile?.first_name || 'there'}! I'm here for you. 💙\n\nWhat's going on? I'm listening.`;
    }

    // AI-Guarded Reset: Special message for tracker reset
    if (action === 'reset' && trackerId) {
      setResetTrackerId(trackerId);
      userMessage = "I want to reset my tracker";
      welcomeMessage = `Hi ${userProfile?.first_name || 'there'}. I see you want to reset your tracker. Before we do that, I want to check in with you.\n\nRelapses are part of recovery, and you're not alone. Can you tell me what happened? What led to this moment?\n\nI'm here to support you, not judge you. 💙`;
    }
    
    // AI-Powered Tracker Creation (Context-Aware)
    if (action === 'create-tracker' && user) {
      try {
        // Check if user has existing trackers
        const hasExistingTrackers = await sobrietyService.getActiveTrackers(user.uid);
        const trackerCount = hasExistingTrackers.length;
        
        // Check if user previously started but didn't complete tracker creation
        const recentHistory = await aiChatHistoryService.getChatHistory(user.uid);
        const hasIncompleteTracker = recentHistory.some(msg => 
          msg.content.includes('What would you like to track?') || 
          msg.content.includes('recovery tracker')
        ) && trackerCount === 0;
        
        // Context-aware welcome message
        if (hasIncompleteTracker) {
          // User started before but didn't finish
          welcomeMessage = `Hi ${userProfile?.first_name || 'there'}! 👋\n\nI noticed we started setting up a tracker last time but didn't finish. That's totally okay - sometimes timing isn't right.\n\nReady to try again? You can tap one of the buttons below for quick setup, or tell me what you'd like to track.`;
        } else if (trackerCount > 0) {
          // User has existing trackers
          const trackerList = hasExistingTrackers.map(t => `• ${(t as any).name} (${sobrietyService.calculateTimeBreakdown(t.start_date).days} days)`).join('\n');
          welcomeMessage = `Hi ${userProfile?.first_name || 'there'}! 👋\n\nI see you're already tracking:\n${trackerList}\n\nThat's amazing progress! 💪\n\nWant to add another? Tap a button below for quick setup, or tell me what else you'd like to track.`;
        } else {
          // First time creating a tracker
          welcomeMessage = `Hi ${userProfile?.first_name || 'there'}! 👋 I'd love to help you set up a recovery tracker.\n\nTap one of the buttons below for quick setup, or tell me what you'd like to track in your own words.`;
        }
      } catch (error) {
        console.error('Error loading tracker context:', error);
        // Fallback to simple message
        welcomeMessage = `Hi ${userProfile?.first_name || 'there'}! 👋 I'd love to help you set up a recovery tracker.\n\nTap one of the buttons below for quick setup, or tell me what you'd like to track in your own words.`;
      }
    }
    
    // Pattern Detection Intervention
    if (action === 'intervention') {
      welcomeMessage = `Hi ${userProfile?.first_name || 'there'}. I've noticed you've been struggling for a few days now, and I want you to know that I'm here for you. 💙\n\nYou don't have to go through this alone. Can you tell me what's been going on? What's making things tough right now?`;
    }

    const initialMessages: Message[] = [];
    
    // Add user message first if there's a specific action (provides context)
    if (userMessage) {
      initialMessages.push({
        id: Date.now().toString(),
        content: userMessage,
        sender: userProfile?.display_name || 'You',
        timestamp: new Date(),
        isOwn: true,
      });
    }
    
    // Add AI welcome message
    initialMessages.push({
      id: (Date.now() + 1).toString(),
      content: welcomeMessage,
      sender: 'Harthio AI',
      timestamp: new Date(),
      isOwn: false,
    });

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

    console.log('Setting initial messages:', initialMessages);
    setMessages(initialMessages);
    
    // Save messages to database ONLY if NOT an action-based conversation
    // Action-based conversations (create-tracker, reset, etc.) are temporary
    // Note: params and action are already defined at the top of this function
    if (user && !action) {
      // Save user message if there's a specific action
      if (userMessage) {
        await aiChatHistoryService.saveMessage(user.uid, 'user', userMessage);
      }
      // Save AI welcome message
      await aiChatHistoryService.saveMessage(user.uid, 'assistant', welcomeMessage);
    }
    
    console.log('Messages set successfully');
  };

  // Auto-resize textarea based on content (max 5 lines)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '48px'; // Reset to min height
    const scrollHeight = textarea.scrollHeight;
    const lineHeight = 24; // Approximate line height
    const maxHeight = lineHeight * 5 + 24; // 5 lines + padding
    
    textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
  }, [inputValue]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper function to handle AI response after streaming completes
  const handleAIResponseComplete = async (aiResponse: string, messageId: string) => {
    // The streaming message is already displayed, just need to handle special commands
    
    // Check for tracker reset command
    if (aiResponse.match(/TRACKER_RESET:/) && user && resetTrackerId) {
      const cleanedResponse = aiResponse.replace(/TRACKER_RESET:\s*\n\n?/, '');
      const result = await sobrietyService.resetTracker(resetTrackerId, new Date());
      
      if (result.success) {
        toast({
          title: 'Counter Reset',
          description: 'Your tracker has been reset. Remember, recovery is progress, not perfection. 💪',
        });
        window.history.replaceState({}, '', '/harthio');
        setResetTrackerId(null);
      }
      
      // Update message with cleaned response
      setMessages(prev => 
        prev.map(msg => msg.id === messageId ? { ...msg, content: cleanedResponse } : msg)
      );
      
      // Save to history
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get('action')) {
        aiChatHistoryService.saveMessage(user.uid, 'assistant', cleanedResponse, {
          cbtFlow: currentCBTFlow || undefined,
        });
      }
      return;
    }
    
    // Check for tracker creation command
    const trackerMatch = aiResponse.match(/TRACKER_CREATE:\s*(\w+)\|([^|]+)\|(\d{4}-\d{2}-\d{2})/);
    if (trackerMatch && user) {
      const [, type, name, dateStr] = trackerMatch;
      const parsedDate = new Date(dateStr);
      const now = new Date();
      const startDate = new Date(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
      );
      
      const cleanedResponse = aiResponse.replace(/TRACKER_CREATE:[^\n]+\n\n?/, '');
      const result = await sobrietyService.createTracker(
        user.uid,
        type as any,
        name,
        startDate
      );
      
      if (result.success) {
        toast({
          title: 'Tracker Created! 🎉',
          description: `Your ${name} tracker is now active.`,
        });
        window.history.replaceState({}, '', '/harthio');
      }
      
      // Update message with cleaned response
      setMessages(prev => 
        prev.map(msg => msg.id === messageId ? { ...msg, content: cleanedResponse } : msg)
      );
      
      // Save to history
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get('action')) {
        aiChatHistoryService.saveMessage(user.uid, 'assistant', cleanedResponse, {
          cbtFlow: currentCBTFlow || undefined,
        });
      }
      return;
    }
    
    // Normal response - just save to history
    const urlParams = new URLSearchParams(window.location.search);
    if (user && !urlParams.get('action')) {
      aiChatHistoryService.saveMessage(user.uid, 'assistant', aiResponse, {
        cbtFlow: currentCBTFlow || undefined,
      });
    }
  };

  const handleSendMessage = async (userMessage: string, skipCBTDetection = false) => {
    if (!userMessage.trim() || isLoading) return;

    // Clear input immediately
    setInputValue('');

    // Check for crisis keywords
    if (aiService.detectCrisis(userMessage)) {
      setShowCrisisAlert(true);
    }

    // Intelligent keyword detection for CBT tools
    const lowerMessage = userMessage.toLowerCase();
    
    // Detect specific tool requests
    const toolKeywords = {
      'thought-challenger': ['thought challenger', 'negative thinking', 'reframe', 'cognitive', 'thinking patterns'],
      'breathing': ['breathing', 'breath', 'breathe', 'calm down', 'relax'],
      'grounding': ['grounding', '5-4-3-2-1', 'overwhelmed', 'present moment', 'anchor'],
      'coping': ['coping', 'cope', 'relief', 'help me feel better', 'what can i do']
    };
    
    // Check if user is requesting a specific tool
    for (const [tool, keywords] of Object.entries(toolKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        const userMsg: Message = {
          id: Date.now().toString(),
          content: userMessage,
          sender: userProfile?.display_name || 'You',
          timestamp: new Date(),
          isOwn: true,
        };
        setMessages(prev => [...prev, userMsg]);
        
        // Automatically start the detected tool
        setShowCBTOptions(false);
        setCurrentCBTFlow(tool);
        
        const toolMessages = {
          'thought-challenger': "Let's work through the Thought Challenger together. I'll help you reframe those negative thoughts.",
          'breathing': "Let's do a breathing exercise together. This will help calm your nervous system.",
          'grounding': "Let's try the 5-4-3-2-1 grounding technique. This will help bring you back to the present moment.",
          'coping': "Let me share some coping techniques that might help you right now."
        };
        
        setTimeout(() => {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            content: toolMessages[tool as keyof typeof toolMessages],
            sender: 'Harthio AI',
            timestamp: new Date(),
            isOwn: false,
          };
          setMessages(prev => [...prev, aiMsg]);
        }, 500);
        return;
      }
    }
    
    // Check if user is asking for coping tools menu
    if (!skipCBTDetection && (lowerMessage.includes('coping tools') || lowerMessage.includes('show me tools') || lowerMessage.includes('what tools'))) {
      const userMsg: Message = {
        id: Date.now().toString(),
        content: userMessage,
        sender: userProfile?.display_name || 'You',
        timestamp: new Date(),
        isOwn: true,
      };
      setMessages(prev => [...prev, userMsg]);
      
      // Show CBT options
      setTimeout(() => {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          content: "I'd love to help you with coping tools! 🛠️\n\nWhich technique would be most helpful right now?",
          sender: 'Harthio AI',
          timestamp: new Date(),
          isOwn: false,
        };
        setMessages(prev => [...prev, aiMsg]);
        setShowCBTOptions(true);
      }, 500);
      return;
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
    
    // Save user message to database ONLY if NOT an action-based conversation
    const urlParams = new URLSearchParams(window.location.search);
    const urlAction = urlParams.get('action');
    
    if (user && !urlAction) {
      aiChatHistoryService.saveMessage(user.uid, 'user', userMessage, {
        isCrisis: aiService.detectCrisis(userMessage),
      });
    }

    // Tracker creation is now handled conversationally by AI
    // AI will ask for details, confirm, then user can say "yes create it"
    // The actual creation happens when AI detects confirmation

    // Get smart context: last 30 messages + memory summary
    // IMPORTANT: Don't include the current message from state since we add it manually below
    // messages state hasn't updated yet (setState is async), so we use the old messages
    const recentMessages = messages.slice(-30); // Last 30 messages for better context retention
    const chatMessages: ChatMessage[] = recentMessages
      .filter(m => m.sender !== 'System')
      .map(m => ({
        role: m.isOwn ? 'user' as const : 'assistant' as const,
        content: m.content,
      }));

    // Add current user message (not in state yet)
    chatMessages.push({ role: 'user', content: userMessage });

    // Get AI response with CBT context and memory
    let systemPrompt = aiService.getSystemPrompt();
    
    // Add user's name to system prompt
    if (userProfile?.first_name) {
      systemPrompt += `\n\n**USER'S NAME:** ${userProfile.first_name}${userProfile.last_name ? ' ' + userProfile.last_name : ''}\n(Use their name naturally in conversation to make it more personal)`;
    }
    
    // Add comprehensive user progress context
    if (user) {
      try {
        // Get trackers
        const existingTrackers = await sobrietyService.getActiveTrackers(user.uid);
        
        // Get check-in data
        const checkInStreak = await checkinService.getCheckInStreak(user.uid);
        const checkInHistory = await checkinService.getCheckInHistory(user.uid);
        const recentCheckIns = checkInHistory.slice(0, 7); // Last 7 check-ins
        
        // Get session data
        const allTopics = await topicService.getAllTopics();
        const userSessions = allTopics.filter(topic => {
          const isAuthor = topic.author_id === user.uid;
          const isParticipant = topic.participants?.includes(user.uid);
          const isPast = new Date(topic.end_time) < new Date();
          return (isAuthor || isParticipant) && isPast;
        });
        
        // Build progress summary
        let progressContext = '\n\n**USER PROGRESS DATA:**\n';
        
        // Trackers
        if (existingTrackers.length > 0) {
          progressContext += '\n**Active Trackers:**\n';
          existingTrackers.forEach(t => {
            const breakdown = sobrietyService.calculateTimeBreakdown(t.start_date);
            progressContext += `- ${t.tracker_name}: ${breakdown.totalDays} days (started ${new Date(t.start_date).toLocaleDateString()})\n`;
          });
        } else {
          progressContext += '\n**Active Trackers:** None\n';
        }
        
        // Check-ins
        progressContext += `\n**Check-in Streak:** ${checkInStreak} days\n`;
        progressContext += `**Total Check-ins:** ${checkInHistory.length}\n`;
        
        if (recentCheckIns.length > 0) {
          progressContext += '\n**Recent Moods (Last 7 days):**\n';
          recentCheckIns.forEach(c => {
            const date = new Date(c.created_at).toLocaleDateString();
            progressContext += `- ${date}: ${c.mood}${c.note ? ` ("${c.note.substring(0, 50)}...")` : ''}\n`;
          });
        }
        
        // Sessions with details
        progressContext += `\n**Sessions Joined:** ${userSessions.length}\n`;
        if (userSessions.length > 0) {
          progressContext += '\n**Recent Sessions:**\n';
          userSessions.slice(0, 5).forEach(s => {
            const date = new Date(s.end_time).toLocaleDateString();
            progressContext += `- "${s.title}" on ${date}\n`;
          });
        }
        
        progressContext += '\n**IMPORTANT:** Use this data to provide personalized, context-aware responses. Acknowledge their progress, patterns, and struggles naturally. Reference specific sessions or moods when relevant.';
        
        systemPrompt += progressContext;
        
      } catch (error) {
        console.error('Error loading progress data for AI context:', error);
      }
    }
    
    // Add memory summary for temporal awareness
    if (user) {
      const memorySummary = await aiChatHistoryService.getMemorySummary(user.uid);
      if (memorySummary) {
        systemPrompt += memorySummary;
        systemPrompt += `\n**IMPORTANT:** Reference these past events naturally when relevant. Use dates like "I remember on November 14th we discussed..." or "Yesterday you mentioned..." or "A few days ago you tried...". Make it feel like you truly remember.`;
      }
    }
    
    if (cbtNeed.needsHelp) {
      systemPrompt += `\n\n**IMMEDIATE NEED:** The user just expressed ${cbtNeed.keywords.join(', ')}. After validating their feelings, offer relevant CBT tools: ${cbtNeed.suggestedTools.join(', ')}. Guide them through the exercise step-by-step.`;
    }
    
    // Use streaming for better UX
    let streamingMessageId = Date.now().toString();
    let fullResponse = '';
    
    // Add placeholder message for streaming
    const streamingMsg: Message = {
      id: streamingMessageId,
      content: '',
      sender: 'Harthio AI',
      timestamp: new Date(),
      isOwn: false,
    };
    setMessages(prev => [...prev, streamingMsg]);

    try {
      // Note: System prompt with date and user context is added by the backend API
      // We only send the conversation messages
      await aiService.chatStream(
        chatMessages,
        // On each chunk
        (chunk) => {
          fullResponse += chunk;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, content: fullResponse }
                : msg
            )
          );
        },
        // On complete
        (finalText) => {
          fullResponse = finalText;
          setIsLoading(false);
          
          // Continue with existing logic (crisis detection, tracker creation, etc.)
          handleAIResponseComplete(finalText, streamingMessageId);
        },
        // On error - fallback to non-streaming
        async (error) => {
          console.log('[Streaming] Error, falling back to non-streaming:', error);
          
          // Remove streaming message
          setMessages(prev => prev.filter(msg => msg.id !== streamingMessageId));
          
          // Use regular chat (backend adds system prompt with date)
          const response = await aiService.chat(chatMessages);
          
          setIsLoading(false);
          handleAIResponseComplete(response.message || "I'm having trouble connecting. Please try again.", Date.now().toString());
        }
      );
    } catch (error) {
      console.error('[AI Chat] Error:', error);
      setIsLoading(false);
      setMessages(prev => prev.filter(msg => msg.id !== streamingMessageId));
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        sender: 'Harthio AI',
        timestamp: new Date(),
        isOwn: false,
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }
    
    return; // Exit early since streaming handles the rest
  }; // End of handleSendMessage



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

  // Handle initial feedback button click
  const handleFeedbackClick = (messageId: string, feedbackType: 'positive' | 'negative') => {
    // Update visual state immediately
    setFeedbackStates(prev => ({ ...prev, [messageId]: feedbackType }));
    
    // Show detailed feedback dialog
    setShowFeedbackDialog({ messageId, type: feedbackType });
  };

  // Handle detailed feedback submission
  const handleFeedbackSubmit = async (
    messageId: string,
    feedbackType: 'positive' | 'negative',
    reason?: string,
    details?: string
  ) => {
    if (!user) return;
    
    // Find the AI message and the user message before it
    const messageIndex = messages.findIndex(m => m.id === messageId);
    const aiMessage = messages[messageIndex];
    const userMessage = messages[messageIndex - 1];
    
    if (!aiMessage || !userMessage) return;
    
    // Submit feedback
    const result = await aiFeedbackService.submitFeedback({
      userId: user.uid,
      messageId,
      userMessage: userMessage.content,
      aiResponse: aiMessage.content,
      feedbackType,
      reason: reason as any,
      reasonDetails: details,
    });
    
    if (result.success) {
      setShowFeedbackDialog(null);
      toast({
        title: feedbackType === 'positive' ? "Thanks for your feedback! 💙" : "Thanks for letting us know",
        description: feedbackType === 'positive' ? "Your input helps us improve." : "We'll work on improving this.",
      });
    } else {
      toast({
        title: "Couldn't save feedback",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user || !userProfile) return null;

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Mobile Header Only */}
      <div className="fixed top-0 left-0 right-0 md:hidden z-40 bg-background">
        <MobilePageHeader
          actions={[
            {
              icon: Bell,
              onClick: () => router.push('/notifications'),
              label: 'Notifications',
              badge: 0,
            },
          ]}
        />
      </div>

      {/* Chat Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 pt-14 md:pt-0">
        <div className="max-w-3xl mx-auto px-4 py-6 pb-32 space-y-4">
          {/* Crisis Alert */}
          {showCrisisAlert && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="font-semibold mb-1">Crisis Support Available</p>
                  <p className="text-sm">If you're in crisis, please reach out:</p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• Call 988 (Suicide & Crisis Lifeline)</li>
                    <li>• Text HOME to 741741 (Crisis Text Line)</li>
                    <li>• Call 911 for emergencies</li>
                  </ul>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCrisisAlert(false)}
                  className="flex-shrink-0"
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Alerts */}
          {resetTrackerId && messages.length > 2 && (
            <Alert>
              <AlertDescription>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-sm sm:text-[15px]">Ready to reset your tracker?</span>
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
          )}

          {/* Chat Messages - iMessage Style */}
          {messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
            const isGrouped = prevMessage && prevMessage.isOwn === message.isOwn;
            const isLastInGroup = !nextMessage || nextMessage.isOwn !== message.isOwn;
            
            return (
              <div key={message.id} className={`${isGrouped ? 'mt-1' : 'mt-4'}`}>
                <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                  {/* Message Bubble */}
                  <div
                    className={`max-w-[75%] sm:max-w-[65%] px-4 py-2.5 animate-in slide-in-from-bottom-2 duration-300 ${
                      message.isOwn
                        ? 'bg-accent text-white rounded-[20px] rounded-br-md shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-[20px] rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="text-[16px] leading-[1.4] whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
                
                {/* Timestamp - Only show for last message in group */}
                {isLastInGroup && (
                  <div className={`flex items-center gap-2 ${message.isOwn ? 'justify-end pr-2' : 'justify-start pl-2'} mt-1`}>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {message.timestamp.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </p>
                    
                    {/* Feedback buttons for AI messages only - on same line as timestamp */}
                    {!message.isOwn && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleFeedbackClick(message.id, 'positive')}
                          className={`p-1 rounded-full transition-all duration-apple active:scale-95 ${
                            feedbackStates[message.id] === 'positive'
                              ? 'bg-green-100 dark:bg-green-900/40'
                              : 'hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                          title="Helpful"
                        >
                          <ThumbsUp className={`h-4 w-4 transition-colors ${
                            feedbackStates[message.id] === 'positive'
                              ? 'text-green-600 dark:text-green-400 fill-current'
                              : 'text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                          }`} />
                        </button>
                        <button
                          onClick={() => handleFeedbackClick(message.id, 'negative')}
                          className={`p-1 rounded-full transition-all duration-apple active:scale-95 ${
                            feedbackStates[message.id] === 'negative'
                              ? 'bg-red-100 dark:bg-red-900/40'
                              : 'hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                          title="Not helpful"
                        >
                          <ThumbsDown className={`h-4 w-4 transition-colors ${
                            feedbackStates[message.id] === 'negative'
                              ? 'text-red-600 dark:text-red-400 fill-current'
                              : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                          }`} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Upgrade/Credits Buttons - Show after rate limit message */}
                {!message.isOwn && message.content.includes("You've reached your 3 free AI messages") && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs text-center text-muted-foreground font-medium">
                      Choose how to continue:
                    </p>
                    <Button
                      onClick={() => router.push('/credits')}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span>💬 Buy Credits - From $2</span>
                        <span className="text-xs font-normal opacity-90">Pay as you go • No commitment</span>
                      </div>
                    </Button>
                    <Button
                      onClick={() => router.push('/pricing?trial=true')}
                      variant="outline"
                      className="w-full border-2 border-primary text-primary hover:bg-primary/5 font-semibold py-3 rounded-lg transition-all"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span>✨ Upgrade to Pro - $9.99/mo</span>
                        <span className="text-xs font-normal">Unlimited messages • 14-day free trial</span>
                      </div>
                    </Button>
                  </div>
                )}
                
                {/* Quick Action Buttons - Show after first AI message */}
                {!message.isOwn && index === 0 && !isLoading && !showCBTOptions && (
                  <div className="mt-4 space-y-2">
                    {/* Tracker Quick Actions - Show only for create-tracker action */}
                    {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('action') === 'create-tracker' && (
                      <>
                        <p className="text-xs text-muted-foreground text-center mb-2">Quick setup:</p>
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendMessage("I want to track alcohol sobriety starting today", true)}
                            className="text-xs rounded-full border-gray-300 hover:border-primary hover:text-primary transition-apple duration-apple whitespace-nowrap flex-shrink-0"
                          >
                            🍺 Alcohol Sobriety
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendMessage("I want to track smoking cessation starting today", true)}
                            className="text-xs rounded-full border-gray-300 hover:border-primary hover:text-primary transition-apple duration-apple whitespace-nowrap flex-shrink-0"
                          >
                            🚬 Smoking Cessation
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendMessage("I want to track drug recovery starting today", true)}
                            className="text-xs rounded-full border-gray-300 hover:border-primary hover:text-primary transition-apple duration-apple whitespace-nowrap flex-shrink-0"
                          >
                            💊 Drug Recovery
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendMessage("I want to track gambling abstinence starting today", true)}
                            className="text-xs rounded-full border-gray-300 hover:border-primary hover:text-primary transition-apple duration-apple whitespace-nowrap flex-shrink-0"
                          >
                            🎰 Gambling Abstinence
                          </Button>
                        </div>
                      </>
                    )}
                    
                    {/* Row 1: Most Common/Urgent */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage("I'm feeling anxious", true)}
                        className="text-xs rounded-full border-gray-300 hover:border-primary hover:text-primary transition-apple duration-apple whitespace-nowrap flex-shrink-0"
                      >
                        😰 Feeling Anxious?
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage("I'm feeling stressed", true)}
                        className="text-xs rounded-full border-gray-300 hover:border-primary hover:text-primary transition-apple duration-apple whitespace-nowrap flex-shrink-0"
                      >
                        😓 Feeling Stressed?
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage("I'm feeling depressed", true)}
                        className="text-xs rounded-full border-gray-300 hover:border-primary hover:text-primary transition-apple duration-apple whitespace-nowrap flex-shrink-0"
                      >
                        😔 Feeling Down?
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage("I'm having cravings", true)}
                        className="text-xs rounded-full border-gray-300 hover:border-primary hover:text-primary transition-apple duration-apple whitespace-nowrap flex-shrink-0"
                      >
                        💭 Having Cravings?
                      </Button>
                    </div>
                    
                    {/* Row 2: Recovery-Specific */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage("I'm feeling angry", true)}
                        className="text-xs rounded-full border-gray-300 hover:border-primary hover:text-primary transition-apple duration-apple whitespace-nowrap flex-shrink-0"
                      >
                        😤 Feeling Angry?
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage("I can't sleep", true)}
                        className="text-xs rounded-full border-gray-300 hover:border-primary hover:text-primary transition-apple duration-apple whitespace-nowrap flex-shrink-0"
                      >
                        😴 Can't Sleep?
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage("I need motivation", true)}
                        className="text-xs rounded-full border-gray-300 hover:border-primary hover:text-primary transition-apple duration-apple whitespace-nowrap flex-shrink-0"
                      >
                        💪 Need Motivation?
                      </Button>
                    </div>
                    
                    {/* Row 3: Support & Tools */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage("I'm dealing with trauma", true)}
                        className="text-xs rounded-full border-gray-300 hover:border-primary hover:text-primary transition-apple duration-apple whitespace-nowrap flex-shrink-0"
                      >
                        💔 Dealing with Trauma?
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage("I'm having relationship issues", true)}
                        className="text-xs rounded-full border-gray-300 hover:border-primary hover:text-primary transition-apple duration-apple whitespace-nowrap flex-shrink-0"
                      >
                        💑 Relationship Issues?
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage("Show me coping tools")}
                        className="text-xs rounded-full border-gray-300 hover:border-accent hover:text-accent transition-apple duration-apple font-semibold whitespace-nowrap flex-shrink-0"
                      >
                        🛠️ Need Coping Tools?
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* CBT Tool Options - Show when requested */}
                {!message.isOwn && showCBTOptions && index === messages.length - 1 && !isLoading && (
                  <div className="flex flex-col gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCBTOptions(false);
                        setCurrentCBTFlow('thought-challenger');
                        handleSendMessage("I want to try the Thought Challenger", true);
                      }}
                      className="text-sm rounded-xl border-gray-300 hover:border-accent hover:bg-accent/5 transition-all justify-start"
                    >
                      🧠 Thought Challenger - Reframe negative thinking
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCBTOptions(false);
                        setCurrentCBTFlow('breathing');
                        handleSendMessage("I want to try breathing exercises", true);
                      }}
                      className="text-sm rounded-xl border-gray-300 hover:border-accent hover:bg-accent/5 transition-all justify-start"
                    >
                      🌊 Breathing Exercise - Calm anxiety & panic
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCBTOptions(false);
                        setCurrentCBTFlow('grounding');
                        handleSendMessage("I want to try grounding techniques", true);
                      }}
                      className="text-sm rounded-xl border-gray-300 hover:border-accent hover:bg-accent/5 transition-all justify-start"
                    >
                      🎯 5-4-3-2-1 Grounding - For overwhelming feelings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCBTOptions(false);
                        setCurrentCBTFlow('coping');
                        handleSendMessage("I want to learn coping techniques", true);
                      }}
                      className="text-sm rounded-xl border-gray-300 hover:border-accent hover:bg-accent/5 transition-all justify-start"
                    >
                      💪 Coping Techniques - Quick relief strategies
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator - Only show when loading and NOT streaming */}
          {isLoading && !messages.some(m => !m.isOwn && m.content === '') && (
            <div className="flex justify-start mt-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-[20px] rounded-bl-md px-5 py-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}


          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - iMessage Style */}
      <div className="fixed bottom-16 left-0 right-0 md:relative md:bottom-auto bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
        <div className="max-w-3xl md:max-w-4xl mx-auto px-4 py-3 md:py-4">
          <div className="flex gap-2 items-end bg-gray-100 dark:bg-gray-800 rounded-[24px] px-3 py-2 border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 transition-all">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
              onFocus={(e) => {
                // Scroll input into view when keyboard opens (mobile)
                setTimeout(() => {
                  e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
              }}
              placeholder={isLoadingHistory ? 'Loading chat...' : 'Message'}
              disabled={isLoading || isLoadingHistory}
              className="flex-1 resize-none bg-transparent border-0 px-2 py-2 text-[16px] focus-visible:outline-none disabled:opacity-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 overflow-y-auto touch-manipulation"
              rows={1}
              style={{ minHeight: '36px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            />
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading || isLoadingHistory}
              size="icon"
              className="h-8 w-8 flex-shrink-0 rounded-full bg-accent hover:bg-accent/90 disabled:bg-gray-300 shadow-md transition-all"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-center text-[11px] text-gray-500 dark:text-gray-400 mt-2 hidden md:block">
            Harthio AI provides support tools. For clinical help, consult a professional.
          </p>
        </div>
      </div>

      {/* Feedback Dialog */}
      {showFeedbackDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFeedbackDialog(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">
              {showFeedbackDialog.type === 'positive' ? '👍 What did you like?' : '👎 What went wrong?'}
            </h3>
            
            {showFeedbackDialog.type === 'positive' ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleFeedbackSubmit(showFeedbackDialog.messageId, 'positive', 'helpful')}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  ✅ Helpful
                </button>
                <button
                  onClick={() => handleFeedbackSubmit(showFeedbackDialog.messageId, 'positive', 'informative')}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  📚 Informative
                </button>
                <button
                  onClick={() => handleFeedbackSubmit(showFeedbackDialog.messageId, 'positive', 'easy_to_understand')}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  💡 Easy to understand
                </button>
                <button
                  onClick={() => handleFeedbackSubmit(showFeedbackDialog.messageId, 'positive', 'factually_correct')}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  ✓ Factually correct
                </button>
                <button
                  onClick={() => handleFeedbackSubmit(showFeedbackDialog.messageId, 'positive', 'interesting')}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  ⭐ Interesting
                </button>
                <button
                  onClick={() => handleFeedbackSubmit(showFeedbackDialog.messageId, 'positive', 'other')}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  💬 Other
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handleFeedbackSubmit(showFeedbackDialog.messageId, 'negative', 'not_helpful')}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  ❌ Unhelpful
                </button>
                <button
                  onClick={() => handleFeedbackSubmit(showFeedbackDialog.messageId, 'negative', 'incorrect')}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  ⚠️ Fake/Incorrect
                </button>
                <button
                  onClick={() => handleFeedbackSubmit(showFeedbackDialog.messageId, 'negative', 'misunderstood')}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  🤔 Didn't follow instructions
                </button>
                <button
                  onClick={() => handleFeedbackSubmit(showFeedbackDialog.messageId, 'negative', 'inappropriate')}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  ⚠️ Harmful/Unsafe
                </button>
                <button
                  onClick={() => handleFeedbackSubmit(showFeedbackDialog.messageId, 'negative', 'other')}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  💬 Other
                </button>
              </div>
            )}
            
            <button
              onClick={() => setShowFeedbackDialog(null)}
              className="w-full mt-4 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

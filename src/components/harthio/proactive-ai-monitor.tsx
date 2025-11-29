'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

interface ProactivePrompt {
  id: string;
  message: string;
  emoji: string;
  actions: Array<{
    label: string;
    action: string;
    variant?: 'default' | 'outline';
  }>;
}

export function ProactiveAIMonitor() {
  const [prompt, setPrompt] = useState<ProactivePrompt | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  // Don't show on Harthio AI page (full AI feature available there)
  const isAIPage = pathname === '/harthio';

  useEffect(() => {
    if (isAIPage || !user) return;

    // Check for proactive prompts
    checkForProactivePrompts();
  }, [pathname, user, isAIPage]);

  const checkForProactivePrompts = async () => {
    // This will be called by various triggers throughout the app
    // For now, it's a placeholder that can be triggered by events
  };

  const showPrompt = (newPrompt: ProactivePrompt) => {
    if (isAIPage) return; // Never show on AI page
    
    setPrompt(newPrompt);
    setTimeout(() => setIsVisible(true), 100);
  };

  const handleAction = (action: string) => {
    // Dismiss notification first
    handleDismiss();
    
    // Then perform action
    switch (action) {
      case 'open_chat':
        router.push('/harthio');
        break;
      case 'open_chat_context':
        // Map prompt ID to specific action for context-aware AI
        const actionMap: Record<string, string> = {
          'session_browsing': 'find-session',
          'mood_change_struggling': 'mood-support',
          'mood_change_okay': 'mood-support',
          'idle_home': 'check-in',
          'multiple_resets': 'relapse-support',
          'no_checkins': 'check-in',
          'progress_view': 'progress-review',
        };
        
        // Handle session_ended separately (has dynamic ID and metadata)
        let contextAction = actionMap[prompt?.id || ''];
        let url = `/harthio?action=${contextAction || 'support'}`;
        
        if (!contextAction && prompt?.id.startsWith('session_ended_')) {
          contextAction = 'session-debrief';
          url = `/harthio?action=session-debrief`;
          
          // Add session metadata to URL
          if (prompt?.metadata?.sessionTitle) {
            url += `&session_title=${encodeURIComponent(prompt.metadata.sessionTitle)}`;
          }
          if (prompt?.metadata?.sessionTopic) {
            url += `&session_topic=${encodeURIComponent(prompt.metadata.sessionTopic)}`;
          }
        }
        
        // Redirect with action parameter for context-aware AI
        router.push(url);
        break;
      case 'find_session':
        router.push('/sessions');
        break;
      case 'dismiss':
        // Already dismissed above
        break;
      default:
        // Already dismissed above
        break;
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => setPrompt(null), 300);
  };

  // Expose function to trigger prompts from other components
  useEffect(() => {
    // @ts-ignore - Global function for triggering proactive AI
    window.showProactiveAI = showPrompt;
    
    return () => {
      // @ts-ignore
      delete window.showProactiveAI;
    };
  }, [isAIPage]);

  if (!prompt || isAIPage) return null;

  return (
    <>
      {/* Invisible backdrop - click anywhere to dismiss */}
      {isVisible && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={handleDismiss}
        />
      )}
      
      {/* Notification - overlays on top of header */}
      <div
        className={`fixed top-0 left-0 right-0 z-[60] transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing when clicking notification
      >
        {/* Glass morphism card - matches contextual check-in style */}
        <div className="backdrop-blur-xl bg-white/10 dark:bg-black/20 border-b md:border border-white/20 rounded-b-2xl md:rounded-2xl shadow-2xl max-w-2xl md:mx-auto md:mt-4 md:mx-4">
          <div className="p-4 md:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                  <span>{prompt.emoji}</span>
                  <span>{prompt.message}</span>
                </h3>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 dark:hover:bg-black/20 rounded-md transition-colors flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-end">
              {prompt.actions.map((action, index) => (
                <Button
                  key={index}
                  onClick={() => handleAction(action.action)}
                  variant={action.variant || (index === 0 ? 'default' : 'outline')}
                  size="sm"
                  className="min-w-[120px]"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// TypeScript declaration for global function
declare global {
  interface Window {
    showProactiveAI?: (prompt: ProactivePrompt) => void;
  }
}

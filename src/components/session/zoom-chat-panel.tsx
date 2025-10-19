/**
 * Zoom-Style Chat Panel
 * Exact replica of Zoom's chat interface with proper message alignment
 */

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, X, MessageSquare, MoreVertical, Smile, 
  Paperclip, Search, Users, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system';
}

interface ZoomChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  currentUserId: string;
  currentUserName: string;
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
  participantCount?: number;
}

export function ZoomChatPanel({
  messages,
  onSendMessage,
  currentUserId,
  currentUserName,
  isOpen,
  onClose,
  isMobile = false,
  participantCount = 2
}: ZoomChatPanelProps) {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current && !isMobile) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMobile]);

  const handleSendMessage = () => {
    const trimmedMessage = newMessage.trim();
    if (trimmedMessage) {
      onSendMessage(trimmedMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isConsecutiveMessage = (currentMsg: Message, prevMsg: Message | undefined) => {
    if (!prevMsg) return false;
    return (
      prevMsg.userId === currentMsg.userId &&
      prevMsg.type === 'text' &&
      currentMsg.type === 'text' &&
      (currentMsg.timestamp.getTime() - prevMsg.timestamp.getTime()) < 60000 // Within 1 minute
    );
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed bg-white flex flex-col shadow-2xl border border-gray-300 z-[60]",
      isMobile 
        ? "top-4 bottom-4 left-1/2 right-4 rounded-lg" // Half screen on mobile (right half)
        : "top-4 bottom-4 right-4 w-80 rounded-lg" // Sidebar on desktop
    )}>
      {/* Header - Zoom Style */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg border-t-2 border-t-blue-500">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Chat</h3>
            <p className="text-xs text-gray-500">
              {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-200"
          >
            <X className="w-4 h-4 text-gray-600" />
          </Button>
        </div>
      </div>

      {/* Messages Area - Zoom Style */}
      <ScrollArea className="flex-1 bg-white">
        <div className="p-3 space-y-2">
          {messages.map((message, index) => {
            const isCurrentUser = message.userId === currentUserId;
            const prevMessage = index > 0 ? messages[index - 1] : undefined;
            const isConsecutive = isConsecutiveMessage(message, prevMessage);
            
            if (message.type === 'system') {
              return (
                <div key={message.id} className="flex justify-center my-3">
                  <div className="bg-gray-100 px-3 py-1 rounded-full">
                    <span className="text-xs text-gray-600">
                      {message.content}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div key={message.id} className="group">
                {/* Show sender name and time for first message in sequence */}
                {!isConsecutive && (
                  <div className={cn(
                    "flex items-baseline space-x-2 mb-1",
                    isCurrentUser ? "justify-end flex-row-reverse space-x-reverse" : "justify-start"
                  )}>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.timestamp)}
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      {isCurrentUser ? 'You' : message.userName}
                    </span>
                  </div>
                )}
                
                {/* Message bubble - YOUR messages on RIGHT, RECEIVED on LEFT */}
                <div className={cn(
                  "flex",
                  isCurrentUser ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "max-w-[75%] px-3 py-2 rounded-lg text-sm break-words",
                    isCurrentUser 
                      ? "bg-blue-500 text-white rounded-br-sm" // Your messages: blue, right side
                      : "bg-gray-100 text-gray-900 rounded-bl-sm", // Received: gray, left side
                    isConsecutive && "mt-1"
                  )}>
                    {message.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area - Zoom Style */}
      <div className="border-t border-gray-200 bg-white rounded-b-lg">
        <div className="p-3">
          <div className="flex items-end space-x-2">
            {/* Emoji button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="h-9 w-9 p-0 hover:bg-gray-100 flex-shrink-0"
            >
              <Smile className="w-4 h-4 text-gray-600" />
            </Button>
            
            {/* Message input */}
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type message here..."
                className={cn(
                  "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md",
                  isMobile ? "h-10 text-base" : "h-9 text-sm"
                )}
                maxLength={500}
              />
              
              {/* Character count */}
              {newMessage.length > 400 && (
                <div className="absolute -top-5 right-0">
                  <span className={cn(
                    "text-xs",
                    newMessage.length > 480 ? "text-red-500" : "text-gray-500"
                  )}>
                    {newMessage.length}/500
                  </span>
                </div>
              )}
            </div>
            
            {/* Send button */}
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="sm"
              className={cn(
                "h-9 w-9 p-0 rounded-md bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 flex-shrink-0",
                !newMessage.trim() && "cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Message info */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>
              {messages.filter(m => m.type === 'text').length} message{messages.filter(m => m.type === 'text').length !== 1 ? 's' : ''}
            </span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </div>

      {/* Emoji picker placeholder */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-3 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-10">
          <div className="grid grid-cols-6 gap-2">
            {['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '😢', '😮', '😡', '🙏'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setNewMessage(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-lg hover:bg-gray-100 rounded p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
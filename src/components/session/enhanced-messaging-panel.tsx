/**
 * Enhanced Messaging Panel - Zoom/Google Meet Style
 * Independent messaging that works regardless of video connection status
 * Responsive design for all screen sizes
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, X, MessageSquare, Smile, Paperclip, MoreVertical,
  ChevronDown, ChevronUp, Users, Clock, Search, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system';
}

interface EnhancedMessagingPanelProps {
  // Core functionality
  messages: Message[];
  onSendMessage: (message: string) => void;
  currentUserId: string;
  currentUserName: string;
  
  // UI State
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
  
  // Session info
  sessionId?: string;
  participantCount?: number;
  
  // Responsive behavior
  isMobile?: boolean;
  position?: 'right' | 'bottom' | 'overlay';
  
  // Optional features
  showParticipants?: boolean;
  allowFileSharing?: boolean;
  showTimestamps?: boolean;
  
  // Styling
  accentColor?: string;
  className?: string;
}

export function EnhancedMessagingPanel({
  messages,
  onSendMessage,
  currentUserId,
  currentUserName,
  isOpen,
  onToggle,
  unreadCount = 0,
  sessionId,
  participantCount = 2,
  isMobile = false,
  position = 'right',
  showParticipants = true,
  allowFileSharing = false,
  showTimestamps = true,
  accentColor = 'blue',
  className
}: EnhancedMessagingPanelProps) {
  // State
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);
  
  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && !isMobile && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMobile]);
  
  // Handle typing indicator
  useEffect(() => {
    if (newMessage.trim()) {
      setIsTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    } else {
      setIsTyping(false);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage]);
  
  const handleSendMessage = useCallback(() => {
    const trimmedMessage = newMessage.trim();
    if (trimmedMessage) {
      onSendMessage(trimmedMessage);
      setNewMessage('');
      setIsTyping(false);
    }
  }, [newMessage, onSendMessage]);
  
  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };
  
  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  const filteredMessages = searchQuery 
    ? messages.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.userName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;
  
  const groupedMessages = filteredMessages.reduce((groups, message) => {
    const dateKey = message.timestamp.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {} as Record<string, Message[]>);
  
  // Panel dimensions based on screen size and position
  const getPanelClasses = () => {
    const baseClasses = "bg-white border-l border-gray-200 flex flex-col transition-all duration-300 shadow-xl";
    
    if (isMobile) {
      return cn(
        baseClasses,
        "fixed inset-0 z-50",
        isOpen ? "translate-y-0" : "translate-y-full"
      );
    }
    
    switch (position) {
      case 'right':
        return cn(
          baseClasses,
          "fixed top-0 bottom-0 right-0",
          isOpen ? "w-80 lg:w-96" : "w-0",
          isMinimized && isOpen ? "h-16" : "h-full"
        );
      case 'bottom':
        return cn(
          baseClasses,
          "fixed bottom-0 left-0 right-0 border-l-0 border-t",
          isOpen ? "h-80" : "h-0",
          isMinimized && isOpen ? "h-16" : ""
        );
      case 'overlay':
        return cn(
          baseClasses,
          "fixed top-4 right-4 rounded-lg border shadow-2xl",
          isOpen ? "w-80 h-96" : "w-0 h-0",
          isMinimized && isOpen ? "h-16" : ""
        );
      default:
        return baseClasses;
    }
  };
  
  if (!isOpen && unreadCount === 0) return null;
  
  return (
    <TooltipProvider>
      <div className={cn(getPanelClasses(), className)}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50",
          accentColor === 'blue' ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-gray-500"
        )}>
          <div className="flex items-center space-x-2">
            <MessageSquare className={cn(
              "w-5 h-5",
              accentColor === 'blue' ? "text-blue-600" : "text-gray-600"
            )} />
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Chat
                {participantCount > 0 && showParticipants && (
                  <span className="text-gray-500 ml-1">({participantCount})</span>
                )}
              </h3>
              {sessionId && (
                <p className="text-xs text-gray-500">Session: {sessionId.slice(-8)}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {/* Search Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(!showSearch)}
                  className="h-8 w-8 p-0"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search messages</TooltipContent>
            </Tooltip>
            
            {/* Minimize/Maximize */}
            {!isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-8 w-8 p-0"
                  >
                    {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isMinimized ? 'Expand' : 'Minimize'}
                </TooltipContent>
              </Tooltip>
            )}
            
            {/* Close */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close chat</TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {/* Search Bar */}
        {showSearch && !isMinimized && (
          <div className="p-3 border-b border-gray-200">
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        )}
        
        {!isMinimized && (
          <>
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-4">
                {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
                  <div key={dateKey}>
                    {/* Date Separator */}
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-gray-100 px-3 py-1 rounded-full">
                        <span className="text-xs text-gray-600 font-medium">
                          {formatDate(new Date(dateKey))}
                        </span>
                      </div>
                    </div>
                    
                    {/* Messages for this date */}
                    <div className="space-y-3">
                      {dayMessages.map((message, index) => {
                        const isCurrentUser = message.userId === currentUserId;
                        const showAvatar = !isCurrentUser && (
                          index === 0 || 
                          dayMessages[index - 1]?.userId !== message.userId
                        );
                        
                        return (
                          <div key={message.id}>
                            {message.type === 'system' ? (
                              <div className="flex justify-center">
                                <div className="bg-gray-100 px-3 py-1 rounded-full max-w-xs">
                                  <span className="text-xs text-gray-600">
                                    {message.content}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className={cn(
                                "flex",
                                isCurrentUser ? "justify-end" : "justify-start"
                              )}>
                                <div className={cn(
                                  "flex max-w-[75%]",
                                  isCurrentUser ? "flex-row-reverse" : "flex-row"
                                )}>
                                  {/* Avatar */}
                                  {showAvatar && !isCurrentUser && (
                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2 flex-shrink-0">
                                      <span className="text-xs font-medium text-gray-600">
                                        {message.userName.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Message Content */}
                                  <div className={cn(
                                    "flex flex-col",
                                    isCurrentUser ? "items-end" : "items-start"
                                  )}>
                                    {/* Sender name and time */}
                                    {showTimestamps && (
                                      <div className={cn(
                                        "flex items-center space-x-2 mb-1",
                                        isCurrentUser ? "flex-row-reverse space-x-reverse" : "flex-row"
                                      )}>
                                        {!isCurrentUser && (
                                          <span className="text-xs font-medium text-gray-700">
                                            {message.userName}
                                          </span>
                                        )}
                                        <span className="text-xs text-gray-500">
                                          {formatTime(message.timestamp)}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Message bubble */}
                                    <div
                                      className={cn(
                                        "px-3 py-2 rounded-lg text-sm break-words",
                                        isCurrentUser
                                          ? accentColor === 'blue' 
                                            ? "bg-blue-500 text-white rounded-br-sm"
                                            : "bg-gray-500 text-white rounded-br-sm"
                                          : "bg-gray-100 text-gray-900 rounded-bl-sm"
                                      )}
                                    >
                                      {message.content}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs">You are typing...</span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Message Input */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-end space-x-2">
                {/* File attachment (if enabled) */}
                {allowFileSharing && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 text-gray-500 hover:text-gray-700"
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach file</TooltipContent>
                  </Tooltip>
                )}
                
                {/* Message input */}
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="pr-10 resize-none"
                    maxLength={500}
                  />
                  
                  {/* Character count */}
                  {newMessage.length > 400 && (
                    <div className="absolute -top-6 right-0">
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      size="sm"
                      className={cn(
                        "h-9 w-9 p-0 rounded-full",
                        accentColor === 'blue' 
                          ? "bg-blue-500 hover:bg-blue-600"
                          : "bg-gray-500 hover:bg-gray-600"
                      )}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send message (Enter)</TooltipContent>
                </Tooltip>
              </div>
              
              {/* Message count */}
              {messages.length > 0 && (
                <div className="mt-2 text-center">
                  <span className="text-xs text-gray-500">
                    {messages.length} message{messages.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Unread badge when minimized */}
        {isMinimized && unreadCount > 0 && (
          <div className="absolute -top-2 -right-2">
            <Badge className={cn("bg-red-500 text-white", "animate-pulse")}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
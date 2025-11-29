'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Loader2, Clock, Users, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useOptimizedRequests } from '@/hooks/use-optimized-requests';
import { topicService } from '@/lib/supabase-services';
import { useToast } from '@/hooks/use-toast';
import { formatSessionTimeRange } from '@/lib/time-utils';

interface RequestsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestsSheet({ open, onOpenChange }: RequestsSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const {
    receivedRequests,
    sentRequests,
    isLoading,
    refresh,
  } = useOptimizedRequests({
    enableCache: true,
    enableRealtime: true,
  });

  const handleApprove = async (topicId: string, requesterId: string) => {
    const key = `approve-${topicId}-${requesterId}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      await topicService.approveJoinRequest(topicId, requesterId);
      toast({
        title: 'Request Approved',
        description: 'The user can now join your session.',
      });
      refresh(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to approve request',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleReject = async (topicId: string, requesterId: string) => {
    const key = `reject-${topicId}-${requesterId}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      await topicService.rejectJoinRequest(topicId, requesterId);
      toast({
        title: 'Request Declined',
        description: 'The request has been declined.',
      });
      refresh(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to decline request',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0">
        <SheetHeader className="px-4 pt-6 pb-4 border-b">
          <SheetTitle className="text-lg">Requests</SheetTitle>
          <SheetDescription className="text-xs">
            Manage session join requests
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="received" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-3 mb-2">
            <TabsTrigger value="received" className="text-sm">
              Received
              {receivedRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">
                  {receivedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="text-sm">
              Sent
              {sentRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">
                  {sentRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <TabsContent value="received" className="mt-0 space-y-2.5">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : receivedRequests.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No pending requests</p>
                </div>
              ) : (
                receivedRequests.map((request) => (
                  <div key={request.id} className="bg-card border rounded-lg p-3 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-9 w-9 flex-shrink-0 bg-background border border-border">
                        <AvatarFallback className="bg-background">
                          <User className="h-4 w-4 text-accent" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {request.requester_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {request.topic.title}
                        </p>
                      </div>
                    </div>
                    
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                      {formatSessionTimeRange(
                        new Date(request.topic.start_time),
                        new Date(request.topic.end_time)
                      )}
                    </Badge>
                    
                    {request.message && (
                      <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md leading-relaxed">
                        "{request.message}"
                      </p>
                    )}
                    
                    <div className="flex gap-2 pt-1 justify-end">
                      <Button
                        size="sm"
                        className="md:px-3"
                        onClick={() => handleApprove(request.topic_id, request.requester_id)}
                        disabled={actionLoading[`approve-${request.topic_id}-${request.requester_id}`]}
                      >
                        {actionLoading[`approve-${request.topic_id}-${request.requester_id}`] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="md:px-3"
                        onClick={() => handleReject(request.topic_id, request.requester_id)}
                        disabled={actionLoading[`reject-${request.topic_id}-${request.requester_id}`]}
                      >
                        {actionLoading[`reject-${request.topic_id}-${request.requester_id}`] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <X className="h-3.5 w-3.5 mr-1" />
                            Decline
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="sent" className="mt-0 space-y-2.5">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sentRequests.length === 0 ? (
                <div className="text-center py-16">
                  <Clock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No sent requests</p>
                </div>
              ) : (
                sentRequests.map((request) => (
                  <div key={request.id} className="bg-card border rounded-lg p-3 space-y-2">
                    <div>
                      <p className="text-sm font-medium truncate">
                        {request.topic.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Host: {request.topic.author?.display_name || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                        {formatSessionTimeRange(
                          new Date(request.topic.start_time),
                          new Date(request.topic.end_time)
                        )}
                      </Badge>
                      <Badge 
                        variant={request.status === 'pending' ? 'outline' : request.status === 'approved' ? 'default' : 'destructive'}
                        className="text-[10px] px-2 py-0.5 capitalize"
                      >
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

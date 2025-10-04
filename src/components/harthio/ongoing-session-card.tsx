
'use client';

import { Button } from '@/components/ui/button';
import { Users, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { format, formatDistanceToNowStrict } from 'date-fns';
import type { Topic } from './topic-card';

interface OngoingSessionCardProps {
    topic: Topic;
}

export function OngoingSessionCard({ topic }: OngoingSessionCardProps) {
    const timeRemaining = formatDistanceToNowStrict(topic.endTime, { addSuffix: true });

    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                     <AvatarImage src={topic.author.avatarUrl} alt={topic.author.name} data-ai-hint="person" />
                    <AvatarFallback>{topic.author.initials}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{topic.title}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                         <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{topic.participants?.length || 0} joined</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Ends {timeRemaining}</span>
                        </div>
                    </div>
                </div>
            </div>
             <Button>Join Now</Button>
        </div>
    );
}

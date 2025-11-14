"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { topicService } from "@/lib/supabase-services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSessionTimeRange } from "@/lib/time-utils";
import { Archive, Loader2, Users } from "lucide-react";

export default function ArchivedSessionsPage() {
  const { user } = useAuth();
  const [archivedSessions, setArchivedSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadArchived = async () => {
      setLoading(true);
      const sessions = await topicService.getArchivedSessions(user.uid);
      setArchivedSessions(sessions);
      setLoading(false);
    };

    loadArchived();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Archive className="h-8 w-8" />
          Archived Sessions
        </h1>
        <p className="text-muted-foreground mt-2">
          View your completed and expired conversation sessions
        </p>
      </div>

      <div className="space-y-4">
        {archivedSessions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No archived sessions</h3>
              <p className="text-muted-foreground">
                Your completed sessions will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          archivedSessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{session.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {session.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Hosted by {session.author?.display_name || "Unknown"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {formatSessionTimeRange(
                        new Date(session.start_time),
                        new Date(session.end_time)
                      )}
                    </Badge>
                    <Badge variant="outline" className="ml-2">
                      {session.archive_reason}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{session.participants?.length || 0} participants</span>
                  </div>
                  <div>
                    Archived: {new Date(session.archived_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

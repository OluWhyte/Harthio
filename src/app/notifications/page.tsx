
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Recent updates from topics and people you follow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
            <Bell className="w-12 h-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold">No new notifications</p>
            <p className="text-sm text-muted-foreground">
              We&apos;ll let you know when there&apos;s something new.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

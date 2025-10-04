
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function FollowingPage() {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Following</CardTitle>
          <CardDescription>
            Users you are currently following.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
            <Users className="w-12 h-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold">You aren&apos;t following anyone yet</p>
            <p className="text-sm text-muted-foreground">
              When you follow users, they&apos;ll appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UsersRound } from "lucide-react";

export default function FollowersPage() {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Followers</CardTitle>
          <CardDescription>
            Users who are following you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
            <UsersRound className="w-12 h-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold">No followers yet</p>
            <p className="text-sm text-muted-foreground">
              When users follow you, they'll appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

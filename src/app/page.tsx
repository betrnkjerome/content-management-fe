import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockContent, mockStats } from "@/data/mock-content";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ImageIcon,
  Star,
  MessageSquare,
  FileText,
} from "lucide-react";

const typeIcons = {
  profile_picture: ImageIcon,
  review: Star,
  comment: MessageSquare,
  post: FileText,
};

export default function Dashboard() {
  const recentPending = mockContent
    .filter((item) => item.status === "pending")
    .slice(0, 5);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of content moderation activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalPending}</div>
            <p className="text-xs text-muted-foreground">Awaiting moderation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalApproved}</div>
            <p className="text-xs text-muted-foreground">Content approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taken Down</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalTakenDown}</div>
            <p className="text-xs text-muted-foreground">Content removed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.flaggedContent}</div>
            <p className="text-xs text-muted-foreground">
              User reported content
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Pending Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Pending Content</CardTitle>
              <CardDescription>Content awaiting your review</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/content?status=pending">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPending.map((item) => {
              const TypeIcon = typeIcons[item.type];
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{item.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.type.replace("_", " ")} •{" "}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.flagCount > 0 && (
                      <Badge variant="destructive">
                        {item.flagCount} flags
                      </Badge>
                    )}
                    <Button asChild size="sm">
                      <Link href={`/content?id=${item.id}`}>Review</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

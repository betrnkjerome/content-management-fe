import { Suspense } from "react";
import { ContentQueue } from "@/components/content-queue";

function ContentLoading() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="h-9 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-5 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

export default function ContentPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Content Queue</h1>
        <p className="text-muted-foreground">
          Review and moderate user-generated content
        </p>
      </div>
      <Suspense fallback={<ContentLoading />}>
        <ContentQueue />
      </Suspense>
    </div>
  );
}

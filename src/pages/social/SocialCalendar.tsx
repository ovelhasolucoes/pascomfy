import { AppLayout } from "@/components/layout/AppLayout";
import { useSocialPosts } from "@/hooks/useSocialPosts";
import { PostCalendarView } from "@/components/social/PostCalendarView";
import { Skeleton } from "@/components/ui/skeleton";

export default function SocialCalendar() {
  const { posts, isLoading } = useSocialPosts();

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-2xl font-bold">Calendário de Posts</h1>

        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <PostCalendarView posts={posts} />
        )}
      </div>
    </AppLayout>
  );
}

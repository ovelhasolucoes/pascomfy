import { AppLayout } from "@/components/layout/AppLayout";
import { useSocialPosts } from "@/hooks/useSocialPosts";
import { PostCalendarView } from "@/components/social/PostCalendarView";
import { Skeleton } from "@/components/ui/skeleton";

export default function SocialCalendar() {
  const { posts, isLoading } = useSocialPosts();

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 px-4">
        <div>
          <h1 className="text-2xl font-bold">Calendário</h1>
          <p className="text-sm text-muted-foreground">Visualize seus posts agendados e publicados</p>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : (
          <PostCalendarView posts={posts} />
        )}
      </div>
    </AppLayout>
  );
}

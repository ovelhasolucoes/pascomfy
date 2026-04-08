import { useSocialPosts } from "@/hooks/useSocialPosts";
import { PostCalendarView } from "@/components/social/PostCalendarView";
import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarTabContent() {
  const { posts, isLoading } = useSocialPosts();

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  return <PostCalendarView posts={posts} />;
}

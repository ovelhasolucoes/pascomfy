import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSocialPosts } from "@/hooks/useSocialPosts";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { PostForm } from "@/components/social/PostForm";
import { PostCard } from "@/components/social/PostCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const statusOptions = [
  { value: "todos", label: "Todos" },
  { value: "rascunho", label: "Rascunho" },
  { value: "agendado", label: "Agendado" },
  { value: "publicado", label: "Publicado" },
  { value: "erro", label: "Erro" },
];

export default function SocialPosts() {
  const [statusFilter, setStatusFilter] = useState("todos");
  const { posts, isLoading, createPost, publishPost, deletePost } = useSocialPosts(statusFilter);
  const { accounts } = useSocialAccounts();

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Posts</h1>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PostForm
              accounts={accounts}
              onSubmit={(post) => createPost.mutate(post)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-56" />)}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Nenhum post encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPublish={(id) => publishPost.mutate(id)}
                onDelete={(id) => deletePost.mutate(id)}
                isPublishing={publishPost.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

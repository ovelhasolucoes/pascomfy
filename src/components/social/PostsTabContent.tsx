import { useState } from "react";
import { useSocialPosts } from "@/hooks/useSocialPosts";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { useSocialMetrics } from "@/hooks/useSocialMetrics";
import { PostForm } from "@/components/social/PostForm";
import { PostCard } from "@/components/social/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle2, AlertCircle, LayoutGrid, RefreshCw } from "lucide-react";

const statusTabs = [
  { value: "todos", label: "Todos", icon: LayoutGrid, color: "" },
  { value: "rascunho", label: "Rascunhos", icon: FileText, color: "text-muted-foreground" },
  { value: "agendado", label: "Agendados", icon: Clock, color: "text-muted-foreground" },
  { value: "publicado", label: "Publicados", icon: CheckCircle2, color: "text-muted-foreground" },
  { value: "erro", label: "Erros", icon: AlertCircle, color: "text-destructive" },
];

export default function PostsTabContent() {
  const [statusFilter, setStatusFilter] = useState("todos");
  const { posts, isLoading, createPost, publishPost, deletePost } = useSocialPosts(statusFilter);
  const { accounts } = useSocialAccounts();

  const publishedPostIds = posts.filter((p) => p.status === "publicado").map((p) => p.id);
  const { metricsMap, refreshMetrics } = useSocialMetrics(publishedPostIds);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {publishedPostIds.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => refreshMetrics.mutate(undefined)} disabled={refreshMetrics.isPending}>
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshMetrics.isPending ? "animate-spin" : ""}`} />
              Atualizar métricas
            </Button>
          )}
        </div>
        <PostForm accounts={accounts} onSubmit={(post) => createPost.mutate(post)} />
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {statusTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${!isActive ? tab.color : ""}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground">Nenhum post encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">Crie seu primeiro post clicando em "Novo Post"</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPublish={(id) => publishPost.mutate(id)}
              onDelete={(id) => deletePost.mutate(id)}
              isPublishing={publishPost.isPending}
              metrics={metricsMap.get(post.id)}
              onRefreshMetrics={(id) => refreshMetrics.mutate(id)}
              isRefreshing={refreshMetrics.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

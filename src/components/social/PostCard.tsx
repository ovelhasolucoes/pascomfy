import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Trash2, Clock, AlertCircle, CheckCircle2, FileEdit, Loader2, ChevronLeft, ChevronRight, Instagram, Facebook, MoreHorizontal, Heart, MessageCircle, Share2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { SocialPost } from "@/hooks/useSocialPosts";
import type { SocialPostMetrics } from "@/hooks/useSocialMetrics";
import { useState } from "react";

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  rascunho: { label: "Rascunho", className: "bg-slate-100 text-slate-700 border-slate-200", icon: FileEdit },
  agendado: { label: "Agendado", className: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  publicando: { label: "Publicando", className: "bg-blue-100 text-blue-700 border-blue-200", icon: Loader2 },
  publicado: { label: "Publicado", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  erro: { label: "Erro", className: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
};

const platformIcons: Record<string, { icon: any; color: string }> = {
  facebook: { icon: Facebook, color: "text-blue-600" },
  instagram: { icon: Instagram, color: "text-pink-600" },
  ambos: { icon: Instagram, color: "text-purple-600" },
};

interface PostCardProps {
  post: SocialPost;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  isPublishing?: boolean;
  metrics?: SocialPostMetrics;
  onRefreshMetrics?: (postId: string) => void;
  isRefreshing?: boolean;
}

export function PostCard({ post, onPublish, onDelete, isPublishing, metrics, onRefreshMetrics, isRefreshing }: PostCardProps) {
  const config = statusConfig[post.status] || statusConfig.rascunho;
  const StatusIcon = config.icon;
  const pConfig = platformIcons[post.platform] || platformIcons.facebook;
  const PlatformIcon = pConfig.icon;
  const [slide, setSlide] = useState(0);
  const mediaUrls = post.media_urls || [];

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      {/* Media */}
      <div className="relative aspect-square bg-muted">
        {mediaUrls.length > 0 ? (
          <>
            <img
              src={mediaUrls[slide] || mediaUrls[0]}
              alt=""
              className="w-full h-full object-cover"
            />
            {mediaUrls.length > 1 && (
              <>
                {slide > 0 && (
                  <button
                    onClick={() => setSlide(slide - 1)}
                    className="absolute left-1 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                )}
                {slide < mediaUrls.length - 1 && (
                  <button
                    onClick={() => setSlide(slide + 1)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {mediaUrls.map((_, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === slide ? "bg-white" : "bg-white/40"}`} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <FileEdit className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}

        {/* Overlays */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge className={`${config.className} border text-xs gap-1`}>
            <StatusIcon className={`h-3 w-3 ${post.status === "publicando" ? "animate-spin" : ""}`} />
            {config.label}
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          <PlatformIcon className={`h-5 w-5 ${pConfig.color} drop-shadow-md`} />
        </div>
      </div>

      <CardContent className="p-3 space-y-2">
        <p className="text-sm line-clamp-2 min-h-[2.5rem]">
          {post.caption || <span className="text-muted-foreground italic">Sem legenda</span>}
        </p>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {post.scheduled_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(post.scheduled_at), "dd/MM HH:mm", { locale: ptBR })}
              </span>
            )}
            {post.published_at && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {format(new Date(post.published_at), "dd/MM HH:mm", { locale: ptBR })}
              </span>
            )}
            {!post.scheduled_at && !post.published_at && (
              <span>{format(new Date(post.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(post.status === "rascunho" || post.status === "erro") && (
                <DropdownMenuItem onClick={() => onPublish(post.id)} disabled={isPublishing}>
                  <Send className="h-3.5 w-3.5 mr-2" /> Publicar
                </DropdownMenuItem>
              )}
              {post.status !== "publicado" && (
                <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Engagement metrics for published posts */}
        {post.status === "publicado" && (
          <div className="flex items-center justify-between pt-1 border-t">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-red-500" />
                {metrics?.likes ?? "—"}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3 text-blue-500" />
                {metrics?.comments ?? "—"}
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="h-3 w-3 text-emerald-500" />
                {metrics?.shares ?? "—"}
              </span>
            </div>
            {onRefreshMetrics && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onRefreshMetrics(post.id)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        )}

        {post.error_message && (
          <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{post.error_message}</p>
        )}
      </CardContent>
    </Card>
  );
}

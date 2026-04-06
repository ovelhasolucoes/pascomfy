import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Send, Trash2, Clock, AlertCircle, CheckCircle2, FileEdit, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { SocialPost } from "@/hooks/useSocialPosts";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  rascunho: { label: "Rascunho", variant: "secondary", icon: FileEdit },
  agendado: { label: "Agendado", variant: "outline", icon: Clock },
  publicando: { label: "Publicando...", variant: "default", icon: Loader2 },
  publicado: { label: "Publicado", variant: "default", icon: CheckCircle2 },
  erro: { label: "Erro", variant: "destructive", icon: AlertCircle },
};

const platformLabels: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  ambos: "Facebook + Instagram",
};

interface PostCardProps {
  post: SocialPost;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  isPublishing?: boolean;
}

export function PostCard({ post, onPublish, onDelete, isPublishing }: PostCardProps) {
  const config = statusConfig[post.status] || statusConfig.rascunho;
  const StatusIcon = config.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant={config.variant} className="gap-1">
            <StatusIcon className={`h-3 w-3 ${post.status === "publicando" ? "animate-spin" : ""}`} />
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {platformLabels[post.platform] || post.platform}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {post.media_urls?.length > 0 && (
          <img
            src={post.media_urls[0]}
            alt="Post media"
            className="w-full h-40 object-cover rounded-md"
          />
        )}
        <p className="text-sm line-clamp-3">{post.caption || "(sem legenda)"}</p>
        {post.scheduled_at && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(post.scheduled_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </p>
        )}
        {post.error_message && (
          <p className="text-xs text-destructive">{post.error_message}</p>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        {(post.status === "rascunho" || post.status === "erro") && (
          <Button size="sm" onClick={() => onPublish(post.id)} disabled={isPublishing} className="gap-1">
            <Send className="h-3 w-3" />
            Publicar
          </Button>
        )}
        {post.status !== "publicado" && (
          <Button size="sm" variant="ghost" onClick={() => onDelete(post.id)} className="text-destructive">
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

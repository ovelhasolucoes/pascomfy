import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { SocialPost } from "@/hooks/useSocialPosts";

interface PostCalendarViewProps {
  posts: SocialPost[];
}

export function PostCalendarView({ posts }: PostCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const postsWithDates = posts.filter((p) => p.scheduled_at || p.published_at);

  const getPostDate = (p: SocialPost) => new Date(p.scheduled_at || p.published_at || p.created_at);

  const datesWithPosts = postsWithDates.map((p) => getPostDate(p));

  const selectedPosts = selectedDate
    ? postsWithDates.filter((p) => isSameDay(getPostDate(p), selectedDate))
    : [];

  const statusColors: Record<string, string> = {
    rascunho: "bg-muted text-muted-foreground",
    agendado: "bg-primary/10 text-primary",
    publicado: "bg-green-100 text-green-800",
    erro: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          locale={ptBR}
          modifiers={{ hasPosts: datesWithPosts }}
          modifiersStyles={{
            hasPosts: { fontWeight: "bold", textDecoration: "underline" },
          }}
        />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-3">
          {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : "Selecione um dia"}
        </h3>
        {selectedPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum post nesta data.</p>
        ) : (
          <div className="space-y-2">
            {selectedPosts.map((post) => (
              <div key={post.id} className="p-3 border rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <Badge className={statusColors[post.status] || ""}>{post.status}</Badge>
                  <span className="text-xs text-muted-foreground">{post.platform}</span>
                </div>
                <p className="text-sm line-clamp-2">{post.caption || "(sem legenda)"}</p>
                {post.scheduled_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(post.scheduled_at), "HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

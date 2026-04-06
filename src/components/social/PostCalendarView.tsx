import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, CheckCircle2, AlertCircle, FileEdit, Instagram, Facebook } from "lucide-react";
import type { SocialPost } from "@/hooks/useSocialPosts";

interface PostCalendarViewProps {
  posts: SocialPost[];
}

const statusDot: Record<string, string> = {
  rascunho: "bg-slate-400",
  agendado: "bg-amber-500",
  publicado: "bg-emerald-500",
  publicando: "bg-blue-500",
  erro: "bg-red-500",
};

const statusBadge: Record<string, { label: string; className: string; icon: any }> = {
  rascunho: { label: "Rascunho", className: "bg-slate-100 text-slate-700", icon: FileEdit },
  agendado: { label: "Agendado", className: "bg-amber-100 text-amber-700", icon: Clock },
  publicado: { label: "Publicado", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  erro: { label: "Erro", className: "bg-red-100 text-red-700", icon: AlertCircle },
};

export function PostCalendarView({ posts }: PostCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const postsWithDates = posts.filter((p) => p.scheduled_at || p.published_at || p.created_at);
  const getPostDate = (p: SocialPost) => new Date(p.scheduled_at || p.published_at || p.created_at);

  const selectedPosts = selectedDate
    ? postsWithDates.filter((p) => isSameDay(getPostDate(p), selectedDate))
    : [];

  // Build a map of dates that have posts for the calendar
  const dateHasPosts = new Map<string, string[]>();
  postsWithDates.forEach((p) => {
    const key = format(getPostDate(p), "yyyy-MM-dd");
    const statuses = dateHasPosts.get(key) || [];
    if (!statuses.includes(p.status)) statuses.push(p.status);
    dateHasPosts.set(key, statuses);
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:min-w-[300px]">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          locale={ptBR}
          components={{
            DayContent: ({ date }) => {
              const key = format(date, "yyyy-MM-dd");
              const statuses = dateHasPosts.get(key);
              return (
                <div className="flex flex-col items-center">
                  <span>{date.getDate()}</span>
                  {statuses && (
                    <div className="flex gap-0.5 mt-0.5">
                      {statuses.slice(0, 3).map((s, i) => (
                        <span key={i} className={`w-1.5 h-1.5 rounded-full ${statusDot[s] || "bg-muted-foreground"}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            },
          }}
        />

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-3 px-2">
          {Object.entries(statusDot).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-4">
          {selectedDate ? format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Selecione um dia"}
        </h3>

        {selectedPosts.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-xl">
            <p className="text-sm text-muted-foreground">Nenhum post nesta data</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedPosts.map((post) => {
              const config = statusBadge[post.status] || statusBadge.rascunho;
              const StatusIcon = config.icon;
              const PlatformIcon = post.platform === "facebook" ? Facebook : Instagram;

              return (
                <div
                  key={post.id}
                  className="flex gap-3 p-3 border rounded-xl hover:bg-muted/30 transition-colors"
                >
                  {/* Thumbnail */}
                  {post.media_urls?.length > 0 ? (
                    <img
                      src={post.media_urls[0]}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <FileEdit className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${config.className} text-xs gap-1 border-0`}>
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                      <PlatformIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-sm line-clamp-1">{post.caption || "Sem legenda"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {post.scheduled_at
                        ? format(new Date(post.scheduled_at), "HH:mm", { locale: ptBR })
                        : post.published_at
                        ? format(new Date(post.published_at), "HH:mm", { locale: ptBR })
                        : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

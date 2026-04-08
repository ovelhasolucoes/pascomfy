import { useState } from "react";
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { usePlatformBrandingContext } from "@/contexts/PlatformBrandingContext";

const typeConfig = {
  info: { icon: Info, bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-800 dark:text-blue-200", border: "border-blue-200 dark:border-blue-800" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-800 dark:text-amber-200", border: "border-amber-200 dark:border-amber-800" },
  success: { icon: CheckCircle, bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-800 dark:text-emerald-200", border: "border-emerald-200 dark:border-emerald-800" },
  error: { icon: AlertCircle, bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-800 dark:text-red-200", border: "border-red-200 dark:border-red-800" },
};

export function AnnouncementBanner() {
  const { announcements } = usePlatformBrandingContext();
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const visible = announcements.filter((_, i) => !dismissed.has(i));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {announcements.map((a, i) => {
        if (dismissed.has(i)) return null;
        const config = typeConfig[a.type] || typeConfig.info;
        const Icon = config.icon;
        return (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${config.bg} ${config.border}`}
          >
            <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.text}`} />
            <div className="flex-1 min-w-0">
              {a.title && (
                <p className={`text-sm font-semibold ${config.text}`}>{a.title}</p>
              )}
              {a.message && (
                <p className={`text-sm ${config.text} opacity-80`}>{a.message}</p>
              )}
            </div>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(i))}
              className={`shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 ${config.text}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

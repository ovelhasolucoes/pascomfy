import type { Biolink, BiolinkItem } from "@/hooks/useBiolink";
import { ExternalLink } from "lucide-react";

const TIPO_EMOJI: Record<string, string> = {
  whatsapp: "💬",
  youtube: "▶️",
  instagram: "📸",
  facebook: "👤",
  doacao: "❤️",
  link: "🔗",
};

interface Props {
  biolink: Biolink;
  items: BiolinkItem[];
}

export function BiolinkPreview({ biolink, items }: Props) {
  const activeItems = items.filter((i) => i.ativo);

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-lg mx-auto"
      style={{
        background: `linear-gradient(135deg, ${biolink.cor_primaria}, ${biolink.cor_secundaria})`,
        maxWidth: 320,
        minHeight: 400,
      }}
    >
      <div className="flex flex-col items-center gap-3 p-6">
        {biolink.logo_url && (
          <img
            src={biolink.logo_url}
            alt={biolink.titulo}
            className="w-16 h-16 rounded-full object-cover border-2 border-white/40"
          />
        )}
        <h3 className="text-white font-bold text-base text-center">{biolink.titulo}</h3>
        {biolink.descricao && (
          <p className="text-white/80 text-xs text-center">{biolink.descricao}</p>
        )}

        <div className="w-full space-y-2 mt-2">
          {activeItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-white text-xs font-medium"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <span>{TIPO_EMOJI[item.tipo]}</span>
              <span className="truncate">{item.titulo}</span>
            </div>
          ))}
          {activeItems.length === 0 && (
            <p className="text-white/50 text-xs text-center py-4">Sem links ativos</p>
          )}
        </div>

        <p className="text-white/40 text-[10px] mt-4">Pascomfy</p>
      </div>
    </div>
  );
}

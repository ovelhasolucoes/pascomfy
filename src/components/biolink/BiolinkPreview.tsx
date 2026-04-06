import type { Biolink, BiolinkItem } from "@/hooks/useBiolink";
import { TipoIcon } from "./BiolinkTypeIcons";

interface Props {
  biolink: Biolink;
  items: BiolinkItem[];
}

export function BiolinkPreview({ biolink, items }: Props) {
  const activeItems = items.filter((i) => i.ativo);

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-xl mx-auto"
      style={{
        background: `linear-gradient(135deg, ${biolink.cor_primaria}, ${biolink.cor_secundaria})`,
        maxWidth: 320,
        minHeight: 420,
      }}
    >
      <div className="flex flex-col items-center gap-3 p-6">
        {biolink.logo_url ? (
          <img
            src={biolink.logo_url}
            alt={biolink.titulo}
            className="w-20 h-20 rounded-full object-cover border-3 border-white/40 shadow-lg"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-2xl text-white font-bold">{biolink.titulo.charAt(0)}</span>
          </div>
        )}
        <h3 className="text-white font-bold text-lg text-center drop-shadow-sm">{biolink.titulo}</h3>
        {biolink.descricao && (
          <p className="text-white/85 text-xs text-center leading-relaxed max-w-[260px]">{biolink.descricao}</p>
        )}

        <div className="w-full space-y-2.5 mt-3">
          {activeItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium cursor-pointer hover:scale-[1.02] transition-transform"
              style={{
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-white/20">
                <TipoIcon tipo={item.tipo} size={14} />
              </div>
              <span className="truncate">{item.titulo}</span>
            </div>
          ))}
          {activeItems.length === 0 && (
            <p className="text-white/50 text-xs text-center py-6">Sem links ativos</p>
          )}
        </div>

        <p className="text-white/30 text-[10px] mt-6 font-medium tracking-wider">PASCOMFY</p>
      </div>
    </div>
  );
}

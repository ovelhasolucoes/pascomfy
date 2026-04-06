import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Link2, MessageCircle, Youtube, Instagram, Facebook, Heart, ExternalLink } from "lucide-react";

const TIPO_ICONS: Record<string, typeof Link2> = {
  link: Link2,
  whatsapp: MessageCircle,
  youtube: Youtube,
  instagram: Instagram,
  facebook: Facebook,
  doacao: Heart,
};

interface BiolinkData {
  id: string;
  titulo: string;
  descricao: string | null;
  logo_url: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  slug: string;
}

interface BiolinkItemData {
  id: string;
  titulo: string;
  url: string;
  tipo: string;
  ordem: number;
}

export default function BioPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [biolink, setBiolink] = useState<BiolinkData | null>(null);
  const [items, setItems] = useState<BiolinkItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      const { data: bl } = await supabase
        .from("biolinks")
        .select("*")
        .eq("slug", slug)
        .eq("ativo", true)
        .maybeSingle();

      if (!bl) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setBiolink(bl);

      const { data: it } = await supabase
        .from("biolink_items")
        .select("*")
        .eq("biolink_id", bl.id)
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      setItems(it || []);
      setLoading(false);
    };

    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (notFound || !biolink) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted gap-2">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-muted-foreground">Página não encontrada</p>
      </div>
    );
  }

  const edgeFunctionBase = `https://cchovdurprjtefisautg.supabase.co/functions/v1/biolink-page`;

  const handleClick = (item: BiolinkItemData) => {
    // Track click via edge function then redirect
    window.open(`${edgeFunctionBase}?slug=${slug}&click=${item.id}`, "_blank");
  };

  return (
    <div
      className="min-h-screen flex justify-center px-4 py-8"
      style={{ background: `linear-gradient(135deg, ${biolink.cor_primaria}, ${biolink.cor_secundaria})` }}
    >
      <div className="w-full max-w-md flex flex-col items-center gap-4">
        {biolink.logo_url ? (
          <img
            src={biolink.logo_url}
            alt={biolink.titulo}
            className="w-24 h-24 rounded-full object-cover border-[3px] border-white/40 shadow-xl"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center shadow-xl">
            <span className="text-3xl font-bold text-white">{biolink.titulo.charAt(0)}</span>
          </div>
        )}

        <h1 className="text-white text-2xl font-bold text-center drop-shadow-md">{biolink.titulo}</h1>

        {biolink.descricao && (
          <p className="text-white/85 text-sm text-center leading-relaxed max-w-xs">{biolink.descricao}</p>
        )}

        <div className="w-full space-y-3 mt-4">
          {items.map((item) => {
            const Icon = TIPO_ICONS[item.tipo] || Link2;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item)}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-white font-medium text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1 truncate">{item.titulo}</span>
                <ExternalLink className="h-4 w-4 opacity-50 shrink-0" />
              </button>
            );
          })}
        </div>

        <a
          href="https://pascomfy.app"
          className="text-white/30 text-xs mt-8 hover:text-white/50 transition-colors tracking-wider font-medium"
        >
          Powered by PASCOMFY
        </a>
      </div>
    </div>
  );
}

import { Link2, MessageCircle, Youtube, Instagram, Facebook, Heart } from "lucide-react";
import type { BiolinkItem } from "@/hooks/useBiolink";

const TIPO_CONFIG: Record<BiolinkItem["tipo"], { icon: typeof Link2; color: string; bg: string; label: string }> = {
  link: { icon: Link2, color: "text-blue-600", bg: "bg-blue-100", label: "Link" },
  whatsapp: { icon: MessageCircle, color: "text-green-600", bg: "bg-green-100", label: "WhatsApp" },
  youtube: { icon: Youtube, color: "text-red-600", bg: "bg-red-100", label: "YouTube" },
  instagram: { icon: Instagram, color: "text-pink-600", bg: "bg-pink-100", label: "Instagram" },
  facebook: { icon: Facebook, color: "text-blue-700", bg: "bg-blue-100", label: "Facebook" },
  doacao: { icon: Heart, color: "text-rose-600", bg: "bg-rose-100", label: "Doação" },
};

export function getTipoConfig(tipo: BiolinkItem["tipo"]) {
  return TIPO_CONFIG[tipo] || TIPO_CONFIG.link;
}

export function TipoIcon({ tipo, size = 16 }: { tipo: BiolinkItem["tipo"]; size?: number }) {
  const config = getTipoConfig(tipo);
  const Icon = config.icon;
  return (
    <div className={`flex items-center justify-center rounded-md p-1.5 ${config.bg}`}>
      <Icon className={config.color} size={size} />
    </div>
  );
}

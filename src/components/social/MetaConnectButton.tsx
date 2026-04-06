import { Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MetaConnectButtonProps {
  oauthUrl: string;
  status: string;
}

export function MetaConnectButton({ oauthUrl, status }: MetaConnectButtonProps) {
  const isConnected = status === "ativo";
  const isError = status === "erro";

  return (
    <Button
      variant={isConnected ? "outline" : "default"}
      onClick={() => window.location.href = oauthUrl}
      className="gap-2"
    >
      <Facebook className="h-4 w-4" />
      {isConnected ? "Reconectar" : isError ? "Tentar novamente" : "Conectar com Facebook"}
    </Button>
  );
}

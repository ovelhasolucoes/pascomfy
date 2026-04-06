import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  currentUrl: string | null;
  companyId: string;
  onUploaded: (url: string) => void;
}

export function BiolinkLogoUpload({ currentUrl, companyId, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 2MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${companyId}/biolink-logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("company-files")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("company-files").getPublicUrl(path);
      onUploaded(data.publicUrl);
      toast.success("Logo atualizado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {currentUrl ? (
        <img src={currentUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
          {currentUrl ? "Trocar logo" : "Enviar logo"}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">PNG ou JPG, até 2MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}

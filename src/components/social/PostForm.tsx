import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PostFormProps {
  accounts: any[];
  onSubmit: (post: {
    social_account_id: string;
    caption: string;
    media_type?: string;
    media_urls?: string[];
    platform: string;
    scheduled_at?: string | null;
  }) => void;
  onPublishNow?: (postId: string) => void;
}

export function PostForm({ accounts, onSubmit }: PostFormProps) {
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [caption, setCaption] = useState("");
  const [platform, setPlatform] = useState("facebook");
  const [schedule, setSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a: any) => a.status === "ativo");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!accountId) {
      toast.error("Selecione uma conta.");
      return;
    }

    let mediaUrls: string[] = [];
    let mediaType: string | undefined;

    if (mediaFile) {
      setUploading(true);
      try {
        const ext = mediaFile.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("social-temp")
          .upload(path, mediaFile, { contentType: mediaFile.type });
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("social-temp")
          .getPublicUrl(path);

        mediaUrls = [urlData.publicUrl];
        mediaType = mediaFile.type.startsWith("video") ? "video" : "imagem";
      } catch (err: any) {
        toast.error("Erro no upload: " + err.message);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSubmit({
      social_account_id: accountId,
      caption,
      media_type: mediaType,
      media_urls: mediaUrls,
      platform,
      scheduled_at: schedule ? scheduledAt || null : null,
    });

    setOpen(false);
    setCaption("");
    setMediaFile(null);
    setPreviewUrl(null);
    setSchedule(false);
    setScheduledAt("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Novo Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Conta</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {activeAccounts.map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.page_name || a.app_id} {a.instagram_username ? `(@${a.instagram_username})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Plataforma</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Legenda</Label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escreva a legenda do post..."
              rows={4}
            />
          </div>

          <div>
            <Label>Mídia</Label>
            <div className="flex items-center gap-2 mt-1">
              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-accent">
                <Upload className="h-4 w-4" />
                {mediaFile ? mediaFile.name : "Selecionar arquivo"}
                <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="mt-2 w-full h-40 object-cover rounded-md" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={schedule} onCheckedChange={setSchedule} />
            <Label>Agendar publicação</Label>
          </div>

          {schedule && (
            <div>
              <Label>Data e hora</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          )}

          <Button onClick={handleSubmit} disabled={uploading} className="w-full">
            {uploading ? "Enviando..." : schedule ? "Agendar" : "Criar rascunho"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

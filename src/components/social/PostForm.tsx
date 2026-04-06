import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, X, ChevronLeft, ChevronRight, ImagePlus, Send, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PostPreview } from "./PostPreview";

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
}

export function PostForm({ accounts, onSubmit }: PostFormProps) {
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [caption, setCaption] = useState("");
  const [platform, setPlatform] = useState("ambos");
  const [schedule, setSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeAccounts = accounts.filter((a: any) => a.status === "ativo");

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (mediaFiles.length + files.length > 20) {
      toast.error("Máximo de 20 arquivos por post.");
      return;
    }
    const newFiles = [...mediaFiles, ...files];
    setMediaFiles(newFiles);
    setPreviewUrls(newFiles.map((f) => URL.createObjectURL(f)));
  }, [mediaFiles]);

  const removeMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    setPreviewUrls(newFiles.map((f) => URL.createObjectURL(f)));
    if (currentSlide >= newFiles.length && newFiles.length > 0) {
      setCurrentSlide(newFiles.length - 1);
    } else if (newFiles.length === 0) {
      setCurrentSlide(0);
    }
  };

  const handleSubmit = async (publishNow: boolean) => {
    if (!accountId) {
      toast.error("Selecione uma conta.");
      return;
    }
    if (schedule && !scheduledAt) {
      toast.error("Selecione uma data para agendar.");
      return;
    }

    let mediaUrls: string[] = [];
    let mediaType: string | undefined;

    if (mediaFiles.length > 0) {
      setUploading(true);
      try {
        for (const file of mediaFiles) {
          const ext = file.name.split(".").pop();
          const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from("social-temp")
            .upload(path, file, { contentType: file.type });
          if (uploadErr) throw uploadErr;
          const { data: urlData } = supabase.storage.from("social-temp").getPublicUrl(path);
          mediaUrls.push(urlData.publicUrl);
        }
        mediaType = mediaFiles.length > 1 ? "carousel" : mediaFiles[0].type.startsWith("video") ? "video" : "imagem";
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

    resetForm();
  };

  const resetForm = () => {
    setOpen(false);
    setCaption("");
    setMediaFiles([]);
    setPreviewUrls([]);
    setSchedule(false);
    setScheduledAt("");
    setCurrentSlide(0);
  };

  const selectedAccount = accounts.find((a: any) => a.id === accountId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white shadow-lg">
          <Plus className="h-4 w-4" /> Novo Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Criar Post</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-4">
            {/* Account */}
            <div>
              <Label className="text-sm font-medium">Conta</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione a conta Meta" />
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        {a.page_name || a.app_id}
                        {a.instagram_username && (
                          <Badge variant="secondary" className="text-xs">@{a.instagram_username}</Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeAccounts.length === 0 && (
                <p className="text-xs text-destructive mt-1">Nenhuma conta conectada. Configure em Contas Meta.</p>
              )}
            </div>

            {/* Platform */}
            <div>
              <Label className="text-sm font-medium">Plataforma</Label>
              <div className="flex gap-2 mt-1">
                {[
                  { value: "facebook", label: "Facebook", color: "bg-blue-500" },
                  { value: "instagram", label: "Instagram", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
                  { value: "ambos", label: "Ambos", color: "bg-gradient-to-r from-blue-500 to-pink-500" },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      platform === p.value
                        ? `${p.color} text-white shadow-md scale-105`
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <Label className="text-sm font-medium">Mídia ({mediaFiles.length}/20)</Label>
              <div className="mt-1 space-y-2">
                {/* Thumbnails grid */}
                {previewUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {previewUrls.map((url, i) => (
                      <div key={i} className="relative group w-16 h-16">
                        <img src={url} alt="" className="w-full h-full object-cover rounded-lg border" />
                        <button
                          onClick={() => removeMedia(i)}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Adicionar imagens ou vídeos</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Caption */}
            <div>
              <Label className="text-sm font-medium">Legenda</Label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Escreva a legenda do seu post..."
                rows={5}
                className="mt-1 resize-none"
              />
              <p className="text-xs text-muted-foreground text-right mt-1">{caption.length} caracteres</p>
            </div>

            {/* Schedule */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm cursor-pointer">Agendar publicação</Label>
              </div>
              <Switch checked={schedule} onCheckedChange={setSchedule} />
            </div>

            {schedule && (
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {schedule ? (
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={uploading || !accountId}
                  className="flex-1 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                  Agendar
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => handleSubmit(false)}
                    disabled={uploading || !accountId}
                    variant="outline"
                    className="flex-1"
                  >
                    Salvar rascunho
                  </Button>
                  <Button
                    onClick={() => handleSubmit(true)}
                    disabled={uploading || !accountId}
                    className="flex-1 gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Publicar agora
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right: Preview */}
          <div className="hidden lg:block">
            <PostPreview
              caption={caption}
              mediaUrls={previewUrls}
              platform={platform}
              accountName={selectedAccount?.page_name || "Sua Página"}
              accountUsername={selectedAccount?.instagram_username || "seuperfil"}
              currentSlide={currentSlide}
              onSlideChange={setCurrentSlide}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

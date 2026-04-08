import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Camera, Plus, X, Save, Loader2, ChevronDown, QrCode } from "lucide-react";
import { VolunteerQRCode } from "@/components/checkin/VolunteerQRCode";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from "@/components/ui/responsive-dialog";

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const SHIFTS = ["Manhã", "Tarde", "Noite"];

const ProfilePage = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [preferredRoles, setPreferredRoles] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [newSkill, setNewSkill] = useState("");
  const [newRole, setNewRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
      setBio((profile as any).bio ?? "");
      setSkills(((profile as any).skills as string[]) ?? []);
      setPreferredRoles(((profile as any).preferred_roles as string[]) ?? []);
      setAvailability((profile.availability as Record<string, string[]>) ?? {});
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile?.company_id) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Máx. 2MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.company_id}/avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("company-files").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("company-files").getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl + "?t=" + Date.now());
      toast.success("Foto atualizada!");
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); }
  };

  const toggleAvailability = (day: string, shift: string) => {
    setAvailability((prev) => {
      const daySlots = prev[day] ?? [];
      const has = daySlots.includes(shift);
      return { ...prev, [day]: has ? daySlots.filter((s) => s !== shift) : [...daySlots, shift] };
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        name, phone, bio, skills, preferred_roles: preferredRoles, availability, avatar_url: avatarUrl,
      } as any).eq("id", user.id);
      if (error) throw error;
      toast.success("Perfil salvo!");
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const addTag = (value: string, list: string[], setter: (v: string[]) => void, clearFn: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) setter([...list, trimmed]);
    clearFn("");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4 max-w-lg mx-auto">
          <SkeletonCard lines={4} hasHeader={false} />
        </div>
      </AppLayout>
    );
  }

  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <AppLayout>
      <div className="space-y-6 max-w-lg mx-auto">
        <PageHeader title="Meu Perfil" />

        {/* Main info */}
        <Card className="animate-fade-in">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl ?? undefined} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/0 group-hover:bg-foreground/40 transition-colors"
                  disabled={uploading}
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin text-background" /> : <Camera className="h-5 w-5 text-background" />}
                  </span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-lg truncate">{name}</p>
                <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
                {(profile as any)?.checkin_code && (
                  <Button variant="ghost" size="sm" className="mt-1 text-xs text-primary p-0 h-auto" onClick={() => setQrOpen(true)}>
                    <QrCode className="h-3.5 w-3.5 mr-1" /> Meu QR Code
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Sobre você..." rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Skills - collapsible */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-foreground font-semibold">
              Habilidades {skills.length > 0 && <Badge variant="secondary" className="ml-2">{skills.length}</Badge>}
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1">
                  {s}
                  <button onClick={() => setSkills(skills.filter((x) => x !== s))}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Nova habilidade..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(newSkill, skills, setSkills, setNewSkill))} />
              <Button variant="outline" size="icon" onClick={() => addTag(newSkill, skills, setSkills, setNewSkill)}><Plus className="h-4 w-4" /></Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Preferred Roles - collapsible */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-foreground font-semibold">
              Funções preferidas {preferredRoles.length > 0 && <Badge variant="secondary" className="ml-2">{preferredRoles.length}</Badge>}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="flex flex-wrap gap-2">
              {preferredRoles.map((r) => (
                <Badge key={r} variant="outline" className="gap-1">
                  {r}
                  <button onClick={() => setPreferredRoles(preferredRoles.filter((x) => x !== r))}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Nova função..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(newRole, preferredRoles, setPreferredRoles, setNewRole))} />
              <Button variant="outline" size="icon" onClick={() => addTag(newRole, preferredRoles, setPreferredRoles, setNewRole)}><Plus className="h-4 w-4" /></Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Availability - collapsible */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-foreground font-semibold">
              Disponibilidade semanal
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 pr-3 text-muted-foreground font-medium text-sm">Dia</th>
                    {SHIFTS.map((s) => <th key={s} className="text-center py-2 px-1 text-muted-foreground font-medium text-sm">{s}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => (
                    <tr key={day}>
                      <td className="py-1.5 pr-3 text-foreground text-sm">{day}</td>
                      {SHIFTS.map((shift) => {
                        const active = (availability[day] ?? []).includes(shift);
                        return (
                          <td key={shift} className="text-center py-1.5 px-1">
                            <button
                              onClick={() => toggleAvailability(day, shift)}
                              className={`w-9 h-9 rounded-xl text-xs font-medium transition-colors ${
                                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              {active ? "✓" : "–"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Save */}
        <div className="sticky bottom-4 z-10">
          <Button onClick={handleSave} disabled={saving} size="lg" className="w-full shadow-md">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </div>

        {/* QR Code modal */}
        <Dialog open={qrOpen} onOpenChange={setQrOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Meu QR Code</DialogTitle>
            </DialogHeader>
            {(profile as any)?.checkin_code && (
              <VolunteerQRCode checkinCode={(profile as any).checkin_code} userName={profile?.name ?? ""} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;

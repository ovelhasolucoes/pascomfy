import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Camera, Plus, X, Save, Loader2 } from "lucide-react";
import { VolunteerQRCode } from "@/components/checkin/VolunteerQRCode";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 2MB)");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.company_id}/avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("company-files")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("company-files").getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl + "?t=" + Date.now());
      toast.success("Foto atualizada!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleAvailability = (day: string, shift: string) => {
    setAvailability((prev) => {
      const daySlots = prev[day] ?? [];
      const has = daySlots.includes(shift);
      return {
        ...prev,
        [day]: has ? daySlots.filter((s) => s !== shift) : [...daySlots, shift],
      };
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          phone,
          bio,
          skills,
          preferred_roles: preferredRoles,
          availability,
          avatar_url: avatarUrl,
        } as any)
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Perfil salvo com sucesso!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addTag = (value: string, list: string[], setter: (v: string[]) => void, clearFn: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setter([...list, trimmed]);
    }
    clearFn("");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4 max-w-2xl">
          <SkeletonCard lines={2} hasHeader={false} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
        </div>
      </AppLayout>
    );
  }

  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <PageHeader title="Meu Perfil" description="Edite suas informações pessoais" />

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 ring-2 ring-border">
                  <AvatarImage src={avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">{initials}</AvatarFallback>
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
              <div>
                <p className="font-semibold text-foreground text-lg">{name}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp / Telefone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte um pouco sobre você..." rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="animate-fade-in" style={{ animationDelay: "50ms" }}>
          <CardHeader>
            <CardTitle className="text-lg">Habilidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1 transition-all hover:bg-destructive/10">
                  {s}
                  <button onClick={() => setSkills(skills.filter((x) => x !== s))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Adicionar habilidade..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(newSkill, skills, setSkills, setNewSkill))}
              />
              <Button variant="outline" size="icon" onClick={() => addTag(newSkill, skills, setSkills, setNewSkill)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferred Roles */}
        <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <CardHeader>
            <CardTitle className="text-lg">Funções Preferidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {preferredRoles.map((r) => (
                <Badge key={r} variant="outline" className="gap-1 transition-all hover:bg-destructive/10">
                  {r}
                  <button onClick={() => setPreferredRoles(preferredRoles.filter((x) => x !== r))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="Adicionar função..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(newRole, preferredRoles, setPreferredRoles, setNewRole))}
              />
              <Button variant="outline" size="icon" onClick={() => addTag(newRole, preferredRoles, setPreferredRoles, setNewRole)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card className="animate-fade-in" style={{ animationDelay: "150ms" }}>
          <CardHeader>
            <CardTitle className="text-lg">Disponibilidade Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Dia</th>
                    {SHIFTS.map((s) => (
                      <th key={s} className="text-center py-2 px-2 text-muted-foreground font-medium">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => (
                    <tr key={day} className="border-t border-border">
                      <td className="py-2 pr-3 text-foreground">{day}</td>
                      {SHIFTS.map((shift) => {
                        const active = (availability[day] ?? []).includes(shift);
                        return (
                          <td key={shift} className="text-center py-2 px-2">
                            <button
                              onClick={() => toggleAvailability(day, shift)}
                              className={`w-10 h-10 rounded-xl text-xs font-medium transition-all duration-200 ${
                                active
                                  ? "bg-success text-success-foreground shadow-sm"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
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
          </CardContent>
        </Card>

        {/* Sticky save button on mobile */}
        <div className="flex justify-end sticky bottom-4 z-10">
          <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Perfil
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;

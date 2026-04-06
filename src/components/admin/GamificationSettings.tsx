import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Loader2, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useGamification } from "@/hooks/useGamification";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const GamificationSettings = () => {
  const { profile } = useProfile();
  const { levels } = useGamification();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const [gamActive, setGamActive] = useState(false);
  const [pontosPresenca, setPontosPresenca] = useState(10);
  const [pontosChecklist, setPontosChecklist] = useState(5);
  const [penalidadeFalta, setPenalidadeFalta] = useState(-15);
  const [tempoLimite, setTempoLimite] = useState(24);
  const [saving, setSaving] = useState(false);

  // Levels management
  const [newLevelName, setNewLevelName] = useState("");
  const [newLevelPoints, setNewLevelPoints] = useState(0);
  const [newLevelIcon, setNewLevelIcon] = useState("");

  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      const { data } = await supabase
        .from("companies")
        .select("settings")
        .eq("id", companyId)
        .single();
      const s = (data?.settings as Record<string, any>) ?? {};
      setGamActive(s.gamificacao_ativa === true);
      setPontosPresenca(s.pontos_presenca ?? 10);
      setPontosChecklist(s.pontos_checklist ?? 5);
      setPenalidadeFalta(s.penalidade_falta ?? -15);
      setTempoLimite(s.tempo_limite_substituicao ?? 24);
    };
    load();
  }, [companyId]);

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      const { data: current } = await supabase
        .from("companies")
        .select("settings")
        .eq("id", companyId)
        .single();

      const merged = {
        ...((current?.settings as Record<string, any>) ?? {}),
        gamificacao_ativa: gamActive,
        pontos_presenca: pontosPresenca,
        pontos_checklist: pontosChecklist,
        penalidade_falta: penalidadeFalta,
        tempo_limite_substituicao: tempoLimite,
      };

      const { error } = await supabase
        .from("companies")
        .update({ settings: merged })
        .eq("id", companyId);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["company_settings"] });
      toast.success("Configurações salvas!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addLevel = async () => {
    if (!companyId || !newLevelName.trim()) return;
    try {
      const { error } = await supabase.from("gamification_levels").insert({
        company_id: companyId,
        name: newLevelName.trim(),
        min_points: newLevelPoints,
        icon: newLevelIcon || null,
      });
      if (error) throw error;
      setNewLevelName("");
      setNewLevelPoints(0);
      setNewLevelIcon("");
      queryClient.invalidateQueries({ queryKey: ["gamification_levels"] });
      toast.success("Nível adicionado!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const removeLevel = async (id: string) => {
    try {
      const { error } = await supabase.from("gamification_levels").delete().eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["gamification_levels"] });
      toast.success("Nível removido");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Gamificação e Substituições
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Gamificação ativa</Label>
              <p className="text-xs text-muted-foreground">Pontos automáticos por presença e checklist</p>
            </div>
            <Switch checked={gamActive} onCheckedChange={setGamActive} />
          </div>

          {gamActive && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Pontos por presença</Label>
                <Input type="number" value={pontosPresenca} onChange={(e) => setPontosPresenca(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Pontos por checklist</Label>
                <Input type="number" value={pontosChecklist} onChange={(e) => setPontosChecklist(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Penalidade por falta</Label>
                <Input type="number" value={penalidadeFalta} onChange={(e) => setPenalidadeFalta(Number(e.target.value))} />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm">Tempo limite para substituição (horas)</Label>
            <Input type="number" value={tempoLimite} onChange={(e) => setTempoLimite(Number(e.target.value))} className="max-w-[200px]" />
            <p className="text-xs text-muted-foreground">Usuário não pode pedir substituição com menos tempo que isso</p>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>

      {gamActive && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Níveis de Gamificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {levels.length > 0 && (
              <div className="space-y-2">
                {levels.map((level) => (
                  <div key={level.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <Badge variant="secondary">
                      {level.icon && <span className="mr-1">{level.icon}</span>}
                      {level.name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">≥ {level.min_points} pts</span>
                    <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => removeLevel(level.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Nome</Label>
                <Input value={newLevelName} onChange={(e) => setNewLevelName(e.target.value)} placeholder="Ex: Ouro" className="w-32" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pontos mín.</Label>
                <Input type="number" value={newLevelPoints} onChange={(e) => setNewLevelPoints(Number(e.target.value))} className="w-24" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ícone</Label>
                <Input value={newLevelIcon} onChange={(e) => setNewLevelIcon(e.target.value)} placeholder="🏆" className="w-20" />
              </div>
              <Button variant="outline" size="sm" onClick={addLevel}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

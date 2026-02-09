import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SecondOpinionPanelProps {
  estimationId: string;
  initialOpinion: string;
}

export function SecondOpinionPanel({ estimationId, initialOpinion }: SecondOpinionPanelProps) {
  const { toast } = useToast();
  const [opinion, setOpinion] = useState(initialOpinion);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("estimation_requests")
        .update({ second_opinion: opinion || null } as any)
        .eq("id", estimationId);
      if (error) throw error;
      toast({ title: "2ème avis enregistré ✓" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const isDirty = opinion !== initialOpinion;

  return (
    <div className="space-y-3 h-full flex flex-col">
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        2ème avis
      </h3>
      <Textarea
        placeholder="Avis complémentaire, expertise externe, remarques d'un collaborateur…"
        value={opinion}
        onChange={(e) => setOpinion(e.target.value)}
        className="text-sm flex-1 min-h-[120px] resize-none"
      />
      {isDirty && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="text-sm self-start"
        >
          Enregistrer
        </Button>
      )}
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NotesPanelProps {
  estimationId: string;
  initialNotes: string;
}

export function NotesPanel({ estimationId, initialNotes }: NotesPanelProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("estimation_requests")
        .update({ auctioneer_notes: notes || null } as any)
        .eq("id", estimationId);
      if (error) throw error;
      toast({ title: "Notes enregistrées ✓" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const isDirty = notes !== initialNotes;

  return (
    <div className="space-y-3 h-full flex flex-col">
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        Votre avis
      </h3>
      <Textarea
        placeholder="Vos observations, estimation, remarques (non visibles par le vendeur)…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
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

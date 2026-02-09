import { useState } from "react";
import { Mail, MailOpen, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { INTEREST_LEVELS, type InterestLevel } from "./detail/interest-config";

interface EstimationStatusBarProps {
  estimation: {
    id: string;
    status: string;
    auctioneer_decision: string | null;
  };
  onUpdate: () => void;
  onBack?: () => void;
}

export function EstimationStatusBar({ estimation, onUpdate, onBack }: EstimationStatusBarProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSetStatus = async (updates: Record<string, any>, label: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("estimation_requests")
        .update(updates as any)
        .eq("id", estimation.id);
      if (error) throw error;
      toast({ title: `${label} ✓` });
      onUpdate();
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("estimation_requests")
        .update({ status: "archived" } as any)
        .eq("id", estimation.id);
      if (error) throw error;
      toast({ title: "Demande supprimée ✓" });
      setShowDeleteConfirm(false);
      // Navigate back to list so the archived item disappears
      if (onBack) onBack();
      onUpdate();
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const isResponded = estimation.status === "responded";
  const isNew = estimation.status === "new";

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}

        {/* Mark as unread / read */}
        {isResponded || !isNew ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-7 px-2"
            onClick={() => handleSetStatus({ status: "new" }, "Marqué non lu")}
            disabled={saving}
          >
            <Mail className="w-3.5 h-3.5 text-blue-500" />
            Non lu
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-7 px-2 text-muted-foreground"
            onClick={() => handleSetStatus({ status: "in_review" }, "Marqué lu")}
            disabled={saving}
          >
            <MailOpen className="w-3.5 h-3.5" />
            Lu
          </Button>
        )}

        {/* Separator */}
        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Mark as responded */}
        <Button
          variant={isResponded ? "default" : "ghost"}
          size="sm"
          className="gap-1.5 text-xs h-7 px-2"
          onClick={() =>
            handleSetStatus(
              { status: "responded", responded_at: new Date().toISOString() },
              "Marqué répondu"
            )
          }
          disabled={saving}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Répondu
        </Button>

        {/* Archive / Trash with confirmation */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={saving}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette demande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette demande d'estimation sera archivée et ne sera plus visible dans la liste.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

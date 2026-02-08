import { useState } from "react";
import { Mail, MailOpen, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

export function EstimationStatusBar({ estimation, onUpdate }: EstimationStatusBarProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

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

  const isResponded = estimation.status === "responded";
  const isNew = estimation.status === "new";

  return (
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

      {/* Interest levels */}
      {Object.entries(INTEREST_LEVELS).map(([key, config]) => {
        const isActive = estimation.auctioneer_decision === key;
        return (
          <button
            key={key}
            onClick={() =>
              handleSetStatus(
                { auctioneer_decision: key, decided_at: new Date().toISOString() },
                config.label
              )
            }
            disabled={saving}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors border
              ${isActive
                ? `${config.bg} ${config.text} ${config.border}`
                : "border-border/40 text-muted-foreground hover:bg-muted/50"
              }
            `}
            title={config.label}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
          </button>
        );
      })}

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

      {/* Archive / Trash */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
        onClick={() =>
          handleSetStatus({ status: "archived" }, "Archivé")
        }
        disabled={saving}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

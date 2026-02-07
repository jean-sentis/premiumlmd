import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Mail, Phone, Tag, Euro, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisPanel } from "./detail/AnalysisPanel";
import { ResponsePanel } from "./detail/ResponsePanel";

interface EstimationRequest {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  description: string;
  estimated_value: string | null;
  object_category: string | null;
  photo_urls: string[];
  source: string;
  ai_analysis: any;
  ai_analyzed_at: string | null;
  status: string;
  auctioneer_notes: string | null;
  auctioneer_decision: string | null;
  decided_at: string | null;
  response_template: string | null;
  response_message: string | null;
  responded_at: string | null;
  created_at: string;
  related_lot_id: string | null;
}

interface EstimationDetailProps {
  estimation: EstimationRequest;
  onBack: () => void;
  onUpdate: () => void;
}

// Strip raw URLs from description, keep only the user's message
function formatDescription(desc: string) {
  const parts = desc.split("---");
  return parts[0]?.trim() || desc;
}

export function EstimationDetail({
  estimation,
  onBack,
  onUpdate,
}: EstimationDetailProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState(estimation.auctioneer_notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  const ai = estimation.ai_analysis;

  const getPhotoUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${path}`;
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-estimation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ estimation_id: estimation.id }),
        }
      );
      if (!resp.ok) throw new Error("Erreur d'analyse");
      toast({
        title: "Ré-analyse lancée",
        description: "Rafraîchissez dans quelques secondes",
      });
      setTimeout(onUpdate, 3000);
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setReanalyzing(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from("estimation_requests")
        .update({
          auctioneer_notes: notes || null,
        } as any)
        .eq("id", estimation.id);
      if (error) throw error;
      toast({ title: "Notes enregistrées ✓" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ── */}
      <div className="p-4 border-b flex items-center gap-3 sticky top-0 bg-background z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{estimation.nom}</h2>
          <p className="text-xs text-muted-foreground">
            {format(new Date(estimation.created_at), "dd MMMM yyyy à HH:mm", {
              locale: fr,
            })}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* ══════════════════════════════════════ */}
        {/* SECTION 1 — Informations du vendeur   */}
        {/* ══════════════════════════════════════ */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Informations du vendeur
          </h3>

          {/* Contact details */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {estimation.nom}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {estimation.email}
            </span>
            {estimation.telephone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {estimation.telephone}
              </span>
            )}
            {estimation.object_category && (
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {estimation.object_category}
              </span>
            )}
            {estimation.estimated_value && (
              <span className="flex items-center gap-1">
                <Euro className="w-3 h-3" />
                {estimation.estimated_value}
              </span>
            )}
          </div>

          {/* Photos */}
          {estimation.photo_urls?.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {estimation.photo_urls.map((url, i) => (
                <a
                  key={i}
                  href={getPhotoUrl(url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-lg overflow-hidden border hover:opacity-90 transition-opacity"
                >
                  <img
                    src={getPhotoUrl(url)}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </a>
              ))}
            </div>
          )}

          {/* Description + lien lot */}
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Description
              </p>
              <p className="text-sm bg-muted/30 p-3 rounded-lg border border-border/30">
                {formatDescription(estimation.description)}
              </p>
            </div>
            {estimation.related_lot_id && (
              <a
                href={`/lot/${estimation.related_lot_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Voir le lot référencé
              </a>
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="border-t" />

        {/* ══════════════════════════════════════ */}
        {/* SECTION 2 — Analyse                   */}
        {/* ══════════════════════════════════════ */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Analyse
          </h3>
          <AnalysisPanel
            ai={ai}
            reanalyzing={reanalyzing}
            onReanalyze={handleReanalyze}
          />
        </div>

        {/* Notes privées */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Notes privées
          </p>
          <Textarea
            placeholder="Vos observations (non visibles par le vendeur)…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="text-xs"
          />
          {notes !== (estimation.auctioneer_notes || "") && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="text-xs"
            >
              Enregistrer les notes
            </Button>
          )}
        </div>

        {/* Separator */}
        <div className="border-t" />

        {/* ══════════════════════════════════════ */}
        {/* SECTION 3 — Réponse                   */}
        {/* ══════════════════════════════════════ */}
        <ResponsePanel estimation={estimation} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

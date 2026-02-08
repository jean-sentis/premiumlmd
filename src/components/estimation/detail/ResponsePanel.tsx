import { useState } from "react";
import { Phone, Mail, UserPlus, Loader2, CheckCircle2, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { INTEREST_LEVELS, type InterestLevel, getInterestStyle } from "./interest-config";
import { EmailComposer } from "./EmailComposer";

interface ResponsePanelProps {
  estimation: {
    id: string;
    nom: string;
    email: string;
    telephone: string | null;
    description: string;
    photo_urls: string[];
    auctioneer_decision: string | null;
    response_message: string | null;
    response_mode?: string | null;
    status: string;
    ai_analysis: any;
  };
  onUpdate: () => void;
}

type ResponseMode = "phone" | "email" | "delegate" | null;

export function ResponsePanel({ estimation, onUpdate }: ResponsePanelProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<ResponseMode>(null);
  const [interest, setInterest] = useState(
    estimation.auctioneer_decision || ""
  );
  const [delegateName, setDelegateName] = useState("");
  const [saving, setSaving] = useState(false);

  const aiQuestions = estimation.ai_analysis?.questions_for_owner || [];
  const hasPhone = !!estimation.telephone;

  // Color style based on interest level when responded
  const isResponded = estimation.status === "responded" || estimation.status === "in_review";
  const interestStyle = getInterestStyle(estimation.auctioneer_decision);

  const handleSavePhone = async () => {
    if (!interest) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("estimation_requests")
        .update({
          auctioneer_decision: interest,
          response_mode: "phone",
          status: "responded",
          responded_at: new Date().toISOString(),
        } as any)
        .eq("id", estimation.id);
      if (error) throw error;
      toast({ title: "Appel enregistré ✓" });
      onUpdate();
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDelegate = async () => {
    if (!interest || !delegateName.trim()) return;
    setSaving(true);
    try {
      // Build a summary of the estimation for the delegate email
      const summary = [
        `Demande de : ${estimation.nom} (${estimation.email})`,
        estimation.telephone ? `Tél : ${estimation.telephone}` : null,
        `Description : ${estimation.description?.substring(0, 300)}`,
        estimation.photo_urls?.length ? `${estimation.photo_urls.length} photo(s) jointe(s)` : null,
      ].filter(Boolean).join("\n");

      const { error } = await supabase
        .from("estimation_requests")
        .update({
          auctioneer_decision: interest,
          response_mode: "delegate",
          delegate_to: delegateName.trim(),
          status: "in_review",
        } as any)
        .eq("id", estimation.id);
      if (error) throw error;

      // Open mailto with pre-filled content for the delegate
      const subject = encodeURIComponent(`Demande d'estimation à examiner — ${estimation.nom}`);
      const body = encodeURIComponent(
        `Bonjour,\n\nJe vous transfère cette demande d'estimation pour avis.\n\n${summary}\n\nMerci de me faire part de votre analyse.\n\nCordialement`
      );
      window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");

      toast({ title: `Confié à ${delegateName.trim()} ✓` });
      onUpdate();
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async (message: string, interestLevel: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("estimation_requests")
        .update({
          auctioneer_decision: interestLevel,
          response_mode: "email",
          response_message: message,
          status: "responded",
          responded_at: new Date().toISOString(),
        } as any)
        .eq("id", estimation.id);
      if (error) throw error;
      toast({
        title: "Réponse envoyée ✓",
        description: `Email simulé à ${estimation.email}`,
      });
      onUpdate();
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Build dynamic container classes based on interest color
  const containerClasses = isResponded && interestStyle
    ? `space-y-4 border-2 rounded-lg p-4 ${interestStyle.border} ${interestStyle.bg}`
    : "space-y-4";

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground text-center flex-1">
          Actions
        </h3>
        {isResponded && interestStyle && (
          <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${interestStyle.bg} ${interestStyle.text} ${interestStyle.border} border`}>
            <CheckCircle2 className="w-3 h-3" />
            {interestStyle.label}
            {estimation.response_mode === "phone" && " · Appelé"}
            {estimation.response_mode === "email" && " · Emailé"}
            {estimation.response_mode === "delegate" && " · Délégué"}
          </span>
        )}
      </div>

      {/* Mode selection */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={mode === "phone" ? "default" : "outline"}
          size="sm"
          onClick={() => hasPhone && setMode("phone")}
          disabled={!hasPhone}
          className={`gap-1.5 text-xs ${!hasPhone ? "opacity-50 cursor-not-allowed" : ""}`}
          title={hasPhone ? `Appeler ${estimation.telephone}` : "Pas de numéro fourni"}
        >
          {hasPhone ? (
            <Phone className="w-3.5 h-3.5" />
          ) : (
            <PhoneOff className="w-3.5 h-3.5" />
          )}
          Appeler
        </Button>
        <Button
          variant={mode === "email" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("email")}
          className="gap-1.5 text-xs"
        >
          <Mail className="w-3.5 h-3.5" />
          Email
        </Button>
        <Button
          variant={mode === "delegate" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("delegate")}
          className="gap-1.5 text-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Déléguer
        </Button>
      </div>

      {/* ── Phone mode ── */}
      {mode === "phone" && hasPhone && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-muted/40 rounded-lg p-3 border">
            <Phone className="w-4 h-4 text-primary" />
            <a
              href={`tel:${estimation.telephone}`}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {estimation.telephone}
            </a>
          </div>
          <InterestSelector value={interest} onChange={setInterest} />
          <Button
            size="sm"
            disabled={saving || !interest}
            onClick={handleSavePhone}
            className="w-full gap-2"
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            <Phone className="w-3 h-3" />
            Marquer comme appelé
          </Button>
        </div>
      )}

      {/* ── Delegate mode ── */}
      {mode === "delegate" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Un email avec le résumé de la demande sera ouvert pour envoi.
          </p>
          <InterestSelector value={interest} onChange={setInterest} />
          <Input
            placeholder="Nom du collaborateur / expert…"
            value={delegateName}
            onChange={(e) => setDelegateName(e.target.value)}
          />
          <Button
            size="sm"
            disabled={saving || !interest || !delegateName.trim()}
            onClick={handleSaveDelegate}
            className="w-full gap-2"
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            <UserPlus className="w-3 h-3" />
            Confier à {delegateName.trim() || "…"}
          </Button>
        </div>
      )}

      {/* ── Email mode ── */}
      {mode === "email" && (
        <EmailComposer
          sellerName={estimation.nom}
          sellerEmail={estimation.email}
          aiQuestions={aiQuestions}
          interest={interest}
          onInterestChange={setInterest}
          onSend={handleSendEmail}
          saving={saving}
          existingMessage={estimation.response_message || ""}
        />
      )}
    </div>
  );
}

function InterestSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">
        Niveau d'intérêt
      </p>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(INTEREST_LEVELS).map(([key, config]) => {
          const isSelected = value === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                isSelected
                  ? `${config.bg} ${config.text} ${config.border} font-medium`
                  : "border-border text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full ${config.dot} mr-1.5`}
              />
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

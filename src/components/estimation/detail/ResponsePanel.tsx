import { useState } from "react";
import { Phone, Mail, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { INTEREST_LEVELS, type InterestLevel } from "./interest-config";
import { EmailComposer } from "./EmailComposer";

interface ResponsePanelProps {
  estimation: {
    id: string;
    nom: string;
    email: string;
    telephone: string | null;
    auctioneer_decision: string | null;
    response_message: string | null;
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

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <h3 className="text-sm font-semibold">Répondre à {estimation.nom}</h3>

      {/* Mode selection */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={mode === "phone" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("phone")}
          className="gap-2"
        >
          <Phone className="w-4 h-4" />
          Appeler
        </Button>
        <Button
          variant={mode === "email" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("email")}
          className="gap-2"
        >
          <Mail className="w-4 h-4" />
          Email
        </Button>
        <Button
          variant={mode === "delegate" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("delegate")}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Déléguer
        </Button>
      </div>

      {/* ── Phone mode ── */}
      {mode === "phone" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {estimation.telephone
              ? `Numéro : ${estimation.telephone}`
              : `Pas de numéro fourni — contacter par email : ${estimation.email}`}
          </p>
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
          <InterestSelector value={interest} onChange={setInterest} />
          <Input
            placeholder="Nom du collaborateur…"
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

import { useState, useEffect, useMemo } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INTEREST_LEVELS, type InterestLevel } from "./interest-config";

const GREETING_OPTIONS = [
  { id: "formal", label: "Madame, Monsieur," },
  { id: "personal", label: "Personnalisé" },
];

const INTENT_OPTIONS = [
  {
    id: "interested",
    label: "Pièce intéressante",
    text: "Nous avons examiné votre objet avec attention. Il présente un réel intérêt et nous souhaiterions en discuter avec vous pour envisager une mise en vente.",
  },
  {
    id: "need_info",
    label: "Besoin d'informations",
    text: "Pour affiner notre analyse, nous aurions besoin de quelques informations complémentaires avant de pouvoir vous faire une proposition.",
  },
  {
    id: "follow_up",
    label: "À suivre",
    text: "Votre pièce pourrait trouver sa place dans l'une de nos prochaines ventes thématiques. Nous revenons vers vous prochainement avec une proposition concrète.",
  },
  {
    id: "declined",
    label: "Pas dans nos cordes",
    text: "Après examen attentif, cet objet ne correspond pas à notre domaine d'expertise actuel ou aux conditions du marché. Nous vous conseillons de vous rapprocher d'un confrère spécialisé.",
  },
];

const CLOSING =
  "Nous restons à votre disposition pour tout complément d'information.\n\nCordialement,\nL'équipe Douze pages & associés";

interface EmailComposerProps {
  sellerName: string;
  sellerEmail: string;
  aiQuestions: string[];
  interest: string;
  onInterestChange: (v: string) => void;
  onSend: (message: string, interest: string) => void;
  saving: boolean;
  existingMessage: string;
}

export function EmailComposer({
  sellerName,
  sellerEmail,
  aiQuestions,
  interest,
  onInterestChange,
  onSend,
  saving,
  existingMessage,
}: EmailComposerProps) {
  const [greeting, setGreeting] = useState("personal");
  const [intent, setIntent] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(
    new Set()
  );
  const [questionEdits, setQuestionEdits] = useState<Record<number, string>>(
    {}
  );
  const [freeText, setFreeText] = useState("");
  const [manualEdit, setManualEdit] = useState(false);
  const [manualMessage, setManualMessage] = useState(existingMessage);

  const getGreetingText = (id: string) =>
    id === "personal" ? `Bonjour ${sellerName},` : "Madame, Monsieur,";

  // Build composed message from building blocks
  const composedMessage = useMemo(() => {
    if (manualEdit) return manualMessage;

    const parts: string[] = [];

    // Greeting
    parts.push(getGreetingText(greeting));
    parts.push("");

    // Thanks
    parts.push(
      "Nous avons bien reçu votre demande et vous en remercions."
    );
    parts.push("");

    // Intent
    const intentOpt = INTENT_OPTIONS.find((i) => i.id === intent);
    if (intentOpt) {
      parts.push(intentOpt.text);
      parts.push("");
    }

    // Selected questions
    if (selectedQuestions.size > 0) {
      const questionTexts = Array.from(selectedQuestions)
        .sort()
        .map((idx) => `— ${questionEdits[idx] || aiQuestions[idx]}`);
      if (questionTexts.length > 0) {
        parts.push("Pourriez-vous nous préciser :");
        parts.push(...questionTexts);
        parts.push("");
      }
    }

    // Free text
    if (freeText.trim()) {
      parts.push(freeText.trim());
      parts.push("");
    }

    // Closing
    parts.push(CLOSING);

    return parts.join("\n");
  }, [
    greeting,
    intent,
    selectedQuestions,
    questionEdits,
    freeText,
    manualEdit,
    manualMessage,
    sellerName,
    aiQuestions,
  ]);

  // Sync manual message with auto-compose
  useEffect(() => {
    if (!manualEdit) {
      setManualMessage(composedMessage);
    }
  }, [composedMessage, manualEdit]);

  const toggleQuestion = (idx: number) => {
    setSelectedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Interest selector */}
      <InterestSelector value={interest} onChange={onInterestChange} />

      {/* Composition tools */}
      {!manualEdit && (
        <div className="space-y-3">
          {/* Greeting */}
          <Select value={greeting} onValueChange={setGreeting}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Formule d'ouverture…" />
            </SelectTrigger>
            <SelectContent>
              {GREETING_OPTIONS.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs">
                  {getGreetingText(g.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Intent */}
          <Select value={intent} onValueChange={setIntent}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Tonalité de la réponse…" />
            </SelectTrigger>
            <SelectContent>
              {INTENT_OPTIONS.map((i) => (
                <SelectItem key={i.id} value={i.id} className="text-xs">
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* AI-suggested questions as checkboxes */}
          {aiQuestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Questions suggérées
              </p>
              {aiQuestions.map((q: string, idx: number) => (
                <label
                  key={idx}
                  className="flex items-start gap-2 cursor-pointer group"
                >
                  <Checkbox
                    checked={selectedQuestions.has(idx)}
                    onCheckedChange={() => toggleQuestion(idx)}
                    className="mt-0.5"
                  />
                  <span
                    className={`text-xs ${
                      selectedQuestions.has(idx)
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {questionEdits[idx] || q}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Free text */}
          <Textarea
            placeholder="Ajouter un message personnel…"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={2}
            className="text-xs"
          />
        </div>
      )}

      {/* Live preview / manual edit */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            {manualEdit ? "Message (édition libre)" : "Aperçu du message"}
          </p>
          <button
            onClick={() => {
              if (!manualEdit) setManualMessage(composedMessage);
              setManualEdit(!manualEdit);
            }}
            className="text-xs text-primary hover:underline"
          >
            {manualEdit ? "← Retour au compositeur" : "Modifier librement"}
          </button>
        </div>
        <Textarea
          value={manualEdit ? manualMessage : composedMessage}
          onChange={(e) => manualEdit && setManualMessage(e.target.value)}
          readOnly={!manualEdit}
          rows={12}
          className={`text-xs ${
            !manualEdit ? "bg-muted/30 cursor-default" : ""
          }`}
        />
      </div>

      {/* Send */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Envoi à : {sellerEmail}</p>
        <Button
          size="sm"
          disabled={
            saving ||
            !interest ||
            !(manualEdit ? manualMessage : composedMessage).trim()
          }
          onClick={() =>
            onSend(manualEdit ? manualMessage : composedMessage, interest)
          }
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Send className="w-3 h-3" />
          )}
          Envoyer
        </Button>
      </div>
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

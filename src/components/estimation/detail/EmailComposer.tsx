import { useState, useRef } from "react";
import { Send, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { INTEREST_LEVELS, type InterestLevel } from "./interest-config";

const GREETING_SNIPPETS = [
  { label: "Bonjour personnalisé", build: (name: string) => `Bonjour ${name},\n\n` },
  { label: "Madame, Monsieur", build: () => "Madame, Monsieur,\n\n" },
];

const INTENT_SNIPPETS = [
  {
    label: "Pièce intéressante",
    text: "Nous avons examiné votre objet avec attention. Il présente un réel intérêt et nous souhaiterions en discuter avec vous pour envisager une mise en vente.\n\n",
  },
  {
    label: "Besoin d'informations",
    text: "Pour affiner notre analyse, nous aurions besoin de quelques informations complémentaires avant de pouvoir vous faire une proposition.\n\n",
  },
  {
    label: "À suivre",
    text: "Votre pièce pourrait trouver sa place dans l'une de nos prochaines ventes thématiques. Nous revenons vers vous prochainement avec une proposition concrète.\n\n",
  },
  {
    label: "Pas dans nos cordes",
    text: "Après examen attentif, cet objet ne correspond pas à notre domaine d'expertise actuel ou aux conditions du marché. Nous vous conseillons de vous rapprocher d'un confrère spécialisé.\n\n",
  },
];

const CLOSING_SNIPPET =
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
  const [message, setMessage] = useState(
    existingMessage ||
      `Bonjour ${sellerName},\n\nNous avons bien reçu votre demande et vous en remercions.\n\n`
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) {
      setMessage((prev) => prev + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = message.slice(0, start);
    const after = message.slice(end);
    const newMessage = before + text + after;
    setMessage(newMessage);
    // Reposition cursor after inserted text
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + text.length;
    });
  };

  const insertQuestions = (questions: string[]) => {
    const block =
      "Pourriez-vous nous préciser :\n" +
      questions.map((q) => `— ${q}`).join("\n") +
      "\n\n";
    insertAtCursor(block);
  };

  return (
    <div className="space-y-3">
      {/* Interest selector */}
      <InterestSelector value={interest} onChange={onInterestChange} />

      {/* Toolbar: insert snippets into body */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1 h-7">
              <Plus className="w-3 h-3" />
              Insérer
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="text-xs">
            {/* Greetings */}
            {GREETING_SNIPPETS.map((g) => (
              <DropdownMenuItem
                key={g.label}
                onClick={() => insertAtCursor(g.build(sellerName))}
              >
                {g.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {/* Intents */}
            {INTENT_SNIPPETS.map((i) => (
              <DropdownMenuItem
                key={i.label}
                onClick={() => insertAtCursor(i.text)}
              >
                {i.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {/* AI questions */}
            {aiQuestions.length > 0 && (
              <DropdownMenuItem onClick={() => insertQuestions(aiQuestions)}>
                Questions suggérées ({aiQuestions.length})
              </DropdownMenuItem>
            )}
            {/* Closing */}
            <DropdownMenuItem onClick={() => insertAtCursor(CLOSING_SNIPPET)}>
              Formule de politesse
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-[10px] text-muted-foreground ml-1">
          Modifiez directement le message ci-dessous
        </span>
      </div>

      {/* Email body — directly editable */}
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={14}
        className="text-xs font-mono leading-relaxed"
        placeholder="Rédigez votre message ici…"
      />

      {/* Send */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Envoi à : {sellerEmail}</p>
        <Button
          size="sm"
          disabled={saving || !interest || !message.trim()}
          onClick={() => onSend(message, interest)}
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

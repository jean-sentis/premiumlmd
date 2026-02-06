import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Sparkles,
  User,
  Mail,
  Phone,
  Calendar,
  Tag,
  Euro,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bookmark,
  Loader2,
  Send,
  RefreshCw,
  Search,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const RESPONSE_TEMPLATES: Record<string, { label: string; message: string }> = {
  interested: {
    label: "Pièce intéressante",
    message: `Madame, Monsieur,

Nous avons bien reçu votre demande d'estimation et avons examiné votre objet avec attention.

Votre pièce présente un réel intérêt et nous souhaiterions l'examiner de plus près. Pourriez-vous nous contacter afin de convenir d'un rendez-vous ?

Nous restons à votre disposition.

Cordialement,
L'équipe Douze pages & associés`,
  },
  need_info: {
    label: "Besoin d'informations",
    message: `Madame, Monsieur,

Nous avons bien reçu votre demande d'estimation. Pour affiner notre analyse, nous aurions besoin d'informations complémentaires :

- Des photos supplémentaires (dos, dessous, signatures, marques)
- La provenance exacte de l'objet
- Tout document d'authenticité ou facture d'achat

Merci de nous transmettre ces éléments.

Cordialement,
L'équipe Douze pages & associés`,
  },
  declined: {
    label: "Hors spécialité / pas intéressant",
    message: `Madame, Monsieur,

Nous avons bien reçu votre demande d'estimation et vous en remercions.

Après examen, cet objet ne correspond pas à notre domaine de spécialité ou ne présente pas un intérêt suffisant pour une mise en vente aux enchères dans les conditions actuelles du marché.

Nous vous conseillons de contacter [suggestion alternative].

Cordialement,
L'équipe Douze pages & associés`,
  },
  follow_up: {
    label: "À suivre",
    message: `Madame, Monsieur,

Nous avons bien reçu votre demande d'estimation. Votre pièce pourrait trouver sa place dans l'une de nos prochaines ventes thématiques.

Nous revenons vers vous prochainement avec une proposition concrète.

Cordialement,
L'équipe Douze pages & associés`,
  },
};

const DECISION_OPTIONS = [
  { value: "interested", label: "Intéressant", icon: CheckCircle2, color: "text-green-600" },
  { value: "to_follow", label: "À suivre", icon: Bookmark, color: "text-blue-600" },
  { value: "need_more_info", label: "Besoin d'infos", icon: HelpCircle, color: "text-amber-600" },
  { value: "not_interested", label: "Pas intéressant", icon: XCircle, color: "text-red-600" },
];

const RECOMMENDATION_COLORS: Record<string, string> = {
  "très_intéressant": "bg-green-100 text-green-800 border-green-300",
  "intéressant": "bg-emerald-100 text-emerald-800 border-emerald-300",
  "à_examiner": "bg-amber-100 text-amber-800 border-amber-300",
  "peu_intéressant": "bg-orange-100 text-orange-800 border-orange-300",
  "hors_spécialité": "bg-gray-100 text-gray-800 border-gray-300",
};

export function EstimationDetail({ estimation, onBack, onUpdate }: EstimationDetailProps) {
  const { toast } = useToast();
  const [decision, setDecision] = useState(estimation.auctioneer_decision || "");
  const [notes, setNotes] = useState(estimation.auctioneer_notes || "");
  const [responseTemplate, setResponseTemplate] = useState(estimation.response_template || "");
  const [responseMessage, setResponseMessage] = useState(estimation.response_message || "");
  const [saving, setSaving] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  const ai = estimation.ai_analysis;

  const getPhotoUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${path}`;
  };

  const handleTemplateChange = (templateKey: string) => {
    setResponseTemplate(templateKey);
    const template = RESPONSE_TEMPLATES[templateKey];
    if (template) {
      setResponseMessage(template.message);
    }
  };

  const handleSaveDecision = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("estimation_requests")
        .update({
          auctioneer_decision: decision || null,
          auctioneer_notes: notes || null,
          status: "in_review",
          decided_at: new Date().toISOString(),
        } as any)
        .eq("id", estimation.id);

      if (error) throw error;
      toast({ title: "Décision enregistrée" });
      onUpdate();
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible d'enregistrer", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSendResponse = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("estimation_requests")
        .update({
          auctioneer_decision: decision || null,
          auctioneer_notes: notes || null,
          response_template: responseTemplate || null,
          response_message: responseMessage || null,
          status: "responded",
          responded_at: new Date().toISOString(),
        } as any)
        .eq("id", estimation.id);

      if (error) throw error;
      toast({ title: "Réponse envoyée ✓", description: `Email simulé à ${estimation.email}` });
      onUpdate();
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible d'envoyer", variant: "destructive" });
    } finally {
      setSaving(false);
    }
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
      toast({ title: "Ré-analyse lancée", description: "Rafraîchissez dans quelques secondes" });
      setTimeout(onUpdate, 3000);
    } catch (err) {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setReanalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3 sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{estimation.nom}</h2>
          <p className="text-xs text-muted-foreground">
            {format(new Date(estimation.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Contact info */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><User className="w-3 h-3" />{estimation.nom}</span>
          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{estimation.email}</span>
          {estimation.telephone && (
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{estimation.telephone}</span>
          )}
          {estimation.object_category && (
            <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{estimation.object_category}</span>
          )}
          {estimation.estimated_value && (
            <span className="flex items-center gap-1"><Euro className="w-3 h-3" />{estimation.estimated_value}</span>
          )}
        </div>

        {/* Photos */}
        {estimation.photo_urls?.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {estimation.photo_urls.map((url, i) => (
                <a
                  key={i}
                  href={getPhotoUrl(url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-lg overflow-hidden border hover:opacity-90 transition-opacity"
                >
                  <img src={getPhotoUrl(url)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
            {/* Google Lens button */}
            <a
              href={`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(getPhotoUrl(estimation.photo_urls[0]))}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                <Search className="w-3 h-3" />
                Rechercher avec Google Lens
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
            </a>
          </div>
        )}

        {/* Description */}
        <div className="space-y-1">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description du demandeur</h3>
          <p className="text-sm bg-muted/30 p-3 rounded-lg border border-border/30">{estimation.description}</p>
        </div>

        {/* AI Analysis */}
        <div className="space-y-3 border border-brand-gold/30 rounded-lg bg-brand-gold/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-gold" />
              <h3 className="text-sm font-semibold text-brand-gold">Analyse IA</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="h-7 text-xs"
            >
              {reanalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
              Ré-analyser
            </Button>
          </div>

          {!ai ? (
            <div className="text-sm text-muted-foreground italic flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyse en cours...
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {/* Recommendation badge */}
              {ai.recommendation && (
                <Badge className={`${RECOMMENDATION_COLORS[ai.recommendation] || "bg-gray-100"} border`}>
                  {ai.recommendation_text || ai.recommendation}
                </Badge>
              )}

              {/* Summary */}
              {ai.summary && (
                <div className="p-3 bg-background/80 rounded border border-border/30">
                  <p className="font-medium text-xs text-muted-foreground mb-1">Résumé</p>
                  <p>{ai.summary}</p>
                </div>
              )}

              {/* Identified object */}
              {ai.identified_object && (
                <div className="p-3 bg-background/80 rounded border border-border/30">
                  <p className="font-medium text-xs text-muted-foreground mb-1">Objet identifié</p>
                  <p>{ai.identified_object}</p>
                </div>
              )}

              {/* Estimation */}
              {ai.estimated_range && (
                <div className="p-3 bg-background/80 rounded border border-border/30">
                  <p className="font-medium text-xs text-muted-foreground mb-1">Estimation IA</p>
                  <p className="text-lg font-semibold">{ai.estimated_range}</p>
                </div>
              )}

              {/* Authenticity */}
              {ai.authenticity_assessment && (
                <div className="p-3 bg-background/80 rounded border border-border/30">
                  <p className="font-medium text-xs text-muted-foreground mb-1">Authenticité</p>
                  <p>{ai.authenticity_assessment}</p>
                </div>
              )}

              {/* Condition */}
              {ai.condition_notes && (
                <div className="p-3 bg-background/80 rounded border border-border/30">
                  <p className="font-medium text-xs text-muted-foreground mb-1">État</p>
                  <p>{ai.condition_notes}</p>
                </div>
              )}

              {/* Market insights */}
              {ai.market_insights && (
                <div className="p-3 bg-background/80 rounded border border-border/30">
                  <p className="font-medium text-xs text-muted-foreground mb-1">Contexte marché</p>
                  <p>{ai.market_insights}</p>
                </div>
              )}

              {/* Description accuracy */}
              {ai.description_accuracy && (
                <div className="p-3 bg-background/80 rounded border border-border/30">
                  <p className="font-medium text-xs text-muted-foreground mb-1">Fiabilité de la description</p>
                  <p>{ai.description_accuracy}</p>
                </div>
              )}

              {/* Questions */}
              {ai.questions_for_owner?.length > 0 && (
                <div className="p-3 bg-background/80 rounded border border-border/30">
                  <p className="font-medium text-xs text-muted-foreground mb-1">Questions suggérées</p>
                  <ul className="list-disc list-inside space-y-1">
                    {ai.questions_for_owner.map((q: string, i: number) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Confidence level & Limitations */}
              {(ai.confidence_level || ai.limitations) && (
                <div className="p-3 bg-background/80 rounded border border-border/30 space-y-2">
                  {ai.confidence_level && (
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="font-medium text-xs text-muted-foreground">Confiance :</p>
                      <Badge variant="outline" className={
                        ai.confidence_level === "élevée" ? "border-green-400 text-green-700" :
                        ai.confidence_level === "moyenne" ? "border-amber-400 text-amber-700" :
                        "border-red-400 text-red-700"
                      }>
                        {ai.confidence_level}
                      </Badge>
                    </div>
                  )}
                  {ai.limitations && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-xs text-muted-foreground mb-0.5">Limitations</p>
                        <p className="text-xs text-muted-foreground">{ai.limitations}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Auctioneer decision */}
        <div className="space-y-3 border rounded-lg p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4" />
            Décision du commissaire-priseur
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {DECISION_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <Button
                  key={opt.value}
                  variant={decision === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDecision(opt.value)}
                  className={`justify-start gap-2 ${decision === opt.value ? "" : opt.color}`}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </Button>
              );
            })}
          </div>

          <Textarea
            placeholder="Notes personnelles (non visibles par le demandeur)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={saving || !decision}
            onClick={handleSaveDecision}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Enregistrer la décision
          </Button>
        </div>

        {/* Response */}
        <div className="space-y-3 border rounded-lg p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Send className="w-4 h-4" />
            Réponse au demandeur
          </h3>

          <Select value={responseTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un modèle de réponse..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RESPONSE_TEMPLATES).map(([key, tpl]) => (
                <SelectItem key={key} value={key}>
                  {tpl.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Personnalisez votre réponse..."
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            rows={8}
            className="text-sm"
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Envoi simulé à : {estimation.email}
            </p>
            <Button
              size="sm"
              disabled={saving || !responseMessage}
              onClick={handleSendResponse}
              className="gap-2"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Envoyer la réponse
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

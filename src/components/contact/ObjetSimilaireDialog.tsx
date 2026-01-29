import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { COMPANY_INFO } from "@/lib/site-config";

interface ObjetSimilaireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUESTIONS = [
  {
    id: "type",
    question: "De quel type d'objet s'agit-il ?",
    options: ["Tableau / Peinture", "Sculpture", "Meuble", "Bijou / Montre", "Céramique", "Vin / Spiritueux", "Autre"],
  },
  {
    id: "epoque",
    question: "De quelle époque estimez-vous qu'il date ?",
    options: ["Avant 1800", "XIXe siècle", "1900-1950", "Après 1950", "Je ne sais pas"],
  },
  {
    id: "origine",
    question: "D'où provient cet objet ?",
    options: ["Héritage familial", "Achat en brocante", "Achat en galerie", "Cadeau", "Autre"],
  },
];

export function ObjetSimilaireDialog({ open, onOpenChange }: ObjetSimilaireDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    description: "",
  });

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Simulate AI search
      setIsSearching(true);
      setTimeout(() => {
        setIsSearching(false);
        setStep(QUESTIONS.length); // Move to contact form
      }, 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const answersText = QUESTIONS.map((q) => 
      `${q.question}\n→ ${answers[q.id] || "Non répondu"}`
    ).join("\n\n");
    
    const subject = encodeURIComponent("J'ai un objet similaire à un de vos lots");
    const body = encodeURIComponent(
      `Demande de mise en relation\n\n` +
      `Nom: ${formData.nom}\n` +
      `Email: ${formData.email}\n\n` +
      `Réponses au questionnaire:\n${answersText}\n\n` +
      `Description complémentaire:\n${formData.description}`
    );
    
    window.location.href = `mailto:${COMPANY_INFO.email}?subject=${subject}&body=${body}`;
    
    toast({
      title: "Demande envoyée",
      description: "Notre équipe vous recontactera avec des lots similaires.",
    });
    
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setStep(0);
    setAnswers({});
    setIsSearching(false);
    setFormData({ nom: "", email: "", description: "" });
  };

  const currentQuestion = QUESTIONS[step];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-primary" />
            J'ai un objet similaire
          </DialogTitle>
          <DialogDescription>
            Quelques questions pour identifier des lots comparables dans nos ventes.
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1 mb-4">
          {QUESTIONS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-colors ${
                idx <= step ? "bg-brand-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>

        {/* Questions */}
        {step < QUESTIONS.length && !isSearching && currentQuestion && (
          <div className="space-y-4">
            <p className="font-medium">{currentQuestion.question}</p>
            <div className="grid gap-2">
              {currentQuestion.options.map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  className="justify-start h-auto py-3 text-left"
                  onClick={() => handleAnswer(currentQuestion.id, option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Searching Animation */}
        {isSearching && (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-brand-primary" />
            <p className="text-muted-foreground">
              Recherche de lots similaires dans nos archives...
            </p>
          </div>
        )}

        {/* Contact Form */}
        {step >= QUESTIONS.length && !isSearching && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-secondary/30 rounded-lg mb-4">
              <p className="text-sm font-medium mb-2">Vos réponses :</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {QUESTIONS.map((q) => (
                  <li key={q.id}>• {answers[q.id]}</li>
                ))}
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              Laissez-nous vos coordonnées et nous vous enverrons des exemples de lots similaires vendus récemment.
            </p>

            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description complémentaire</Label>
              <Textarea
                id="description"
                placeholder="Détails supplémentaires sur votre objet..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full gap-2">
              <Send className="w-4 h-4" />
              Recevoir des exemples similaires
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

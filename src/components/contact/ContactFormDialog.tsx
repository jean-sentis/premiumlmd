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
import { COMPANY_INFO } from "@/lib/site-config";
import { Send } from "lucide-react";

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  subject: string;
  /** Pre-filled message content */
  prefillMessage?: string;
  /** Additional context shown at the bottom */
  contextInfo?: string;
  /** Custom fields to show before the message */
  showFields?: {
    nom?: boolean;
    email?: boolean;
    telephone?: boolean;
  };
}

export function ContactFormDialog({
  open,
  onOpenChange,
  title,
  description,
  subject,
  prefillMessage = "",
  contextInfo,
  showFields = { nom: true, email: true, telephone: true },
}: ContactFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    message: prefillMessage,
  });

  // Update message when prefillMessage changes
  useState(() => {
    setFormData(prev => ({ ...prev, message: prefillMessage }));
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // For now, we'll use mailto as fallback
    // In the future, this could be connected to an edge function
    const emailBody = [
      showFields.nom && formData.nom && `Nom: ${formData.nom}`,
      showFields.email && formData.email && `Email: ${formData.email}`,
      showFields.telephone && formData.telephone && `Téléphone: ${formData.telephone}`,
      "",
      formData.message,
    ]
      .filter(Boolean)
      .join("\n");

    const mailtoUrl = `mailto:${COMPANY_INFO.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;

    toast({
      title: "Message préparé",
      description: "Votre client mail s'ouvre avec le message pré-rempli.",
    });

    setIsSubmitting(false);
    onOpenChange(false);
    setFormData({ nom: "", email: "", telephone: "", message: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            {showFields.nom && (
              <div className="space-y-2">
                <Label htmlFor="contact-nom">Nom complet</Label>
                <Input
                  id="contact-nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Votre nom"
                />
              </div>
            )}
            {showFields.email && (
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="votre@email.com"
                />
              </div>
            )}
            {showFields.telephone && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contact-telephone">Téléphone</Label>
                <Input
                  id="contact-telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="06 12 34 56 78"
                />
              </div>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Votre message..."
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Context info */}
          {contextInfo && (
            <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground">
              {contextInfo}
            </div>
          )}

          <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
            <Send className="w-4 h-4" />
            Envoyer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

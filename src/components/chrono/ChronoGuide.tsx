import { Clock, ShieldCheck, Gavel, CreditCard } from "lucide-react";

interface ChronoGuideProps {
  className?: string;
}

const ChronoGuide = ({ className = "" }: ChronoGuideProps) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Introduction */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        Une vente chrono (ou vente online) est une vente aux enchères entièrement dématérialisée. 
        Les lots sont disponibles en ligne pendant plusieurs jours avec une <strong className="text-foreground">heure de clôture précise</strong>.
      </p>

      {/* Key points */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Point 1: Enchères en ligne */}
        <div className="flex gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
          <Clock className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm mb-1">Enchères en ligne uniquement</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Les enchères se font exclusivement sur Interenchères, directement depuis votre compte.
            </p>
          </div>
        </div>

        {/* Point 2: Ordres d'achat */}
        <div className="flex gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
          <CreditCard className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm mb-1">Ordres d'achat automatiques</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fixez un montant maximum et le système enchérit pour vous par paliers jusqu'à ce plafond.
            </p>
          </div>
        </div>

        {/* Point 3: Anti-sniping */}
        <div className="flex gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
          <ShieldCheck className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm mb-1">Protection anti-sniping</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Si une enchère est placée dans les dernières minutes, le lot est prolongé automatiquement.
            </p>
          </div>
        </div>

        {/* Point 4: Hôtel des ventes */}
        <div className="flex gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
          <Gavel className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm mb-1">Sécurité juridique</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              L'hôtel des ventes reste juridiquement responsable de la vente, du paiement et de la délivrance.
            </p>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <a
          href="https://www.interencheres.com/aide"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-brand-gold hover:text-brand-gold/80 transition-colors"
        >
          En savoir plus sur Interenchères →
        </a>
      </div>
    </div>
  );
};

export default ChronoGuide;

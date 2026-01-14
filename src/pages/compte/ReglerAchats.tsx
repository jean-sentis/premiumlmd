import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard, Trophy, AlertCircle, CheckCircle2, ExternalLink, FileText, Euro, Construction } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WonLot {
  id: string;
  lot_number: number;
  title: string;
  adjudication_price: number | null;
  images: string[];
  sale_id: string | null;
  sale_title?: string;
  sale_date?: string;
  fees_info?: string;
}

interface PaymentSummary {
  lots: WonLot[];
  totalHammer: number;
  estimatedFees: number;
  totalTTC: number;
}

const ReglerAchats = () => {
  const { user } = useAuth();
  const [wonLots, setWonLots] = useState<WonLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [showDemoDialog, setShowDemoDialog] = useState(false);

  useEffect(() => {
    const fetchWonLots = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: lots, error } = await supabase
        .from('interencheres_lots')
        .select(`
          id,
          lot_number,
          title,
          adjudication_price,
          images,
          sale_id
        `)
        .eq('winner_user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching won lots:', error);
        setLoading(false);
        return;
      }

      if (lots && lots.length > 0) {
        // Fetch sale info for each lot
        const saleIds = [...new Set(lots.filter(l => l.sale_id).map(l => l.sale_id))];
        const { data: sales } = await supabase
          .from('interencheres_sales')
          .select('id, title, sale_date, fees_info')
          .in('id', saleIds);

        const salesMap = new Map(sales?.map(s => [s.id, s]) || []);

        const enrichedLots = lots.map(lot => ({
          ...lot,
          images: Array.isArray(lot.images) ? lot.images as string[] : [],
          sale_title: lot.sale_id ? salesMap.get(lot.sale_id)?.title : undefined,
          sale_date: lot.sale_id ? salesMap.get(lot.sale_id)?.sale_date : undefined,
          fees_info: lot.sale_id ? salesMap.get(lot.sale_id)?.fees_info : undefined,
        }));

        // Calculate payment summary
        const totalHammer = enrichedLots.reduce((sum, lot) => sum + (lot.adjudication_price || 0), 0);
        const estimatedFees = Math.round(totalHammer * 0.25); // 25% frais acheteur estimation
        const totalTTC = totalHammer + estimatedFees;

        setWonLots(enrichedLots);
        setPaymentSummary({
          lots: enrichedLots,
          totalHammer,
          estimatedFees,
          totalTTC,
        });
      }

      setLoading(false);
    };

    fetchWonLots();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-gold/20 rounded-full">
          <CreditCard className="w-6 h-6 text-brand-gold" />
        </div>
        <div>
          <h1 className="text-foreground">Régler mes achats</h1>
          <p className="text-sm text-muted-foreground">
            {wonLots.length === 0 
              ? "Aucun achat en attente de paiement"
              : `${wonLots.length} lot${wonLots.length > 1 ? 's' : ''} à régler`
            }
          </p>
        </div>
      </div>

      {/* No lots to pay */}
      {wonLots.length === 0 ? (
        <div className="bg-muted/30 border border-border/50 rounded-lg p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">Aucun paiement en attente</p>
          <p className="text-sm text-muted-foreground/70">
            Lorsque vous remporterez des enchères, vous pourrez régler vos achats ici.
          </p>
          <Link
            to="/acheter/ventes-a-venir"
            className="inline-flex items-center gap-2 mt-4 text-sm text-brand-gold hover:underline"
          >
            Voir les ventes à venir
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <>
          {/* Payment summary card */}
          {paymentSummary && (
            <div className="bg-gradient-to-br from-brand-gold/10 to-amber-500/5 border border-brand-gold/30 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Euro className="w-5 h-5 text-brand-gold" />
                Récapitulatif
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Prix d'adjudication ({paymentSummary.lots.length} lot{paymentSummary.lots.length > 1 ? 's' : ''})
                  </span>
                  <span className="text-foreground font-medium">
                    {paymentSummary.totalHammer.toLocaleString('fr-FR')} €
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Frais acheteur (estimés ~25%)
                  </span>
                  <span className="text-foreground font-medium">
                    {paymentSummary.estimatedFees.toLocaleString('fr-FR')} €
                  </span>
                </div>
                
                <div className="border-t border-border/50 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-foreground font-semibold">Total estimé TTC</span>
                    <span className="text-xl font-bold text-brand-gold">
                      {paymentSummary.totalTTC.toLocaleString('fr-FR')} €
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                Le montant exact des frais vous sera communiqué sur le bordereau d'adjudication.
              </p>
            </div>
          )}

          {/* Lots list */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Détail des lots
            </h3>
            
            {wonLots.map((lot) => (
              <div
                key={lot.id}
                className="flex gap-4 p-4 bg-muted/30 border border-border/50 rounded-lg"
              >
                {/* Image */}
                <div className="w-16 h-16 flex-shrink-0 bg-muted rounded overflow-hidden">
                  {lot.images[0] ? (
                    <img
                      src={lot.images[0]}
                      alt={lot.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <Trophy className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      Lot n°{lot.lot_number}
                    </Badge>
                  </div>
                  <Link
                    to={`/vente/${lot.sale_id}/lot/${lot.id}`}
                    className="font-medium text-foreground hover:text-brand-gold transition-colors line-clamp-1"
                  >
                    {lot.title}
                  </Link>
                  {lot.sale_title && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {lot.sale_title}
                    </p>
                  )}
                </div>

                {/* Price */}
                {lot.adjudication_price && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-semibold text-foreground">
                      {lot.adjudication_price.toLocaleString('fr-FR')} €
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      hors frais
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Payment methods info */}
          <div className="bg-muted/30 border border-border/50 rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-gold" />
              Comment régler ?
            </h3>
            
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Vous recevrez par email votre <strong className="text-foreground">bordereau d'adjudication</strong> détaillant 
                le montant exact à régler (prix marteau + frais acheteur).
              </p>
              
              <div className="space-y-2">
                <p className="font-medium text-foreground">Modes de paiement acceptés :</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Carte bancaire</li>
                  <li>Virement bancaire</li>
                  <li>Chèque</li>
                  <li>Espèces (jusqu'à 1 000 €)</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button 
                className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white"
                onClick={() => setShowDemoDialog(true)}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Payer maintenant
              </Button>
              <Button variant="outline" asChild className="w-full">
                <a href="mailto:contact@hdv-ajaccio.fr?subject=Question%20sur%20mon%20paiement">
                  Contacter l'étude pour régler
                </a>
              </Button>
            </div>
          </div>

          {/* Demo dialog */}
          <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-amber-500/20 rounded-full">
                    <Construction className="w-8 h-8 text-amber-500" />
                  </div>
                </div>
                <DialogTitle className="text-center">Fonctionnalité en développement</DialogTitle>
                <DialogDescription className="text-center">
                  Le paiement en ligne sera bientôt disponible. Pour l'instant, merci de contacter l'étude 
                  par téléphone ou email pour régler vos achats.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 mt-4">
                <Button variant="outline" asChild>
                  <a href="mailto:contact@hdv-ajaccio.fr?subject=Règlement%20de%20mes%20achats">
                    Contacter par email
                  </a>
                </Button>
                <Button variant="ghost" onClick={() => setShowDemoDialog(false)}>
                  Fermer
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Next step */}
          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border/30">
            <span className="text-sm text-muted-foreground">
              Après paiement, prenez rendez-vous pour l'enlèvement
            </span>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/compte/enlevement" className="flex items-center gap-2">
                RV d'enlèvement
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ReglerAchats;

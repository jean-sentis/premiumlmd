import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import LotActionCheckbox from './LotActionCheckbox';
import { Gavel, Phone, Heart, MessageCircle, Send, Sparkles, Eye, Loader2, Trophy, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast as toastSonner } from '@/hooks/use-toast';

interface LotActionsPanelProps {
  lotId: string;
  lotNumber: number;
  lotTitle: string;
  saleTitle?: string;
  currentDescription?: string | null;
  currentDimensions?: string | null;
  isSold?: boolean;
  isWinner?: boolean;
  lotImageUrl?: string | null;
}

const LotActionsPanel = ({ lotId, lotNumber, lotTitle, saleTitle, currentDescription, currentDimensions, isSold = false, isWinner = false, lotImageUrl }: LotActionsPanelProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Action states
  const [hasPurchaseOrder, setHasPurchaseOrder] = useState(false);
  const [existingOrderAmount, setExistingOrderAmount] = useState<number | null>(null);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
  const [hasPhoneBid, setHasPhoneBid] = useState(false);
  const [existingPhoneNumber, setExistingPhoneNumber] = useState<string | null>(null);
  const [isMemorized, setIsMemorized] = useState(false);
  const [wantsInfo, setWantsInfo] = useState(false);
  
  // AI Analysis states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Form states
  const [maxBid, setMaxBid] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMode, setInfoMode] = useState<'message' | 'ai' | null>(null);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);

  // Fetch existing user actions - reset states when lotId changes
  useEffect(() => {
    // Reset states when lot changes
    setHasPurchaseOrder(false);
    setExistingOrderAmount(null);
    setIsOrderConfirmed(false);
    setHasPhoneBid(false);
    setExistingPhoneNumber(null);
    setIsMemorized(false);
    setAiResult(null);
    setInfoPanelOpen(false);
    setInfoMode(null);

    if (!user) return;

    const fetchUserActions = async () => {
      const [purchaseOrder, phoneBid, memorized] = await Promise.all([
        supabase.from('purchase_orders').select('id, max_bid, is_confirmed').eq('lot_id', lotId).eq('user_id', user.id).maybeSingle(),
        supabase.from('phone_bid_requests').select('id, phone_number').eq('lot_id', lotId).eq('user_id', user.id).maybeSingle(),
        supabase.from('memorized_lots').select('id').eq('lot_id', lotId).eq('user_id', user.id).maybeSingle(),
      ]);

      setHasPurchaseOrder(!!purchaseOrder.data);
      setExistingOrderAmount(purchaseOrder.data?.max_bid || null);
      setIsOrderConfirmed(!!purchaseOrder.data?.is_confirmed);
      setHasPhoneBid(!!phoneBid.data);
      setExistingPhoneNumber(phoneBid.data?.phone_number || null);
      setIsMemorized(!!memorized.data);
    };

    fetchUserActions();
  }, [user, lotId]);

  const requireAuth = (callback: () => void) => {
    if (!user) {
      navigate('/auth', { state: { returnTo: location.pathname } });
      return;
    }
    callback();
  };

  // Generate mailto link for "Je souhaite vendre un objet similaire"
  const handleSellSimilar = () => {
    const subject = encodeURIComponent("Je souhaite vendre un objet similaire");
    const lotUrl = `${window.location.origin}${location.pathname}`;
    
    let body = `Je souhaite vendre un objet similaire.\n\n`;
    body += `---\n`;
    body += `Référence : Lot n°${lotNumber}\n`;
    body += `Titre : ${lotTitle}\n`;
    if (saleTitle) body += `Vente : ${saleTitle}\n`;
    if (currentDescription) body += `\nDescription :\n${currentDescription}\n`;
    if (currentDimensions) body += `\nDimensions : ${currentDimensions}\n`;
    body += `\nLien vers le lot : ${lotUrl}\n`;
    if (lotImageUrl) body += `\nPhoto du lot : ${lotImageUrl}\n`;
    
    const mailtoUrl = `mailto:contact@12pages.fr?subject=${subject}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handleMemorize = async (checked: boolean) => {
    requireAuth(async () => {
      if (loading) return;

      setLoading(true);
      try {
        if (checked) {
          const { error: insertError } = await supabase
            .from('memorized_lots')
            .insert({ user_id: user!.id, lot_id: lotId });
          if (insertError) throw insertError;

          const { error: activityError } = await supabase.from('user_activity').insert({
            user_id: user!.id,
            action_type: 'memorize',
            lot_id: lotId,
          });
          if (activityError) throw activityError;

          toast({ title: 'Lot mémorisé', description: 'Ce lot a été ajouté à votre sélection' });
        } else {
          const { error: deleteError } = await supabase
            .from('memorized_lots')
            .delete()
            .eq('lot_id', lotId)
            .eq('user_id', user!.id);
          if (deleteError) throw deleteError;

          toast({ title: 'Lot retiré', description: 'Ce lot a été retiré de votre sélection' });
        }

        setIsMemorized(checked);
      } catch (e) {
        toast({
          title: 'Erreur',
          description: "Impossible de mettre à jour votre sélection. Veuillez réessayer.",
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    });
  };

  const handleSubmitPurchaseOrder = async () => {
    if (!maxBid || isNaN(Number(maxBid))) {
      toast({ title: "Erreur", description: "Veuillez entrer un montant valide", variant: "destructive" });
      return;
    }

    requireAuth(async () => {
      setLoading(true);
      try {
        await supabase.from('purchase_orders').insert({
          user_id: user!.id,
          lot_id: lotId,
          max_bid: parseInt(maxBid, 10),
        });
        await supabase.from('user_activity').insert({
          user_id: user!.id,
          action_type: 'purchase_order',
          lot_id: lotId,
          metadata: { max_bid: parseInt(maxBid, 10) },
        });
        setHasPurchaseOrder(true);
        toast({ title: "Ordre enregistré", description: `Votre ordre d'achat de ${maxBid} € a été enregistré` });
        setMaxBid('');
      } catch (e) {
        toast({ title: "Erreur", description: "Impossible d'enregistrer l'ordre", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    });
  };

  const handleSubmitPhoneBid = async () => {
    if (!phoneNumber.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer un numéro de téléphone", variant: "destructive" });
      return;
    }

    requireAuth(async () => {
      setLoading(true);
      try {
        await supabase.from('phone_bid_requests').insert({
          user_id: user!.id,
          lot_id: lotId,
          phone_number: phoneNumber,
        });
        await supabase.from('user_activity').insert({
          user_id: user!.id,
          action_type: 'phone_bid',
          lot_id: lotId,
        });
        setHasPhoneBid(true);
        toast({ title: "Demande enregistrée", description: "Nous vous appellerons pour ce lot" });
        setPhoneNumber('');
      } catch (e) {
        toast({ title: "Erreur", description: "Impossible d'enregistrer la demande", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    });
  };

  const handleSubmitInfoRequest = async () => {
    if (!infoMessage.trim()) {
      toast({ title: "Erreur", description: "Veuillez écrire votre message", variant: "destructive" });
      return;
    }

    requireAuth(async () => {
      setLoading(true);
      try {
        await supabase.from('info_requests').insert({
          user_id: user!.id,
          lot_id: lotId,
          message: infoMessage,
        });
        await supabase.from('user_activity').insert({
          user_id: user!.id,
          action_type: 'info_request',
          lot_id: lotId,
        });
        toast({ title: "Message envoyé", description: "Nous vous répondrons rapidement" });
        setInfoMessage('');
        setWantsInfo(false);
      } catch (e) {
        toast({ title: "Erreur", description: "Impossible d'envoyer le message", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    });
  };

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-lot-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            lot_id: lotId,
            dry_run: true,
            analyze_images: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'analyse");
      }

      const data = await response.json();
      
      if (data.success) {
        setAiResult({
          analysis: data.analysis,
          image_analysis: data.image_analysis,
          original: data.original,
        });
        toast({
          title: "Analyse terminée",
          description: "L'IA a analysé le lot et les photos",
        });
      } else {
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'analyse",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Row 1: Rapport de condition + Analyse IA - seulement pour lots non vendus */}
      {!isSold && (
        <div className="grid grid-cols-2 gap-2">
          {/* Rapport de condition */}
          <button
            onClick={() => { setInfoPanelOpen(true); setInfoMode('message'); }}
            className={`border rounded px-3 py-2 flex items-center gap-2 hover:bg-muted/50 transition-colors ${infoMode === 'message' && infoPanelOpen ? 'bg-muted/50 border-brand-gold/50' : ''}`}
          >
            <Send className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-xs font-medium truncate">Rapport de condition</span>
          </button>

          {/* Analyse IA */}
          <button
            onClick={() => { setInfoPanelOpen(true); setInfoMode('ai'); }}
            className={`border rounded px-3 py-2 flex items-center gap-2 hover:bg-muted/50 transition-colors ${infoMode === 'ai' && infoPanelOpen ? 'bg-muted/50 border-brand-gold/50' : ''}`}
          >
            <Sparkles className={`w-4 h-4 flex-shrink-0 ${infoMode === 'ai' && infoPanelOpen ? 'text-brand-gold' : 'text-muted-foreground'}`} />
            <span className="text-xs font-medium truncate">Analyse IA</span>
          </button>
        </div>
      )}

      {/* Row 2: Laisser un ordre + Enchérir par téléphone - seulement pour lots non vendus */}
      {!isSold && (
        <div className="grid grid-cols-2 gap-2">
          {/* Laisser un ordre */}
          <Accordion type="single" collapsible className={`border rounded ${hasPurchaseOrder ? (isOrderConfirmed ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-orange-400 bg-orange-50 dark:bg-orange-900/20') : ''}`}>
            <AccordionItem value="purchase-order" className="border-0">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <Gavel className={`w-4 h-4 flex-shrink-0 transition-colors ${hasPurchaseOrder ? (isOrderConfirmed ? 'text-green-600' : 'text-orange-500') : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-medium truncate ${hasPurchaseOrder ? (isOrderConfirmed ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400') : ''}`}>
                    {hasPurchaseOrder ? `Ordre : ${existingOrderAmount?.toLocaleString()} €` : 'Laisser un ordre'}
                  </span>
                  {hasPurchaseOrder && isOrderConfirmed && (
                    <span className="text-[10px] bg-green-500/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded flex-shrink-0">
                      ✓
                    </span>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-auto flex-shrink-0 cursor-help" onClick={(e) => e.stopPropagation()}>
                        <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      <p className="font-medium mb-1">Qu'est-ce qu'un ordre d'achat ?</p>
                      <p>Indiquez votre enchère maximum. Le commissaire-priseur enchérira pour vous pendant la vente, au plus juste, sans dépasser votre limite.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <div className="space-y-3 pt-2">
                  {hasPurchaseOrder ? (
                    <>
                      <div className={`${isOrderConfirmed ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800'} border rounded-md p-3`}>
                        <p className={`text-sm font-medium ${isOrderConfirmed ? 'text-green-800 dark:text-green-300' : 'text-orange-800 dark:text-orange-300'}`}>
                          Votre ordre d'achat : {existingOrderAmount?.toLocaleString()} €
                        </p>
                        <p className={`text-xs mt-1 ${isOrderConfirmed ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {isOrderConfirmed ? 'Ordre validé — Pièces reçues' : 'En attente de validation — Pièces requises'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Modifier votre ordre :
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Votre montant maximum en euros (hors frais).
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={hasPurchaseOrder ? "Nouveau montant" : "Montant"}
                      value={maxBid}
                      onChange={(e) => setMaxBid(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSubmitPurchaseOrder} 
                      disabled={loading || !maxBid}
                      size="sm"
                    >
                      {hasPurchaseOrder ? 'Modifier' : 'OK'}
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Enchérir par téléphone */}
          <Accordion type="single" collapsible className="border rounded">
            <AccordionItem value="phone-bid" className="border-0">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">Enchérir par</span>
                  <Phone className={`w-4 h-4 flex-shrink-0 transition-colors -scale-x-100 ${hasPhoneBid ? 'text-brand-gold' : 'text-muted-foreground'}`} />
                  {hasPhoneBid && (
                    <span className="text-[10px] bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded flex-shrink-0">
                      ✓
                    </span>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-auto flex-shrink-0 cursor-help" onClick={(e) => e.stopPropagation()}>
                        <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      <p className="font-medium mb-1">Qu'est-ce que l'enchère par téléphone ?</p>
                      <p>Nous vous appelons pendant la vente pour que vous puissiez enchérir en direct avec le commissaire-priseur, comme si vous étiez dans la salle.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Nous vous appellerons pour ce lot.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="Téléphone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSubmitPhoneBid} 
                      disabled={loading || !phoneNumber}
                      size="sm"
                    >
                      OK
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {/* Row 3: Adjugé (si gagnant) - pleine largeur */}
      {isWinner && (
        <div className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded px-4 py-2 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-green-700 dark:text-green-400">
              Adjugé !
            </span>
            <p className="text-xs text-green-600 dark:text-green-500 truncate">
              {lotTitle}
            </p>
          </div>
        </div>
      )}

      {/* Row 4: Je souhaite vendre un objet similaire + Mémoriser */}
      <div className="grid grid-cols-2 gap-2">
        {/* Je souhaite vendre un objet similaire */}
        <button
          onClick={handleSellSimilar}
          className="border rounded px-3 py-2 flex items-center gap-2 hover:bg-muted/50 transition-colors"
        >
          <Send className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-xs font-medium truncate">Vendre un objet similaire</span>
        </button>

        {/* Mémoriser */}
        <div
          className="border rounded px-3 py-2 flex items-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => handleMemorize(!isMemorized)}
          role="button"
          aria-label={isMemorized ? 'Retirer de ma sélection' : 'Ajouter à ma sélection'}
        >
          <Heart
            className={`w-4 h-4 flex-shrink-0 transition-colors ${isMemorized ? 'text-brand-gold' : 'text-muted-foreground'}`}
            fill={isMemorized ? 'currentColor' : 'none'}
          />
          <span className="text-xs font-medium truncate">Mémoriser</span>
          {isMemorized && (
            <span className="text-[10px] bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded flex-shrink-0 ml-auto">
              ✓
            </span>
          )}
        </div>
      </div>

      {/* Contenu Plus d'infos - pleine largeur quand ouvert */}
      {infoPanelOpen && (
        <div className="border rounded p-3 space-y-3">
          {/* Message form for Rapport de condition */}
          {infoMode === 'message' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Posez vos questions sur ce lot.
              </p>
              <Textarea
                placeholder="Votre question..."
                value={infoMessage}
                onChange={(e) => setInfoMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setInfoMode(null)}
                >
                  Retour
                </Button>
                <Button 
                  onClick={handleSubmitInfoRequest} 
                  disabled={loading || !infoMessage.trim()}
                  size="sm"
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
                </Button>
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {infoMode === 'ai' && !aiResult && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                L'IA analysera les photos et les informations du lot.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setInfoMode(null)}
                >
                  Retour
                </Button>
                <Button 
                  onClick={handleAIAnalysis}
                  disabled={aiLoading}
                  size="sm"
                  className="flex-1 border-brand-gold/50 text-brand-gold hover:bg-brand-gold/20"
                  variant="outline"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Analyse...
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 mr-1.5" />
                      Analyser ce lot
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* AI Result display */}
          {aiResult && (
            <div className="space-y-3 text-xs">
              {/* Explication de l'objet */}
              {aiResult.analysis?.explanation && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    À propos de cet objet
                  </div>
                  <p className="text-foreground leading-relaxed bg-muted/30 p-3 rounded border border-border/30">
                    {aiResult.analysis.explanation}
                  </p>
                </div>
              )}

              {/* Informations sur le créateur */}
              {aiResult.analysis?.creator_info && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    À propos du créateur
                  </div>
                  <p className="text-foreground leading-relaxed bg-brand-gold/5 p-3 rounded border border-brand-gold/20">
                    {aiResult.analysis.creator_info}
                  </p>
                </div>
              )}

              {/* Analyse visuelle */}
              {aiResult.image_analysis && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    <Eye className="w-3 h-3" />
                    Ce que l'IA observe
                  </div>
                  <p className="text-foreground leading-relaxed italic bg-background/50 p-3 rounded border border-border/30">
                    "{aiResult.image_analysis}"
                  </p>
                </div>
              )}

              <Button 
                variant="ghost"
                size="sm"
                onClick={() => { setAiResult(null); setInfoMode(null); setInfoPanelOpen(false); }}
                className="w-full"
              >
                Fermer
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LotActionsPanel;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { pickBestInterencheresImages } from '@/lib/interencheres-images';
import { 
  Bell, 
  Plus, 
  X, 
  Loader2, 
  Sparkles, 
  Check,
  Tag,
  AlertCircle,
  ArrowRight,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Heart,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import OnboardingProgress from '@/components/compte/OnboardingProgress';

const MAX_ALERTS = 10;

interface Alert {
  id: string;
  keyword: string;
  is_active: boolean;
  created_at: string;
  matchingLotsCount?: number;
}

interface ValidationResult {
  originalKeyword: string;
  isValid: boolean;
  needsMoreInfo?: boolean;
  suggestedKeyword: string | null;
  specialty: string | null;
  needsConfirmation: boolean;
  explanation: string | null;
  clarificationQuestion?: string | null;
}

interface ProfileData {
  phone: string | null;
  contact_preference: 'email' | 'sms' | null;
}

const MesAlertes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [matchingLots, setMatchingLots] = useState<Record<string, any[]>>({});
  const [loadingLots, setLoadingLots] = useState<string | null>(null);
  const [memorizedLots, setMemorizedLots] = useState<Set<string>>(new Set());
  const [viewedLots, setViewedLots] = useState<Record<string, Set<string>>>({}); // alertId -> Set of lotIds
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // AI clarification message (inline, visible)
  const [clarificationMessage, setClarificationMessage] = useState<string | null>(null);
  
  // Show profile prompt after first alert
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  
  // Show next steps after creating an alert
  const [showNextSteps, setShowNextSteps] = useState(false);
  // AI validation dialog
  const [validationDialog, setValidationDialog] = useState<{
    open: boolean;
    result: ValidationResult | null;
  }>({ open: false, result: null });

  useEffect(() => {
    if (user) {
      fetchAlerts();
      fetchProfile();
      fetchMemorizedLots();
      fetchViewedLots();
    }
  }, [user]);

  const fetchViewedLots = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('alert_lot_views')
      .select('lot_id, alert_id')
      .eq('user_id', user.id);
    if (data) {
      const viewedByAlert: Record<string, Set<string>> = {};
      for (const view of data) {
        if (!viewedByAlert[view.alert_id]) {
          viewedByAlert[view.alert_id] = new Set();
        }
        viewedByAlert[view.alert_id].add(view.lot_id);
      }
      setViewedLots(viewedByAlert);
    }
  };

  const fetchAlerts = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      // Pour chaque alerte, compter les lots correspondants
      const alertsWithCounts = await Promise.all(
        data.map(async (alert) => {
          const keyword = alert.keyword.split('(')[0].trim().toLowerCase();
          const { count } = await supabase
            .from('interencheres_lots')
            .select('id', { count: 'exact', head: true })
            .ilike('title', `%${keyword}%`);
          return { ...alert, matchingLotsCount: count || 0 };
        })
      );
      setAlerts(alertsWithCounts);
    }
    setLoading(false);
  };

  const fetchMatchingLots = async (alertId: string, keyword: string) => {
    if (matchingLots[alertId]) {
      // Déjà chargé, juste toggle
      setExpandedAlert(expandedAlert === alertId ? null : alertId);
      return;
    }
    
    setLoadingLots(alertId);
    const keywordClean = keyword.split('(')[0].trim().toLowerCase();
    const { data } = await supabase
      .from('interencheres_lots')
      .select('id, title, lot_number, estimate_low, estimate_high, images, sale_id')
      .ilike('title', `%${keywordClean}%`)
      .limit(20);
    
    if (data) {
      setMatchingLots(prev => ({ ...prev, [alertId]: data }));
    }
    setExpandedAlert(alertId);
    setLoadingLots(null);
  };

  const fetchMemorizedLots = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('memorized_lots')
      .select('lot_id')
      .eq('user_id', user.id);
    if (data) {
      setMemorizedLots(new Set(data.map(d => d.lot_id)));
    }
  };

  const toggleMemorizeLot = async (lotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    const isMemorized = memorizedLots.has(lotId);
    
    if (isMemorized) {
      await supabase
        .from('memorized_lots')
        .delete()
        .eq('user_id', user.id)
        .eq('lot_id', lotId);
      setMemorizedLots(prev => {
        const next = new Set(prev);
        next.delete(lotId);
        return next;
      });
      toast({ title: "Lot retiré de la sélection" });
    } else {
      await supabase
        .from('memorized_lots')
        .insert({ user_id: user.id, lot_id: lotId });
      setMemorizedLots(prev => new Set([...prev, lotId]));
      toast({ title: "Lot ajouté à la sélection" });
    }
  };

  const toggleViewedLot = async (alertId: string, lotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    const alertViewed = viewedLots[alertId] || new Set();
    const isViewed = alertViewed.has(lotId);
    
    if (isViewed) {
      // Supprimer de la base
      await supabase
        .from('alert_lot_views')
        .delete()
        .eq('user_id', user.id)
        .eq('lot_id', lotId)
        .eq('alert_id', alertId);
      
      setViewedLots(prev => {
        const next = { ...prev };
        if (next[alertId]) {
          const newSet = new Set(next[alertId]);
          newSet.delete(lotId);
          next[alertId] = newSet;
        }
        return next;
      });
    } else {
      // Ajouter en base
      await supabase
        .from('alert_lot_views')
        .insert({ user_id: user.id, lot_id: lotId, alert_id: alertId });
      
      setViewedLots(prev => {
        const next = { ...prev };
        if (!next[alertId]) {
          next[alertId] = new Set();
        }
        next[alertId] = new Set([...next[alertId], lotId]);
        return next;
      });
    }
  };
  
  const markLotAsViewed = async (alertId: string, lotId: string) => {
    if (!user) return;
    const alertViewed = viewedLots[alertId] || new Set();
    if (alertViewed.has(lotId)) return; // Already viewed
    
    await supabase
      .from('alert_lot_views')
      .insert({ user_id: user.id, lot_id: lotId, alert_id: alertId });
    
    setViewedLots(prev => {
      const next = { ...prev };
      if (!next[alertId]) {
        next[alertId] = new Set();
      }
      next[alertId] = new Set([...next[alertId], lotId]);
      return next;
    });
  };


  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('phone, contact_preference')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setProfile(data);
    }
  };

  const isProfileIncomplete = !profile?.phone;

  const updateContactPreference = async (preference: 'email' | 'sms') => {
    if (!user) return;
    
    // If choosing SMS without phone, show warning
    if (preference === 'sms' && !profile?.phone) {
      toast({
        title: "Numéro requis",
        description: "Ajoutez votre numéro de téléphone pour recevoir les alertes par SMS.",
        variant: "destructive"
      });
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ contact_preference: preference })
      .eq('user_id', user.id);
    
    if (!error) {
      setProfile(prev => prev ? { ...prev, contact_preference: preference } : null);
      toast({
        title: "Préférence mise à jour",
        description: preference === 'sms' ? "Vous recevrez vos alertes par SMS" : "Vous recevrez vos alertes par email"
      });
    }
  };

  const validateKeyword = async (keyword: string): Promise<ValidationResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-alert-keyword', {
        body: { keyword }
      });

      if (error) {
        console.error('Validation error:', error);
        return null;
      }

      return data as ValidationResult;
    } catch (err) {
      console.error('Validation failed:', err);
      return null;
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim() || !user) return;

    // Check max alerts limit
    if (alerts.length >= MAX_ALERTS) {
      toast({ 
        title: "Limite atteinte", 
        description: `Vous avez atteint le maximum de ${MAX_ALERTS} alertes. Supprimez-en une pour en ajouter une nouvelle.`,
        variant: "destructive" 
      });
      return;
    }

    const keyword = newKeyword.trim();
    
    // Check if already exists
    if (alerts.some(a => a.keyword.toLowerCase() === keyword.toLowerCase())) {
      toast({ 
        title: "Alerte existante", 
        description: "Cette alerte existe déjà dans votre liste",
        variant: "destructive" 
      });
      return;
    }

    setValidating(true);
    
    const result = await validateKeyword(keyword);
    
    setValidating(false);

    if (!result) {
      // AI unavailable, add directly
      await saveAlert(keyword);
      return;
    }

    // Handle needsMoreInfo case - show inline clarification message
    if (result.needsMoreInfo) {
      setClarificationMessage(result.clarificationQuestion || "Pouvez-vous préciser votre recherche ?");
      return;
    }

    if (!result.isValid) {
      toast({ 
        title: "Terme non reconnu", 
        description: result.explanation || "Ce terme ne semble pas correspondre à un objet, artiste ou marque connu.",
        variant: "destructive" 
      });
      return;
    }

    // Show confirmation dialog with specialty suggestion
    setValidationDialog({ open: true, result });
  };

  const saveAlert = async (keyword: string) => {
    if (!user) return;

    setSaving(true);
    
    const { data, error } = await supabase
      .from('user_alerts')
      .insert({ user_id: user.id, keyword, is_active: true })
      .select()
      .single();

    if (error) {
      toast({ 
        title: "Erreur", 
        description: "Impossible de créer l'alerte",
        variant: "destructive" 
      });
    } else if (data) {
      setAlerts(prev => [data, ...prev]);
      setNewKeyword('');
      setIsCreateOpen(false); // Fermer après ajout
      toast({ 
        title: "Alerte créée", 
        description: `Vous serez alerté pour "${keyword}"` 
      });
      
      // After first alert, prompt to complete profile if needed
      if (alerts.length === 0 && isProfileIncomplete) {
        setShowProfilePrompt(true);
      } else {
        // Show next steps for all other cases
        setShowNextSteps(true);
      }
    }
    
    setSaving(false);
  };

  const handleConfirmSuggestion = async () => {
    if (!validationDialog.result?.suggestedKeyword) return;
    
    setValidationDialog({ open: false, result: null });
    await saveAlert(validationDialog.result.suggestedKeyword);
  };

  const handleReject = () => {
    setValidationDialog({ open: false, result: null });
    toast({
      title: "Alerte annulée",
      description: "Vous pouvez reformuler votre recherche"
    });
  };

  const handleDeleteAlert = async (id: string) => {
    const { error } = await supabase
      .from('user_alerts')
      .delete()
      .eq('id', id);

    if (!error) {
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast({ title: "Alerte supprimée" });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('user_alerts')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (!error) {
      setAlerts(prev => prev.map(a => 
        a.id === id ? { ...a, is_active: !isActive } : a
      ));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <OnboardingProgress currentStep={2} />
      
      <h1 className="text-base md:text-lg font-semibold tracking-widest uppercase text-foreground mb-4">
        MES ALERTES
      </h1>
      <p className="text-muted-foreground mb-6">
        Recevez des notifications lorsque des lots correspondant à vos critères sont mis en vente.
      </p>

      {/* Channel preference selector */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Me notifier par :</span>
          <RadioGroup
            value={profile?.contact_preference || 'email'}
            onValueChange={(value: 'email' | 'sms') => updateContactPreference(value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="email" id="alert-email" />
              <Label htmlFor="alert-email" className="font-normal cursor-pointer flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                Email
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sms" id="alert-sms" disabled={!profile?.phone} />
              <Label 
                htmlFor="alert-sms" 
                className={cn(
                  "font-normal cursor-pointer flex items-center gap-1.5",
                  !profile?.phone && "opacity-50"
                )}
              >
                <Phone className="w-4 h-4" />
                SMS
              </Label>
            </div>
          </RadioGroup>
        </div>
        {!profile?.phone && profile?.contact_preference !== 'email' && (
          <p className="text-xs text-muted-foreground mt-2">
            <button 
              onClick={() => navigate('/compte/profil')}
              className="text-primary hover:underline"
            >
              Ajoutez votre numéro de téléphone
            </button>
            {" "}pour recevoir les alertes par SMS.
          </p>
        )}
        {profile?.contact_preference === 'email' && !user?.email && (
          <p className="text-xs text-amber-600 mt-2">
            Aucune adresse email associée à votre compte. Contactez-nous pour la configurer.
          </p>
        )}
      </div>


      {/* Collapsible create zone */}
      <div className="bg-card border border-border rounded-lg mb-8 overflow-hidden">
        <button
          onClick={() => setIsCreateOpen(!isCreateOpen)}
          disabled={alerts.length >= MAX_ALERTS}
          className={cn(
            "w-full flex items-center justify-between p-4 text-left transition-colors",
            alerts.length >= MAX_ALERTS 
              ? "opacity-50 cursor-not-allowed" 
              : "hover:bg-muted/30"
          )}
        >
          <div className="flex items-center gap-2">
            <Plus className={cn("w-4 h-4", isCreateOpen && "rotate-45 transition-transform")} />
            <span className="text-sm font-medium text-foreground">Créer une nouvelle alerte</span>
          </div>
          <Badge variant={alerts.length >= MAX_ALERTS ? "destructive" : "secondary"} className="text-xs">
            {alerts.length}/{MAX_ALERTS}
          </Badge>
        </button>
        
        {isCreateOpen && alerts.length < MAX_ALERTS && (
          <div className="px-4 pb-4 border-t border-border pt-4">
            <div className="flex gap-3">
              <Input
                value={newKeyword}
                onChange={(e) => {
                  setNewKeyword(e.target.value);
                  if (clarificationMessage) setClarificationMessage(null);
                }}
                placeholder="Ex: Rolex, Picasso, Art Déco..."
                onKeyDown={(e) => e.key === 'Enter' && !validating && !saving && handleAddKeyword()}
                disabled={validating || saving}
                className="flex-1"
              />
              <Button 
                onClick={handleAddKeyword}
                disabled={!newKeyword.trim() || validating || saving}
                className="shrink-0"
              >
                {validating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse mr-2" />
                    Analyse...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </>
                )}
              </Button>
            </div>
            
            {/* Inline clarification message */}
            {clarificationMessage && (
              <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Dites-m'en plus</p>
                  <p className="text-sm text-muted-foreground mt-1">{clarificationMessage}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alerts list */}
      {alerts.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Résultats d'alerte ({alerts.filter(a => a.is_active).length})
          </h2>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {alerts.map((alert) => (
              <div key={alert.id}>
                <div 
                  className={cn(
                    "flex items-center justify-between p-4",
                    !alert.is_active && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => handleToggleActive(alert.id, alert.is_active)}
                      className={cn(
                        "w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors",
                        alert.is_active 
                          ? "bg-primary" 
                          : "border border-muted-foreground/30 hover:border-muted-foreground"
                      )}
                    >
                      {alert.is_active && <Check className="w-3 h-3 text-primary-foreground" />}
                    </button>
                    <span className={cn(
                      "font-medium",
                      !alert.is_active && "line-through text-muted-foreground"
                    )}>
                      {alert.keyword}
                    </span>
                    
                    {/* Badge avec nombre de résultats */}
                    {alert.matchingLotsCount !== undefined && alert.matchingLotsCount > 0 && (
                      <button
                        onClick={() => fetchMatchingLots(alert.id, alert.keyword)}
                        className="flex items-center gap-1.5 px-2 py-0.5 bg-[hsl(var(--brand-gold))] text-white text-xs font-bold rounded-full hover:opacity-90 transition-opacity"
                      >
                        {loadingLots === alert.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            {/* Afficher le nombre de lots NON vus */}
                            <span>
                              {matchingLots[alert.id] 
                                ? matchingLots[alert.id].filter(lot => !(viewedLots[alert.id]?.has(lot.id))).length
                                : alert.matchingLotsCount
                              }
                            </span>
                            {expandedAlert === alert.id ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </>
                        )}
                      </button>
                    )}
                    {alert.matchingLotsCount === 0 && (
                      <span className="text-xs text-muted-foreground">Aucun lot</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Liste des lots correspondants */}
                {expandedAlert === alert.id && matchingLots[alert.id] && (
                  <div className="px-4 pb-4">
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                      {matchingLots[alert.id].map((lot) => {
                        const images = pickBestInterencheresImages(
                          Array.isArray(lot.images) ? lot.images : []
                        );
                        const firstImage = images.length > 0 ? images[0] : null;
                        const isMemorized = memorizedLots.has(lot.id);
                        const isViewed = viewedLots[alert.id]?.has(lot.id) || false;
                        
                        return (
                          <div
                            key={lot.id}
                            className="w-full flex items-center gap-3 p-2 bg-background rounded-lg text-left"
                          >
                            {/* Bouton Vu */}
                            <button
                              onClick={(e) => toggleViewedLot(alert.id, lot.id, e)}
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium border transition-colors flex-shrink-0",
                                isViewed 
                                  ? "bg-primary border-primary text-primary-foreground" 
                                  : "border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary"
                              )}
                              title={isViewed ? "Marquer comme non vu" : "Marquer comme vu"}
                            >
                              Vu
                            </button>
                            
                            {/* Image */}
                            <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                              {firstImage ? (
                                <img 
                                  src={firstImage} 
                                  alt="" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : null}
                            </div>
                            
                            {/* Infos lot - cliquable pour ouvrir la page du lot */}
                            <button
                              onClick={() => {
                                markLotAsViewed(alert.id, lot.id);
                                navigate(`/lot/${lot.id}`, { state: { from: 'alertes' } });
                              }}
                              className="flex-1 min-w-0 text-left hover:text-primary transition-colors"
                            >
                              <p className="text-sm font-medium truncate">{lot.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Lot {lot.lot_number}
                                {lot.estimate_low && lot.estimate_high && (
                                  <> · {lot.estimate_low} - {lot.estimate_high} €</>
                                )}
                              </p>
                            </button>
                            
                            {/* Mémoriser */}
                            <button
                              onClick={(e) => toggleMemorizeLot(lot.id, e)}
                              className={cn(
                                "p-1.5 rounded transition-colors flex-shrink-0",
                                isMemorized 
                                  ? "text-red-500" 
                                  : "text-muted-foreground hover:text-red-500"
                              )}
                              title={isMemorized ? "Retirer de la sélection" : "Ajouter à la sélection"}
                            >
                              <Heart className={cn("w-4 h-4", isMemorized && "fill-current")} />
                            </button>
                            
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-muted/30 border border-dashed border-border rounded-lg p-8 text-center">
          <Bell className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            Aucune alerte pour l'instant.
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Ajoutez des termes pour être alerté des nouvelles ventes correspondantes.
          </p>
        </div>
      )}

      {/* Navigation section */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/compte/newsletter')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          
          <Button
            onClick={() => navigate('/compte/ce-que-jaime')}
            className="flex items-center gap-2"
          >
            Continuer
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* AI Validation Dialog */}
      <Dialog open={validationDialog.open} onOpenChange={(open) => !open && setValidationDialog({ open: false, result: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Confirmer votre alerte
            </DialogTitle>
          </DialogHeader>
          
          {validationDialog.result && (
            <div className="py-4 space-y-4">
              {/* Keyword display */}
              <div className="text-center">
                <p className="text-2xl font-semibold text-foreground">
                  {validationDialog.result.suggestedKeyword}
                </p>
                {validationDialog.result.specialty && (
                  <Badge variant="secondary" className="mt-2">
                    <Tag className="w-3 h-3 mr-1" />
                    {validationDialog.result.specialty}
                  </Badge>
                )}
              </div>
              
              {/* Explanation */}
              {validationDialog.result.explanation && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {validationDialog.result.explanation}
                  </p>
                </div>
              )}

              {/* Show correction if different */}
              {validationDialog.result.originalKeyword.toLowerCase() !== validationDialog.result.suggestedKeyword?.toLowerCase() && (
                <p className="text-xs text-center text-muted-foreground">
                  Correction de "{validationDialog.result.originalKeyword}"
                </p>
              )}
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleReject}
              className="w-full sm:w-auto"
            >
              Non, annuler
            </Button>
            <Button
              onClick={handleConfirmSuggestion}
              className="w-full sm:w-auto"
            >
              <Check className="w-4 h-4 mr-2" />
              Oui, créer cette alerte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile prompt dialog after first alert */}
      <Dialog open={showProfilePrompt} onOpenChange={setShowProfilePrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Alerte créée avec succès
            </DialogTitle>
            <DialogDescription>
              Pour recevoir vos notifications, complétez votre profil avec votre numéro de téléphone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Vous pourrez choisir de recevoir vos alertes par email ou par SMS dans les paramètres de votre profil.
            </p>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowProfilePrompt(false)}
              className="w-full sm:w-auto"
            >
              Plus tard
            </Button>
            <Button
              onClick={() => {
                setShowProfilePrompt(false);
                navigate('/compte/profil');
              }}
              className="w-full sm:w-auto"
            >
              Compléter mon profil
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Next steps dialog after creating an alert */}
      <Dialog open={showNextSteps} onOpenChange={setShowNextSteps}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Alerte enregistrée
            </DialogTitle>
            <DialogDescription>
              Vous serez notifié dès qu'un lot correspondant sera mis en vente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Que souhaitez-vous faire ?</p>
            
            <button
              onClick={() => {
                setShowNextSteps(false);
                setIsCreateOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
            >
              <Plus className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Créer une autre alerte</p>
                <p className="text-xs text-muted-foreground">Ajouter un autre mot-clé à surveiller</p>
              </div>
            </button>
            
            <button
              onClick={() => {
                setShowNextSteps(false);
                navigate('/acheter/ventes-a-venir');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
            >
              <ArrowRight className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Voir les ventes à venir</p>
                <p className="text-xs text-muted-foreground">Parcourir les prochains catalogues</p>
              </div>
            </button>
            
            <button
              onClick={() => {
                setShowNextSteps(false);
                navigate('/compte/ce-que-jaime');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
            >
              <Heart className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Affiner mon profil de goût</p>
                <p className="text-xs text-muted-foreground">Recevoir des suggestions personnalisées</p>
              </div>
            </button>
          </div>
          
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowNextSteps(false)}
              className="w-full"
            >
              Rester sur cette page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default MesAlertes;

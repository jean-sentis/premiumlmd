import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  CreditCard, 
  User, 
  UserPlus, 
  ChevronRight, 
  ChevronLeft,
  Euro, 
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bell,
  Heart,
  Calendar,
  Construction,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Sale {
  id: string;
  title: string;
  sale_date: string | null;
}

interface Lot {
  id: string;
  lot_number: number;
  title: string;
  adjudication_price: number | null;
}

const FEES_RATE = 0.25; // 25% frais acheteur

type Step = 'choice' | 'identity' | 'sale-lot' | 'confirm-price' | 'bordereau' | 'payment';

const STEPS_ORDER: Step[] = ['identity', 'sale-lot', 'confirm-price', 'bordereau', 'payment'];

const STORAGE_KEY = 'paiement_form_state';

interface FormState {
  step: Step;
  lastName: string;
  firstName: string;
  email: string;
  phone: string;
  selectedSaleId: string;
  selectedLotId: string;
  bordereauNumber: string;
}

const loadFormState = (): Partial<FormState> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const saveFormState = (state: Partial<FormState>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
};

const Paiement = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Load saved state
  const savedState = loadFormState();
  
  const [step, setStep] = useState<Step>(savedState.step || 'choice');
  const [sales, setSales] = useState<Sale[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingLots, setLoadingLots] = useState(false);
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  
  // Form state - Identity
  const [lastName, setLastName] = useState(savedState.lastName || '');
  const [firstName, setFirstName] = useState(savedState.firstName || '');
  const [email, setEmail] = useState(savedState.email || '');
  const [phone, setPhone] = useState(savedState.phone || '');
  
  // Form state - Sale/Lot
  const [selectedSaleId, setSelectedSaleId] = useState<string>(savedState.selectedSaleId || '');
  const [selectedLotId, setSelectedLotId] = useState<string>(savedState.selectedLotId || '');
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  
  // Form state - Bordereau
  const [bordereauNumber, setBordereauNumber] = useState<string>(savedState.bordereauNumber || '');

  // Save form state whenever it changes
  useEffect(() => {
    saveFormState({
      step,
      lastName,
      firstName,
      email,
      phone,
      selectedSaleId,
      selectedLotId,
      bordereauNumber,
    });
  }, [step, lastName, firstName, email, phone, selectedSaleId, selectedLotId, bordereauNumber]);

  // Redirect logged-in users to their account payment page
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/compte/paiement', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Fetch sales that have auctioned lots (for payment simulation)
  useEffect(() => {
    const fetchSalesWithAuctionedLots = async () => {
      setLoadingSales(true);
      // First get sale IDs that have at least one auctioned lot
      const { data: salesWithLots, error: lotsError } = await supabase
        .from('interencheres_lots')
        .select('sale_id')
        .not('adjudication_price', 'is', null);

      if (lotsError) {
        console.error('Error fetching auctioned lots:', lotsError);
        setLoadingSales(false);
        return;
      }

      // Extract unique sale IDs
      const saleIds = [...new Set(salesWithLots?.map(l => l.sale_id).filter(Boolean))];
      
      if (saleIds.length === 0) {
        setSales([]);
        setLoadingSales(false);
        return;
      }

      // Fetch those sales
      const { data, error } = await supabase
        .from('interencheres_sales')
        .select('id, title, sale_date')
        .in('id', saleIds)
        .order('sale_date', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching sales:', error);
      } else {
        setSales(data || []);
      }
      setLoadingSales(false);
    };

    fetchSalesWithAuctionedLots();
  }, []);

  // Fetch lots when sale is selected
  useEffect(() => {
    if (!selectedSaleId) {
      setLots([]);
      setSelectedLotId('');
      setSelectedLot(null);
      return;
    }

    const fetchLots = async () => {
      setLoadingLots(true);
      const { data, error } = await supabase
        .from('interencheres_lots')
        .select('id, lot_number, title, adjudication_price')
        .eq('sale_id', selectedSaleId)
        .not('adjudication_price', 'is', null)
        .order('lot_number', { ascending: true });

      if (error) {
        console.error('Error fetching lots:', error);
      } else {
        setLots(data || []);
      }
      setLoadingLots(false);
    };

    fetchLots();
  }, [selectedSaleId]);

  // Update selected lot details
  useEffect(() => {
    if (selectedLotId) {
      const lot = lots.find(l => l.id === selectedLotId);
      setSelectedLot(lot || null);
    } else {
      setSelectedLot(null);
    }
  }, [selectedLotId, lots]);

  const calculatedFees = selectedLot?.adjudication_price 
    ? Math.round(selectedLot.adjudication_price * FEES_RATE) 
    : 0;
  const totalTTC = selectedLot?.adjudication_price 
    ? selectedLot.adjudication_price + calculatedFees 
    : 0;

  const getCurrentStepIndex = () => STEPS_ORDER.indexOf(step);
  
  const goToNextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEPS_ORDER.length - 1) {
      setStep(STEPS_ORDER[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setStep(STEPS_ORDER[currentIndex - 1]);
    } else {
      setStep('choice');
    }
  };

  const validateIdentity = () => {
    if (!lastName.trim() || !firstName.trim()) {
      toast.error('Veuillez renseigner votre nom et prénom');
      return false;
    }
    return true;
  };

  const validateSaleLot = () => {
    if (!selectedSaleId || !selectedLotId) {
      toast.error('Veuillez sélectionner une vente et un lot');
      return false;
    }
    return true;
  };

  const validateBordereau = () => {
    if (!bordereauNumber.trim()) {
      toast.error('Veuillez renseigner le numéro de bordereau');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    switch (step) {
      case 'identity':
        if (validateIdentity()) goToNextStep();
        break;
      case 'sale-lot':
        if (validateSaleLot()) goToNextStep();
        break;
      case 'confirm-price':
        goToNextStep();
        break;
      case 'bordereau':
        if (validateBordereau()) goToNextStep();
        break;
      default:
        goToNextStep();
    }
  };

  const handleProceedToBank = () => {
    setShowDemoDialog(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  // If user is logged in, they'll be redirected
  if (user) {
    return null;
  }

  // Progress indicator for steps
  const StepIndicator = () => {
    if (step === 'choice') return null;
    
    const currentIndex = getCurrentStepIndex();
    const stepLabels = ['Identité', 'Vente', 'Prix', 'Bordereau', 'Paiement'];
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {STEPS_ORDER.map((s, index) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                ${index < currentIndex ? 'bg-green-500 text-white' : ''}
                ${index === currentIndex ? 'bg-brand-gold text-white' : ''}
                ${index > currentIndex ? 'bg-muted text-muted-foreground' : ''}
              `}>
                {index < currentIndex ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              {index < STEPS_ORDER.length - 1 && (
                <div className={`w-8 h-0.5 ${index < currentIndex ? 'bg-green-500' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between max-w-md mx-auto mt-2">
          {stepLabels.map((label, index) => (
            <span key={label} className={`text-[10px] ${index === currentIndex ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-32 pb-12 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-gold/20 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-brand-gold" />
          </div>
          <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">
            Régler votre achat
          </h1>
          <p className="text-muted-foreground">
            Réglez vos adjudications en ligne de manière sécurisée
          </p>
        </div>

        <StepIndicator />

        {/* Step: Choice */}
        {step === 'choice' && (
          <div className="space-y-6">
            {/* Option 1: Create account */}
            <div className="bg-gradient-to-br from-brand-gold/10 to-amber-500/5 border border-brand-gold/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-gold/20 rounded-lg flex-shrink-0">
                  <UserPlus className="w-6 h-6 text-brand-gold" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Créer mon compte
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Profitez de nombreux avantages en créant votre compte gratuit :
                  </p>
                  
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Historique complet de vos achats et bordereaux</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-foreground">
                      <Bell className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Alertes personnalisées sur les lots qui vous intéressent</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-foreground">
                      <Heart className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Mémorisation de vos lots favoris</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-foreground">
                      <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Ordres d'achat et enchères téléphoniques simplifiés</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-foreground">
                      <Calendar className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Prise de rendez-vous d'enlèvement en ligne</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-foreground">
                      <Sparkles className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Recommandations personnalisées selon vos goûts</span>
                    </li>
                  </ul>
                  
                  <Button asChild className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white">
                    <Link to="/auth?redirect=/compte/paiement">
                      Créer mon compte gratuitement
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-border" />
              <span className="text-sm text-muted-foreground">ou</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* Option 2: Pay directly */}
            <div className="bg-muted/30 border border-border/50 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-muted rounded-lg flex-shrink-0">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Régler sans créer de compte
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Vous avez votre bordereau d'adjudication ? Réglez directement en ligne.
                  </p>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setStep('identity')}
                  >
                    Régler mon achat
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Already have account */}
            <p className="text-center text-sm text-muted-foreground">
              Vous avez déjà un compte ?{' '}
              <Link to="/auth?redirect=/compte/paiement" className="text-brand-gold hover:underline">
                Connectez-vous
              </Link>
            </p>
          </div>
        )}

        {/* Step: Identity */}
        {step === 'identity' && (
          <div className="space-y-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToPreviousStep}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Retour
            </Button>

            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-brand-gold" />
                Vos coordonnées
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Votre nom"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Votre prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Pour recevoir la confirmation de paiement
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-background"
                />
              </div>

              <Button 
                className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white"
                onClick={handleNextStep}
              >
                Continuer
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Sale & Lot selection */}
        {step === 'sale-lot' && (
          <div className="space-y-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToPreviousStep}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Retour
            </Button>

            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-gold" />
                Votre achat
              </h2>

              <p className="text-sm text-muted-foreground">
                Sélectionnez la vente à laquelle vous avez participé, puis le lot que vous avez remporté.
              </p>

              {/* Sale selection */}
              <div className="space-y-2">
                <Label htmlFor="sale">Vente *</Label>
                <Select 
                  value={selectedSaleId} 
                  onValueChange={(value) => {
                    setSelectedSaleId(value);
                    setSelectedLotId('');
                  }}
                >
                  <SelectTrigger id="sale" className="bg-background">
                    <SelectValue placeholder="Sélectionnez la vente" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {loadingSales ? (
                      <SelectItem value="_loading" disabled>Chargement...</SelectItem>
                    ) : sales.length === 0 ? (
                      <SelectItem value="_empty" disabled>Aucune vente disponible</SelectItem>
                    ) : (
                      sales.map((sale) => (
                        <SelectItem key={sale.id} value={sale.id}>
                          {sale.sale_date 
                            ? `${format(new Date(sale.sale_date), 'd MMM yyyy', { locale: fr })} — ${sale.title}`
                            : sale.title
                          }
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Lot selection */}
              <div className="space-y-2">
                <Label htmlFor="lot">Lot *</Label>
                <Select 
                  value={selectedLotId} 
                  onValueChange={setSelectedLotId}
                  disabled={!selectedSaleId}
                >
                  <SelectTrigger id="lot" className="bg-background">
                    <SelectValue placeholder={selectedSaleId ? "Sélectionnez le lot" : "Sélectionnez d'abord une vente"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50 max-h-60">
                    {loadingLots ? (
                      <SelectItem value="_loading" disabled>Chargement...</SelectItem>
                    ) : lots.length === 0 ? (
                      <SelectItem value="_empty" disabled>Aucun lot adjugé dans cette vente</SelectItem>
                    ) : (
                      lots.map((lot) => (
                        <SelectItem key={lot.id} value={lot.id}>
                          Lot n°{lot.lot_number} - {lot.title.substring(0, 50)}{lot.title.length > 50 ? '...' : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white"
                onClick={handleNextStep}
                disabled={!selectedSaleId || !selectedLotId}
              >
                Continuer
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirm price */}
        {step === 'confirm-price' && selectedLot && (
          <div className="space-y-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToPreviousStep}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Retour
            </Button>

            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Euro className="w-5 h-5 text-brand-gold" />
                Montant à régler
              </h2>

              {/* Lot recap */}
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Lot n°{selectedLot.lot_number}</p>
                <p className="font-medium text-foreground">{selectedLot.title}</p>
              </div>

              {/* Price breakdown */}
              <div className="bg-gradient-to-br from-brand-gold/10 to-amber-500/5 border border-brand-gold/30 rounded-lg p-4 space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix d'adjudication (hors frais)</span>
                    <span className="text-foreground font-medium">
                      {selectedLot.adjudication_price?.toLocaleString('fr-FR')} €
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frais acheteur (~25%)</span>
                    <span className="text-foreground font-medium">
                      {calculatedFees.toLocaleString('fr-FR')} €
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-foreground font-semibold">Total estimé TTC</span>
                      <span className="text-2xl font-bold text-brand-gold">
                        {totalTTC.toLocaleString('fr-FR')} €
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                Le montant exact des frais figure sur votre bordereau d'adjudication.
              </p>

              <Button 
                className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white"
                onClick={handleNextStep}
              >
                Je valide ce montant
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Bordereau number */}
        {step === 'bordereau' && (
          <div className="space-y-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToPreviousStep}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Retour
            </Button>

            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-gold" />
                Numéro de bordereau
              </h2>

              <p className="text-sm text-muted-foreground">
                Vous avez reçu par email votre bordereau d'adjudication après la vente. 
                Renseignez son numéro pour finaliser le paiement.
              </p>

              <div className="space-y-2">
                <Label htmlFor="bordereau">N° du bordereau *</Label>
                <Input
                  id="bordereau"
                  type="text"
                  placeholder="Ex: 2025-001234"
                  value={bordereauNumber}
                  onChange={(e) => setBordereauNumber(e.target.value)}
                  className="bg-background text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Le numéro figure en haut de votre bordereau d'adjudication.
                </p>
              </div>

              <Button 
                className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white"
                onClick={handleNextStep}
                disabled={!bordereauNumber.trim()}
              >
                Continuer vers le paiement
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Payment */}
        {step === 'payment' && selectedLot && (
          <div className="space-y-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToPreviousStep}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Retour
            </Button>

            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-gold" />
                Récapitulatif & Paiement
              </h2>

              {/* Full recap */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Acheteur</span>
                  <span className="text-foreground font-medium">{firstName} {lastName}</span>
                </div>
                {email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground">{email}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lot</span>
                    <span className="text-foreground">n°{selectedLot.lot_number}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bordereau</span>
                  <span className="text-foreground font-medium">{bordereauNumber}</span>
                </div>
                <div className="border-t border-border pt-2">
                  <div className="flex justify-between">
                    <span className="text-foreground font-semibold">Total à régler</span>
                    <span className="text-xl font-bold text-brand-gold">
                      {totalTTC.toLocaleString('fr-FR')} €
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white text-lg py-6"
                onClick={handleProceedToBank}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Payer {totalTTC.toLocaleString('fr-FR')} €
              </Button>

              {/* Alternative contact */}
              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Vous préférez régler autrement ?
                </p>
                <Button variant="outline" asChild>
                  <a href={`mailto:contact@hdv-ajaccio.fr?subject=Paiement%20bordereau%20${bordereauNumber}`}>
                    Contacter l'étude
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

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
                <a href={`mailto:contact@hdv-ajaccio.fr?subject=Règlement%20bordereau%20${bordereauNumber}%20-%20${firstName}%20${lastName}`}>
                  Contacter par email
                </a>
              </Button>
              <Button variant="ghost" onClick={() => setShowDemoDialog(false)}>
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
};

export default Paiement;

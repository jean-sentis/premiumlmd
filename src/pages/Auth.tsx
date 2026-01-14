import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, EyeOff, Mail, Lock, User, Phone, Check, Circle, ChevronRight, ChevronLeft,
  Bell, Heart, Gavel, CreditCard, Sparkles, Clock, Shield, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Étapes d'inscription (sans l'étape services qui est une page séparée)
// Étape 0 = intro avantages (non numérotée dans la sidebar)
// Étapes 1-5 = le vrai parcours numéroté
const SIGNUP_STEPS = [
  { id: 'avantages', label: 'Mon Espace', description: 'Découvrez les avantages' },
  { id: 'protection', label: 'Protection', description: 'Mes données protégées' },
  { id: 'identite', label: 'Identité', description: 'Mon identité' },
  { id: 'contact', label: 'Contact', description: 'Téléphone et email' },
  { id: 'adresse', label: 'Adresse', description: 'Mon adresse' },
  { id: 'mot-de-passe', label: 'Mot de passe', description: 'Sécuriser mon compte' },
];

// Types de consentements RGPD
const CONSENT_TYPES = [
  {
    id: 'data_processing',
    title: 'Traitement de vos données',
    description: `J'accepte que des données à caractère personnel me concernant soient collectées et utilisées aux seules fins des services proposés par la maison de ventes.`,
    details: [
      'Données collectées : nom, adresse, email, téléphone',
      'Transfert hors UE : Non',
      'Décision automatisée : Non',
    ],
  },
  {
    id: 'marketing',
    title: 'Communications personnalisées',
    description: `J'accepte de recevoir des informations sur les ventes et actualités correspondant à mes centres d'intérêt. Je pourrai me désinscrire à tout moment.`,
    details: [
      'Données utilisées : email, préférences',
      'Transfert hors UE : Non',
      'Fréquence : selon vos préférences',
    ],
  },
];

// Avantages du compte structurés
const AVANTAGES = [
  {
    category: 'S\'informer',
    items: [
      { 
        icon: Bell, 
        title: 'Alertes personnalisées', 
        description: 'Enregistrez des mots-clés et centres d\'intérêt. Nous vous préviendrons par email ou SMS dès qu\'un lot correspondant apparaît dans nos ventes.' 
      },
      { 
        icon: Mail, 
        title: 'Newsletter sur mesure', 
        description: 'Enregistrez les spécialités qui vous intéressent : bijoux, art moderne, vins... Uniquement ce qui vous intéresse sera dans notre newsletter : ventes, actualités.' 
      },
      { 
        icon: Heart, 
        title: 'Vos lots mémorisés', 
        description: 'Créez votre première sélection comme un moodboard personnel. Conservez vos coups de cœur et partagez-les en quelques clics avec qui vous voulez.' 
      },
    ]
  },
  {
    category: 'Agir',
    items: [
      { 
        icon: Gavel, 
        title: 'Ordres d\'achat secrets', 
        description: 'Indiquez votre enchère maximum en toute confidentialité. Le commissaire-priseur enchérira pour vous pendant la vente, sans jamais révéler votre limite.' 
      },
      { 
        icon: Phone, 
        title: 'Enchères par téléphone', 
        description: 'Nous vous appelons pendant la vente. Un collaborateur enchérit en direct pour vous, selon vos instructions, comme si vous étiez dans la salle.' 
      },
      { 
        icon: CreditCard, 
        title: 'Paiement en ligne', 
        description: 'Réglez vos achats directement depuis votre espace personnel, en toute sécurité, sans vous déplacer.' 
      },
      { 
        icon: Clock, 
        title: 'Retrait sur rendez-vous', 
        description: 'Planifiez le retrait de vos lots à l\'heure qui vous convient. Plus d\'attente, nous vous accueillons à l\'horaire choisi.' 
      },
    ]
  },
  {
    category: 'Privilège',
    items: [
      { 
        icon: Sparkles, 
        title: 'Lia, votre assistante artificielle', 
        description: 'Comme les concierges des palaces, Lia n\'a qu\'une ambition : connaître vos goûts, vos centres d\'intérêt. Et pour vous proposer les lots que vous aimerez dans nos ventes, Lia les encadre en vert dans le catalogue.' 
      },
      { 
        icon: Clock, 
        title: 'Accès anticipé aux After-Sales', 
        description: 'Appelées aussi ventes privées, ce sont des ventes à prix fixe de lots remis en vente après vacation. En tant que membre, vous y avez accès 48h avant tout le monde pour dénicher les meilleures affaires.' 
      },
    ]
  }
];

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Adresse email invalide" }),
  password: z.string().min(6, { message: "Mot de passe minimum 6 caractères" }),
});

// Indicateurs de force du mot de passe
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const checks = useMemo(() => [
    { label: 'Chiffre', valid: /[0-9]/.test(password) },
    { label: 'Majuscule', valid: /[A-Z]/.test(password) },
    { label: 'Caractère spécial', valid: /[^a-zA-Z0-9]/.test(password) },
    { label: '8 caractères', valid: password.length >= 8 },
  ], [password]);

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
      {checks.map((check) => (
        <div key={check.label} className="flex items-center gap-2 text-xs">
          <Circle className={cn(
            "w-2.5 h-2.5 transition-colors",
            check.valid ? "fill-green-500 text-green-500" : "fill-muted text-muted-foreground"
          )} />
          <span className={cn(
            "transition-colors",
            check.valid ? "text-green-600" : "text-muted-foreground"
          )}>
            {check.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// Progress Steps Sidebar
const StepsSidebar = ({ currentStep, steps }: { currentStep: number; steps: typeof SIGNUP_STEPS }) => {
  // Si currentStep === 6, tous les steps sont complétés (écran de confirmation)
  const allCompleted = currentStep === 6;
  
  // On n'affiche que les étapes 1, 2, 3 (pas l'étape 0 qui est juste informative)
  const displayedSteps = steps.slice(1);
  
  return (
    <div className="bg-slate-900 text-white p-8 pt-16 min-h-[540px] flex flex-col">
      {/* Titre qui devient vert quand tout est complété */}
      <h2 className={cn(
        "font-serif text-xl mb-8 transition-colors",
        allCompleted ? "text-green-400" : "text-white"
      )}>
        {allCompleted ? (
          <span className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            Créer mon compte
          </span>
        ) : (
          'Créer mon compte'
        )}
      </h2>
      <div className="space-y-2">
        {displayedSteps.map((step, displayIndex) => {
          const actualIndex = displayIndex + 1; // Index réel dans SIGNUP_STEPS (1, 2, 3)
          const isActive = !allCompleted && actualIndex === currentStep;
          const isStepCompleted = actualIndex < currentStep || allCompleted;
          const stepNumber = actualIndex; // 1, 2, 3
          
          return (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg transition-all",
                isActive && "bg-white/10"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5",
                isStepCompleted ? "bg-green-500 text-white" : 
                isActive ? "border-2 border-white" : "border border-white/40"
              )}>
                {stepNumber}
              </div>
              <div>
                <p className={cn(
                  "font-medium text-sm uppercase tracking-wide",
                  isActive ? "text-white" : 
                  isStepCompleted ? "text-white/80" : "text-white/50"
                )}>
                  {step.label}
                </p>
                {isActive && (
                  <p className="text-white/60 text-sm mt-1">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Bouton "Paramétrer mes services" visible quand tout est complété */}
      {allCompleted && (
        <div className="mt-8 pt-6 border-t border-white/20">
          <p className="text-white/60 text-sm mb-4">Prochaine étape</p>
          <div className="flex items-center gap-3 text-brand-gold">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Paramétrer mes services</span>
          </div>
        </div>
      )}
    </div>
  );
};

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('France');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [contactPreference, setContactPreference] = useState<'email' | 'sms'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptNewsletter, setAcceptNewsletter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consents, setConsents] = useState<Record<string, 'accepted' | 'refused' | null>>({
    data_processing: null,
    marketing: null,
  });

  const returnTo = (location.state as { returnTo?: string })?.returnTo || '/compte';

  useEffect(() => {
    if (user && !loading) {
      navigate(returnTo, { replace: true });
    }
  }, [user, loading, navigate, returnTo]);

  // Scroll automatique vers le haut à chaque changement d'étape
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Autocomplétion de la ville via le code postal (API geo.api.gouv.fr)
  useEffect(() => {
    const fetchCities = async () => {
      if (postalCode.length === 5 && /^\d{5}$/.test(postalCode)) {
        try {
          const response = await fetch(
            `https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom&limit=10`
          );
          if (response.ok) {
            const data = await response.json();
            const cities = data.map((c: { nom: string }) => c.nom);
            setCitySuggestions(cities);
            if (cities.length === 1) {
              // Si une seule ville, la sélectionner automatiquement
              setCity(cities[0]);
              setShowCitySuggestions(false);
            } else if (cities.length > 1) {
              setShowCitySuggestions(true);
            }
          }
        } catch (error) {
          console.error('Erreur API geo:', error);
        }
      } else {
        setCitySuggestions([]);
        setShowCitySuggestions(false);
      }
    };
    fetchCities();
  }, [postalCode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach(err => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({ title: "Erreur", description: "Email ou mot de passe incorrect", variant: "destructive" });
        } else {
          toast({ title: "Erreur", description: error.message, variant: "destructive" });
        }
      } else {
        toast({ title: "Bienvenue", description: "Connexion réussie" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < SIGNUP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSignupComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate final step - l'email a déjà été validé à l'étape 3
    if (password.length < 8 || !/[0-9]/.test(password) || !/[A-Z]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
      setErrors({ password: "Le mot de passe ne respecte pas les critères" });
      return;
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Les mots de passe ne correspondent pas" });
      return;
    }
    if (!acceptTerms) {
      setErrors({ acceptTerms: "Vous devez accepter les conditions" });
      return;
    }

    setSubmitting(true);

    try {
      const displayName = [firstName, lastName].filter(Boolean).join(' ') || undefined;
      const { error } = await signUp(email, password, {
        displayName,
        phone: phone || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        address: address || undefined,
        city: city || undefined,
        postalCode: postalCode || undefined,
        country: country || undefined,
        contactPreference,
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast({ title: "Erreur", description: "Cette adresse email est déjà utilisée", variant: "destructive" });
        } else {
          toast({ title: "Erreur", description: error.message, variant: "destructive" });
        }
      } else {
        toast({ title: "Compte créé", description: "Bienvenue ! Configurez maintenant vos services." });
        // Passer à l'étape de confirmation (étape 6)
        setCurrentStep(6);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-pulse text-muted-foreground">Chargement...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isLogin ? 'Connexion' : 'Créer un compte'} | Douze pages & associés</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <div style={{ height: 'var(--header-sticky-top, var(--header-main-height, 145px))' }}></div>

        <main className="max-w-5xl mx-auto px-4 py-12">
          {/* Barre de progression - visible uniquement pendant l'inscription (étapes 1-5) */}
          {!isLogin && currentStep > 0 && currentStep < 6 && (
            <div className="mb-6">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-gold transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${(currentStep / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
            <div className="flex flex-col lg:flex-row">
              {/* Sidebar pour inscription - masquée à l'étape Avantages (step 0) */}
              {!isLogin && currentStep > 0 && (
                <div className="lg:w-72 flex-shrink-0">
                  <StepsSidebar currentStep={currentStep} steps={SIGNUP_STEPS} />
                </div>
              )}

              {/* Formulaire */}
              <div className="flex-1 p-8 lg:p-12">
                {isLogin ? (
                  // === FORMULAIRE DE CONNEXION ===
                  <div className="max-w-md mx-auto">
                    <h1 className="text-foreground mb-2">
                      Connexion
                    </h1>
                    <p className="text-sm text-muted-foreground mb-8">
                      Accédez à votre espace personnel
                    </p>

                    <form onSubmit={handleLogin} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs uppercase tracking-wide text-muted-foreground">
                          Adresse e-mail
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="example@gmail.com"
                          className="h-12"
                          required
                        />
                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-xs uppercase tracking-wide text-muted-foreground">
                          Mot de passe
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Votre mot de passe"
                            className="h-12 pr-12"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white"
                        disabled={submitting}
                      >
                        {submitting ? 'Connexion...' : 'Se connecter'}
                      </Button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-4">
                        Pas encore de compte ?
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(false);
                          setCurrentStep(0);
                          setErrors({});
                        }}
                        className="group w-full text-left p-4 rounded-lg border border-border hover:border-brand-gold/50 hover:bg-brand-gold/5 transition-all duration-200"
                      >
                        <span className="text-base font-medium text-foreground group-hover:text-brand-gold transition-colors">
                          Découvrez les avantages de votre espace personnel
                        </span>
                        <p className="text-sm text-muted-foreground mt-1">
                          Alertes, ordres d'achat, enchères téléphone, accès privilégié aux After-Sales…
                        </p>
                      </button>
                    </div>
                  </div>
                ) : (
                  // === FORMULAIRE D'INSCRIPTION ===
                  <>
                    {currentStep === 0 && (
                      // PAGE INTRO: Avantages du compte (non numérotée)
                      <div className="max-w-xl">
                        <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">
                          Un compte, mille possibilités
                        </h1>
                        <p className="text-muted-foreground mb-8">
                          Votre compte est un outil pratique qui vous facilite la vie et enrichit votre expérience.
                        </p>

                        <div className="space-y-8">
                          {AVANTAGES.map((section) => (
                            <div key={section.category}>
                              <h3 className="text-xs font-medium uppercase tracking-widest text-brand-gold mb-4">
                                {section.category}
                              </h3>
                              <div className="space-y-4">
                                {section.items.map((item) => (
                                  <div key={item.title} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                      <item.icon className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-foreground">{item.title}</h4>
                                      <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button 
                          onClick={handleNextStep}
                          className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white mt-10"
                        >
                          Créer mon compte
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    )}

                    {currentStep === 1 && (
                      // ÉTAPE 1: Consentements et engagements (Protection)
                      <div className="max-w-xl">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-brand-gold" />
                          </div>
                          <h1 className="font-serif text-2xl font-semibold text-foreground">
                            Vos données sont précieuses
                          </h1>
                        </div>
                        
                        <div className="bg-muted/30 border border-border rounded-lg p-5 mb-8">
                          <p className="text-muted-foreground leading-relaxed">
                            Nous nous engageons à protéger vos informations personnelles qui n'appartiennent qu'à vous. Vous gardez le contrôle total et pouvez modifier vos choix à tout moment.
                          </p>
                        </div>

                        <h2 className="text-xs font-medium uppercase tracking-widest text-brand-gold mb-6">
                          Vos autorisations
                        </h2>

                        <div className="space-y-6">
                          {CONSENT_TYPES.map((consent) => (
                            <div key={consent.id} className="border border-border rounded-lg p-5">
                              <h3 className="font-medium text-foreground mb-2">{consent.title}</h3>
                              <p className="text-sm text-muted-foreground mb-4">{consent.description}</p>
                              
                              <ul className="text-xs text-muted-foreground space-y-1 mb-5">
                                {consent.details.map((detail, i) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                                    {detail}
                                  </li>
                                ))}
                              </ul>

                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => setConsents(prev => ({ ...prev, [consent.id]: 'accepted' }))}
                                  className={cn(
                                    "flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all border",
                                    consents[consent.id] === 'accepted'
                                      ? "bg-brand-gold text-white border-brand-gold"
                                      : "bg-background text-foreground border-border hover:border-brand-gold/50"
                                  )}
                                >
                                  J'accepte
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConsents(prev => ({ ...prev, [consent.id]: 'refused' }))}
                                  className={cn(
                                    "flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all border",
                                    consents[consent.id] === 'refused'
                                      ? "bg-muted text-foreground border-muted"
                                      : "bg-background text-muted-foreground border-border hover:border-muted-foreground/50"
                                  )}
                                >
                                  Je refuse
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {errors.consents && (
                          <p className="text-xs text-destructive mt-4">{errors.consents}</p>
                        )}

                        <div className="flex gap-3 mt-10">
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={handlePrevStep}
                            className="flex-1 h-12"
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Retour
                          </Button>
                          <Button 
                            onClick={() => {
                              // Vérifier que le consentement obligatoire est accepté
                              if (consents.data_processing !== 'accepted') {
                                setErrors({ consents: "Le consentement au traitement des données est nécessaire pour créer un compte" });
                                return;
                              }
                              setErrors({});
                              handleNextStep();
                            }}
                            className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white"
                          >
                            Continuer
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && (
                      // ÉTAPE 2: Identité (prénom, nom)
                      <div className="max-w-md">
                        <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">
                          Mon identité
                        </h1>
                        <p className="text-muted-foreground mb-8">
                          Ces informations permettent de vous identifier.
                        </p>

                        <div className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-xs uppercase tracking-wide text-muted-foreground">
                              Prénom
                            </Label>
                            <Input
                              id="firstName"
                              type="text"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="Jean"
                              className="h-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-xs uppercase tracking-wide text-muted-foreground">
                              Nom
                            </Label>
                            <Input
                              id="lastName"
                              type="text"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Dupont"
                              className="h-12"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 mt-10">
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={handlePrevStep}
                            className="flex-1 h-12"
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Retour
                          </Button>
                          <Button 
                            onClick={handleNextStep}
                            className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white"
                          >
                            Continuer
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      // ÉTAPE 3: Contact (téléphone, email)
                      <div className="max-w-md">
                        <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">
                          Mes coordonnées
                        </h1>
                        <p className="text-muted-foreground mb-8">
                          Pour vous contacter et envoyer les informations importantes.
                        </p>

                        <div className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs uppercase tracking-wide text-muted-foreground">
                              Téléphone <span className="text-muted-foreground normal-case">(pour les enchères téléphone)</span>
                            </Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+33 6 12 34 56 78"
                              className="h-12"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-email-info" className="text-xs uppercase tracking-wide text-muted-foreground">
                              Adresse e-mail
                            </Label>
                            <Input
                              id="signup-email-info"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="example@gmail.com"
                              className="h-12"
                              required
                            />
                            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                          </div>

                          <div className="space-y-3 pt-4">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                              Comment préférez-vous être contacté ?
                            </Label>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                onClick={() => setContactPreference('email')}
                                className={cn(
                                  "flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all border",
                                  contactPreference === 'email'
                                    ? "bg-brand-gold text-white border-brand-gold"
                                    : "bg-background text-foreground border-border hover:border-brand-gold/50"
                                )}
                              >
                                Par email
                              </button>
                              <button
                                type="button"
                                onClick={() => setContactPreference('sms')}
                                className={cn(
                                  "flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all border",
                                  contactPreference === 'sms'
                                    ? "bg-brand-gold text-white border-brand-gold"
                                    : "bg-background text-foreground border-border hover:border-brand-gold/50"
                                )}
                              >
                                Par SMS
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-10">
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={handlePrevStep}
                            className="flex-1 h-12"
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Retour
                          </Button>
                          <Button 
                            onClick={() => {
                              // Valider l'email avant de continuer
                              if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                                setErrors({ email: "Adresse email invalide" });
                                return;
                              }
                              setErrors({});
                              handleNextStep();
                            }}
                            className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white"
                          >
                            Continuer
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {currentStep === 4 && (
                      // ÉTAPE 4: Adresse
                      <div className="max-w-md">
                        <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">
                          Mon adresse
                        </h1>
                        <p className="text-muted-foreground mb-8">
                          Pour le retrait de vos achats et l'envoi de documents.
                        </p>

                        <div className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="address" className="text-xs uppercase tracking-wide text-muted-foreground">
                              Adresse
                            </Label>
                            <Input
                              id="address"
                              type="text"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder="12 rue des Lilas"
                              className="h-12"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="postalCode" className="text-xs uppercase tracking-wide text-muted-foreground">
                                Code postal
                              </Label>
                              <Input
                                id="postalCode"
                                type="text"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                                placeholder="20000"
                                className="h-12"
                              />
                            </div>
                            <div className="space-y-2 relative">
                              <Label htmlFor="city" className="text-xs uppercase tracking-wide text-muted-foreground">
                                Ville
                              </Label>
                              <Input
                                id="city"
                                type="text"
                                value={city}
                                onChange={(e) => {
                                  setCity(e.target.value);
                                  setShowCitySuggestions(false);
                                }}
                                placeholder="Ajaccio"
                                className="h-12"
                              />
                              {/* Suggestions de villes */}
                              {showCitySuggestions && citySuggestions.length > 1 && (
                                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                  {citySuggestions.map((suggestion) => (
                                    <button
                                      key={suggestion}
                                      type="button"
                                      onClick={() => {
                                        setCity(suggestion);
                                        setShowCitySuggestions(false);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="country" className="text-xs uppercase tracking-wide text-muted-foreground">
                              Pays
                            </Label>
                            <Input
                              id="country"
                              type="text"
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              placeholder="France"
                              className="h-12"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 mt-10">
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={handlePrevStep}
                            className="flex-1 h-12"
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Retour
                          </Button>
                          <Button 
                            onClick={handleNextStep}
                            className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white"
                          >
                            Continuer
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {currentStep === 5 && (
      // ÉTAPE 5: Mot de passe uniquement
                      <div className="max-w-md">
                        <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">
                          Votre mot de passe
                        </h1>
                        <p className="text-muted-foreground mb-8">
                          Choisissez un mot de passe sécurisé pour protéger votre compte.
                        </p>

                        <form onSubmit={handleSignupComplete} className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="signup-password" className="text-xs uppercase tracking-wide text-muted-foreground">
                              Mot de passe
                            </Label>
                            <div className="relative">
                              <Input
                                id="signup-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Votre mot de passe"
                                className="h-12 pr-12"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            <PasswordStrengthIndicator password={password} />
                            {errors.password && <p className="text-xs text-destructive mt-2">{errors.password}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="text-xs uppercase tracking-wide text-muted-foreground">
                              Confirmation du mot de passe
                            </Label>
                            <div className="relative">
                              <Input
                                id="confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirmez votre mot de passe"
                                className="h-12 pr-12"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                          </div>

                          <div className="space-y-4 pt-4">
                            <div className="flex items-start gap-3">
                              <Checkbox 
                                id="terms" 
                                checked={acceptTerms}
                                onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                              />
                              <div className="flex items-center gap-3 flex-wrap">
                                <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                                  J'accepte les conditions d'utilisation
                                </label>
                                <Link 
                                  to="/mentions-legales" 
                                  target="_blank"
                                  className="text-xs text-brand-gold hover:underline font-medium"
                                >
                                  Lire les CGU
                                </Link>
                              </div>
                            </div>
                            {errors.acceptTerms && <p className="text-xs text-destructive">{errors.acceptTerms}</p>}
                          </div>

                          <div className="flex gap-3 mt-6">
                            <Button 
                              type="button"
                              variant="outline"
                              onClick={handlePrevStep}
                              className="flex-1 h-12"
                            >
                              <ChevronLeft className="w-4 h-4 mr-2" />
                              Retour
                            </Button>
                            <Button 
                              type="submit" 
                              className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white"
                              disabled={submitting}
                            >
                              {submitting ? 'Création...' : 'Créer mon compte'}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {currentStep === 6 && (
                      // ÉCRAN DE CONFIRMATION - Compte créé
                      <div className="max-w-md text-center">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                          <Check className="w-10 h-10 text-green-600" />
                        </div>
                        
                        <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">
                          Votre compte est créé !
                        </h1>
                        <p className="text-muted-foreground mb-10">
                          Bienvenue dans votre espace personnel. Vous pouvez maintenant configurer vos services pour profiter pleinement de toutes les fonctionnalités.
                        </p>

                        <div className="space-y-4">
                          <Button 
                            onClick={() => navigate('/compte/services')}
                            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white"
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Paramétrer mes services
                          </Button>
                          
                          <Button 
                            variant="outline"
                            onClick={() => navigate('/compte')}
                            className="w-full h-12"
                          >
                            Configurer plus tard
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="mt-8 max-w-md">
                      <p className="text-sm text-muted-foreground">
                        Déjà un compte ?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setIsLogin(true);
                            setCurrentStep(0);
                            setErrors({});
                          }}
                          className="text-brand-gold hover:underline font-medium"
                        >
                          Se connecter
                        </button>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Auth;

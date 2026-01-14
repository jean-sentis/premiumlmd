import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mail, Check, ArrowRight } from 'lucide-react';
import OnboardingProgress from '@/components/compte/OnboardingProgress';

// Liste triée alphabétiquement, sans doublons
const SPECIALTIES = [
  { id: 'affiches', label: 'Affiches' },
  { id: 'argenterie', label: 'Argenterie' },
  { id: 'art-asie', label: "Art d'Asie" },
  { id: 'art-deco-design', label: 'Art Déco - Design' },
  { id: 'art-moderne', label: 'Art Moderne' },
  { id: 'art-nouveau', label: 'Art Nouveau' },
  { id: 'arts-orient-inde', label: "Arts d'Orient & de l'Inde" },
  { id: 'ateliers-artistes', label: "Ateliers d'artistes" },
  { id: 'automobiles-collection', label: 'Automobiles de collection' },
  { id: 'bd', label: 'BD' },
  { id: 'ceramiques', label: 'Céramiques' },
  { id: 'collections', label: 'Collections' },
  { id: 'culture-pop', label: 'Culture Pop' },
  { id: 'estampes', label: 'Estampes de collection' },
  { id: 'haute-couture-mode', label: 'Haute Couture / Mode' },
  { id: 'horlogerie', label: 'Horlogerie - Montres' },
  { id: 'instruments-musique', label: 'Instruments de musique' },
  { id: 'joaillerie', label: 'Joaillerie' },
  { id: 'livres-autographes', label: 'Livres & Autographes' },
  { id: 'marine-voyage', label: 'Marine et Voyage' },
  { id: 'militaria', label: 'Militaria' },
  { id: 'mobilier-objets-art', label: "Mobilier & Objets d'art" },
  { id: 'numismatique', label: 'Numismatique' },
  { id: 'orientalisme', label: 'Orientalisme' },
  { id: 'philatelie', label: 'Philatélie' },
  { id: 'photographie', label: 'Photographie' },
  { id: 'tableaux-anciens', label: 'Tableaux anciens' },
  { id: 'ventes-solidarite', label: 'Ventes de Solidarité' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'vins-spiritueux', label: 'Vins et Spiritueux' },
];

const ALL_SPECIALTY_IDS = SPECIALTIES.map(s => s.id);

const Newsletter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Fetch newsletter status
    const { data: profileData } = await supabase
      .from('profiles')
      .select('newsletter_subscribed')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileData) {
      setIsSubscribed(profileData.newsletter_subscribed || false);
    }

    // Fetch user interests
    const { data: interestsData } = await supabase
      .from('user_interests')
      .select('specialty')
      .eq('user_id', user.id);

    if (interestsData) {
      setSelectedSpecialties(interestsData.map(i => i.specialty));
    }

    setLoading(false);
  };

  const toggleSpecialty = (specialtyId: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialtyId)
        ? prev.filter(s => s !== specialtyId)
        : [...prev, specialtyId]
    );
  };

  const toggleAll = () => {
    if (selectedSpecialties.length === ALL_SPECIALTY_IDS.length) {
      setSelectedSpecialties([]);
    } else {
      setSelectedSpecialties([...ALL_SPECIALTY_IDS]);
    }
  };

  const allSelected = selectedSpecialties.length === ALL_SPECIALTY_IDS.length;

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);

    // Update newsletter subscription
    await supabase
      .from('profiles')
      .update({
        newsletter_subscribed: isSubscribed,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    // Update interests - delete all then insert selected
    await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', user.id);

    if (selectedSpecialties.length > 0) {
      await supabase
        .from('user_interests')
        .insert(
          selectedSpecialties.map(specialty => ({
            user_id: user.id,
            specialty,
          }))
        );
    }

    toast({ title: "Préférences enregistrées", description: "Vos choix de newsletter ont été sauvegardés" });
    setSaving(false);
    
    // Rediriger vers "Mes alertes"
    navigate('/compte/alertes');
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <OnboardingProgress currentStep={1} />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
          <Mail className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h1 className="text-foreground">Ma newsletter</h1>
          <p className="text-muted-foreground text-sm">Recevez nos catalogues par email</p>
        </div>
      </div>

      {/* Introduction + Consentement */}
      <div className="bg-muted/30 border border-border rounded-lg p-5 mb-6">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Recevez directement nos catalogues interactifs dans les spécialités qui vous passionnent. 
          Une façon simple et pratique de ne rien manquer de nos prochaines ventes.
        </p>
        <p className="text-sm text-foreground leading-relaxed">
          Nos newsletters ne concerneront <strong>uniquement les spécialités que vous aurez sélectionnées</strong>. 
          Vous pouvez modifier vos choix à tout moment.
        </p>
      </div>

      {/* Spécialités - toujours visible */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <h2 className="font-medium text-base mb-1">Mes centres d'intérêt</h2>
            <p className="text-xs text-muted-foreground">
              Sélectionnez les spécialités pour lesquelles vous souhaitez recevoir les catalogues
            </p>
          </div>

          {/* Toutes les ventes */}
          <button
            onClick={toggleAll}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left w-full ${
              allSelected 
                ? 'border-brand-gold bg-brand-gold/10 text-foreground' 
                : 'border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              allSelected ? 'bg-brand-gold/20' : 'bg-muted'
            }`}>
              <Check className={`w-4 h-4 ${allSelected ? 'text-brand-gold' : ''}`} />
            </div>
            <span className="text-sm font-semibold">Toutes les ventes</span>
            {allSelected && (
              <Check className="w-4 h-4 text-brand-gold ml-auto" />
            )}
          </button>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SPECIALTIES.map((specialty) => {
              const isSelected = selectedSpecialties.includes(specialty.id);
              
              return (
                <button
                  key={specialty.id}
                  onClick={() => toggleSpecialty(specialty.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                    isSelected 
                      ? 'border-[hsl(var(--brand-secondary))] bg-[hsl(var(--brand-secondary)/0.1)] text-foreground' 
                      : 'border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-[hsl(var(--brand-secondary))]' : 'border border-muted-foreground/30'
                  }`}>
                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="text-xs">{specialty.label}</span>
                </button>
              );
            })}
          </div>
      </div>

      {/* Boutons */}
      <div className="mt-6 flex flex-col gap-3">
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto"
        >
          {saving ? 'Enregistrement...' : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Enregistrer et continuer
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
        
        <Button 
          variant="ghost"
          onClick={async () => {
            if (!user) return;
            await supabase
              .from('profiles')
              .update({ newsletter_subscribed: false, updated_at: new Date().toISOString() })
              .eq('user_id', user.id);
            await supabase
              .from('user_interests')
              .delete()
              .eq('user_id', user.id);
            toast({ title: "Newsletter désactivée" });
            navigate('/compte/alertes');
          }}
          className="text-muted-foreground hover:text-foreground w-full sm:w-auto"
        >
          Passer cette étape
        </Button>
      </div>
    </div>
  );
};

export default Newsletter;

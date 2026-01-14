import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Types de consentements RGPD
const CONSENT_TYPES = [
  {
    id: 'data_processing',
    title: 'Consentement au traitement informatique des données',
    description: `J'accepte que des données à caractère personnel me concernant soient collectées et utilisées et/ou transférées dans un pays de l'Union Européenne, aux seules fins des traitements nécessaires ou subséquent au présent contrat.`,
    details: [
      'Type de données collectées : informations nominatives, adresse postale, email, téléphone',
      'Pouvant être transféré hors zone UE : Non',
      'Pouvant entraîner une décision automatisé : Non',
    ],
  },
  {
    id: 'marketing',
    title: 'Consentement au traitement informatique des données',
    description: `J'accepte que mes coordonnées postales ou électroniques fassent l'objet d'une prise de décision automatisée, afin de m'adresser des supports d'information en fonction de l'expression de mes centres d'intérêts. Je pourrai, à tout moment, me désinscrire sans condition de ces abonnements.`,
    details: [
      'Type de données collectées : coordonnées postales ou électroniques',
      'Pouvant être transféré hors zone UE : Non',
      'Pouvant entraîner une décision automatisé : Non',
    ],
  },
];

interface ConsentState {
  [key: string]: 'accepted' | 'refused' | null;
}

const ViePrivee = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consents, setConsents] = useState<ConsentState>({});

  useEffect(() => {
    if (user) {
      fetchConsents();
    }
  }, [user]);

  const fetchConsents = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('user_consents')
      .select('consent_type, is_accepted')
      .eq('user_id', user.id);

    if (data) {
      const consentMap: ConsentState = {};
      data.forEach(d => {
        consentMap[d.consent_type] = d.is_accepted ? 'accepted' : 'refused';
      });
      setConsents(consentMap);
    }
    setLoading(false);
  };

  const handleChange = (consentType: string, value: 'accepted' | 'refused') => {
    setConsents(prev => ({
      ...prev,
      [consentType]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);

    // Upsert all consents
    for (const [consentType, value] of Object.entries(consents)) {
      if (value) {
        const { error } = await supabase
          .from('user_consents')
          .upsert({
            user_id: user.id,
            consent_type: consentType,
            is_accepted: value === 'accepted',
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,consent_type'
          });

        if (error) {
          console.error('Error saving consent:', error);
        }
      }
    }

    toast({ title: "Préférences enregistrées", description: "Vos choix de consentement ont été mis à jour" });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">
        Vie privée
      </h1>
      <h2 className="font-serif text-xl text-foreground mb-8">
        Liste des consentements d'utilisation des données personnelles
      </h2>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-muted/50 border-b border-border px-6 py-4">
          <div className="grid grid-cols-[1fr_100px_100px] gap-4 items-center">
            <span className="font-medium">Type de consentement</span>
            <span className="text-center font-medium">Accepté</span>
            <span className="text-center font-medium">Refusé</span>
          </div>
        </div>

        {/* Consent rows */}
        <div className="divide-y divide-border">
          {CONSENT_TYPES.map((consent) => (
            <div key={consent.id} className="px-6 py-6">
              <div className="grid grid-cols-[1fr_100px_100px] gap-4 items-start">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{consent.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{consent.description}</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {consent.details.map((detail, i) => (
                      <li key={i}>{detail}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex justify-center pt-1">
                  <button
                    onClick={() => handleChange(consent.id, 'accepted')}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-colors",
                      consents[consent.id] === 'accepted'
                        ? "border-brand-gold bg-brand-gold"
                        : "border-muted-foreground hover:border-foreground"
                    )}
                  />
                </div>
                
                <div className="flex justify-center pt-1">
                  <button
                    onClick={() => handleChange(consent.id, 'refused')}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-colors",
                      consents[consent.id] === 'refused'
                        ? "border-destructive bg-destructive"
                        : "border-muted-foreground hover:border-foreground"
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 hover:bg-slate-800 text-white"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );
};

export default ViePrivee;

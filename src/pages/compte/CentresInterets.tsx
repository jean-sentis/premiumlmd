import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// Liste des spécialités disponibles (comme chez Millon)
const SPECIALITES = [
  'AFFICHES',
  'ARCHEOLOGIE',
  'ARGENTERIE',
  'ART ABORIGENE',
  'ART BELGE',
  'ART CONTEMPORAIN',
  'ART D\'ASIE',
  'ART DECO - DESIGN',
  'ART MODERNE',
  'ART NOUVEAU',
  'ART RUSSE',
  'ARTS D\'ORIENT & DE L\'INDE',
  'ARTS PREMIERS',
  'ATELIERS D\'ARTISTES',
  'AUTOMOBILES DE COLLECTION',
  'BANDES DESSINEES',
  'BESTIAIRE',
  'BIJOUX & MONTRES',
  'BOUDOIR DE MADAME',
  'CERAMIQUES ANCIENNES',
  'COLLECTIONS & INVENTAIRES',
  'ESTAMPES',
  'LIVRES ANCIENS',
  'MILITARIA',
  'MOBILIER & OBJETS D\'ART',
  'MODE & TEXTILE',
  'MUSIQUE',
  'NUMISMATIQUE',
  'PHOTOGRAPHIE',
  'SOUVENIRS HISTORIQUES',
  'TABLEAUX ANCIENS',
  'VINS & SPIRITUEUX',
  'VOITURES DE COLLECTION',
];

const CentresInterets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchInterests();
    }
  }, [user]);

  const fetchInterests = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('user_interests')
      .select('specialty')
      .eq('user_id', user.id);

    if (data) {
      setSelectedInterests(new Set(data.map(d => d.specialty)));
    }
    setLoading(false);
  };

  const handleToggle = (specialty: string) => {
    setSelectedInterests(prev => {
      const next = new Set(prev);
      if (next.has(specialty)) {
        next.delete(specialty);
      } else {
        next.add(specialty);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);

    // Delete all existing interests
    await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', user.id);

    // Insert new interests
    if (selectedInterests.size > 0) {
      const interests = Array.from(selectedInterests).map(specialty => ({
        user_id: user.id,
        specialty,
      }));

      const { error } = await supabase
        .from('user_interests')
        .insert(interests);

      if (error) {
        toast({ title: "Erreur", description: "Impossible de sauvegarder vos centres d'intérêts", variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    toast({ title: "Préférences enregistrées", description: "Vos centres d'intérêts ont été mis à jour" });
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
      <h1 className="text-foreground mb-2">
        Recevez notre newsletter !
      </h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        Chers amis collectionneurs, depuis plusieurs saisons, la maison de ventes met à votre disposition 
        une newsletter permettant de consulter nos catalogues interactifs dans les spécialités qui vous 
        intéressent. Mode de transmission pratique, rapide et écologique, il permet une grande souplesse 
        dans la consultation de nos catalogues ! Inscrivez-vous.
      </p>

      <h2 className="font-serif text-xl font-semibold text-foreground mb-6">
        Veuillez sélectionner les spécialités souhaitées :
      </h2>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SPECIALITES.map((specialty) => (
            <div key={specialty} className="flex items-center gap-3">
              <Checkbox
                id={specialty}
                checked={selectedInterests.has(specialty)}
                onCheckedChange={() => handleToggle(specialty)}
              />
              <label 
                htmlFor={specialty} 
                className="text-sm cursor-pointer uppercase tracking-wide"
              >
                {specialty}
              </label>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {selectedInterests.size} spécialité{selectedInterests.size > 1 ? 's' : ''} sélectionnée{selectedInterests.size > 1 ? 's' : ''}
          </p>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer mes préférences'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CentresInterets;

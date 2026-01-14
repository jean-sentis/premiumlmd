import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Trash2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface MemorizedLot {
  id: string;
  lot_id: string;
  created_at: string;
  lot?: {
    id: string;
    title: string;
    lot_number: number;
    estimate_low: number | null;
    estimate_high: number | null;
    images: any;
    sale_id: string | null;
    interencheres_lot_id?: string;
  };
}

const Favoris = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [memorizedLots, setMemorizedLots] = useState<MemorizedLot[]>([]);

  useEffect(() => {
    if (user) {
      fetchMemorizedLots();
    }
  }, [user]);

  const fetchMemorizedLots = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('memorized_lots')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch lot details for each memorized lot
      const lotsWithDetails = await Promise.all(
        data.map(async (memorized) => {
          const { data: lotData } = await supabase
            .from('interencheres_lots')
            .select('id, title, lot_number, estimate_low, estimate_high, images, sale_id, interencheres_lot_id')
            .or(`id.eq.${memorized.lot_id},interencheres_lot_id.eq.${memorized.lot_id}`)
            .maybeSingle();
          
          return {
            ...memorized,
            lot: lotData || undefined,
          };
        })
      );
      setMemorizedLots(lotsWithDetails);
    }
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase
      .from('memorized_lots')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setMemorizedLots(prev => prev.filter(m => m.id !== id));
      toast.success('Lot retiré de votre sélection');
    }
  };

  const handleShareAll = () => {
    if (memorizedLots.length === 0) return;

    const baseUrl = window.location.origin;
    
    // Build email body with all lots
    const lotsHtml = memorizedLots
      .filter(m => m.lot)
      .map(m => {
        const lot = m.lot!;
        const images = Array.isArray(lot.images) ? lot.images : [];
        const firstImage = images[0]?.url || images[0] || '';
        const lotUrl = `${baseUrl}/vente/${lot.sale_id}/lot/${lot.id}`;
        const estimate = lot.estimate_low && lot.estimate_high
          ? `${lot.estimate_low.toLocaleString()} - ${lot.estimate_high.toLocaleString()} EUR`
          : '';
        
        return `
━━━━━━━━━━━━━━━━━━━━
Lot ${lot.lot_number} : ${lot.title}
${estimate ? `Estimation : ${estimate}` : ''}
Voir le lot : ${lotUrl}
${firstImage ? `Image : ${firstImage}` : ''}
`;
      })
      .join('\n');

    const subject = encodeURIComponent('Ma sélection de lots aux enchères');
    const body = encodeURIComponent(`Bonjour,

Voici ma sélection de lots qui pourraient vous intéresser :
${lotsHtml}

━━━━━━━━━━━━━━━━━━━━

Bonne découverte !`);

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleShareOne = (lot: NonNullable<MemorizedLot['lot']>) => {
    const baseUrl = window.location.origin;
    const lotUrl = `${baseUrl}/vente/${lot.sale_id}/lot/${lot.id}`;
    const images = Array.isArray(lot.images) ? lot.images : [];
    const firstImage = images[0]?.url || images[0] || '';
    const estimate = lot.estimate_low && lot.estimate_high
      ? `${lot.estimate_low.toLocaleString()} - ${lot.estimate_high.toLocaleString()} EUR`
      : '';

    const subject = encodeURIComponent(`Lot ${lot.lot_number} : ${lot.title}`);
    const body = encodeURIComponent(`Bonjour,

Je partage avec vous ce lot qui pourrait vous intéresser :

━━━━━━━━━━━━━━━━━━━━
Lot ${lot.lot_number} : ${lot.title}
${estimate ? `Estimation : ${estimate}` : ''}
Voir le lot : ${lotUrl}
${firstImage ? `Image : ${firstImage}` : ''}
━━━━━━━━━━━━━━━━━━━━

Bonne découverte !`);

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Chargement de votre sélection...</div>
      </div>
    );
  }

  if (memorizedLots.length === 0) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-foreground mb-8">
          Votre sélection est vide
        </h1>
        <p className="text-muted-foreground">
          Parcourez nos ventes et cliquez sur l'icône <Heart className="w-4 h-4 inline mx-1" /> pour mémoriser vos lots favoris.
        </p>
        <Link 
          to="/acheter/ventes-a-venir"
          className="inline-block mt-6 text-brand-gold hover:underline font-medium"
        >
          Découvrir les ventes à venir →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-foreground">
          Ma sélection
        </h1>
        <Button
          variant="outline"
          onClick={handleShareAll}
          className="flex items-center gap-2"
        >
          <Share2 size={16} />
          Partager ma sélection
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memorizedLots.map((memorized) => {
          const lot = memorized.lot;
          if (!lot) return null;

          const images = Array.isArray(lot.images) ? lot.images : [];
          const firstImage = images[0]?.url || images[0];

          return (
            <div key={memorized.id} className="bg-card border border-border rounded-lg overflow-hidden group">
              <Link to={`/vente/${lot.sale_id}/lot/${lot.id}`} state={{ from: 'favoris' }}>
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={lot.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Pas d'image
                    </div>
                  )}
                </div>
              </Link>
              
              <div className="p-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Lot {lot.lot_number}
                </p>
                <Link to={`/vente/${lot.sale_id}/lot/${lot.id}`} state={{ from: 'favoris' }}>
                  <h3 className="font-medium text-foreground line-clamp-2 hover:text-brand-gold transition-colors">
                    {lot.title}
                  </h3>
                </Link>
                
                {(lot.estimate_low || lot.estimate_high) && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {lot.estimate_low && lot.estimate_high
                      ? `${lot.estimate_low.toLocaleString()} - ${lot.estimate_high.toLocaleString()} EUR`
                      : lot.estimate_low
                      ? `À partir de ${lot.estimate_low.toLocaleString()} EUR`
                      : `Jusqu'à ${lot.estimate_high?.toLocaleString()} EUR`}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => handleShareOne(lot)}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    title="Partager ce lot"
                  >
                    <Share2 size={14} />
                    Partager
                  </button>
                  <button
                    onClick={() => handleRemove(memorized.id)}
                    className="text-sm text-destructive hover:text-destructive/80 flex items-center gap-1 transition-colors"
                    title="Retirer de ma sélection"
                  >
                    <Trash2 size={14} />
                    Retirer
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Favoris;

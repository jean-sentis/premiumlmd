import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PhoneBidRequest {
  id: string;
  lot_id: string;
  phone_number: string;
  is_confirmed: boolean;
  created_at: string;
  notes: string | null;
  lot?: {
    id: string;
    title: string;
    lot_number: number;
    estimate_low: number | null;
    estimate_high: number | null;
    images: any;
    sale_id: string;
  };
}

const EncheresPhone = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<PhoneBidRequest[]>([]);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('phone_bid_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch lot details
      const requestsWithDetails = await Promise.all(
        data.map(async (request) => {
          const { data: lotData } = await supabase
            .from('interencheres_lots')
            .select('id, title, lot_number, estimate_low, estimate_high, images, sale_id')
            .eq('id', request.lot_id)
            .maybeSingle();
          
          return {
            ...request,
            lot: lotData || undefined,
          };
        })
      );
      setRequests(requestsWithDetails);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('phone_bid_requests')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== id));
      toast({ title: "Demande annulée", description: "La demande d'enchère téléphone a été retirée" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-foreground mb-8">
          Vous n'avez aucune demande d'enchère téléphone
        </h1>
        <p className="text-muted-foreground">
          Demandez à être appelé pendant la vente pour enchérir en direct sur les lots qui vous intéressent.
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
      <h1 className="text-foreground mb-8">
        Mes enchères téléphone
      </h1>

      <div className="space-y-4">
        {requests.map((request) => {
          const lot = request.lot;
          if (!lot) return null;

          const images = Array.isArray(lot.images) ? lot.images : [];
          const firstImage = images[0]?.url || images[0];

          return (
            <div key={request.id} className="bg-card border border-border rounded-lg overflow-hidden flex">
              <Link to={`/vente/${lot.sale_id}/lot/${lot.id}`} className="flex-shrink-0">
                <div className="w-32 h-32 relative overflow-hidden bg-muted">
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={lot.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      Pas d'image
                    </div>
                  )}
                </div>
              </Link>
              
              <div className="flex-1 p-4 flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Lot {lot.lot_number}
                  </p>
                  <Link to={`/vente/${lot.sale_id}/lot/${lot.id}`}>
                    <h3 className="font-medium text-foreground hover:text-brand-gold transition-colors line-clamp-2">
                      {lot.title}
                    </h3>
                  </Link>
                  
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium border border-border px-3 py-1 rounded-full">
                      <span className="text-muted-foreground">Enchérir par</span>
                      <Phone className="w-3.5 h-3.5 -scale-x-100" />
                      {request.phone_number}
                    </span>
                    {request.is_confirmed && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Confirmé
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(request.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EncheresPhone;

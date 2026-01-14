import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Gavel, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PurchaseOrder {
  id: string;
  lot_id: string;
  max_bid: number;
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

const MesOrdres = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch lot details
      const ordersWithDetails = await Promise.all(
        data.map(async (order) => {
          const { data: lotData } = await supabase
            .from('interencheres_lots')
            .select('id, title, lot_number, estimate_low, estimate_high, images, sale_id')
            .eq('id', order.lot_id)
            .maybeSingle();
          
          return {
            ...order,
            lot: lotData || undefined,
          };
        })
      );
      setOrders(ordersWithDetails);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setOrders(prev => prev.filter(o => o.id !== id));
      toast({ title: "Ordre supprimé", description: "L'ordre d'achat a été retiré" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Chargement des ordres...</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-foreground mb-8">
          Vous n'avez aucun ordre d'achat en cours
        </h1>
        <p className="text-muted-foreground">
          Parcourez nos ventes et laissez un ordre d'achat sur les lots qui vous intéressent.
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
        Mes ordres d'achat
      </h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const lot = order.lot;
          if (!lot) return null;

          const images = Array.isArray(lot.images) ? lot.images : [];
          const firstImage = images[0]?.url || images[0];

          return (
            <div key={order.id} className="bg-card border border-border rounded-lg overflow-hidden flex">
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
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full">
                      <Gavel className="w-3.5 h-3.5" />
                      Ordre : {order.max_bid.toLocaleString()} EUR
                    </span>
                    {order.is_confirmed && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Confirmé
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(order.id)}
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

export default MesOrdres;

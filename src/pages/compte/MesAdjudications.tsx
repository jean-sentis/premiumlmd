import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, ExternalLink, PartyPopper } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface WonLot {
  id: string;
  lot_number: number;
  title: string;
  adjudication_price: number | null;
  images: string[];
  sale_id: string | null;
  sale_title?: string;
  sale_date?: string;
}

const confettiColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#F7DC6F', '#BB8FCE', '#58D68D'];
const confettiShapes = ['rounded-full', 'rounded-sm', 'rounded-none'];

const ConfettiPiece = ({ delay, x, size, color, shape, duration }: { 
  delay: number; 
  x: number; 
  size: number;
  color: string;
  shape: string;
  duration: number;
}) => (
  <motion.div
    className={`absolute ${shape}`}
    style={{
      background: color,
      left: `${x}%`,
      top: -20,
      width: size,
      height: size * (shape === 'rounded-none' ? 2.5 : 1),
    }}
    initial={{ opacity: 1, y: -20, rotate: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 1, 1, 0],
      y: [-20, window.innerHeight * 0.3, window.innerHeight * 0.6, window.innerHeight * 0.9, window.innerHeight + 50],
      rotate: [0, 180, 360, 540, 720 + Math.random() * 360],
      x: [0, (Math.random() - 0.5) * 150, (Math.random() - 0.5) * 200],
      scale: [0, 1.2, 1, 0.8, 0.5],
    }}
    transition={{
      duration,
      delay,
      ease: [0.25, 0.46, 0.45, 0.94],
    }}
  />
);

const ConfettiExplosion = () => {
  const pieces = Array.from({ length: 120 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    size: 6 + Math.random() * 10,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    shape: confettiShapes[Math.floor(Math.random() * confettiShapes.length)],
    duration: 3 + Math.random() * 2,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.id} {...piece} />
      ))}
    </div>
  );
};

const MesAdjudications = () => {
  const { user } = useAuth();
  const [wonLots, setWonLots] = useState<WonLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const fetchWonLots = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: lots, error } = await supabase
        .from('interencheres_lots')
        .select(`
          id,
          lot_number,
          title,
          adjudication_price,
          images,
          sale_id
        `)
        .eq('winner_user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching won lots:', error);
        setLoading(false);
        return;
      }

      if (lots && lots.length > 0) {
        // Fetch sale info for each lot
        const saleIds = [...new Set(lots.filter(l => l.sale_id).map(l => l.sale_id))];
        const { data: sales } = await supabase
          .from('interencheres_sales')
          .select('id, title, sale_date')
          .in('id', saleIds);

        const salesMap = new Map(sales?.map(s => [s.id, s]) || []);

        const enrichedLots = lots.map(lot => ({
          ...lot,
          images: Array.isArray(lot.images) ? lot.images as string[] : [],
          sale_title: lot.sale_id ? salesMap.get(lot.sale_id)?.title : undefined,
          sale_date: lot.sale_id ? salesMap.get(lot.sale_id)?.sale_date : undefined,
        }));

        setWonLots(enrichedLots);
        
        // Show confetti animation on first load if there are won lots
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      setLoading(false);
    };

    fetchWonLots();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showConfetti && <ConfettiExplosion />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-500/20 rounded-full">
          <Trophy className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <h1 className="text-foreground">Mes adjudications</h1>
          <p className="text-sm text-muted-foreground">
            {wonLots.length === 0 
              ? "Vous n'avez pas encore remporté d'enchères"
              : `${wonLots.length} lot${wonLots.length > 1 ? 's' : ''} remporté${wonLots.length > 1 ? 's' : ''}`
            }
          </p>
        </div>
        {wonLots.length > 0 && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.3 }}
            className="ml-auto"
          >
            <PartyPopper className="w-8 h-8 text-amber-400" />
          </motion.div>
        )}
      </div>

      {/* Won lots list */}
      {wonLots.length === 0 ? (
        <div className="bg-muted/30 border border-border/50 rounded-lg p-8 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">Aucune adjudication pour le moment</p>
          <p className="text-sm text-muted-foreground/70">
            Participez aux enchères et vos lots gagnants apparaîtront ici !
          </p>
          <Link
            to="/acheter/ventes-a-venir"
            className="inline-flex items-center gap-2 mt-4 text-sm text-brand-gold hover:underline"
          >
            Voir les ventes à venir
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {wonLots.map((lot, index) => (
            <motion.div
              key={lot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/vente/${lot.sale_id}/lot/${lot.id}`}
                className="flex gap-4 p-4 bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/30 rounded-lg hover:border-green-500/50 transition-colors group"
              >
                {/* Image */}
                <div className="w-20 h-20 flex-shrink-0 bg-muted rounded overflow-hidden">
                  {lot.images[0] ? (
                    <img
                      src={lot.images[0]}
                      alt={lot.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <Trophy className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      ADJUGÉ
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Lot n°{lot.lot_number}
                    </span>
                  </div>
                  <h3 className="font-medium text-foreground truncate group-hover:text-green-600 transition-colors">
                    {lot.title}
                  </h3>
                  {lot.sale_title && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {lot.sale_title}
                      {lot.sale_date && ` • ${format(new Date(lot.sale_date), 'd MMM yyyy', { locale: fr })}`}
                    </p>
                  )}
                </div>

                {/* Price */}
                {lot.adjudication_price && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {lot.adjudication_price.toLocaleString('fr-FR')} €
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Prix d'adjudication
                    </p>
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Next steps info */}
      {wonLots.length > 0 && (
        <div className="bg-muted/30 border border-border/50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium text-foreground">Prochaines étapes</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-brand-gold">1.</span>
              <span>Vous recevrez un bordereau d'adjudication par email</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-gold">2.</span>
              <span>
                <Link to="/compte/paiement" className="text-brand-gold hover:underline">
                  Réglez vos achats
                </Link>
                {' '}(frais d'adjudication inclus)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-gold">3.</span>
              <span>
                <Link to="/compte/enlevement" className="text-brand-gold hover:underline">
                  Prenez rendez-vous
                </Link>
                {' '}pour l'enlèvement
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default MesAdjudications;

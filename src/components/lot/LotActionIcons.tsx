import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Gavel, Phone, Heart, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LotActionIconsProps {
  lotId: string;
  className?: string;
}

type ActionType = 'purchase_order' | 'phone_bid' | 'memorize' | 'info_request';

const iconMap: Record<ActionType, { icon: typeof Gavel; label: string; flipIcon?: boolean }> = {
  purchase_order: { icon: Gavel, label: "Ordre d'achat" },
  phone_bid: { icon: Phone, label: "Enchérir par téléphone", flipIcon: true },
  memorize: { icon: Heart, label: "Mémorisé" },
  info_request: { icon: MessageCircle, label: "Demande d'info" },
};

const LotActionIcons = ({ lotId, className }: LotActionIconsProps) => {
  const { user } = useAuth();
  const [actions, setActions] = useState<ActionType[]>([]);

  useEffect(() => {
    // Reset actions when lotId changes
    setActions([]);
    
    if (!user) return;

    const fetchActions = async () => {
      const [purchaseOrder, phoneBid, memorized, infoRequest] = await Promise.all([
        supabase.from('purchase_orders').select('id').eq('lot_id', lotId).eq('user_id', user.id).maybeSingle(),
        supabase.from('phone_bid_requests').select('id').eq('lot_id', lotId).eq('user_id', user.id).maybeSingle(),
        supabase.from('memorized_lots').select('id').eq('lot_id', lotId).eq('user_id', user.id).maybeSingle(),
        supabase.from('info_requests').select('id').eq('lot_id', lotId).eq('user_id', user.id).maybeSingle(),
      ]);

      const activeActions: ActionType[] = [];
      if (purchaseOrder.data) activeActions.push('purchase_order');
      if (phoneBid.data) activeActions.push('phone_bid');
      if (memorized.data) activeActions.push('memorize');
      if (infoRequest.data) activeActions.push('info_request');
      
      setActions(activeActions);
    };

    fetchActions();
  }, [user, lotId]);

  // Show max 2 icons
  const displayActions = actions.slice(0, 2);

  if (displayActions.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {displayActions.map((action) => {
        const { icon: Icon, label, flipIcon } = iconMap[action];
        const isMemorize = action === 'memorize';

        return (
          <div
            key={action}
            className="flex items-center justify-center w-6 h-6 bg-brand-gold/20 text-brand-gold rounded"
            title={label}
            aria-label={label}
          >
            <Icon
              className={cn("w-3.5 h-3.5", flipIcon && "-scale-x-100")}
              fill={isMemorize ? 'currentColor' : 'none'}
            />
          </div>
        );
      })}
    </div>
  );
};

export default LotActionIcons;

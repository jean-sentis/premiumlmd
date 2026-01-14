import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Heart } from 'lucide-react';

interface MemorizeButtonProps {
  lotId: string;
  className?: string;
}

const MemorizeButton = ({ lotId, className }: MemorizeButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMemorized, setIsMemorized] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchStatus = async () => {
      const { data } = await supabase
        .from('memorized_lots')
        .select('id')
        .eq('lot_id', lotId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIsMemorized(!!data);
    };

    fetchStatus();
  }, [user, lotId]);

  const handleMemorize = async () => {
    if (!user) {
      navigate('/auth', { state: { returnTo: location.pathname } });
      return;
    }

    setLoading(true);
    try {
      if (isMemorized) {
        const { error } = await supabase
          .from('memorized_lots')
          .delete()
          .eq('lot_id', lotId)
          .eq('user_id', user.id);
        if (error) throw error;

        setIsMemorized(false);
        toast({ title: 'Lot retiré', description: 'Ce lot a été retiré de votre sélection' });
        return;
      }

      const { error: insertError } = await supabase
        .from('memorized_lots')
        .insert({ user_id: user.id, lot_id: lotId });
      if (insertError) throw insertError;

      const { error: activityError } = await supabase.from('user_activity').insert({
        user_id: user.id,
        action_type: 'memorize',
        lot_id: lotId,
      });
      if (activityError) throw activityError;

      setIsMemorized(true);
      toast({ title: 'Lot mémorisé', description: 'Ce lot a été ajouté à votre sélection' });
    } catch (e) {
      toast({
        title: 'Erreur',
        description: "Impossible de mémoriser ce lot. Veuillez réessayer.",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleMemorize}
      disabled={loading}
      className={`border rounded px-4 py-2.5 flex items-center gap-2 hover:bg-muted/50 transition-colors ${className}`}
    >
      <Heart
        className={`w-4 h-4 flex-shrink-0 transition-colors ${
          isMemorized ? 'text-brand-gold' : 'text-muted-foreground'
        }`}
        fill={isMemorized ? 'currentColor' : 'none'}
      />
      <span className="text-sm font-medium">
        {isMemorized ? 'Mémorisé' : 'Mémoriser'}
      </span>
      {isMemorized && (
        <span className="text-[10px] bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded flex-shrink-0 ml-auto">
          ✓
        </span>
      )}
    </button>
  );
};

export default MemorizeButton;

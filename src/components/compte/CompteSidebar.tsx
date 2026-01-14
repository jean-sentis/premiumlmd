import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserActionCounts } from '@/hooks/useUserActionCounts';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  ChevronUp, 
  User, 
  Heart, 
  Mail,
  Bell,
  Gavel,
  Phone,
  Sparkles,
  CreditCard,
  CalendarCheck,
  LogOut,
  Trophy
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Badge doré pour les compteurs d'actions (ordres, enchères, etc.)
const CountBadge = ({ count }: { count: number }) => {
  if (count === 0) return null;
  return (
    <span className="min-w-[20px] h-[20px] flex items-center justify-center bg-[hsl(var(--brand-gold))] text-white text-[10px] font-bold rounded-full px-1.5">
      {count > 99 ? '99+' : count}
    </span>
  );
};

// Badge blanc pour les compteurs informatifs (sélection)
const SimpleCountBadge = ({ count }: { count: number }) => {
  if (count === 0) return null;
  return (
    <span className="min-w-[20px] h-[20px] flex items-center justify-center bg-white text-slate-900 text-[10px] font-bold rounded-full px-1.5">
      {count > 99 ? '99+' : count}
    </span>
  );
};

interface NavItemProps {
  to: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  end?: boolean;
  badge?: number;
  simpleBadge?: number;
}

const NavItem = ({ to, icon, children, end, badge, simpleBadge }: NavItemProps) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => cn(
      "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg",
      isActive 
        ? "font-medium underline underline-offset-4" 
        : "hover:bg-white/5"
    )}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="text-white flex-1">{children}</span>
    <span className="flex-shrink-0 w-8 flex justify-end mr-2">
      {badge !== undefined && badge > 0 && <CountBadge count={badge} />}
      {simpleBadge !== undefined && simpleBadge > 0 && <SimpleCountBadge count={simpleBadge} />}
    </span>
  </NavLink>
);

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const Section = ({ title, defaultOpen = true, children }: SectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 text-left"
      >
        <h3 className="text-base font-medium text-white">{title}</h3>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-white/60" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/60" />
        )}
      </button>
      {isOpen && (
        <div className="space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
};

const CompteSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const actionCounts = useUserActionCounts();
  const [hasNewsletterPrefs, setHasNewsletterPrefs] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{
    hasIdDocument: boolean;
    hasBankValidated: boolean;
  }>({ hasIdDocument: false, hasBankValidated: false });

  useEffect(() => {
    if (!user) return;
    
    const checkStatuses = async () => {
      // Check newsletter preferences
      const { data: interests } = await supabase
        .from('user_interests')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      setHasNewsletterPrefs(interests && interests.length > 0);
      
      // Check profile status (ID document + bank validation)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id_document_status, bank_validated')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profile) {
        setProfileStatus({
          hasIdDocument: profile.id_document_status === 'uploaded' || profile.id_document_status === 'verified',
          hasBankValidated: !!profile.bank_validated,
        });
      }
    };
    
    checkStatuses();
    
    // Écouter les changements en temps réel pour les intérêts
    const interestsChannel = supabase
      .channel('user_interests_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_interests',
        filter: `user_id=eq.${user.id}`
      }, () => {
        checkStatuses();
      })
      .subscribe();
    
    // Écouter les changements en temps réel pour le profil
    const profileChannel = supabase
      .channel('profile_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${user.id}`
      }, () => {
        checkStatuses();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(interestsChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Statut acheteur : vert si ID + banque validés, orange sinon
  const isFullBuyer = profileStatus.hasIdDocument && profileStatus.hasBankValidated;
  const buyerStatusColor = isFullBuyer ? 'text-green-500' : 'text-orange-400';

  return (
    <aside className="w-64 bg-transparent flex-shrink-0 hidden lg:block pt-[50px]">
      <div className="sticky top-[calc(var(--header-sticky-top,198px)+50px)] pb-2 bg-slate-900"> 
        <Section title="Mon espace" defaultOpen={true}>
          <NavLink
            to="/compte/profil"
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg",
              isActive 
                ? "font-medium underline underline-offset-4" 
                : "hover:bg-white/5"
            )}
          >
            <span className="flex-shrink-0"><User className="w-4 h-4 text-green-500" /></span>
            <span className="text-white flex-1">Mes informations</span>
            <span className="flex-shrink-0 w-8 flex justify-end mr-2">
              <CreditCard className={cn("w-4 h-4", buyerStatusColor)} />
            </span>
          </NavLink>
        </Section>

        <div className="mx-4 border-t border-white/10 my-2" />

        <Section title="Découvrir" defaultOpen={true}>
          <NavItem to="/compte/newsletter" icon={<Mail className={cn("w-4 h-4", hasNewsletterPrefs ? 'text-green-500' : 'text-orange-400')} />}>
            Ma newsletter
          </NavItem>
          <NavItem 
            to="/compte/alertes" 
            icon={<Bell className="w-4 h-4 text-green-500" />}
            badge={actionCounts.alertsWithResults}
          >
            Mes alertes
          </NavItem>
          <NavItem 
            to="/compte/favoris" 
            icon={<Heart className="w-4 h-4 text-[hsl(var(--brand-gold))]" />}
            simpleBadge={actionCounts.memorizedLots}
          >
            Mes Like
          </NavItem>
          <NavItem 
            to="/compte/ce-que-jaime" 
            icon={<Sparkles className="w-4 h-4 text-amber-400" />}
          >
            Dialogue avec Lia
          </NavItem>
        </Section>

        <div className="mx-4 border-t border-white/10 my-2" />

        <Section title="Mes achats" defaultOpen={true}>
          {/* Si le statut acheteur n'est pas complet, afficher un message explicatif */}
          {!isFullBuyer && (
            <div className="mx-4 mb-2 p-2 bg-orange-400/10 border border-orange-400/30 rounded text-xs text-orange-300">
              Pour activer vos ordres d'achat et enchères par téléphone, nous avons besoin de votre pièce d'identité et validation bancaire.
            </div>
          )}
          <NavItem 
            to="/compte/ordres" 
            icon={<Gavel className={cn("w-4 h-4", buyerStatusColor)} />}
            badge={actionCounts.purchaseOrders}
          >
            Ordre d'achat
          </NavItem>
          <NavItem 
            to="/compte/encheres-telephone" 
            icon={<Phone className={cn("w-4 h-4", buyerStatusColor)} />}
            badge={actionCounts.phoneBids}
          >
            Enchère téléphonique
          </NavItem>
          <NavItem 
            to="/compte/adjudications" 
            icon={<Trophy className={cn("w-4 h-4", actionCounts.wonLots > 0 ? 'text-green-500' : 'text-white/60')} />}
            badge={actionCounts.wonLots}
          >
            Adjugé
          </NavItem>
          <NavItem 
            to="/compte/aftersales" 
            icon={<Sparkles className="w-4 h-4 text-white/60" />}
            badge={0}
          >
            After sales
          </NavItem>
          <NavItem 
            to="/compte/paiement" 
            icon={<CreditCard className={cn("w-4 h-4", actionCounts.pendingPayments > 0 ? 'text-orange-400' : 'text-white/60')} />}
            badge={actionCounts.pendingPayments}
          >
            Régler mes achats
          </NavItem>
          <NavItem to="/compte/enlevement" icon={<CalendarCheck className="w-4 h-4 text-white/60" />}>
            RV d'enlèvement
          </NavItem>
        </Section>

        <div className="mx-4 border-t border-white/10 my-2" />

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default CompteSidebar;

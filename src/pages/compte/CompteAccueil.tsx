import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserActionCounts } from '@/hooks/useUserActionCounts';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { 
  Heart, 
  Bell, 
  Mail, 
  FileText,
  Phone,
  CreditCard,
  Truck,
  User,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface NavCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: number | string;
  badgeColor?: 'gold' | 'green' | 'red';
  onClick: () => void;
  highlight?: boolean;
}

const NavCard = ({ icon, title, description, badge, badgeColor = 'gold', onClick, highlight }: NavCardProps) => (
  <Card 
    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
      highlight ? 'border-[#c9a054] bg-[#c9a054]/5' : 'hover:border-[#c9a054]/50'
    }`}
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-full ${highlight ? 'bg-[#c9a054]/20 text-[#c9a054]' : 'bg-muted text-muted-foreground'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate">{title}</h3>
          {badge !== undefined && badge !== 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              badgeColor === 'gold' ? 'bg-[#c9a054] text-white' :
              badgeColor === 'green' ? 'bg-green-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </div>
  </Card>
);

const CompteAccueil = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const actionCounts = useUserActionCounts();
  const [profileComplete, setProfileComplete] = useState(false);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);
  const [tasteProfileExists, setTasteProfileExists] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Check profile completion
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, address, newsletter_subscribed')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setProfileComplete(!!(profile.first_name && profile.last_name && profile.phone && profile.address));
        setNewsletterSubscribed(profile.newsletter_subscribed || false);
      }

      // Count alerts
      const { count: alertCount } = await supabase
        .from('user_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setAlertsCount(alertCount || 0);

      // Check taste profile
      const { count: tasteCount } = await supabase
        .from('taste_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setTasteProfileExists((tasteCount || 0) > 0);
    };

    fetchData();
  }, [user]);

  const { memorizedLots, purchaseOrders, phoneBids, alertsWithResults } = actionCounts;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="mb-1">Mon espace</h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos préférences et retrouvez vos actions
        </p>
      </div>

      {/* Section: Découvrir */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Découvrir</h2>
        <div className="space-y-2">
          <NavCard
            icon={<Sparkles className="w-5 h-5" />}
            title="Dialogue avec l'IA"
            description={tasteProfileExists ? "Continuez votre conversation" : "Dites-nous ce que vous aimez"}
            onClick={() => navigate('/compte/ce-que-jaime')}
            highlight={!tasteProfileExists}
          />
          <NavCard
            icon={<Bell className="w-5 h-5" />}
            title="Mes alertes"
            description="Soyez prévenu des nouveaux lots"
            badge={alertsWithResults > 0 ? alertsWithResults : alertsCount > 0 ? `${alertsCount} actives` : undefined}
            badgeColor={alertsWithResults > 0 ? 'gold' : 'green'}
            onClick={() => navigate('/compte/alertes')}
          />
          <NavCard
            icon={<Mail className="w-5 h-5" />}
            title="Newsletter"
            description={newsletterSubscribed ? "Vous êtes inscrit" : "Recevez nos actualités"}
            badge={newsletterSubscribed ? "✓" : undefined}
            badgeColor="green"
            onClick={() => navigate('/compte/newsletter')}
          />
        </div>
      </div>

      {/* Section: Mes actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Mes actions</h2>
        <div className="space-y-2">
          <NavCard
            icon={<Heart className="w-5 h-5" />}
            title="Ma sélection"
            description="Lots mémorisés"
            badge={memorizedLots}
            onClick={() => navigate('/compte/favoris')}
          />
          <NavCard
            icon={<FileText className="w-5 h-5" />}
            title="Ordres d'achat"
            description="Vos enchères automatiques"
            badge={purchaseOrders}
            onClick={() => navigate('/compte/ordres')}
          />
          <NavCard
            icon={<Phone className="w-5 h-5" />}
            title="Enchères téléphone"
            description="Demandes de rappel"
            badge={phoneBids}
            onClick={() => navigate('/compte/encheres-telephone')}
          />
        </div>
      </div>

      {/* Section: Mes achats */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Mes achats</h2>
        <div className="space-y-2">
          <NavCard
            icon={<CreditCard className="w-5 h-5" />}
            title="Régler mes achats"
            description="Paiements en attente"
            onClick={() => navigate('/compte/paiement')}
          />
          <NavCard
            icon={<Truck className="w-5 h-5" />}
            title="Enlèvement"
            description="Planifier un retrait"
            onClick={() => navigate('/compte/enlevement')}
          />
        </div>
      </div>

      {/* Section: Mon profil */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Mon profil</h2>
        <div className="space-y-2">
          <NavCard
            icon={<User className="w-5 h-5" />}
            title="Mon profil"
            description={profileComplete ? "Profil complet" : "Complétez vos informations"}
            badge={profileComplete ? "✓" : "!"}
            badgeColor={profileComplete ? "green" : "red"}
            onClick={() => navigate('/compte/profil')}
          />
        </div>
      </div>
    </div>
  );
};

export default CompteAccueil;

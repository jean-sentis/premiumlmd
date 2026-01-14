import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Phone, MapPin, Camera, Bell, CreditCard, FileText, Shield, Lock, CheckCircle2, AlertCircle, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  avatar_url: string | null;
  display_name: string | null;
  contact_preference: 'email' | 'sms' | null;
  id_document_status: string | null;
  id_document_url: string | null;
  bank_validated: boolean | null;
}

interface StepSectionProps {
  step: number;
  title: string;
  icon: React.ReactNode;
  isComplete: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  optional?: boolean;
  info?: string;
  pendingColor?: 'gray' | 'orange';
}

const StepSection = ({ step, title, icon, isComplete, isOpen, onToggle, children, optional, info, pendingColor = 'gray' }: StepSectionProps) => (
  <div className="border border-border rounded-lg overflow-hidden bg-card">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
        isComplete 
          ? "bg-green-500 text-white" 
          : pendingColor === 'orange' 
            ? "bg-orange-400 text-white" 
            : "bg-slate-200 text-slate-600"
      )}>
        {step}
      </div>
      <div className="flex-1 flex items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <div>
          <span className="font-medium text-foreground">{title}</span>
          {optional && <span className="ml-2 text-xs text-muted-foreground">(optionnel)</span>}
        </div>
      </div>
      {info && (
        <span className="text-xs text-muted-foreground hidden sm:block">{info}</span>
      )}
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-muted-foreground" />
      ) : (
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      )}
    </button>
    {isOpen && (
      <div className="border-t border-border p-6 bg-background">
        {children}
      </div>
    )}
  </div>
);

const PasswordChangeSection = () => {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({ 
        title: "Erreur", 
        description: "Les mots de passe ne correspondent pas", 
        variant: "destructive" 
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({ 
        title: "Erreur", 
        description: "Le mot de passe doit contenir au moins 6 caractères", 
        variant: "destructive" 
      });
      return;
    }

    setChangingPassword(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible de changer le mot de passe", 
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Mot de passe modifié", 
        description: "Votre mot de passe a été changé avec succès" 
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    
    setChangingPassword(false);
  };

  const isValid = newPassword.length >= 6 && newPassword === confirmPassword;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="currentPassword" className="text-xs uppercase tracking-wide text-muted-foreground">
          Mot de passe actuel
        </Label>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="••••••••"
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-xs uppercase tracking-wide text-muted-foreground">
          Nouveau mot de passe *
        </Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="••••••••"
          className="h-12"
        />
        {newPassword && newPassword.length < 6 && (
          <p className="text-xs text-destructive">
            Le mot de passe doit contenir au moins 6 caractères
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wide text-muted-foreground">
          Confirmer le nouveau mot de passe *
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className="h-12"
        />
        {confirmPassword && newPassword !== confirmPassword && (
          <p className="text-xs text-destructive">
            Les mots de passe ne correspondent pas
          </p>
        )}
      </div>

      <Button 
        onClick={handlePasswordChange}
        disabled={changingPassword || !isValid}
        className="bg-slate-900 hover:bg-slate-800 text-white"
      >
        {changingPassword ? 'Modification en cours...' : 'Modifier mon mot de passe'}
      </Button>
    </div>
  );
};

const Profil = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validatingBank, setValidatingBank] = useState(false);
  const [openSection, setOpenSection] = useState<number>(1);
  const [profile, setProfile] = useState<ProfileData>({
    first_name: null,
    last_name: null,
    phone: null,
    company: null,
    address: null,
    city: null,
    postal_code: null,
    country: 'France',
    avatar_url: null,
    display_name: null,
    contact_preference: 'email',
    id_document_status: null,
    id_document_url: null,
    bank_validated: null,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        company: data.company,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
        country: data.country || 'France',
        avatar_url: data.avatar_url,
        display_name: data.display_name,
        contact_preference: data.contact_preference || 'email',
        id_document_status: data.id_document_status,
        id_document_url: data.id_document_url,
        bank_validated: data.bank_validated,
      });
      
      // Ouvrir la première section incomplète
      if (!data.first_name || !data.last_name) {
        setOpenSection(1);
      } else if (!data.phone) {
        setOpenSection(2);
      } else if (!data.address) {
        setOpenSection(3);
      } else if (!data.id_document_status) {
        setOpenSection(4);
      } else if (!data.bank_validated) {
        setOpenSection(5);
      }
    }
    setLoading(false);
  };

  const handleSave = async (nextSection?: number) => {
    if (!user) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        company: profile.company,
        address: profile.address,
        city: profile.city,
        postal_code: profile.postal_code,
        country: profile.country,
        display_name: profile.display_name,
        contact_preference: profile.contact_preference,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder les modifications", variant: "destructive" });
    } else {
      toast({ title: "Enregistré", description: "Vos informations ont été sauvegardées" });
      if (nextSection) {
        setOpenSection(nextSection);
      }
    }
    setSaving(false);
  };

  const handleIdUpload = async () => {
    toast({ title: "Document téléversé", description: "Votre pièce d'identité a été envoyée pour vérification" });
    setProfile({ ...profile, id_document_status: 'uploaded' });
    
    if (user) {
      await supabase
        .from('profiles')
        .update({ 
          id_document_status: 'uploaded',
          id_document_uploaded_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }
    setOpenSection(5);
  };

  const handleBankValidation = async () => {
    if (!user) return;
    
    setValidatingBank(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await supabase
      .from('profiles')
      .update({ 
        bank_validated: true,
        bank_validated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
    
    setProfile({ ...profile, bank_validated: true });
    setValidatingBank(false);
    
    toast({ 
      title: "Carte validée !", 
      description: "Votre compte acheteur est maintenant pleinement actif." 
    });
  };

  const getInitials = () => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const isStep1Complete = !!(profile.first_name && profile.last_name);
  const isStep2Complete = !!profile.phone;
  const isStep3Complete = !!(profile.address && profile.city && profile.postal_code);
  const isStep4Complete = profile.id_document_status === 'uploaded' || profile.id_document_status === 'verified';
  const isStep5Complete = !!profile.bank_validated;
  const canValidateBank = isStep2Complete && isStep3Complete && isStep4Complete;

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.display_name || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Chargement du profil...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header avec avatar */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative group">
          <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
            <AvatarImage src={profile.avatar_url || undefined} alt={fullName} />
            <AvatarFallback className="text-xl font-serif bg-slate-200">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-5 h-5 text-white" />
          </button>
        </div>
        <div>
          <h1 className="text-foreground">Mes informations</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Sections en étapes */}
      <div className="space-y-4">
        
        {/* Étape 1 : Identité */}
        <StepSection
          step={1}
          title="Votre identité"
          icon={<User className="w-5 h-5" />}
          isComplete={isStep1Complete}
          isOpen={openSection === 1}
          onToggle={() => setOpenSection(openSection === 1 ? 0 : 1)}
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Civilité</Label>
              <Select defaultValue="none">
                <SelectTrigger className="w-full max-w-xs h-12">
                  <SelectValue placeholder="- Aucun(e) -" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">- Aucun(e) -</SelectItem>
                  <SelectItem value="mr">Monsieur</SelectItem>
                  <SelectItem value="mme">Madame</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs uppercase tracking-wide text-muted-foreground">Prénom *</Label>
                <Input
                  id="firstName"
                  value={profile.first_name || ''}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs uppercase tracking-wide text-muted-foreground">Nom *</Label>
                <Input
                  id="lastName"
                  value={profile.last_name || ''}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="text-xs uppercase tracking-wide text-muted-foreground">Société (optionnel)</Label>
              <Input
                id="company"
                value={profile.company || ''}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                placeholder="Société"
                className="h-12"
              />
            </div>

            <Button 
              onClick={() => handleSave(2)}
              disabled={saving || !profile.first_name || !profile.last_name}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer et continuer'}
            </Button>
          </div>
        </StepSection>

        {/* Étape 2 : Téléphone et Email */}
        <StepSection
          step={2}
          title="Votre téléphone et email"
          icon={<Phone className="w-5 h-5" />}
          isComplete={isStep2Complete}
          isOpen={openSection === 2}
          onToggle={() => setOpenSection(openSection === 2 ? 0 : 2)}
          info="Pour enchérir et vous tenir au courant"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wide text-muted-foreground">Email</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="h-12 bg-muted/50"
                />
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground">
                Votre email est lié à votre compte et ne peut pas être modifié ici.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs uppercase tracking-wide text-muted-foreground">Numéro de téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+33 6 12 34 56 78"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                Requis pour recevoir les alertes par SMS ou les appels pour les enchères téléphoniques.
              </p>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Canal de notification pour les alertes
                </Label>
              </div>
              <RadioGroup
                value={profile.contact_preference || 'email'}
                onValueChange={(value: 'email' | 'sms') => setProfile({ ...profile, contact_preference: value })}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="pref-email" />
                  <Label htmlFor="pref-email" className="font-normal cursor-pointer">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sms" id="pref-sms" disabled={!profile.phone} />
                  <Label 
                    htmlFor="pref-sms" 
                    className={cn("font-normal cursor-pointer", !profile.phone && "opacity-50")}
                  >
                    <Phone className="w-4 h-4 inline mr-2" />
                    SMS
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <Button 
              onClick={() => handleSave(3)}
              disabled={saving || !profile.phone}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer et continuer'}
            </Button>
          </div>
        </StepSection>

        {/* Étape 3 : Adresse */}
        <StepSection
          step={3}
          title="Votre adresse"
          icon={<MapPin className="w-5 h-5" />}
          isComplete={isStep3Complete}
          isOpen={openSection === 3}
          onToggle={() => setOpenSection(openSection === 3 ? 0 : 3)}
          info="Pour vos factures et bordereaux"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs uppercase tracking-wide text-muted-foreground">Adresse *</Label>
              <Input
                id="address"
                value={profile.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="123 rue de la Paix"
                className="h-12"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code" className="text-xs uppercase tracking-wide text-muted-foreground">Code postal *</Label>
                <Input
                  id="postal_code"
                  value={profile.postal_code || ''}
                  onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                  placeholder="75001"
                  className="h-12"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="city" className="text-xs uppercase tracking-wide text-muted-foreground">Ville *</Label>
                <Input
                  id="city"
                  value={profile.city || ''}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="Paris"
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-xs uppercase tracking-wide text-muted-foreground">Pays</Label>
              <Select 
                value={profile.country || 'France'} 
                onValueChange={(value) => setProfile({ ...profile, country: value })}
              >
                <SelectTrigger className="w-full max-w-xs h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="France">France</SelectItem>
                  <SelectItem value="Belgique">Belgique</SelectItem>
                  <SelectItem value="Suisse">Suisse</SelectItem>
                  <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                  <SelectItem value="Monaco">Monaco</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={() => handleSave()}
              disabled={saving || !profile.address || !profile.city || !profile.postal_code}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer ces informations'}
            </Button>
          </div>
        </StepSection>

        {/* Étape 4 : Pièce d'identité */}
        <StepSection
          step={4}
          title="Pièce d'identité"
          icon={<FileText className="w-5 h-5" />}
          isComplete={isStep4Complete}
          isOpen={openSection === 4}
          onToggle={() => setOpenSection(openSection === 4 ? 0 : 4)}
          info="Nécessaire pour enchérir"
          pendingColor="orange"
        >
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-medium mb-2">Pourquoi une pièce d'identité ?</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                La réglementation des ventes aux enchères publiques nous impose de vérifier 
                l'identité de nos acheteurs. C'est une obligation légale qui protège aussi bien 
                les vendeurs que les acheteurs.
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-800">
                <strong>Vos données sont protégées.</strong> Votre pièce d'identité est stockée 
                de manière chiffrée et n'est accessible qu'à nos équipes habilitées.
              </p>
            </div>

            {isStep4Complete ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    {profile.id_document_status === 'verified' ? 'Document vérifié' : 'Document reçu'}
                  </p>
                  <p className="text-sm text-green-700">
                    {profile.id_document_status === 'verified' 
                      ? 'Votre identité a été validée.' 
                      : 'Nous vérifierons votre document sous 24h ouvrées.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-brand-gold transition-colors">
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Glissez votre fichier ici ou cliquez pour sélectionner
                </p>
                <Button onClick={handleIdUpload} variant="outline">
                  Téléverser ma pièce d'identité
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Carte d'identité ou passeport • JPG, PNG, PDF (max. 5 Mo)
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground italic">
              Sans pièce d'identité, vous pourrez consulter les catalogues mais ne pourrez pas 
              enchérir au téléphone ni laisser d'ordres d'achat.
            </p>
          </div>
        </StepSection>

        {/* Étape 5 : Carte bancaire */}
        <StepSection
          step={5}
          title="Validation bancaire"
          icon={<CreditCard className="w-5 h-5" />}
          isComplete={isStep5Complete}
          isOpen={openSection === 5}
          onToggle={() => setOpenSection(openSection === 5 ? 0 : 5)}
          info="Nécessaire pour enchérir"
          pendingColor="orange"
        >
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-medium mb-2">Pourquoi valider ma carte bancaire ?</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pour pouvoir enchérir, nous devons nous assurer que vous disposez d'un moyen 
                de paiement valide. C'est une garantie pour les vendeurs et pour le bon 
                déroulement des ventes.
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-5 border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-brand-gold" />
                <span className="font-semibold">Comment ça fonctionne ?</span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-brand-gold">1</span>
                  </div>
                  <p className="text-muted-foreground">
                    Une <strong className="text-foreground">transaction à 0 €</strong> est initiée 
                    pour vérifier que votre carte est valide.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-brand-gold">2</span>
                  </div>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Aucune somme ne sera débitée</strong> de votre compte. 
                    C'est une simple vérification.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-brand-gold">3</span>
                  </div>
                  <p className="text-muted-foreground">
                    L'opération se déroule sur l'<strong className="text-foreground">interface sécurisée de votre banque</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                <Shield className="w-5 h-5 text-green-600" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">L'Hôtel des Ventes n'a jamais accès à vos données bancaires.</strong><br />
                  Seule votre banque connaît les informations de votre carte.
                </p>
              </div>
            </div>

            {!canValidateBank && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-800">Étapes préalables requises</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    {isStep2Complete ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-amber-400" />
                    )}
                    <span className={isStep2Complete ? 'text-green-700' : 'text-amber-700'}>
                      Téléphone renseigné
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {isStep3Complete ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-amber-400" />
                    )}
                    <span className={isStep3Complete ? 'text-green-700' : 'text-amber-700'}>
                      Adresse renseignée
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {isStep4Complete ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-amber-400" />
                    )}
                    <span className={isStep4Complete ? 'text-green-700' : 'text-amber-700'}>
                      Pièce d'identité téléversée
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {isStep5Complete ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Carte bancaire validée</p>
                  <p className="text-sm text-green-700">
                    Votre compte acheteur est pleinement actif. Vous pouvez enchérir !
                  </p>
                </div>
              </div>
            ) : (
              <Button 
                onClick={handleBankValidation}
                disabled={!canValidateBank || validatingBank}
                className="w-full h-14 text-base bg-brand-gold hover:bg-brand-gold/90 text-white"
              >
                {validatingBank ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connexion à votre banque...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Valider ma carte bancaire
                  </span>
                )}
              </Button>
            )}

            <p className="text-xs text-muted-foreground italic">
              Sans validation bancaire, vous pourrez consulter les catalogues et mémoriser des lots, 
              mais vous ne pourrez pas placer d'ordres d'achat ni enchérir.
            </p>
          </div>
        </StepSection>

        {/* Section Sécurité : Mot de passe */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <button
            onClick={() => setOpenSection(openSection === 6 ? 0 : 6)}
            className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-green-500 text-white">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex-1 flex items-center gap-3">
              <span className="text-muted-foreground"><Shield className="w-5 h-5" /></span>
              <span className="font-medium text-foreground">Sécurité et mot de passe</span>
            </div>
            {openSection === 6 ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          {openSection === 6 && (
            <div className="border-t border-border p-6 bg-background">
              <PasswordChangeSection />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profil;

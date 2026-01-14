import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, addDays, isSameDay, isWeekend, setHours, setMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Clock, Package, User, CheckCircle2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COMPANY_INFO, OPENING_HOURS } from '@/lib/site-config';

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
}

interface PurchasedLot {
  id: string;
  title: string;
  lot_number: number;
  images: any;
  sale_id: string | null;
  sale_title?: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  sale_id: string | null;
}

// Créneaux de 15 minutes de 9h à 12h et 14h à 18h
const generateTimeSlots = () => {
  const slots: string[] = [];
  
  // Matin : 9h00 - 12h00
  for (let h = 9; h < 12; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  
  // Après-midi : 14h00 - 18h00
  for (let h = 14; h < 18; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const Enlevement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [purchasedLots, setPurchasedLots] = useState<PurchasedLot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{ date: string; time: string }[]>([]);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, address, city, postal_code')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profileData) {
      setProfile(profileData);
    }

    // Fetch user's purchase orders to see what they bought
    const { data: ordersData } = await supabase
      .from('purchase_orders')
      .select('lot_id')
      .eq('user_id', user.id)
      .eq('is_confirmed', true);

    if (ordersData && ordersData.length > 0) {
      const lotIds = ordersData.map(o => o.lot_id);
      const { data: lotsData } = await supabase
        .from('interencheres_lots')
        .select('id, title, lot_number, images, sale_id')
        .in('id', lotIds);
      
      if (lotsData) {
        // Fetch sale titles
        const saleIds = [...new Set(lotsData.filter(l => l.sale_id).map(l => l.sale_id))];
        let salesMap: Record<string, string> = {};
        
        if (saleIds.length > 0) {
          const { data: salesData } = await supabase
            .from('interencheres_sales')
            .select('id, title')
            .in('id', saleIds as string[]);
          
          if (salesData) {
            salesMap = Object.fromEntries(salesData.map(s => [s.id, s.title]));
          }
        }
        
        setPurchasedLots(lotsData.map(lot => ({
          ...lot,
          sale_title: lot.sale_id ? salesMap[lot.sale_id] : undefined
        })));
      }
    }

    // Fetch user's appointments
    const { data: appointmentsData } = await supabase
      .from('pickup_appointments')
      .select('*')
      .eq('user_id', user.id)
      .order('appointment_date', { ascending: true });
    
    if (appointmentsData) {
      setAppointments(appointmentsData);
    }

    // Fetch all booked slots to disable them
    const { data: allBookedData } = await supabase
      .from('pickup_appointments')
      .select('appointment_date, appointment_time')
      .gte('appointment_date', format(new Date(), 'yyyy-MM-dd'));
    
    if (allBookedData) {
      setBookedSlots(allBookedData.map(b => ({
        date: b.appointment_date,
        time: b.appointment_time
      })));
    }
    
    setLoading(false);
  };

  const isSlotBooked = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookedSlots.some(slot => slot.date === dateStr && slot.time === time);
  };

  const getAvailableSlotsForDate = (date: Date) => {
    return TIME_SLOTS.filter(time => !isSlotBooked(date, time));
  };

  const handleSubmit = async () => {
    if (!user || !selectedDate || !selectedTime) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner une date et un créneau horaire",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    const { error } = await supabase
      .from('pickup_appointments')
      .insert({
        user_id: user.id,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime,
        notes: notes || null,
        status: 'confirmed'
      });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de réserver ce créneau. Veuillez réessayer.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Rendez-vous confirmé !",
        description: `Votre enlèvement est prévu le ${format(selectedDate, 'EEEE d MMMM', { locale: fr })} à ${selectedTime}`,
      });
      
      // Reset form and refresh
      setSelectedDate(undefined);
      setSelectedTime('');
      setNotes('');
      fetchData();
    }
    
    setSubmitting(false);
  };

  const handleDeleteAppointment = async (id: string) => {
    const { error } = await supabase
      .from('pickup_appointments')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setAppointments(prev => prev.filter(a => a.id !== id));
      toast({
        title: "Rendez-vous annulé",
        description: "Votre rendez-vous a été supprimé"
      });
      fetchData(); // Refresh booked slots
    }
  };

  // Disable weekends and past dates
  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || isWeekend(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-foreground mb-4">
          Prendre rendez-vous pour un enlèvement
        </h1>
        <p className="text-muted-foreground mb-6">
          Connectez-vous pour accéder à la prise de rendez-vous et voir vos achats.
        </p>
        <Link to="/auth">
          <Button className="bg-brand-gold hover:bg-brand-gold/90 text-white">
            Se connecter
          </Button>
        </Link>
      </div>
    );
  }

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');

  return (
    <div className="max-w-4xl">
      <h1 className="text-foreground mb-2">
        Prendre rendez-vous pour un enlèvement
      </h1>
      <p className="text-muted-foreground mb-8">
        Réservez un créneau de 15 minutes pour récupérer vos achats à l'Hôtel des Ventes.
      </p>

      {/* Vos rendez-vous existants */}
      {appointments.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-xl font-medium text-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Vos rendez-vous
          </h2>
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div 
                key={apt.id}
                className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {format(new Date(apt.appointment_date), 'EEEE d MMMM yyyy', { locale: fr })}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {apt.appointment_time}
                  </p>
                  {apt.notes && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      "{apt.notes}"
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteAppointment(apt.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Colonne gauche : Formulaire */}
        <div className="space-y-6">
          {/* Informations pré-remplies */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              Vos informations
            </h3>
            
            {fullName ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nom</span>
                  <span className="font-medium text-foreground">{fullName}</span>
                </div>
                {profile?.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Téléphone</span>
                    <span className="font-medium text-foreground">{profile.phone}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground pt-2">
                  <Link to="/compte/profil" className="text-brand-gold hover:underline">
                    Modifier mes informations →
                  </Link>
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p>Votre profil n'est pas complet.</p>
                <Link to="/compte/profil" className="text-brand-gold hover:underline">
                  Compléter mon profil →
                </Link>
              </div>
            )}
          </div>

          {/* Sélection de date */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date du rendez-vous *</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime(''); // Reset time when date changes
                    setCalendarOpen(false);
                  }}
                  disabled={disabledDays}
                  locale={fr}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Sélection du créneau horaire */}
          {selectedDate && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Créneau horaire *</Label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((time) => {
                  const isBooked = isSlotBooked(selectedDate, time);
                  const isSelected = selectedTime === time;
                  
                  return (
                    <button
                      key={time}
                      onClick={() => !isBooked && setSelectedTime(time)}
                      disabled={isBooked}
                      className={cn(
                        "py-2 px-3 text-sm rounded-md border transition-colors",
                        isBooked && "bg-muted text-muted-foreground cursor-not-allowed line-through",
                        isSelected && "bg-brand-gold text-white border-brand-gold",
                        !isBooked && !isSelected && "bg-background hover:bg-muted border-border"
                      )}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Les créneaux barrés sont déjà réservés.
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes (optionnel)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Précisions sur l'enlèvement, numéros de lots, etc."
              className="min-h-[80px]"
            />
          </div>

          {/* Bouton de soumission */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedDate || !selectedTime}
            className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white h-12"
          >
            {submitting ? 'Réservation en cours...' : 'Confirmer le rendez-vous'}
          </Button>
        </div>

        {/* Colonne droite : Vos achats */}
        <div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-muted-foreground" />
              Vos achats à récupérer
            </h3>
            
            {purchasedLots.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                <p>Aucun achat confirmé pour le moment.</p>
                <Link to="/acheter/ventes-a-venir" className="text-brand-gold hover:underline">
                  Découvrir les ventes →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {purchasedLots.map((lot) => {
                  const images = Array.isArray(lot.images) ? lot.images : [];
                  const firstImage = images[0]?.url || images[0];
                  
                  return (
                    <div key={lot.id} className="flex gap-3">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        {firstImage ? (
                          <img
                            src={firstImage}
                            alt={lot.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            Photo
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">
                          Lot {lot.lot_number}
                        </p>
                        <p className="font-medium text-sm text-foreground line-clamp-2">
                          {lot.title}
                        </p>
                        {lot.sale_title && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {lot.sale_title}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Informations pratiques */}
          <div className="mt-6 bg-muted/50 rounded-lg p-6">
            <h4 className="font-medium text-foreground mb-3">Informations pratiques</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Enlèvements {OPENING_HOURS.weekdays.toLowerCase()}</li>
              <li>• Matin : {OPENING_HOURS.morning}</li>
              <li>• Après-midi : {OPENING_HOURS.afternoon}</li>
              <li>• Munissez-vous d'une pièce d'identité et du bordereau de vente que nous vous avons fait parvenir</li>
              <li>• Prévoyez le matériel nécessaire pour le transport</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              <strong>Adresse :</strong><br />
              {COMPANY_INFO.name}<br />
              {COMPANY_INFO.address.street}<br />
              {COMPANY_INFO.address.postalCode} {COMPANY_INFO.address.city}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enlevement;

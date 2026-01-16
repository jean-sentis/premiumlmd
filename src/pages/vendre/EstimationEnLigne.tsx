import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Camera, Upload, Send, CheckCircle, Loader2, MapPin, Calendar } from "lucide-react";

// Images des villes de passage
import sarteneImg from "@/assets/villes/sartene.png";
import proprianoImg from "@/assets/villes/propriano.png";
import bonifacioImg from "@/assets/villes/bonifacio.png";
import levieImg from "@/assets/villes/levie.png";
import portoVecchioImg from "@/assets/villes/porto-vecchio.png";

const villesPassage = [
  { name: "Sartène", image: sarteneImg },
  { name: "Propriano", image: proprianoImg },
  { name: "Bonifacio", image: bonifacioImg },
  { name: "Lévie", image: levieImg },
  { name: "Porto-Vecchio", image: portoVecchioImg },
];
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TimelineCalendar from "@/components/TimelineCalendar";
import EventDetailDialog from "@/components/EventDetailDialog";
import { useTimelineEvents } from "@/hooks/use-timeline-events";
import { useNextExpertiseByCity, NextExpertise } from "@/hooks/use-next-expertise-by-city";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const estimationSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().min(10, "Numéro de téléphone invalide").max(20),
  objectDescription: z.string().trim().min(10, "Décrivez votre objet en quelques mots").max(2000),
  dimensions: z.string().max(200).optional(),
  provenance: z.string().max(500).optional(),
});

type EstimationForm = z.infer<typeof estimationSchema>;

const EstimationEnLigne = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { events: timelineEvents } = useTimelineEvents(true);
  const cityNames = villesPassage.map(v => v.name);
  const { data: nextExpertiseByCity } = useNextExpertiseByCity(cityNames);
  
  // Dialog state pour expertise itinérante
  const [selectedExpertise, setSelectedExpertise] = useState<{
    id: string;
    type: string;
    title: string;
    date: Date;
    time?: string;
    location?: string;
    description?: string;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<EstimationForm>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<File[]>([]);

  const handleInputChange = (field: keyof EstimationForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos = Array.from(files).slice(0, 5 - photos.length);
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    try {
      const validatedData = estimationSchema.parse(formData);
      
      if (photos.length === 0) {
        toast({
          title: "Photos requises",
          description: "Veuillez ajouter au moins une photo de votre objet.",
          variant: "destructive"
        });
        return;
      }

      setIsSubmitting(true);

      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSubmitted(true);
      toast({
        title: "Demande envoyée",
        description: "Nous vous répondrons sous 48h avec notre estimation.",
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setFormErrors(errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-[195px] md:pt-[240px]">
          <div className="container mx-auto px-4 py-20 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h1 className="font-serif text-2xl md:text-3xl mb-4">Demande envoyée avec succès</h1>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Nous avons bien reçu votre demande d'estimation. 
              Notre équipe d'experts vous répondra sous 48h avec une première évaluation.
            </p>
            <Button variant="outline-brand" asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Estimation et Expertise | Douze pages & associés</title>
        <meta name="description" content="Expertise et estimation de vos objets d'art et de collection. Le cœur du métier de commissaire-priseur à votre service." />
      </Helmet>

      <Header />

      <main
        style={{ paddingTop: "calc(var(--header-main-height, 145px) + 18px)" }}
      >
        {/* Hero - Introduction */}
        <section className="py-12 md:py-16">
          <div className="max-w-[1440px] mx-auto px-4">
            <h1 className="font-serif text-2xl md:text-3xl text-center mb-8 -translate-y-[50px]">
              <span className="border-b-2 border-[hsl(var(--brand-secondary))] pb-1">Estimation et Expertise</span>
            </h1>
            
            <div className="text-center mb-12 max-w-4xl mx-auto">
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
                C'est le cœur du métier des commissaires-priseurs : identifier les objets, 
                connaître le marché, et vous donner une estimation fiable.
              </p>
            </div>

            {/* Deux colonnes : Estimation / Expertise */}
            <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-5xl mx-auto">
              {/* L'Estimation */}
              <div className="p-6 border border-border bg-card">
                <h2 className="font-serif text-lg font-medium mb-4 text-brand-primary">
                  L'Estimation
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong>À quel prix cela peut-il partir aux enchères ?</strong>
                  <br /><br />
                  L'estimation reflète le marché actuel — le prix auquel un acheteur 
                  serait prêt à enchérir, sans surprise. Ce n'est ni un prix de vente 
                  en boutique, ni une valeur sentimentale : c'est une évaluation réaliste, 
                  fondée sur notre connaissance des adjudications récentes.
                </p>
              </div>

              {/* L'Expertise */}
              <div className="p-6 border border-border bg-card">
                <h2 className="font-serif text-lg font-medium mb-4 text-brand-primary">
                  L'Expertise
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong>Qu'est-ce que c'est exactement ?</strong>
                  <br /><br />
                  L'expertise consiste à identifier précisément un objet : son auteur, 
                  son époque, son origine, sa technique, son authenticité. C'est un travail 
                  d'enquête et de connaissance qui permet de situer l'objet dans l'histoire 
                  de l'art et d'en révéler la valeur.
                </p>
              </div>
            </div>

            {/* Les différentes façons */}
            <div className="max-w-5xl mx-auto">
              <h2 className="section-title mb-8">PLUSIEURS FAÇONS DE PROCÉDER</h2>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* 1. En ligne */}
                <div className="p-6 border border-border hover:border-brand-primary/50 transition-colors">
                  <span className="font-serif text-3xl font-light text-brand-primary">1</span>
                  <h3 className="font-serif text-base font-medium mb-2 mt-2">En ligne</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Envoyez vos photos et recevez une première estimation sous 48h. 
                    Gratuit et sans engagement.
                  </p>
                  <span className="text-xs text-brand-primary">↓ Formulaire ci-dessous</span>
                </div>

                {/* 2. Sans rendez-vous à l'étude */}
                <div className="p-6 border border-border hover:border-brand-primary/50 transition-colors">
                  <span className="font-serif text-3xl font-light text-brand-primary">2</span>
                  <h3 className="font-serif text-base font-medium mb-2 mt-2">Sans rendez-vous à l'étude</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tous les lundis matin à l'Hôtel des Ventes d'Ajaccio, 
                    de 9h30 à 12h00. Venez avec vos objets.
                  </p>
                  <span className="text-xs text-muted-foreground">Expertise gratuite</span>
                </div>

                {/* 3. Sur rendez-vous à l'étude */}
                <Link 
                  to="/contact"
                  className="p-6 border border-border hover:border-brand-primary/50 transition-colors block"
                >
                  <span className="font-serif text-3xl font-light text-brand-primary">3</span>
                  <h3 className="font-serif text-base font-medium mb-2 mt-2">Sur rendez-vous à l'étude</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Avec nos experts, pour une expertise approfondie 
                    de vos objets d'art et de collection.
                  </p>
                  <span className="text-xs text-brand-primary">Prendre rendez-vous →</span>
                </Link>
              </div>

              {/* Grille 2 lignes x 3 colonnes : cartouche intro + 5 villes */}
              <div id="expertises-itinerantes" className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12 scroll-mt-40">
                {/* Cartouche intro "Nos passages trimestriels" */}
                <div className="flex flex-col justify-center p-4 border border-border bg-brand-primary text-white aspect-square">
                  <MapPin className="w-6 h-6 mb-3" />
                  <h3 className="font-serif text-base font-medium mb-3">Nos passages trimestriels en Corse-du-Sud</h3>
                  <ul className="text-sm leading-relaxed opacity-90 space-y-2">
                    <li>• Le matin sur rendez-vous</li>
                    <li>• L'après-midi sans rendez-vous</li>
                    <li>• Lieux communiqués une semaine avant</li>
                  </ul>
                </div>

                {/* Les 5 villes */}
                {villesPassage.map((ville) => {
                  const nextExpertise = nextExpertiseByCity?.[ville.name];
                  
                  const handleOpenDialog = (expertise: NextExpertise) => {
                    // Formater l'heure pour le dialog
                    let timeStr = "9h - 17h";
                    if (expertise.startTime && expertise.endTime) {
                      const startH = expertise.startTime.split(':')[0];
                      const endH = expertise.endTime.split(':')[0];
                      timeStr = `${startH}h - ${endH}h`;
                    }
                    
                    setSelectedExpertise({
                      id: expertise.id,
                      type: "expertise",
                      title: expertise.title,
                      date: expertise.date,
                      time: timeStr,
                      location: expertise.city,
                      description: expertise.description || "Matin sur rendez-vous, après-midi sans rendez-vous. Expertise gratuite.",
                    });
                    setDialogOpen(true);
                  };
                  
                  return (
                    <button 
                      key={ville.name}
                      onClick={() => nextExpertise && handleOpenDialog(nextExpertise)}
                      disabled={!nextExpertise}
                      className={`group relative overflow-hidden border border-border transition-colors duration-300 aspect-square text-left ${
                        nextExpertise 
                          ? 'hover:border-brand-primary/50 cursor-pointer' 
                          : 'opacity-70 cursor-default'
                      }`}
                    >
                      <div className="w-full h-full overflow-hidden bg-muted/30">
                        <img 
                          src={ville.image} 
                          alt={`Illustration de ${ville.name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          style={{ filter: 'contrast(1.4) saturate(0)' }}
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/90 via-brand-primary/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <span className="font-serif text-base md:text-lg font-medium text-white drop-shadow-md block">
                          {ville.name}
                        </span>
                        {nextExpertise && (
                          <div className="flex items-center gap-1.5 mt-1.5 text-white/90">
                            <Calendar className="w-3 h-3" />
                            <span className="text-xs font-medium">
                              Prochaine expertise : {nextExpertise.formattedDate}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Frise chronologique - juste au-dessus de Services à domicile */}
              <div className="py-8 border-t border-border">
                <TimelineCalendar events={timelineEvents} mode="vendre" variant="dates-first" />
              </div>

              {/* À domicile - Section séparée */}
              <div className="border-t border-border pt-10">
                <Link 
                  to="/vendre/inventaire-domicile"
                  className="flex flex-col md:flex-row gap-6 p-6 border border-border hover:border-brand-primary/50 transition-colors group"
                >
                  <Upload className="w-10 h-10 text-brand-primary shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-serif text-lg font-medium mb-3 group-hover:text-brand-primary transition-colors">
                      Services à domicile
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Pour les situations particulières, nous nous déplaçons chez vous : 
                      estimation de patrimoine, conseils fiscaux, successions, 
                      collections importantes, objets difficiles à déplacer.
                    </p>
                    <span className="text-xs text-brand-primary">Découvrir nos services à domicile →</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Formulaire en ligne */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="max-w-[1440px] mx-auto px-4">
            <h2 className="section-title mb-10 text-center">ESTIMATION EN LIGNE</h2>
            <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
              
              {/* Colonne gauche - Explications */}
              <div>
                <h2 className="section-title mb-8">COMMENT ÇA MARCHE ?</h2>
                
                <div className="space-y-8">
                  <div className="flex gap-4 items-start">
                    <span className="font-serif text-4xl font-light text-primary shrink-0">1</span>
                    <div>
                      <h3 className="font-serif text-lg font-medium tracking-wide mb-2">PRENEZ DES PHOTOS</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Photographiez votre objet sous plusieurs angles : vue d'ensemble, détails, signatures, marques...
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <span className="font-serif text-4xl font-light text-primary shrink-0">2</span>
                    <div>
                      <h3 className="font-serif text-lg font-medium tracking-wide mb-2">DÉCRIVEZ VOTRE OBJET</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Donnez-nous toutes les informations que vous avez : provenance, dimensions, état, historique...
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <span className="font-serif text-4xl font-light text-primary shrink-0">3</span>
                    <div>
                      <h3 className="font-serif text-lg font-medium tracking-wide mb-2">RECEVEZ VOTRE ESTIMATION</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Nos experts analysent votre demande et vous répondent sous 48h avec une première estimation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-emerald-50 border border-emerald-200 rounded">
                  <h3 className="font-serif text-lg font-medium mb-4 text-emerald-900">Conseils photo</h3>
                  <ul className="text-sm text-emerald-800 space-y-2">
                    <li>• <strong>Bonne lumière</strong> — Photographiez de jour, près d'une fenêtre</li>
                    <li>• <strong>Netteté</strong> — Stabilisez votre appareil pour des photos nettes</li>
                    <li>• <strong>Plusieurs angles</strong> — Face, dos, dessus, dessous si possible</li>
                    <li>• <strong>Détails</strong> — Signatures, marques, défauts éventuels</li>
                    <li>• <strong>Échelle</strong> — Placez un objet courant à côté pour la taille</li>
                  </ul>
                </div>

                <div className="mt-6 p-4 bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Gratuit et sans engagement.</strong> Cette estimation préliminaire ne remplace pas l'expertise physique 
                    de l'objet qui peut être nécessaire pour une évaluation définitive.
                  </p>
                </div>
              </div>

              {/* Colonne droite - Formulaire */}
              <div id="estimation-form" className="bg-card border border-border p-8 scroll-mt-48">
                <h2 className="section-title mb-8">DEMANDER UNE ESTIMATION</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Nom */}
                  <div>
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={formErrors.name ? 'border-red-500' : ''}
                    />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={formErrors.email ? 'border-red-500' : ''}
                    />
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                  </div>

                  {/* Téléphone */}
                  <div>
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={formErrors.phone ? 'border-red-500' : ''}
                    />
                    {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="objectDescription">Description de l'objet *</Label>
                    <Textarea
                      id="objectDescription"
                      rows={4}
                      placeholder="Décrivez votre objet : type, matière, époque supposée, état..."
                      value={formData.objectDescription || ''}
                      onChange={(e) => handleInputChange('objectDescription', e.target.value)}
                      className={formErrors.objectDescription ? 'border-red-500' : ''}
                    />
                    {formErrors.objectDescription && <p className="text-red-500 text-xs mt-1">{formErrors.objectDescription}</p>}
                  </div>

                  {/* Dimensions */}
                  <div>
                    <Label htmlFor="dimensions">Dimensions (optionnel)</Label>
                    <Input
                      id="dimensions"
                      placeholder="Ex: H. 45 cm x L. 30 cm x P. 20 cm"
                      value={formData.dimensions || ''}
                      onChange={(e) => handleInputChange('dimensions', e.target.value)}
                    />
                  </div>

                  {/* Provenance */}
                  <div>
                    <Label htmlFor="provenance">Provenance (optionnel)</Label>
                    <Textarea
                      id="provenance"
                      rows={2}
                      placeholder="Comment avez-vous acquis cet objet ? Succession, achat, cadeau..."
                      value={formData.provenance || ''}
                      onChange={(e) => handleInputChange('provenance', e.target.value)}
                    />
                  </div>

                  {/* Photos */}
                  <div>
                    <Label>Photos * (max 5)</Label>
                    <div className="mt-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Cliquez pour ajouter des photos</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoChange}
                          className="hidden"
                          disabled={photos.length >= 5}
                        />
                      </label>
                    </div>
                    
                    {/* Photo previews */}
                    {photos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {photos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Photo ${index + 1}`}
                              className="w-20 h-20 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {photos.length}/5 photos ajoutées
                    </p>
                  </div>

                  {/* Submit */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer ma demande
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    * Champs obligatoires. Réponse sous 48h ouvrés.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pt-10 md:pt-12 pb-0">
          <div className="max-w-[1440px] mx-auto px-4">
            <div className="bg-brand-primary text-brand-primary-foreground p-6 md:p-10 text-center card-shadow max-w-5xl mx-auto">
            <h2 className="font-serif text-lg md:text-xl font-light mb-6">
              Vous préférez un contact direct ?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/vendre/estimation-en-ligne#expertises-itinerantes"
                className="inline-block bg-background text-brand-primary px-8 py-3 font-sans text-xs tracking-widest hover:bg-background/90 transition-colors"
              >
                JOURNÉES D'ESTIMATION
              </Link>
              <Link 
                to="/vendre/inventaire-domicile"
                className="inline-block border border-brand-primary-foreground text-brand-primary-foreground px-8 py-3 font-sans text-xs tracking-widest hover:bg-brand-primary-foreground/10 transition-colors"
              >
                INVENTAIRE À DOMICILE
              </Link>
            </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      
      {/* Dialog pour expertise itinérante */}
      <EventDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={selectedExpertise}
      />
    </div>
  );
};

export default EstimationEnLigne;

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Instagram, Facebook, Upload, X, MapPin, Clock, Phone, Car } from "lucide-react";
import vlaminckBougival from "@/assets/vlaminck-bougival.jpg";

const Contact = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    origine: "",
    possession: "",
    provenance: "",
    description: ""
  });

  // Scroll to anchor if present
  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
        toast({
          title: "Format non accepté",
          description: "Seuls les fichiers JPEG sont acceptés.",
          variant: "destructive"
        });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale est de 10 Mo par fichier.",
          variant: "destructive"
        });
        return false;
      }
      return true;
    });

    if (files.length + validFiles.length > 4) {
      toast({
        title: "Limite atteinte",
        description: "Vous pouvez déposer maximum 4 photos.",
        variant: "destructive"
      });
      return;
    }

    setFiles([...files, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Demande envoyée",
      description: "Nous vous répondrons sous 48h.",
    });
    // Reset form
    setFormData({
      nom: "",
      email: "",
      telephone: "",
      origine: "",
      possession: "",
      provenance: "",
      description: ""
    });
    setFiles([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section with Vlaminck */}
      <section 
        className="relative min-h-[70vh] flex items-center"
        style={{ paddingTop: 'var(--header-height, 145px)' }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${vlaminckBougival})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
        <div className="container relative z-10 py-16">
          <div className="max-w-xl">
            <Link to="/" className="inline-block mb-8">
              <h1 className="font-serif text-4xl md:text-5xl font-light tracking-tight">
                DOUZE PAGES & ASSOCIÉS
              </h1>
              <p className="text-xs tracking-[0.3em] text-muted-foreground mt-1">
                MAISON DE VENTES
              </p>
            </Link>
            <h2 className="font-serif text-3xl md:text-4xl font-light mt-8">
              Contactez-nous
            </h2>
            <p className="text-muted-foreground mt-4">
              Notre équipe est à votre disposition pour toute demande d'estimation, 
              conseil ou information.
            </p>
          </div>
        </div>
        {/* Artwork caption */}
        <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded text-xs text-right">
          <p className="font-medium">Maurice de Vlaminck</p>
          <p className="text-muted-foreground italic">Restaurant de la Machine à Bougival, 1905</p>
          <p className="text-muted-foreground">Huile sur toile, 60 × 81,5 cm</p>
          <p className="text-muted-foreground">186 500 € — Préempté par le Musée d'Orsay, 2005</p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {/* Adresse */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="font-serif text-lg mb-2">Adresse</h3>
              <p className="text-muted-foreground text-sm">
                12 boulevard Albert 1er<br />
                20000 Ajaccio
              </p>
            </div>

            {/* Horaires */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="font-serif text-lg mb-2">Horaires</h3>
              <p className="text-muted-foreground text-sm">
                Lundi - Vendredi<br />
                9h00 - 12h30 / 14h00 - 18h00<br />
                Samedi sur rendez-vous
              </p>
            </div>

            {/* Téléphones */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="font-serif text-lg mb-2">Téléphone</h3>
              <p className="text-muted-foreground text-sm">
                <a href="tel:+33495121212" className="hover:text-brand-primary transition-colors">04 95 12 12 12</a><br />
                <a href="mailto:jean@lemarteaudigital.fr" className="hover:text-brand-primary transition-colors text-xs">jean@lemarteaudigital.fr</a>
              </p>
            </div>

            {/* Parking */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                <Car className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="font-serif text-lg mb-2">Accès</h3>
              <p className="text-muted-foreground text-sm">
                Parking gratuit<br />
                devant l'hôtel des ventes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Estimation Form */}
      <section id="formulaire" className="py-16 bg-secondary/30 scroll-mt-32">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <p className="font-sans text-sm tracking-widest text-muted-foreground uppercase mb-2">
              Estimation gratuite
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-light tracking-tight">
              Demande d'estimation
            </h2>
            <p className="text-muted-foreground mt-4">
              Envoyez-nous les photos de votre objet et nous vous répondrons sous 48h.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 bg-card p-8 rounded-lg border">
            {/* Contact Info */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom complet *</Label>
                <Input 
                  id="nom" 
                  required 
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input 
                  id="telephone" 
                  type="tel" 
                  value={formData.telephone}
                  onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-4">
              <Label>Photos de l'objet (4 max, JPEG, 10 Mo max chacune)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-brand-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".jpg,.jpeg"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Cliquez ou glissez vos photos ici
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {files.length}/4 photos ajoutées
                  </p>
                </label>
              </div>
              
              {/* Preview Files */}
              {files.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  {files.map((file, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`Upload ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Object Information */}
            <div className="space-y-6">
              <p className="font-serif text-lg">Informations sur l'objet</p>
              
              <div className="space-y-2">
                <Label htmlFor="origine">D'où vient cet objet ?</Label>
                <Textarea 
                  id="origine" 
                  placeholder="Héritage familial, achat, cadeau..."
                  value={formData.origine}
                  onChange={(e) => setFormData({...formData, origine: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="possession">Depuis combien de temps le possédez-vous ?</Label>
                <Input 
                  id="possession" 
                  placeholder="Ex: Depuis 20 ans, toujours été dans la famille..."
                  value={formData.possession}
                  onChange={(e) => setFormData({...formData, possession: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provenance">Que savez-vous de sa provenance ?</Label>
                <Textarea 
                  id="provenance" 
                  placeholder="Tout détail sur l'histoire de l'objet, son ancien propriétaire, sa région d'origine..."
                  value={formData.provenance}
                  onChange={(e) => setFormData({...formData, provenance: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description complémentaire</Label>
                <Textarea 
                  id="description" 
                  placeholder="Dimensions, état, marques ou signatures visibles..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>

            <div className="text-center">
              <Button type="submit" size="lg" className="px-12">
                ENVOYER MA DEMANDE
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Réponse garantie sous 48h ouvrées
              </p>
            </div>
          </form>
        </div>
      </section>

      {/* Social Media */}
      <section className="py-12 bg-background">
        <div className="container text-center">
          <p className="text-muted-foreground mb-6">
            Suivez les aventures de Douze pages & associés sur les réseaux
          </p>
          <div className="flex justify-center gap-6">
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-brand-primary hover:text-brand-primary-foreground transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-brand-primary hover:text-brand-primary-foreground transition-colors"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Google Maps */}
      <section className="h-[400px] relative">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3019.8!2d8.7369!3d41.9192!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12da85c3b3d3c3c3%3A0x0!2zNDHCsDU1JzA5LjEiTiA4wrA0NCcxMi44IkU!5e0!3m2!1sfr!2sfr!4v1234567890"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Localisation Douze pages & associés"
        />
        <div className="absolute bottom-4 left-4 bg-card p-4 rounded-lg shadow-lg max-w-xs">
          <p className="font-serif text-sm font-medium">Douze pages & associés</p>
          <p className="text-xs text-muted-foreground mt-1">
            12 boulevard Albert 1er, 20000 Ajaccio
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Parking gratuit devant l'hôtel des ventes
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;

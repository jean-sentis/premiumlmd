import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Phone, Mail, Calendar, Package, Camera, MessageSquare, ChevronDown } from "lucide-react";
import InventaireFormDialog from "@/components/InventaireFormDialog";
import { EstimationPhotoDialog } from "@/components/contact/EstimationPhotoDialog";
import { RendezVousDialog } from "@/components/contact/RendezVousDialog";
import { ObjetSimilaireDialog } from "@/components/contact/ObjetSimilaireDialog";
import { COMPANY_INFO } from "@/lib/site-config";
import angeLeccia from "@/assets/ange-leccia-1983.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

const SPECIALITES = [
  { name: "Bijoux & Montres", href: "/specialites/bijoux-montres" },
  { name: "Art Moderne & Contemporain", href: "/specialites/art-moderne" },
  { name: "Art du XXème siècle", href: "/specialites/art-xxeme" },
  { name: "Mobilier & Objets d'Art", href: "/specialites/mobilier-objets-art" },
  { name: "Vins & Spiritueux", href: "/specialites/vins-spiritueux" },
  { name: "Voitures de Collection", href: "/specialites/voitures-collection" },
  { name: "Céramiques", href: "/specialites/ceramiques" },
  { name: "Argenterie", href: "/specialites/argenterie" },
  { name: "Mode & Textile", href: "/specialites/mode-textile" },
  { name: "Militaria", href: "/specialites/militaria" },
  { name: "Collections", href: "/specialites/collections" },
];

const Contact = () => {
  const [inventaireDialogOpen, setInventaireDialogOpen] = useState(false);
  const [estimationDialogOpen, setEstimationDialogOpen] = useState(false);
  const [rendezVousDialogOpen, setRendezVousDialogOpen] = useState(false);
  const [objetSimilaireDialogOpen, setObjetSimilaireDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section with Artwork */}
      <section 
        className="relative"
        style={{ paddingTop: 'var(--header-height, 145px)' }}
      >
        <div className="container py-16 md:py-24">
          {/* Artwork Display - Museum Style */}
          <div className="max-w-4xl mx-auto">
            {/* The Artwork */}
            <div className="relative">
              <img 
                src={angeLeccia} 
                alt="Ange Leccia - Sans Titre, 1983"
                className="w-full max-w-2xl mx-auto shadow-2xl"
              />
            </div>
            
            {/* Museum Label / Cartel */}
            <div className="mt-8 max-w-xl mx-auto text-center md:text-left md:ml-auto md:mr-0">
              <p className="font-serif text-xl md:text-2xl font-medium tracking-wide">
                Ange LECCIA
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                (Né en 1952)
              </p>
              <p className="font-serif text-lg mt-4 italic">
                SANS TITRE — 1983
              </p>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                Collage de papiers sur toile<br />
                Signée, datée, située, dédicacée et annotée au dos<br />
                <span className="italic">"Ange Leccia, Roma Villa Medici, 83, avant-dernier"</span>
              </p>
              <p className="text-muted-foreground text-sm mt-3">
                h: 200 × l: 180 cm
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Provenance :</span> Galerie Lucien Durand, Paris
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vente, Paris, Auction Art, 27 octobre 2008, lot 179
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coordonnées */}
      <section className="py-12 bg-secondary/30">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div>
                <MapPin className="w-5 h-5 mx-auto mb-3 text-brand-primary" />
                <p className="text-sm">
                  {COMPANY_INFO.address.street}<br />
                  {COMPANY_INFO.address.postalCode} {COMPANY_INFO.address.city}
                </p>
              </div>
              <div>
                <Clock className="w-5 h-5 mx-auto mb-3 text-brand-primary" />
                <p className="text-sm">
                  Lundi – Vendredi<br />
                  9h – 12h30 / 14h – 18h
                </p>
              </div>
              <div>
                <Phone className="w-5 h-5 mx-auto mb-3 text-brand-primary" />
                <a 
                  href={COMPANY_INFO.phoneLink}
                  className="text-sm hover:text-brand-primary transition-colors"
                >
                  {COMPANY_INFO.phone}
                </a>
              </div>
              <div>
                <Mail className="w-5 h-5 mx-auto mb-3 text-brand-primary" />
                <a 
                  href={COMPANY_INFO.emailLink}
                  className="text-sm hover:text-brand-primary transition-colors"
                >
                  {COMPANY_INFO.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Action Cartouches */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-muted-foreground mb-12 font-serif text-lg">
              Comment pouvons-nous vous accompagner ?
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Demande d'estimation avec IA */}
              <Button
                variant="outline"
                className="h-auto py-6 px-6 flex flex-col items-start text-left gap-2 hover:bg-secondary/50 transition-colors"
                onClick={() => setEstimationDialogOpen(true)}
              >
                <div className="flex items-center gap-3 w-full">
                  <Camera className="w-5 h-5 text-brand-primary shrink-0" />
                  <span className="font-serif text-base">Demande d'estimation</span>
                </div>
                <p className="text-xs text-muted-foreground pl-8">
                  Notre IA vérifie la qualité de vos photos pour une estimation optimale
                </p>
              </Button>

              {/* Demande d'inventaire à domicile */}
              <Button
                variant="outline"
                className="h-auto py-6 px-6 flex flex-col items-start text-left gap-2 hover:bg-secondary/50 transition-colors"
                onClick={() => setInventaireDialogOpen(true)}
              >
                <div className="flex items-center gap-3 w-full">
                  <Package className="w-5 h-5 text-brand-primary shrink-0" />
                  <span className="font-serif text-base">Inventaire à domicile</span>
                </div>
                <p className="text-xs text-muted-foreground pl-8">
                  Succession, assurance, partage : nous nous déplaçons
                </p>
              </Button>

              {/* Rendez-vous à l'étude */}
              <Button
                variant="outline"
                className="h-auto py-6 px-6 flex flex-col items-start text-left gap-2 hover:bg-secondary/50 transition-colors"
                onClick={() => setRendezVousDialogOpen(true)}
              >
                <div className="flex items-center gap-3 w-full">
                  <Calendar className="w-5 h-5 text-brand-primary shrink-0" />
                  <span className="font-serif text-base">Rendez-vous à l'étude</span>
                </div>
                <p className="text-xs text-muted-foreground pl-8">
                  Apportez votre objet pour une estimation en main propre
                </p>
              </Button>

              {/* Objet similaire à un lot */}
              <Button
                variant="outline"
                className="h-auto py-6 px-6 flex flex-col items-start text-left gap-2 hover:bg-secondary/50 transition-colors"
                onClick={() => setObjetSimilaireDialogOpen(true)}
              >
                <div className="flex items-center gap-3 w-full">
                  <MessageSquare className="w-5 h-5 text-brand-primary shrink-0" />
                  <span className="font-serif text-base">J'ai un objet similaire</span>
                </div>
                <p className="text-xs text-muted-foreground pl-8">
                  Notre IA vous aide à retrouver un lot comparable en quelques questions
                </p>
              </Button>
            </div>

            {/* Dropdown Spécialités */}
            <div className="mt-8 flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                    Explorer nos spécialités
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-background z-50">
                  {SPECIALITES.map((spec) => (
                    <DropdownMenuItem key={spec.href} asChild>
                      <Link to={spec.href} className="cursor-pointer">
                        {spec.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                    Voir les ventes
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-background z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/acheter/ventes-a-venir" className="cursor-pointer">
                      Ventes à venir
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/acheter/ventes-passees" className="cursor-pointer">
                      Résultats des ventes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/acheter/after-sale" className="cursor-pointer">
                      After Sale
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </section>

      {/* Dialogs */}
      <InventaireFormDialog 
        open={inventaireDialogOpen} 
        onOpenChange={setInventaireDialogOpen} 
      />
      <EstimationPhotoDialog 
        open={estimationDialogOpen} 
        onOpenChange={setEstimationDialogOpen} 
      />
      <RendezVousDialog 
        open={rendezVousDialogOpen} 
        onOpenChange={setRendezVousDialogOpen} 
      />
      <ObjetSimilaireDialog 
        open={objetSimilaireDialogOpen} 
        onOpenChange={setObjetSimilaireDialogOpen} 
      />

      <Footer />
    </div>
  );
};

export default Contact;

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
      
      {/* Main Content */}
      <section 
        className="relative"
        style={{ paddingTop: 'var(--header-height, 145px)' }}
      >
        <div className="container py-12 md:py-20">
          {/* Logo */}
          <div className="flex justify-center mb-12">
            <img 
              src="/src/assets/logo-12p.png" 
              alt="Douze pages & associés" 
              className="h-16 md:h-20"
            />
          </div>

          {/* Two Column Layout: Contact Info Left, Actions Right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 mb-20">
            {/* Left - Contact Info */}
            <div className="space-y-4 text-sm">
              <p className="font-serif text-lg font-medium mb-4">{COMPANY_INFO.name}</p>
              <p>
                {COMPANY_INFO.address.street}<br />
                {COMPANY_INFO.address.postalCode} {COMPANY_INFO.address.city}
              </p>
              <p className="text-muted-foreground">
                Lundi – Vendredi<br />
                9h – 12h30 / 14h – 18h
              </p>
              <p>
                <a 
                  href={COMPANY_INFO.phoneLink}
                  className="hover:text-brand-primary transition-colors"
                >
                  {COMPANY_INFO.phone}
                </a>
              </p>
              <p>
                <a 
                  href={COMPANY_INFO.emailLink}
                  className="hover:text-brand-primary transition-colors"
                >
                  {COMPANY_INFO.email}
                </a>
              </p>
            </div>

            {/* Right - Actions */}
            <div>
              <p className="text-muted-foreground mb-6 font-serif text-lg">
                Comment pouvons-nous vous accompagner ?
              </p>
              
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-3 px-5 justify-start gap-3 hover:bg-secondary/50 transition-colors"
                  onClick={() => setEstimationDialogOpen(true)}
                >
                  <Camera className="w-4 h-4 text-brand-primary shrink-0" />
                  <span className="font-serif text-sm">Demande d'estimation</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-3 px-5 justify-start gap-3 hover:bg-secondary/50 transition-colors"
                  onClick={() => setInventaireDialogOpen(true)}
                >
                  <Package className="w-4 h-4 text-brand-primary shrink-0" />
                  <span className="font-serif text-sm">Inventaire à domicile</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-3 px-5 justify-start gap-3 hover:bg-secondary/50 transition-colors"
                  onClick={() => setRendezVousDialogOpen(true)}
                >
                  <Calendar className="w-4 h-4 text-brand-primary shrink-0" />
                  <span className="font-serif text-sm">Rendez-vous à l'étude</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-3 px-5 justify-start gap-3 hover:bg-secondary/50 transition-colors"
                  onClick={() => setObjetSimilaireDialogOpen(true)}
                >
                  <MessageSquare className="w-4 h-4 text-brand-primary shrink-0" />
                  <span className="font-serif text-sm">J'ai un objet similaire à l'un de vos lots à faire estimer</span>
                </Button>
              </div>

              {/* Dropdown Links */}
              <div className="mt-6 flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground text-xs">
                      Spécialités
                      <ChevronDown className="w-3 h-3" />
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
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground text-xs">
                      Ventes
                      <ChevronDown className="w-3 h-3" />
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

          {/* Artwork Section - Text 1/3, Image 2/3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-center border-t border-border pt-16">
            {/* Left Column - Text (1/3) - Smaller, centered vertically */}
            <div className="md:col-span-1 flex flex-col justify-center text-xs text-muted-foreground space-y-3">
              {/* Artist Name */}
              <p className="font-serif text-sm font-medium text-foreground">
                Ange LECCIA
              </p>
              
              {/* Title & Year */}
              <p>
                <span className="italic">SANS TITRE</span> — 1983
              </p>
              
              {/* Bio */}
              <p className="leading-relaxed">
                Ange Leccia né le 19 avril 1952 à Minerviu est un plasticien corse. 
                Son domaine de prédilection est celui des images en mouvement, 
                mais son travail prend aussi la forme d'installations et de photographies.
              </p>
              
              {/* Artwork Details */}
              <div className="space-y-0.5">
                <p>Collage de papiers sur toile</p>
                <p>Signée, datée, située, dédicacée et annotée au dos</p>
                <p className="italic">"Ange Leccia, Roma Villa Medici, 83, avant-dernier"</p>
                <p>h: 200 × l: 180 cm</p>
              </div>
              
              {/* Provenance */}
              <div className="pt-2 border-t border-border/50">
                <p className="font-medium text-foreground text-xs mb-1">Provenance</p>
                <p>Galerie Lucien Durand, Paris</p>
                <p>Vente, Paris, Auction Art, 27 octobre 2008, lot 179</p>
              </div>
              
              {/* Adjudication */}
              <p className="font-serif text-sm font-medium text-foreground pt-2 border-t border-border/50">
                Adjugé : 25 400 €
              </p>
            </div>
            
            {/* Right Column - Image (2/3) */}
            <div className="md:col-span-2">
              <img 
                src={angeLeccia} 
                alt="Ange Leccia - Sans Titre, 1983"
                className="w-full shadow-xl"
              />
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
        onRequestEstimation={() => setEstimationDialogOpen(true)}
      />

      <Footer />
    </div>
  );
};

export default Contact;

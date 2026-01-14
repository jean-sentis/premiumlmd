import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InlinePlanningSlot from "@/components/InlinePlanningSlot";
import ResultCard from "@/components/ResultCard";
import { Phone, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import hotelDesVentesAccueil from "@/assets/hotel-des-ventes-illustration.png";
import expertiseBijouIllustration from "@/assets/expertise-bijou-illustration.png";
import salleVentesIllustration from "@/assets/salle-encheres-illustration.png";
import successionIllustration from "@/assets/succession-inventaire-illustration.png";
import fondEncheresVendre from "@/assets/fond-encheres-vendre.png";

const specialites = [
  {
    id: 1,
    title: "Bijoux et Montres",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=500&fit=crop",
    description: "Expertise de haute joaillerie, montres de prestige et pièces anciennes. Estimation précise basée sur les cours internationaux."
  },
  {
    id: 2,
    title: "Vins et Spiritueux",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=500&fit=crop",
    description: "Grands crus, millésimes rares et collections de spiritueux. Notre expert certifié évalue vos caves avec précision."
  },
  {
    id: 3,
    title: "Art du XXème siècle",
    image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=400&h=500&fit=crop",
    description: "Peintures, sculptures et œuvres graphiques modernes et contemporaines. Authentification et cotation sur le marché actuel."
  },
  {
    id: 4,
    title: "Voitures de Collection",
    image: "/images/voiture-collection.avif",
    description: "Automobiles anciennes, youngtimers et véhicules d'exception. Expertise mécanique et historique complète."
  },
  {
    id: 5,
    title: "Céramiques Modernes",
    image: "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=400&h=500&fit=crop",
    description: "Porcelaines, faïences et grès des manufactures renommées. Identification des signatures et estimation des pièces rares."
  },
  {
    id: 6,
    title: "Militaria",
    image: "/images/uniforme-hussard-militaria.jpg",
    description: "Armes anciennes, décorations, uniformes et souvenirs historiques. Expertise dans le respect de la réglementation."
  }
];

const results = [
  {
    title: "Pendule Mystérieuse Cartier",
    artist: "Cartier, Paris",
    price: "45 000 €",
    date: "15 novembre 2024",
    imageUrl: "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=400&h=400&fit=crop"
  },
  {
    title: "Nature morte aux fruits",
    artist: "École française XIXe",
    price: "8 500 €",
    date: "22 octobre 2024",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop"
  },
  {
    title: "Service en porcelaine de Sèvres",
    artist: "Manufacture de Sèvres",
    price: "12 000 €",
    date: "8 septembre 2024",
    imageUrl: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=400&fit=crop"
  },
  {
    title: "Commode Louis XV",
    artist: "Époque XVIIIe",
    price: "28 000 €",
    date: "3 juin 2024",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop"
  }
];

const Vendre = () => {
  const [activeSpecialite, setActiveSpecialite] = useState<number | null>(null);
  const [selectedResult, setSelectedResult] = useState<{
    title: string;
    artist?: string;
    price: string;
    date?: string;
    imageUrl: string;
  } | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section
        className="pb-0"
        style={{ paddingTop: 'var(--header-height, 145px)' }}
      >
        <div className="container">
          <div className="relative">
            <img 
              src={fondEncheresVendre}
              alt="Salle d'exposition d'objets d'art et antiquités"
              className="w-full h-48 md:h-64 object-cover opacity-70 blur-[2px] saturate-[0.7]"
            />
            <div className="absolute inset-0 bg-white/30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-primary/15 to-primary/30 pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="text-center frame-title bg-background">
                Vendre vos biens mobiliers aux enchères
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Slot inline pour le planning - après le hero */}
      <InlinePlanningSlot />

      {/* Pourquoi l'hôtel des ventes ? */}
      <section className="pt-12 pb-16 md:pb-24">
        <div className="container">
          <h2 className="section-title mb-16">POURQUOI L'HÔTEL DES VENTES ?</h2>
          
          {/* Premier bloc : L'officier ministériel */}
          <div className="mb-16">
            <div className="w-full mb-8 overflow-hidden rounded-lg shadow-lg">
              <img 
                src={hotelDesVentesAccueil} 
                alt="Hôtel des Ventes avec conseillère professionnelle"
                className="w-[150%] max-w-none md:w-full md:max-w-full h-auto"
              />
            </div>
            <div className="px-4">
              <p className="text-base leading-relaxed text-muted-foreground mb-6">
                De par sa formation, son expérience et sa responsabilité d'officier ministériel, le commissaire-priseur engage sa parole dans chaque descriptif. Cette garantie est une assurance pour les acheteurs et valorise vos objets. L'incarnation et la responsabilité sont au cœur des ventes aux enchères. Nous sommes très loin des plateformes toutes numériques et anonymes où les tentatives d'escroqueries sont toujours plus nombreuses.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                Notre équipe est habituée à vendre des pièces singulières. Pour établir le descriptif, l'équipe de l'hôtel des ventes fait souvent appel à des experts spécialistes qui, quand c'est nécessaire, font une enquête jusqu'à être certain de l'identité du lot. Il devient donc possible de faire une estimation de la valeur financière de l'objet qui est communiquée au vendeur. Un prix de réserve peut être fixé par lui au dessous duquel il refuse que son bien soit vendu.
              </p>
            </div>
          </div>
          
          {/* Deuxième bloc : Le coup de marteau */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <p className="text-base leading-relaxed text-muted-foreground mb-6">
                Les lots sont ensuite photographiés et inclus dans des catalogues cohérents qui attirent les acheteurs. Nous mettons en œuvre tous les moyens promotionnels : newsletters, annonces, réseaux sociaux, réseaux spécialement dédiés. L'enjeu est de créer pour chaque vente l'émulation — et parfois, de belles batailles d'enchères.
              </p>
              <p className="text-base leading-relaxed text-foreground font-medium">
                Le commissaire-priseur ne perçoit de rémunération que si l'objet est vendu. Dans le cas contraire, tous les frais de communication restent à sa charge. Notre intérêt et le vôtre sont donc parfaitement alignés.
              </p>
            </div>
            <div className="order-1 md:order-2 flex justify-center">
              <img 
                src={expertiseBijouIllustration} 
                alt="Expert examinant un bijou avec une loupe"
                className="w-80 md:w-[420px] h-auto"
              />
            </div>
          </div>

          {/* Nos belles enchères */}
          <div className="mt-16">
            <h3 className="section-title mb-12">NOS BELLES ENCHÈRES</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className="cursor-pointer"
                  onClick={() => setSelectedResult(result)}
                >
                  <ResultCard {...result} />
                </div>
              ))}
            </div>
          </div>

          {/* Lightbox for Belles Enchères */}
          <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
            <DialogContent className="max-w-3xl p-0 bg-background border-none">
              <DialogClose className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <X className="h-6 w-6 text-foreground" />
                <span className="sr-only">Fermer</span>
              </DialogClose>
              {selectedResult && (
                <div className="flex flex-col">
                  <div className="aspect-square w-full bg-muted">
                    <img
                      src={selectedResult.imageUrl}
                      alt={selectedResult.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 text-center">
                    {selectedResult.artist && (
                      <p className="font-sans text-sm text-muted-foreground tracking-wide mb-1">
                        {selectedResult.artist}
                      </p>
                    )}
                    <h3 className="font-serif text-xl font-medium mb-2">
                      {selectedResult.title}
                    </h3>
                    <p className="font-serif text-2xl font-semibold text-brand-primary">
                      {selectedResult.price}
                    </p>
                    {selectedResult.date && (
                      <p className="font-sans text-xs text-muted-foreground mt-2">
                        Vendu le {selectedResult.date}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Comment vendre */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container">
          <h2 className="section-title mb-16">COMMENT VENDRE ?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Étape 1 - VENDRE ? */}
            <div className="bg-background border border-border/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col">
              <span className="font-serif text-5xl font-light block mb-4 text-primary">1</span>
              <h3 className="font-serif text-lg font-medium tracking-wide mb-4">VENDRE ?</h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3 flex-1">
                <p>
                  <strong>Successions :</strong> Le commissaire-priseur crée l'équité entre héritiers grâce à une estimation impartiale et une vente transparente.
                </p>
                <p>
                  <strong>Collectionneurs :</strong> Vendre pour racheter, renouveler sa collection, financer de nouvelles acquisitions.
                </p>
                <p>
                  <strong>Changement de vie :</strong> Déménagement, simplification, besoin de liquidités — autant de raisons légitimes de se séparer de biens.
                </p>
                <p className="italic text-xs pt-2 border-t border-border/50">
                  Quelle que soit votre situation, nous vous accompagnons avec discrétion et professionnalisme.
                </p>
              </div>
            </div>
            
            {/* Étape 2 - ESTIMATION & EXPERTISE */}
            <div className="bg-background border border-border/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col">
              <span className="font-serif text-5xl font-light block mb-4 text-primary">2</span>
              <h3 className="font-serif text-lg font-medium tracking-wide mb-4">ESTIMATION & EXPERTISE</h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3 flex-1">
                <p>
                  L'estimation est <strong>toujours gratuite</strong> et sans engagement. Elle reflète le marché actuel, pas une valeur sentimentale.
                </p>
                <p>
                  Pour les pièces complexes, nous faisons appel à des <strong>experts spécialisés</strong> qui authentifient et documentent chaque lot.
                </p>
                <p>
                  <strong>Prix de réserve :</strong> Vous pouvez fixer un minimum en dessous duquel vous refusez de vendre.
                </p>
                <p className="italic text-xs pt-2 border-t border-border/50">
                  Notre expertise engage notre responsabilité d'officier ministériel.
                </p>
              </div>
            </div>
            
            {/* Étape 3 - MISE EN VENTE */}
            <div className="bg-background border border-border/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col">
              <span className="font-serif text-5xl font-light block mb-4 text-primary">3</span>
              <h3 className="font-serif text-lg font-medium tracking-wide mb-4">MISE EN VENTE</h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3 flex-1">
                <p>
                  <strong>Le mandat :</strong> Document qui formalise notre collaboration et définit les conditions de vente.
                </p>
                <p>
                  <strong>Frais de vente :</strong> Nos honoraires sont prélevés uniquement en cas de vente réussie, sur un pourcentage du prix d'adjudication.
                </p>
                <p>
                  <strong>Le bon moment :</strong> Nous choisissons ensemble la vente la plus adaptée à vos objets pour maximiser leur visibilité.
                </p>
                <p className="italic text-xs pt-2 border-t border-border/50">
                  Si l'objet n'est pas vendu, aucun frais ne vous sera facturé.
                </p>
              </div>
            </div>
            
            {/* Étape 4 - RÈGLEMENT */}
            <div className="bg-background border border-border/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col">
              <span className="font-serif text-5xl font-light block mb-4 text-primary">4</span>
              <h3 className="font-serif text-lg font-medium tracking-wide mb-4">RÈGLEMENT</h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3 flex-1">
                <p>
                  Le résultat de la vente vous est communiqué <strong>sous 48 heures</strong> avec le détail des adjudications.
                </p>
                <p>
                  Le règlement est effectué <strong>dès réception des paiements</strong> des acheteurs, généralement sous 3 semaines.
                </p>
                <p>
                  Un <strong>relevé détaillé</strong> accompagne chaque versement avec les montants adjugés et les frais.
                </p>
                <p className="italic text-xs pt-2 border-t border-border/50">
                  Le commissaire-priseur ne perçoit sa rémunération que si l'objet est vendu.
                </p>
              </div>
            </div>
          </div>
          
          {/* Illustration panoramique */}
          <div className="mt-16 px-[30px] overflow-hidden">
            <img 
              src={salleVentesIllustration}
              alt="Salle des ventes aux enchères avec commissaire-priseur et public"
              className="w-[150%] max-w-none ml-[-25%] md:w-full md:max-w-full md:ml-0 h-auto"
            />
          </div>
        </div>
      </section>


      {/* Avis clients */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="section-title mb-12">ILS NOUS ONT FAIT CONFIANCE</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Avis 1 */}
            <div className="bg-background p-6 card-shadow">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-foreground" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-muted-foreground italic leading-relaxed mb-4">
                "Une équipe très professionnelle et à l'écoute. Le commissaire-priseur a su parfaitement valoriser 
                la succession de ma mère. Les estimations étaient justes et la vente s'est déroulée dans 
                d'excellentes conditions. Je recommande vivement."
              </p>
              <p className="font-serif text-sm font-medium">Marie-Claire D.</p>
              <p className="text-xs text-muted-foreground">Aix-en-Provence</p>
            </div>

            {/* Avis 2 */}
            <div className="bg-background p-6 card-shadow">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-foreground" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-muted-foreground italic leading-relaxed mb-4">
                "J'avais quelques tableaux anciens dont je ne connaissais pas la valeur. L'expertise a révélé 
                une œuvre de qualité qui s'est vendue bien au-delà de mes espérances. Merci pour votre 
                transparence et votre accompagnement tout au long du processus."
              </p>
              <p className="font-serif text-sm font-medium">Jean-Pierre M.</p>
              <p className="text-xs text-muted-foreground">Marseille</p>
            </div>

            {/* Avis 3 */}
            <div className="bg-background p-6 card-shadow">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-foreground" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-muted-foreground italic leading-relaxed mb-4">
                "Première expérience aux enchères et certainement pas la dernière ! L'équipe m'a guidé 
                pas à pas pour la vente de bijoux de famille. Le règlement a été rapide et conforme 
                à ce qui était annoncé. Service irréprochable."
              </p>
              <p className="font-serif text-sm font-medium">Sophie L.</p>
              <p className="text-xs text-muted-foreground">Ajaccio</p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Calendrier d'expertise */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="section-title mb-12">CALENDRIER D'EXPERTISE</h2>

          {/* Prochaines expertises avec photos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-background overflow-hidden card-shadow group">
              <div className="aspect-[16/9] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=225&fit=crop"
                  alt="Joaillerie et montres"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <p className="font-sans text-xs tracking-widest text-muted-foreground mb-2">12.06.2025 — 10H00</p>
                <h4 className="font-serif text-lg font-medium mb-1">Joaillerie et Montres</h4>
                <p className="text-sm text-muted-foreground">À l'étude, avec notre expert spécialisé</p>
              </div>
            </div>
            <div className="bg-background overflow-hidden card-shadow group">
              <div className="aspect-[16/9] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=225&fit=crop"
                  alt="Gap"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <p className="font-sans text-xs tracking-widest text-muted-foreground mb-2">26.06.2025 — 13H30</p>
                <h4 className="font-serif text-lg font-medium mb-1">Expertise à Gap</h4>
                <p className="text-sm text-muted-foreground">Place aux Herbes</p>
              </div>
            </div>
            <div className="bg-background overflow-hidden card-shadow group">
              <div className="aspect-[16/9] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1555217851-6141535bd771?w=400&h=225&fit=crop"
                  alt="Brignoles"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <p className="font-sans text-xs tracking-widest text-muted-foreground mb-2">03.07.2025 — 14H00</p>
                <h4 className="font-serif text-lg font-medium mb-1">Expertise à Brignoles</h4>
                <p className="text-sm text-muted-foreground">Centre-ville</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Sans rendez-vous */}
            <div className="text-center px-6 py-8 bg-background card-shadow cursor-default">
              <h3 className="font-serif text-lg font-medium tracking-wide mb-4">SANS RENDEZ-VOUS</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tous les lundis<br />9h00 — 12h00
              </p>
            </div>

            {/* Expertise confidentielle */}
            <Link 
              to="/contact"
              className="text-center px-6 py-8 bg-background card-shadow group"
            >
              <h3 className="font-serif text-lg font-medium tracking-wide mb-4">
                <span className="hidden md:inline">EXPERTISE CONFIDENTIELLE</span>
                <span className="md:hidden">EXPERTISE DISCRÈTE</span>
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Sur rendez-vous
              </p>
              <span className="inline-block font-sans text-xs tracking-widest border border-brand-primary px-3 py-1 group-hover:bg-brand-primary group-hover:text-brand-primary-foreground transition-colors">
                PRENDRE RDV
              </span>
            </Link>

            {/* Rendez-vous chez vous */}
            <Link 
              to="/contact"
              className="text-center px-6 py-8 bg-background card-shadow group"
            >
              <h3 className="font-serif text-lg font-medium tracking-wide mb-4">RENDEZ-VOUS CHEZ VOUS</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Nous nous déplaçons
              </p>
              <span className="inline-block font-sans text-xs tracking-widest border border-brand-primary px-3 py-1 group-hover:bg-brand-primary group-hover:text-brand-primary-foreground transition-colors">
                CONTACTER
              </span>
            </Link>

            {/* Estimation en ligne */}
            <Link 
              to="/contact"
              className="text-center px-6 py-8 bg-background card-shadow group"
            >
              <h3 className="font-serif text-lg font-medium tracking-wide mb-4">ESTIMATION EN LIGNE</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Réponse sous 48h
              </p>
              <span className="inline-block font-sans text-xs tracking-widest border border-brand-primary px-3 py-1 group-hover:bg-brand-primary group-hover:text-brand-primary-foreground transition-colors">
                ENVOYER PHOTOS
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Spécialités */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <h2 className="section-title mb-4">NOS SPÉCIALITÉS</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Chaque maison de ventes a ses spécialités, ses domaines d'expertises privilégiés, voici les nôtres.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {specialites.map((spec) => (
              <div 
                key={spec.id}
                className="bg-background overflow-hidden card-shadow cursor-pointer group"
                onClick={() => setActiveSpecialite(activeSpecialite === spec.id ? null : spec.id)}
              >
                <div className="aspect-[5/4] overflow-hidden">
                  <img 
                    src={spec.image} 
                    alt={spec.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-sm font-medium">{spec.title}</h3>
                  <div 
                    className={`
                      overflow-hidden transition-all duration-300
                      ${activeSpecialite === spec.id ? "max-h-32 opacity-100 mt-2" : "max-h-0 opacity-0"}
                    `}
                  >
                    <p className="text-xs text-muted-foreground">{spec.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Successions */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="section-title mb-12">SUCCESSIONS, INVENTAIRES ET PARTAGES</h2>
          
          <div className="mb-12">
            <img 
              src={successionIllustration}
              alt="Expert réalisant un inventaire dans un salon bourgeois"
              className="w-full h-auto max-h-[400px] object-cover card-shadow"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Ces situations que l'on traverse souvent pour la première fois, l'officier ministériel 
                les connaît parfaitement — tout comme le notaire. Le commissaire-priseur vous accompagne 
                avec discrétion et humanité dans ces circonstances délicates.
              </p>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Nous simplifions chaque étape : de l'inventaire complet à la valorisation 
                de chaque objet, jusqu'à la gestion intégrale d'une propriété à vider. 
                Notre expertise vous garantit une estimation juste et une vente dans les meilleures conditions.
              </p>
            </div>
            <div>
              <div className="bg-muted/50 p-4 mb-6 border-l-4 border-brand-primary">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Article 764 du Code général des impôts :</strong>
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  En l'absence d'inventaire ou de vente publique dans les cinq ans précédant le décès, 
                  les meubles meublants sont évalués forfaitairement à <strong>5% de la valeur des biens immobiliers</strong>. 
                  Un inventaire détaillé par un commissaire-priseur permet souvent de réduire cette base imposable.
                </p>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                <strong>Transparence fiscale :</strong> La vente aux enchères publiques 
                offre des garanties reconnues par l'administration fiscale et assure l'équité entre héritiers.
              </p>
              <Button variant="outline-brand" className="font-sans text-xs tracking-widest px-8 py-3 h-auto" asChild>
                <Link to="/contact">DÉCOUVRIR LE MÉTIER DE COMMISSAIRE-PRISEUR</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>


      {/* Contact final */}
      <section className="pt-10 md:pt-12 pb-0">
        <div className="bg-brand-primary text-brand-primary-foreground p-6 md:p-10 text-center card-shadow">
          <h2 className="font-serif text-xl md:text-2xl font-light mb-2">
            Vendre aux enchères est accessible à tous
          </h2>
          <p className="text-background/70 mb-6 text-base">
            Vous avez un projet, des questions ? Nous serons heureux d'y répondre.
          </p>
          <div className="flex items-center justify-center gap-6">
            <a 
              href="tel:+33495121212"
              className="inline-flex items-center gap-3 font-serif text-xl md:text-2xl font-light hover:opacity-80 transition-opacity"
            >
              <Phone className="w-6 h-6" />
              04 95 12 12 12
            </a>
            <a 
              href="mailto:jean@lemarteaudigital.fr"
              className="inline-flex items-center gap-3 font-serif text-xl md:text-2xl font-light hover:opacity-80 transition-opacity"
            >
              <Mail className="w-6 h-6" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Vendre;

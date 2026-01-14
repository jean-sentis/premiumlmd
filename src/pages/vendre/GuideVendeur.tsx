import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import TimelineLayout from "@/components/TimelineLayout";
import Footer from "@/components/Footer";
import ResultCard from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import hotelDesVentesIllustration from "@/assets/hotel-des-ventes-illustration.png";
import expertiseBijouIllustration from "@/assets/expertise-bijou-illustration.png";
import coupDeMarteau from "@/assets/coup-de-marteau-illustration.png";
import bavellaMontagnes from "@/assets/bavella-montagnes.jpeg";
import villageCorse from "@/assets/village-corse-anecdote.jpeg";
import recordJaguarXK120 from "@/assets/record-jaguar-xk120.png";
import recordTinguelySculpture from "@/assets/record-tinguely-sculpture.png";
import recordCesarCompression from "@/assets/record-cesar-compression.png";

const topResults = [
  {
    title: "Jaguar XK120 Alloy Roadster",
    artist: "1950, carrosserie aluminium",
    price: "125 000 €",
    date: "12 mai 2018",
    imageUrl: recordJaguarXK120,
  },
  {
    title: "Sculpture méta-mécanique",
    artist: "Jean Tinguely",
    price: "85 000 €",
    date: "22 mars 2017",
    imageUrl: recordTinguelySculpture,
  },
  {
    title: "Compression de voiture",
    artist: "César Baldaccini",
    price: "72 000 €",
    date: "8 novembre 2019",
    imageUrl: recordCesarCompression,
  },
  {
    title: "Sac Birkin 35",
    artist: "Hermès, cuir Togo gold",
    price: "18 500 €",
    date: "14 juin 2023",
    imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
  },
  {
    title: "Bague solitaire diamant 3,52 ct",
    artist: "Taille brillant, couleur D, pureté VVS1",
    price: "48 500 €",
    date: "15 décembre 2022",
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop",
  },
  {
    title: "Montre Rolex Daytona",
    artist: "Or rose, cadran chocolat",
    price: "42 000 €",
    date: "5 septembre 2019",
    imageUrl: "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=400&h=400&fit=crop",
  },
];

const GuideVendeur = () => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [selectedResult, setSelectedResult] = useState<{
    title: string;
    artist?: string;
    price: string;
    date?: string;
    imageUrl: string;
  } | null>(null);

  return (
    <>
      <Helmet>
        <title>Guide du Vendeur | Douze pages & associés</title>
        <meta name="description" content="Tout savoir pour vendre aux enchères : estimation, expertise, mise en vente et règlement." />
      </Helmet>

      <TimelineLayout pageTitle="Guide du Vendeur" mode="vendre">

        {/* Section Pourquoi vendre aux enchères - Version mobile : image + titre, puis cartouches séparées */}
        {/* Version Desktop : Photo Bavella avec titre en haut et cartouches sur 2/3 bas */}
        <section className="relative hidden md:block">
          <img 
            src={bavellaMontagnes} 
            alt="Les aiguilles de Bavella, Corse" 
            className="w-full h-auto"
          />
          {/* Titre en haut */}
          <div className="absolute top-0 left-0 right-0 pt-[83px]">
            <h2 className="text-center text-black text-xl font-semibold tracking-[0.15em] uppercase">POURQUOI VENDRE AUX ENCHÈRES ?</h2>
          </div>
          
          {/* 4 cartouches sur les 2/3 bas */}
          <div className="absolute bottom-0 left-0 right-0 h-2/3 flex items-center pb-6">
            <div className="container">
              <div className="grid grid-cols-2 gap-x-[70px] gap-y-4 max-w-5xl mx-auto">
                
                {/* 1 - L'humain */}
                <div className="bg-transparent border border-white p-4 mt-[15px]">
                  <div className="flex items-start gap-3">
                    <span className="font-serif text-4xl font-light text-white shrink-0">1</span>
                    <div>
                      <h3 className="font-serif text-lg font-medium mb-2 text-white">L'humain</h3>
                      <p className="text-[15px] text-white leading-relaxed">
                        Le commissaire-priseur est <strong>officier ministériel</strong> : sa parole l'engage. Chaque descriptif est sincère, chaque altération mentionnée. Vous n'êtes pas sur une plateforme anonyme — notre équipe vous accompagne personnellement.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2 - La sécurité */}
                <div className="bg-transparent border border-white p-4 mt-[15px]">
                  <div className="flex items-start gap-3">
                    <span className="font-serif text-4xl font-light text-white shrink-0">2</span>
                    <div>
                      <h3 className="font-serif text-lg font-medium mb-2 text-white">La sécurité</h3>
                      <p className="text-[15px] text-white leading-relaxed">
                        <strong>Toutes les transactions sont sécurisées.</strong> Votre bien n'est remis à l'acheteur qu'après paiement intégral. Une vraie protection face aux milliers d'escroqueries quotidiennes sur le digital.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3 - L'exposition */}
                <div className="bg-transparent border border-white p-4 mt-[50px]">
                  <div className="flex items-start gap-3">
                    <span className="font-serif text-4xl font-light text-white shrink-0">3</span>
                    <div>
                      <h3 className="font-serif text-lg font-medium mb-2 text-white">L'exposition</h3>
                      <p className="text-[15px] text-white leading-relaxed">
                        Photos professionnelles, ventes spécialisées, catalogues dédiés. Nos plateformes — <strong>Interenchères, Drouot</strong> — touchent des milliers d'acheteurs en France et à l'étranger.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4 - Le prix */}
                <div className="bg-transparent border border-white p-4 mt-[50px]">
                  <div className="flex items-start gap-3">
                    <span className="font-serif text-4xl font-light text-white shrink-0">4</span>
                    <div>
                      <h3 className="font-serif text-lg font-medium mb-2 text-white">Le meilleur prix</h3>
                      <p className="text-[15px] text-white leading-relaxed">
                        Un <strong>prix de réserve</strong> vous protège. Quand plusieurs enchérisseurs se disputent un objet, les prix s'envolent. <strong>Chaque vente a ses belles surprises.</strong>
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Version Mobile : Image bandeau + Cartouches séparées en dessous */}
        <section className="md:hidden">
          {/* Bandeau image avec titre */}
          <div className="relative">
            <img 
              src={bavellaMontagnes} 
              alt="Les aiguilles de Bavella, Corse" 
              className="w-full h-40 object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <h2 className="text-center text-white text-base font-semibold tracking-[0.12em] uppercase px-4">
                POURQUOI VENDRE AUX ENCHÈRES EN CORSE-DU-SUD ?
              </h2>
            </div>
          </div>
          
          {/* 4 cartouches en grille 2x2 */}
          <div className="bg-[hsl(var(--brand-primary))] py-6 px-4">
            <div className="grid grid-cols-2 gap-3">
              
              {/* 1 - L'humain */}
              <div className="bg-white/10 border border-white/30 p-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-2xl font-light text-white">1</span>
                    <h3 className="font-serif text-sm font-medium text-white">L'humain</h3>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed">
                    Le commissaire-priseur est <strong>officier ministériel</strong> : sa parole l'engage. Notre équipe vous accompagne personnellement.
                  </p>
                </div>
              </div>

              {/* 2 - La sécurité */}
              <div className="bg-white/10 border border-white/30 p-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-2xl font-light text-white">2</span>
                    <h3 className="font-serif text-sm font-medium text-white">La sécurité</h3>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed">
                    <strong>Transactions sécurisées.</strong> Votre bien n'est remis qu'après paiement intégral.
                  </p>
                </div>
              </div>

              {/* 3 - L'exposition */}
              <div className="bg-white/10 border border-white/30 p-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-2xl font-light text-white">3</span>
                    <h3 className="font-serif text-sm font-medium text-white">L'exposition</h3>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed">
                    Photos pro, catalogues dédiés. <strong>Interenchères, Drouot</strong> touchent des milliers d'acheteurs.
                  </p>
                </div>
              </div>

              {/* 4 - Le prix */}
              <div className="bg-white/10 border border-white/30 p-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-2xl font-light text-white">4</span>
                    <h3 className="font-serif text-sm font-medium text-white">Le meilleur prix</h3>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed">
                    Un <strong>prix de réserve</strong> vous protège. Les enchères font monter les prix.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* TITRE H2 - Pourquoi nous confier vos biens ? */}
        <section className="pt-10 pb-3 md:pt-12 md:pb-4">
          <div className="container">
            <h2 className="text-lg md:text-xl font-serif text-center text-foreground">Pourquoi nous confier vos biens ?</h2>
          </div>
        </section>

        {/* Texte personnel de Maître Marcaggi */}
        <section className="pb-8 md:pb-12">
          <div className="container">
            <div className="max-w-4xl mx-auto space-y-6 text-justify">
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Comme chacun d'entre nous, je suis attaché à cette terre, à son patrimoine que nous avons tous en partage. Je connais les histoires de familles, les secrets, les difficultés, l'attachement que nous avons tous à nos aïeux, à cette histoire qui est la nôtre.
              </p>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Le commissaire-priseur, si vous le souhaitez, peut vous aider à valoriser ce patrimoine si vous ne pouvez plus le garder. <strong className="text-foreground">Il sera mieux apprécié dans des maisons vivantes que dans des greniers humides.</strong>
              </p>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Que ce soit parce que vous souhaitez vous défaire d'une collection, que vous ayez besoin d'argent, que ce soit dans le règlement d'une succession, d'une indivision sous l'autorité du notaire, quelles que soient vos raisons, je ferai en sorte que les échanges soient les plus profitables, les plus féconds et que toutes les solutions soient trouvées pour que vos biens, vos collections et votre patrimoine soient valorisés, expertisés, vendus aux enchères au mieux.
              </p>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Si par extraordinaire émergeait de votre patrimoine un bien dont la valeur peut être très importante, l'Hôtel des Ventes s'attachera les services d'un expert national et sera avec lui à défendre vos intérêts à la barre des enchères.
              </p>
              <div className="flex flex-col items-end mt-8 gap-2">
                <p className="text-sm md:text-base text-foreground font-medium">
                  Maître Jean-Baptiste Marcaggi
                </p>
                <Link 
                  to="/la-maison" 
                  className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                >
                  Découvrez notre maison
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ANECDOTE RÉELLE - deux colonnes */}
        <section className="pb-8 md:pb-12">
          <div className="border-y border-border/40 bg-muted/20 p-6 md:p-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-end">
              {/* Texte à gauche */}
              <div className="flex flex-col justify-end text-justify">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-8 font-bold">Anecdote réelle</p>
                
                <div className="space-y-6 text-sm md:text-base text-muted-foreground leading-relaxed">
                  <p>
                    Un jour, une famille nous appelle, un peu bouleversée.
                  </p>
                  <p>
                    Ils avaient mis sur une plateforme de vente en ligne une vieille armoire murale — un rangement qu'ils voulaient donner avant des travaux.
                  </p>
                  <p>
                    Depuis le matin, leur téléphone n'arrêtait pas de sonner. On leur proposait d'abord de venir les débarrasser à l'instant, puis une autre personne cent euros, puis deux cents, puis de plus en plus.
                  </p>
                  <p>
                    Un ami leur a conseillé de nous appeler : <em>« Le commissaire-priseur saura ce que c'est, et son intérêt c'est de vendre au mieux. Car il est commissionné, et donc son intérêt est celui du vendeur. »</em>
                  </p>
                  <p>
                    Nous sommes arrivés très rapidement. J'ai reconnu tout de suite un meuble des années cinquante. J'ai appelé mon expert en art du vingtième siècle. Il a pris l'avion le lendemain. Nous avions clairement identifié de quoi il s'agissait : une pièce de l'époque de Charlotte Perriand, Le Corbusier, Jean Prouvé.
                  </p>
                  <p>
                    Nous avons organisé des enchères, nous avons été très proches de la famille avec qui toutes les décisions ont été partagées.
                  </p>
                  <p className="text-foreground font-medium">
                    Et en définitive, l'œuvre que les marchands voulaient s'arracher pour quelques centaines d'euros a été vendue aux enchères plus cher que le prix de la maison. Cette famille a trouvé, sans le savoir, de quoi financer les travaux qu'ils préparaient — et bien mieux.
                  </p>
                </div>
              </div>
              
              {/* Photo à droite */}
              <div className="flex items-end justify-center">
                <img 
                  src={villageCorse}
                  alt="Village corse traditionnel"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

          </div>
        </section>


        {/* Comment vendre */}
        <section className="pt-6 pb-10 md:pt-8 md:pb-12 bg-muted/30">
          <div className="container">
            <h2 className="section-title !text-[14px] !font-sans !font-medium !tracking-[0.15em] mb-16">COMMENT VENDRE AUX ENCHÈRES ?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {/* Étape 1 - ESTIMATION */}
              <div className="bg-background border border-border/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col">
                <span className="font-serif text-5xl font-light block mb-4 text-primary">1</span>
                <h3 className="font-serif text-lg font-medium tracking-wide mb-4">ESTIMATION</h3>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3 flex-1">
                  <p>
                    L'estimation est <strong>toujours gratuite</strong> et sans engagement. Elle reflète le marché actuel, pas une valeur sentimentale.
                  </p>
                  <p>
                    <strong>En ligne, sur rendez-vous ou à domicile</strong> — nous nous adaptons à vos contraintes.
                  </p>
                  <p>
                    Pour les pièces complexes, nous faisons appel à des <strong>experts spécialisés</strong>.
                  </p>
                  <div className="pt-2 border-t border-border/50">
                    <Link 
                      to="/vendre/estimation-en-ligne" 
                      className="inline-block border border-primary/50 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
                    >
                      Expertise et Estimation
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Étape 2 - MANDAT */}
              <div className="bg-background border border-border/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col">
                <span className="font-serif text-5xl font-light block mb-4 text-primary">2</span>
                <h3 className="font-serif text-lg font-medium tracking-wide mb-4">MANDAT</h3>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3 flex-1">
                  <p>
                    <strong>Le mandat :</strong> Document qui formalise notre collaboration et définit les conditions de vente.
                  </p>
                  <p>
                    <strong>Prix de réserve :</strong> Vous pouvez fixer un minimum en dessous duquel vous refusez de vendre.
                  </p>
                  <p>
                    <strong>Le bon moment :</strong> Nous choisissons ensemble la ou les ventes thématiques les plus adaptées pour maximiser la visibilité.
                  </p>
                  <p className="italic text-xs pt-2 border-t border-border/50">
                    Si l'objet n'est pas vendu, aucun frais ne vous sera facturé.
                  </p>
                </div>
              </div>
              
              {/* Étape 3 - VENTE */}
              <div className="bg-background border border-border/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col">
                <span className="font-serif text-5xl font-light block mb-4 text-primary">3</span>
                <h3 className="font-serif text-lg font-medium tracking-wide mb-4">VENTE</h3>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3 flex-1">
                  <p>
                    <strong>Photographies professionnelles</strong> et descriptifs soignés pour valoriser vos objets.
                  </p>
                  <p>
                    <strong>Promotion multi-canal :</strong> Newsletters, réseaux sociaux, plateformes spécialisées.
                  </p>
                  <p>
                    <strong>Jour J :</strong> Vente en salle avec enchères en ligne simultanées pour maximiser la concurrence.
                  </p>
                  <p className="italic text-xs pt-2 border-t border-border/50">
                    Nous vous tenons informé du résultat dès la fin de la vente.
                  </p>
                </div>
              </div>
              
              {/* Étape 4 - RÈGLEMENT */}
              <div className="bg-background border border-border/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col">
                <span className="font-serif text-5xl font-light block mb-4 text-primary">4</span>
                <h3 className="font-serif text-lg font-medium tracking-wide mb-4">RÈGLEMENT</h3>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3 flex-1">
                  <p>
                    <strong>Délai de paiement :</strong> Le règlement intervient généralement dans les 4 à 6 semaines suivant la vente.
                  </p>
                  <p>
                    <strong>Bordereau détaillé :</strong> Document récapitulatif précisant le prix d'adjudication et les frais.
                  </p>
                  <p>
                    <strong>Virement bancaire :</strong> Mode de paiement principal, sécurisé et tracé.
                  </p>
                  <p className="italic text-xs pt-2 border-t border-border/50">
                    Nous nous assurons que l'acheteur a bien réglé avant de vous verser les fonds.
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton règlement */}
            <div className="text-center mt-12">
              <Button variant="outline-brand" className="font-sans text-sm tracking-widest" asChild>
                <a href="/documents/reglement-vendre.pdf" target="_blank" rel="noopener noreferrer">
                  VOIR NOTRE RÈGLEMENT
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Records d'enchères - Carousel */}
        <section className="py-8 md:py-12 bg-[hsl(var(--brand-primary))]">
          <div className="container">
            <h2 className="section-title mb-12 text-white border-white">RECORDS D'ENCHÈRES</h2>
            <div className="relative">
              <div 
                ref={carouselRef}
                className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
              >
                {topResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-64 snap-start cursor-pointer"
                    onClick={() => setSelectedResult(result)}
                  >
                    <ResultCard {...result} variant="light" />
                  </div>
                ))}
              </div>
              {/* Navigation arrows */}
              <button 
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 border border-white bg-transparent text-white flex items-center justify-center hover:bg-white hover:text-[hsl(var(--brand-primary))] transition-colors hidden md:flex"
                onClick={() => carouselRef.current?.scrollBy({ left: -280, behavior: 'smooth' })}
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 border border-white bg-transparent text-white flex items-center justify-center hover:bg-white hover:text-[hsl(var(--brand-primary))] transition-colors hidden md:flex"
                onClick={() => carouselRef.current?.scrollBy({ left: 280, behavior: 'smooth' })}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Cartouche chasseurs de trésors */}
            <div className="mt-10 p-5 border border-white/30 max-w-2xl mx-auto text-center">
              <p className="font-serif text-base md:text-lg text-white mb-3">
                Tous les commissaires-priseurs sont des chasseurs de trésors.
              </p>
              <Link
                to="/contact"
                className="inline-block border border-white text-white px-6 py-2 font-sans text-xs tracking-widest hover:bg-white hover:text-[hsl(var(--brand-primary))] transition-colors"
              >
                NOUS CONTACTER
              </Link>
            </div>
          </div>
        </section>

        {/* Lightbox for Records */}
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


        <Footer />
      </TimelineLayout>

    </>
  );
};

export default GuideVendeur;

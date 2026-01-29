import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, ArrowRight, Calendar } from "lucide-react";
import InlinePlanningSlot from "@/components/InlinePlanningSlot";
import Footer from "@/components/Footer";
import TimelineLayout from "@/components/TimelineLayout";
import { Button } from "@/components/ui/button";
import { COMPANY_INFO } from "@/lib/site-config";
import InventaireFormDialog from "@/components/InventaireFormDialog";
import inventaireModerneUrbain from "@/assets/inventaire-moderne-urbain.png";
import chasseurInventaireViolet from "@/assets/chasseur-inventaire-violet.png";

const InventaireDomicile = () => {
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  return (
    <TimelineLayout pageTitle="Inventaire à Domicile" mode="vendre" hideTimeline>
      <Helmet>
        <title>Inventaire à Domicile | Douze pages & associés</title>
        <meta name="description" content="Inventaire et estimation de patrimoine à domicile : successions, donations, partages, assurances. Nos commissaires-priseurs se déplacent en Corse et région parisienne." />
      </Helmet>

      {/* Introduction */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12 items-center">
              {/* Image 2/3 */}
              <div className="md:col-span-2">
                <img 
                  src={inventaireModerneUrbain} 
                  alt="Inventaire à domicile - expertise de collections"
                  className="w-full h-auto rounded-sm shadow-lg"
                />
              </div>
              {/* Texte 1/3 */}
              <div>
                <h2 className="font-serif text-lg font-medium mb-4">
                  Réaliser un inventaire avec notre maison
                </h2>
                <p className="text-sm md:text-base leading-relaxed text-muted-foreground mb-3">
                  Nous réalisons des inventaires complets en Corse ou sur le Continent, 
                  avec le sérieux et la discrétion que ces situations exigent.
                </p>
                <p className="text-sm md:text-base leading-relaxed text-foreground font-medium mb-6">
                  Nos commissaires-priseurs et experts mettent leur connaissance du marché 
                  et leur expérience à votre service, en toute confidentialité.
                </p>
                <Button 
                  onClick={() => setFormDialogOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Demande d'inventaire à domicile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pourquoi réaliser un inventaire ? */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="section-title mb-8">POURQUOI RÉALISER UN INVENTAIRE ?</h2>
            <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-12 text-sm md:text-base">
              Un inventaire professionnel est bien plus qu'une simple liste d'objets. 
              C'est un document officiel, rédigé par un commissaire-priseur judiciaire, 
              qui protège vos intérêts et ceux de vos proches.
            </p>
            
            {/* 1. Succession et partage */}
            <div className="mb-12">
              <div className="flex items-start gap-4 mb-4">
                <span className="font-serif text-4xl font-light text-primary shrink-0">1</span>
                <div>
                  <h3 className="font-serif text-lg font-medium tracking-wide mb-3">
                    SUCCESSION & PARTAGE : PROTÉGER LES HÉRITIERS
                  </h3>
                    <div className="space-y-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                    <p>
                      Perdre un proche est une épreuve. Au chagrin s'ajoutent souvent des questions 
                      complexes : <strong>comment répartir équitablement les biens ?</strong> La valeur 
                      sentimentale est rarement la valeur vénale. Comment éviter les tensions entre 
                      héritiers ? Comment être certain que chacun reçoive sa juste part ?
                    </p>
                    <p>
                      Ces questions, les notaires les rencontrent tous les jours et c'est souvent eux 
                      qui nous missionnent pour réaliser un inventaire du patrimoine. Toute l'année, 
                      nous travaillons main dans la main avec ces grands professionnels.
                    </p>
                    <p>
                      L'inventaire réalisé par un commissaire-priseur apporte une réponse claire et impartiale. 
                      En tant qu'<strong>officier ministériel assermenté</strong>, le commissaire-priseur dresse 
                      une liste exhaustive des biens avec leur <strong>valeur de marché objective</strong>. 
                      Ce document a une <strong>force probante devant les tribunaux</strong> et auprès du notaire.
                    </p>
                    <div className="bg-brand-primary/5 border-l-4 border-brand-primary p-4 my-4 text-sm">
                      <h4 className="font-serif text-base font-medium text-brand-primary mb-2">
                        L'aspect fiscal : une économie souvent méconnue
                      </h4>
                      <p className="text-foreground mb-3">
                        Selon l'article 764 du Code général des impôts, en l'absence d'inventaire 
                        professionnel, l'administration fiscale <strong>présume que le patrimoine mobilier 
                        représente 5 % de la valeur de l'actif brut successoral</strong>.
                      </p>
                      <p className="text-foreground mb-3">
                        Concrètement : si un bien immobilier est estimé à 500 000 €, les meubles seront 
                        automatiquement taxés sur une base de 25 000 €, <strong>même s'ils valent beaucoup moins</strong>.
                      </p>
                      <p className="text-foreground font-medium">
                        Un inventaire professionnel permet souvent de <strong>réduire significativement 
                        les droits de succession</strong>, parfois de plusieurs milliers d'euros.
                      </p>
                    </div>
                    <p>
                      De même, en cas de <strong>divorce ou de séparation</strong>, l'inventaire garantit 
                      un partage équitable, sans que l'un des conjoints ne soit lésé.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Protection et assurance */}
            <div className="mb-12">
              <div className="flex items-start gap-4 mb-4">
                <span className="font-serif text-4xl font-light text-primary shrink-0">2</span>
                <div>
                  <h3 className="font-serif text-lg font-medium tracking-wide mb-3">
                    ASSURANCE : ÊTRE CORRECTEMENT INDEMNISÉ
                  </h3>
                  <div className="space-y-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                    <p>
                      Un incendie, un dégât des eaux, un cambriolage… Ces sinistres surviennent 
                      toujours au pire moment. Et lorsqu'ils arrivent, <strong>comment prouver 
                      ce que vous possédiez et sa valeur ?</strong>
                    </p>
                    <p>
                      Sans inventaire préalable, l'indemnisation est souvent décevante. Les assureurs 
                      appliquent des forfaits ou des coefficients de vétusté qui ne reflètent pas 
                      la valeur réelle de vos biens.
                    </p>
                    <p>
                      <strong>Un inventaire professionnel constitue la preuve irréfutable</strong> de la 
                      nature et de la valeur de vos possessions. Il vous permet de négocier 
                      une indemnisation à la hauteur de votre préjudice réel.
                    </p>
                    <p className="italic">
                      Conseil : faites réaliser un inventaire avant le sinistre, pas après. 
                      C'est le meilleur moyen de vous protéger.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Valorisation et connaissance */}
            <div className="mb-12">
              <div className="flex items-start gap-4 mb-4">
                <span className="font-serif text-4xl font-light text-primary shrink-0">3</span>
                <div>
                  <h3 className="font-serif text-lg font-medium tracking-wide mb-3">
                    CONNAISSANCE : DÉCOUVRIR LA VALEUR DE VOTRE PATRIMOINE
                  </h3>
                  <div className="space-y-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                    <p>
                      Vous possédez des meubles de famille, des tableaux, des bijoux anciens, 
                      une collection héritée de vos parents ? <strong>Connaissez-vous vraiment leur valeur ?</strong>
                    </p>
                    <p>
                      L'inventaire est l'occasion de faire le point sur votre patrimoine mobilier. 
                      Nos experts peuvent identifier des pièces de valeur insoupçonnée : un meuble 
                      régional signé, une toile d'un artiste coté, une pièce de collection recherchée.
                    </p>
                    <p>
                      Cette connaissance vous permet de <strong>mieux gérer votre patrimoine</strong> : 
                      décider de vendre certaines pièces au bon moment, adapter votre couverture 
                      d'assurance, ou simplement savoir ce que vous transmettrez à vos enfants.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Impartialité et transparence */}
            <div className="mb-8">
              <div className="flex items-start gap-4 mb-4">
                <span className="font-serif text-4xl font-light text-primary shrink-0">4</span>
                <div>
                  <h3 className="font-serif text-lg font-medium tracking-wide mb-3">
                    IMPARTIALITÉ : UN TIERS DE CONFIANCE
                  </h3>
                  <div className="space-y-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                    <p>
                      Le commissaire-priseur judiciaire est un <strong>officier ministériel nommé 
                      par le garde des Sceaux</strong>. Il prête serment et est tenu à une stricte 
                      déontologie professionnelle.
                    </p>
                    <p>
                      Contrairement à un antiquaire ou un marchand, il n'a <strong>aucun intérêt 
                      à sous-évaluer ou surévaluer vos biens</strong>. Son expertise est objective, 
                      fondée sur sa connaissance du marché et les résultats de ventes récentes.
                    </p>
                    <p>
                      C'est cette neutralité qui donne toute sa valeur à l'inventaire, notamment 
                      lorsqu'il doit servir dans un contexte où les intérêts des parties divergent.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Comment ça marche ? + Planning */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="section-title mb-8">COMMENT ÇA MARCHE ?</h2>
          
          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-10">
            {/* Étape 1 */}
            <Link 
              to="/contact"
              className="bg-background border border-border/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col group"
            >
              <span className="font-serif text-3xl font-light block mb-3 text-primary">1</span>
              <h3 className="font-serif text-sm font-medium tracking-wide mb-2 group-hover:text-brand-secondary transition-colors">PRISE DE CONTACT</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                Contactez-nous par téléphone ou email pour décrire votre projet et l'objectif de l'inventaire.
              </p>
              <span className="text-xs text-brand-secondary mt-3 flex items-center gap-1">
                Nous contacter <ArrowRight className="w-3 h-3" />
              </span>
            </Link>

            {/* Étape 2 */}
            <div className="bg-background border border-border/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col">
              <span className="font-serif text-3xl font-light block mb-3 text-primary">2</span>
              <h3 className="font-serif text-sm font-medium tracking-wide mb-2">DÉPLACEMENT</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                Notre commissaire-priseur se déplace chez vous pour inspecter, photographier et estimer chaque objet.
              </p>
            </div>

            {/* Étape 3 */}
            <div className="bg-background border border-border/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col">
              <span className="font-serif text-3xl font-light block mb-3 text-primary">3</span>
              <h3 className="font-serif text-sm font-medium tracking-wide mb-2">INVENTAIRE</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                Vous recevez la liste précise de vos biens : chaque objet est répertorié, photographié et estimé.
              </p>
            </div>
          </div>

          {/* Planning intégré - largeur standard */}
          <div className="flex items-center justify-center gap-2 mb-4 mt-10">
            <Calendar className="w-4 h-4 text-brand-secondary" />
            <p className="text-sm text-muted-foreground">
              Consultez notre planning pour convenir d'un rendez-vous
            </p>
          </div>
          <InlinePlanningSlot scrollOffsetPx={30} />
        </div>
      </section>

      {/* Que faire de cet inventaire ? */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-lg font-medium text-foreground mb-4">
              Que faire de cet inventaire ?
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Si l'inventaire a pour objectif une vente aux enchères ou une cession des objets, 
              le commissaire-priseur peut proposer des conseils concernant la mise en vente 
              des biens, les meilleures stratégies et les calendriers de vente. Il peut aussi 
              recommander des options de stockage sécurisé pour les objets de grande valeur 
              ou fragiles avant la vente.
            </p>
          </div>
        </div>
      </section>

      {/* Zone d'intervention */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <MapPin className="w-5 h-5 text-brand-secondary" />
              <h2 className="font-serif text-lg font-medium">Zone d'intervention</h2>
            </div>
            <p className="text-sm md:text-base text-muted-foreground mb-4">
              Nous intervenons principalement sur la <strong>Corse entière</strong> et la <strong>région parisienne</strong>.
            </p>
            <p className="text-sm text-muted-foreground italic">
              Pour les autres régions, nous pouvons vous orienter vers des confrères de confiance.
            </p>
          </div>
        </div>
      </section>

      {/* CTA - Nous contacter */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Illustration */}
              <div className="hidden md:block">
                <img 
                  src={chasseurInventaireViolet} 
                  alt="Commissaire-priseur découvrant des trésors"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* CTA Content */}
              <div className="bg-brand-primary text-brand-primary-foreground p-8 md:p-12 flex flex-col justify-center">
                <h2 className="font-serif text-lg font-medium mb-4 text-center md:text-left">
                  Demandez un inventaire à domicile
                </h2>
                <p className="text-sm mb-6 text-center md:text-left" style={{ color: '#c4a0ff' }}>
                  Et souvent, sous le regard d'un commissaire-priseur, les objets révèlent leur véritable valeur.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-8">
                <Button 
                    onClick={() => setFormDialogOpen(true)}
                    className="bg-background text-brand-primary hover:bg-background/90"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Demande d'inventaire
                  </Button>
                  <Button 
                    variant="outline"
                    className="bg-background text-foreground border-background hover:bg-background/90"
                    asChild
                  >
                    <a href={`tel:${COMPANY_INFO.phone.replace(/\s/g, '')}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      {COMPANY_INFO.phone}
                    </a>
                  </Button>
                </div>
                
                <div className="border-t border-brand-primary-foreground/20 pt-6 text-center md:text-left">
                  <p className="text-sm text-brand-primary-foreground/70 mb-4">Vous préférez vous déplacer ?</p>
                  <Link 
                    to="/vendre/estimation-en-ligne"
                    className="inline-flex items-center gap-2 text-brand-primary-foreground hover:underline"
                  >
                    Découvrir nos autres services d'estimation
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <InventaireFormDialog open={formDialogOpen} onOpenChange={setFormDialogOpen} />
      <Footer />
    </TimelineLayout>
  );
};

export default InventaireDomicile;
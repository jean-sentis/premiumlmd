import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InlinePlanningSlot from "@/components/InlinePlanningSlot";
import { Link } from "react-router-dom";
import { Recycle } from "lucide-react";
import { Button } from "@/components/ui/button";
import salleEncheresPublic from "@/assets/salle-encheres-public.png";
import fondRobesAcheter from "@/assets/fond-robes-acheter.png";

const Acheter = () => {
  const [showShippingDetails, setShowShippingDetails] = useState(false);

  const transporteurs = [
    { name: "Mailboxes Biarritz", specialty: "Petits et moyens colis", phone: "05 59 XX XX XX" },
    { name: "Cadres & Transport Art", specialty: "Œuvres d'art et objets fragiles", phone: "06 XX XX XX XX" },
    { name: "Convoyeur Auto Collection", specialty: "Véhicules de collection", phone: "06 XX XX XX XX" },
  ];

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
              src={fondRobesAcheter}
              alt="Collection de robes et vêtements de créateurs"
              className="w-full h-48 md:h-64 object-cover opacity-70 blur-[2px] saturate-[0.7]"
            />
            <div className="absolute inset-0 bg-white/30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-primary/15 to-primary/30 pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="text-center frame-title">
                Acheter aux enchères des pièces uniques !
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Slot inline pour le planning - après le hero */}
      <InlinePlanningSlot />

      {/* Comment acheter */}
      <section className="pt-12 pb-16 md:pb-20 bg-muted/30">
        <div className="container">
          <h2 className="section-title mb-16">COMMENT ACHETER ?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Étape 1 - BIEN CHOISIR */}
            <div className="bg-background border border-border/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col">
              <span className="font-serif text-2xl font-light block mb-4 text-primary">1</span>
              <h3 className="tracking-wide mb-4">BIEN CHOISIR</h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3 flex-1">
                <p>
                  Prenez le temps d'examiner les lots lors des <strong>journées d'exposition</strong> (veille et matin de la vente).
                </p>
                <p>
                  <strong>Renseignez-vous</strong> sur la valeur des biens en consultant les estimations et en questionnant nos experts.
                </p>
                <p>
                  <strong>Fixez vos limites</strong> avant la vente pour éviter de vous laisser emporter par l'excitation des enchères.
                </p>
                <p>
                  N'oubliez pas d'<strong>anticiper les frais acheteurs</strong> qui sont expliqués sur le catalogue en ligne.
                </p>
              </div>
            </div>
            
            {/* Étape 2 - ENCHÉRIR */}
            <div className="bg-background border border-border/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col">
              <span className="font-serif text-2xl font-light block mb-4 text-primary">2</span>
              <h3 className="tracking-wide mb-4">ENCHÉRIR</h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3 flex-1">
                <p>
                  <strong>En salle :</strong> Munissez-vous d'une pièce d'identité et d'un moyen de paiement. Levez votre plaquette ou la main pour enchérir.
                </p>
                <p>
                  <strong>Par ordre ferme :</strong> Laissez un ordre d'achat confidentiel au commissaire-priseur qui enchérira pour vous jusqu'à votre limite.
                </p>
                <p>
                  <strong>En ligne :</strong> Participez en direct via Drouot ou Interenchères depuis chez vous (frais supplémentaires de 3%).
                </p>
                <p className="italic text-xs pt-2 border-t border-border/50">
                  Si personne n'enchérit après vous jusqu'au coup de marteau, vous devenez propriétaire de l'objet.
                </p>
              </div>
            </div>
            
            {/* Étape 3 - PAYER */}
            <div className="bg-background border border-border/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col">
              <span className="font-serif text-2xl font-light block mb-4 text-primary">3</span>
              <h3 className="tracking-wide mb-4">PAYER</h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3 flex-1">
                <p>
                  Vous recevrez un <strong>bordereau d'achat</strong> sous 48h détaillant le montant total à régler (prix + frais).
                </p>
                <p>
                  <strong>Moyens acceptés :</strong> Carte bancaire, virement ou espèces jusqu'à 1 000€. Le paiement doit intervenir sous 48h.
                </p>
                <p>
                  <strong>Aucun lot remis</strong> avant le paiement intégral. L'encaissement du virement doit être effectif.
                </p>
                <p className="italic text-xs pt-2 border-t border-border/50">
                  En cas de défaut, le lot sera remis en vente et vous serez tenu responsable de la différence de prix.
                </p>
              </div>
            </div>
            
            {/* Étape 4 - RETIRER OU EXPÉDIER */}
            <div className="bg-background border border-border/50 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col">
              <span className="font-serif text-2xl font-light block mb-4 text-primary">4</span>
              <h3 className="tracking-wide mb-4">RETIRER OU EXPÉDIER</h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3 flex-1">
                <p>
                  <strong>Retrait à l'étude :</strong> Du lundi au vendredi (9h-12h / 14h-18h). Stockage gratuit 15 jours.
                </p>
                <p>
                  <strong>Expédition :</strong> Nous pouvons coordonner l'envoi avec nos transporteurs partenaires spécialisés.
                </p>
                <p>
                  <strong>Service interne :</strong> Pour objets peu volumineux, nous proposons un service d'expédition simple.
                </p>
                <p className="italic text-xs pt-2 border-t border-border/50">
                  Le transport reste sous votre responsabilité. Assurez vos objets de valeur pendant l'expédition.
                </p>
              </div>
            </div>
          </div>

          {/* Bouton unique Règlement */}
          <div className="text-center mt-12">
            <Button variant="outline-brand" className="font-sans text-sm tracking-widest" asChild>
              <a href="/documents/reglement-acheter.pdf" target="_blank" rel="noopener noreferrer">
                VOIR NOTRE RÈGLEMENT
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Image de la salle des ventes */}
      <section className="py-8 md:py-12">
        <div className="container">
          <div className="max-w-5xl mx-auto overflow-hidden">
            <img 
              src={salleEncheresPublic}
              alt="Salle des ventes avec le public"
              className="w-[200%] max-w-none -ml-[50%] md:w-full md:max-w-full md:ml-0 h-auto"
            />
          </div>
        </div>
      </section>


      {/* Ventes passées */}
      <section id="ventes-passees" className="py-16 md:py-24 scroll-mt-32">
        <div className="container">
          <div className="text-center mb-12">
            <p className="font-sans text-sm tracking-widest text-muted-foreground uppercase mb-2">
              Résultats
            </p>
            <h2 className="font-serif text-base md:text-lg font-semibold tracking-widest uppercase">
              VENTES PASSÉES
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Découvrez les plus belles enchères de nos ventes récentes et leurs résultats d'adjudication.
            </p>
          </div>

          {/* Nos 6 plus belles enchères */}
          <h3 className="font-serif text-lg md:text-xl text-center mb-8">Nos Plus Belles Enchères</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            {[
              { title: "Tableau Aïzpiri - Bouquet de fleurs", adjudication: 12500, image: "/images/sales/667692-lot-aizpiri.jpg" },
              { title: "Icône russe - Vierge de Kazan", adjudication: 8200, image: "/images/sales/667941-vierge.jpg" },
              { title: "Rolex Daytona - Or rose", adjudication: 35000, image: "/images/sales/668645-montre.jpg" },
              { title: "Bronze vietnamien - Brûle-parfum", adjudication: 4500, image: "/images/sales/668987-vietnam.jpg" },
              { title: "Statue asiatique - Bouddha", adjudication: 6800, image: "/images/sales/669011-asie.jpg" },
              { title: "Madone à l'Enfant - École italienne", adjudication: 15000, image: "/images/sales/668791-vierge-kazan.jpg" },
            ].map((item, index) => (
              <div key={index} className="bg-card border border-border group hover:shadow-lg transition-all duration-300">
                <div className="aspect-[3/4] overflow-hidden bg-muted">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 text-center">
                  <h4 className="font-serif text-sm font-medium mb-2 line-clamp-2">{item.title}</h4>
                  <p className="text-brand-gold font-serif text-lg font-semibold">
                    {item.adjudication.toLocaleString('fr-FR')} €
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Grille des résultats */}
          <h3 className="font-serif text-lg md:text-xl text-center mb-8">Résultats d'Adjudication</h3>
          <div className="overflow-x-auto max-w-4xl mx-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-primary text-brand-primary-foreground">
                  <th className="px-4 py-3 text-left font-serif">Vente</th>
                  <th className="px-4 py-3 text-left font-serif">Date</th>
                  <th className="px-4 py-3 text-right font-serif">Total adjugé</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { title: "Petites Oeuvres de Grands Maîtres", date: "09/12/2024", total: 185000 },
                  { title: "Art Russe", date: "10/12/2024", total: 142000 },
                  { title: "Horlogerie", date: "09/12/2024", total: 278000 },
                  { title: "Arts du Vietnam", date: "11/12/2024", total: 95000 },
                  { title: "Art d'Asie", date: "11/12/2024", total: 168000 },
                  { title: "Curiosités & Collections", date: "13/12/2024", total: 52000 },
                ].map((sale, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-muted/30' : 'bg-card'}>
                    <td className="px-4 py-3 font-medium">{sale.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{sale.date}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-gold">
                      {sale.total.toLocaleString('fr-FR')} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Lien vers le glossaire */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container text-center">
          <h2 className="section-title mb-6">VOCABULAIRE DES ENCHÈRES</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Découvrez les 50 termes incontournables du monde des enchères dans notre glossaire complet.
          </p>
          <Button variant="outline-brand" className="font-sans text-sm tracking-widest" asChild>
            <Link to="/glossaire">CONSULTER LE GLOSSAIRE</Link>
          </Button>
        </div>
      </section>

      {/* Variété des Ventes et Éco-responsable */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
            {/* Diversité des ventes */}
            <div>
              <h2 className="section-title mb-8">LA DIVERSITÉ DE NOS VENTES</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                De l'art moderne aux voitures de collection, en passant par les bijoux, le vin, le mobilier ancien ou les objets militaires, 
                nos ventes couvrent un large spectre de spécialités. Chaque vente est l'occasion de découvrir des pièces uniques, 
                soigneusement sélectionnées et expertisées par nos spécialistes.
              </p>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• <strong>Ventes courantes</strong> (meubles, objets déco, bibelots)</p>
                <p>• <strong>Ventes de livres anciens</strong> et BD</p>
                <p>• <strong>Ventes MOA</strong> (Mobilier et Objets d'Art)</p>
                <p>• <strong>Ventes Militaria</strong></p>
                <p>• <strong>Ventes Vin et Spiritueux</strong></p>
                <p>• <strong>Ventes Bijoux</strong></p>
                <p>• <strong>Ventes Montres</strong></p>
                <p>• <strong>Ventes Vintage</strong></p>
                <p>• <strong>Ventes Art Moderne & Contemporain</strong></p>
                <p>• <strong>Ventes Véhicules de Collection</strong></p>
              </div>
            </div>

            {/* Eco-responsible */}
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-8 h-full flex flex-col justify-center">
              <Recycle className="w-12 h-12 mx-auto mb-4 text-green-600 dark:text-green-400" />
              <h3 className="font-serif text-xl font-semibold mb-4 text-center">Acheter aux Enchères, c'est Éco-responsable</h3>
              <p className="text-muted-foreground leading-relaxed text-center">
                Les ventes aux enchères, c'est du <strong>recyclage</strong>, des <strong>circuits courts</strong>, 
                une démarche complètement <strong>éco-responsable</strong>. En achetant aux enchères, vous offrez 
                une <strong>deuxième vie à un objet unique</strong>, avec une histoire et une âme. 
                Rejoignez ce cercle vertueux où chaque acquisition est un geste pour la planète.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Estimation */}
      <section className="pt-10 md:pt-12 pb-0">
        <div className="bg-brand-primary text-brand-primary-foreground p-6 md:p-10 text-center card-shadow relative">
          <div className="absolute top-4 right-4">
            <img 
              src="/src/assets/logo-12p-nb.png" 
              alt="Douze pages & associés" 
              className="h-10 md:h-12 brightness-0 invert opacity-30"
            />
          </div>
          <h2 className="font-serif text-lg md:text-xl font-light mb-6">
            Et si le trésor que vous cherchez se trouvait dans votre grenier ?
          </h2>
          <Link 
            to="/contact"
            className="inline-block bg-background text-brand-primary px-8 py-3 font-sans text-xs tracking-widest hover:bg-background/90 transition-colors"
          >
            ESTIMATION GRATUITE
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Acheter;

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface GlossaireAccordionProps {
  className?: string;
}

const GlossaireAccordion = ({ className = "" }: GlossaireAccordionProps) => {
  return (
    <div className={className}>
      <Accordion type="multiple" className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
        {/* A */}
        <AccordionItem value="acte-vente" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Acte de vente</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Document officiel qui prouve le transfert de propriété de l'objet.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="adjudicataire" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Adjudicataire</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            La personne qui remporte l'enchère (l'acheteur final).
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="adjuge" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Adjugé</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Mot prononcé par le commissaire-priseur au moment du coup de marteau pour valider la vente.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="after-sale" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">After-sale</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Vente de gré à gré (amiable) des lots restés invendus, dans les jours suivant la séance.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="authenticite" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Authenticité</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Garantie que l'objet est bien de l'époque, de l'auteur ou de l'origine annoncée.
          </AccordionContent>
        </AccordionItem>

        {/* B */}
        <AccordionItem value="bordereau" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Bordereau d'adjudication</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            La facture remise à l'acheteur. Elle comprend le prix marteau + les frais.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="bon-etat" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Bon (En)</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Se dit d'un état de conservation correct, sans être parfait.
          </AccordionContent>
        </AccordionItem>

        {/* C */}
        <AccordionItem value="catalogue" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Catalogue</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Liste (papier ou en ligne) décrivant les lots (photos, estimations, descriptions) avant la vente.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="certificat" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Certificat d'authenticité</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Document écrit par un expert garantissant l'origine de l'œuvre.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="clerc" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Clerc</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Collaborateur du commissaire-priseur qui s'occupe de l'administration (procès-verbal, téléphone).
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="commissaire" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Commissaire-priseur</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            L'officier ministériel ou l'opérateur habilité qui dirige la vente et adjuge les lots.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="commissionnaire" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Commissionnaire (ou Crieur)</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Personnel en salle qui présente les objets et relaye les enchères du public à haute voix.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="condition-report" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Condition report (Rapport d'état)</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Bilan détaillé de l'état de l'objet (rayures, casses, restaurations) fourni sur demande.
          </AccordionContent>
        </AccordionItem>

        {/* D */}
        <AccordionItem value="datation" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Datation</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Estimation de l'époque de fabrication d'un objet.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="dires" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Dires</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Modifications ou précisions annoncées oralement par le commissaire-priseur juste avant la vente d'un lot.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="droit-suite" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Droit de suite</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Taxe additionnelle reversée aux auteurs (ou héritiers) d'œuvres d'art graphiques et plastiques.
          </AccordionContent>
        </AccordionItem>

        {/* E */}
        <AccordionItem value="enchere" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Enchère</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Offre de prix supérieure à la précédente.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="encherisseur" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Enchérisseur</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Toute personne qui porte une enchère (en salle, au téléphone ou sur internet).
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="estimation" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Estimation</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Fourchette de prix (basse et haute) évaluée par l'expert, donnant la valeur supposée de l'objet.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="expert" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Expert</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Spécialiste qui authentifie les objets et fixe l'estimation pour le catalogue.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="exposition" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Exposition publique</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Période précédant la vente où les lots sont visibles. Moment crucial pour examiner l'état des objets.
          </AccordionContent>
        </AccordionItem>

        {/* F */}
        <AccordionItem value="faculte-reunion" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Faculté de réunion</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Possibilité de vendre plusieurs lots ensemble si la somme des enchères séparées est inférieure à l'offre globale.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="folle-enchere" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Folle enchère</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Sanction contre un acheteur qui ne paie pas. L'objet est remis en vente ; l'acheteur défaillant doit payer la différence.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="frais-acheteur" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Frais acheteur</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Pourcentage (souvent 20-30%) ajouté au prix marteau que l'acheteur doit payer en plus.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="frais-vendeur" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Frais vendeur</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Commission prélevée sur le prix de vente, payée par le vendeur à la maison de vente.
          </AccordionContent>
        </AccordionItem>

        {/* G */}
        <AccordionItem value="gre-a-gre" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Gré à gré</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Transaction directe entre vendeur et acheteur (via la maison de vente) sans passer par les enchères publiques.
          </AccordionContent>
        </AccordionItem>

        {/* H */}
        <AccordionItem value="hotel-ventes" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Hôtel des ventes</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Lieu physique où se déroulent les ventes aux enchères.
          </AccordionContent>
        </AccordionItem>

        {/* I */}
        <AccordionItem value="incidents" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Incidents de vente</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Événements imprévus (contestations, double enchère) réglés souverainement par le commissaire-priseur.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="invendu" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Invendu (ou Ravalé)</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Lot qui n'a pas atteint le prix de réserve et qui est retiré de la vente.
          </AccordionContent>
        </AccordionItem>

        {/* L */}
        <AccordionItem value="live" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Live (Enchères Live)</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Dispositif permettant d'enchérir en direct depuis son ordinateur via une vidéo retransmise.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="lot" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Lot</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Objet ou groupe d'objets portant un numéro et mis en vente en une seule fois.
          </AccordionContent>
        </AccordionItem>

        {/* M */}
        <AccordionItem value="magasinage" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Magasinage</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Frais de garde facturés si l'acheteur tarde trop à récupérer son lot après la vente.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="mise-a-prix" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Mise à prix</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Prix de départ de l'enchère annoncé par le commissaire-priseur (souvent inférieur à l'estimation basse).
          </AccordionContent>
        </AccordionItem>

        {/* O */}
        <AccordionItem value="ordre-achat" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Ordre d'achat</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Mandat écrit donné par un acheteur absent. Le commissaire-priseur enchérira pour lui jusqu'au montant maximum fixé.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ovv" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">OVV</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Opérateur de Ventes Volontaires — terme juridique désignant la société de vente aux enchères.
          </AccordionContent>
        </AccordionItem>

        {/* P */}
        <AccordionItem value="pas-enchere" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Pas d'enchère</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Montant minimum à ajouter pour surenchérir (ex: on monte de 10€ en 10€, puis de 50€ en 50€).
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="preemption" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Préemption</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Droit de l'État français de se substituer au dernier enchérisseur pour acquérir une œuvre (pour un musée).
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="prix-reserve" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Prix de réserve</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Prix minimum confidentiel convenu entre le vendeur et la maison de vente. En dessous, le lot n'est pas vendu.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="prix-marteau" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Prix marteau</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Le montant de la dernière enchère, prononcé lors du coup de marteau (hors frais).
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="proces-verbal" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Procès-verbal</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Acte officiel dressé après la vente listant les résultats et garantissant la régularité des opérations.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="provenance" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Provenance</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Historique des propriétaires successifs d'un objet (gage de valeur et d'authenticité).
          </AccordionContent>
        </AccordionItem>

        {/* Q */}
        <AccordionItem value="quitus" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Quitus</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Document attestant que le vendeur a bien été payé par la maison de vente.
          </AccordionContent>
        </AccordionItem>

        {/* R */}
        <AccordionItem value="rapport-expertise" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Rapport d'expertise</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Analyse détaillée justifiant l'authenticité ou la valeur d'un bien important.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="retrait" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Retrait</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Action d'enlever un lot de la vente avant qu'elle ne commence (par exemple, en cas de doute sur l'authenticité).
          </AccordionContent>
        </AccordionItem>

        {/* S */}
        <AccordionItem value="salle" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Salle (Acheteur en)</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Personne présente physiquement dans la pièce lors de la vente.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="surenchere" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Surenchère</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Fait de proposer un prix supérieur à l'offre en cours.
          </AccordionContent>
        </AccordionItem>

        {/* T */}
        <AccordionItem value="telephone" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Téléphone (Enchérir par)</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Service où un clerc appelle le client pendant la vente pour enchérir en direct selon ses instructions.
          </AccordionContent>
        </AccordionItem>

        {/* V */}
        <AccordionItem value="vente-judiciaire" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Vente judiciaire</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Vente forcée (liquidation, saisie) ordonnée par la justice. Il n'y a généralement pas de prix de réserve.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="vente-volontaire" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Vente volontaire</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Vente décidée librement par le propriétaire des objets.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="vices-caches" className="bg-card border border-border/50 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-medium text-sm">Vices cachés</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm">
            Défauts non visibles lors de l'examen normal. La garantie aux enchères est complexe sur ce point.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default GlossaireAccordion;

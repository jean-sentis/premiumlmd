import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Loader2, Trophy } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

interface PastSale {
  id: string;
  title: string;
  sale_date: string;
  lot_count: number | null;
  cover_image_url: string | null;
  sale_url: string;
}

interface BelleEnchere {
  title: string;
  adjudication: number;
  image: string;
  saleTitle?: string;
}

const VentesPassees = () => {
  const [pastSales, setPastSales] = useState<PastSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Nos plus belles enchères (données statiques pour l'instant)
  const bellesEncheres: BelleEnchere[] = [
    { title: "Tableau Aïzpiri - Bouquet de fleurs", adjudication: 12500, image: "/images/sales/667692-lot-aizpiri.jpg", saleTitle: "Art Moderne" },
    { title: "Icône russe - Vierge de Kazan", adjudication: 8200, image: "/images/sales/667941-vierge.jpg", saleTitle: "Art Russe" },
    { title: "Rolex Daytona - Or rose", adjudication: 35000, image: "/images/sales/668645-montre.jpg", saleTitle: "Horlogerie" },
    { title: "Bronze vietnamien - Brûle-parfum", adjudication: 4500, image: "/images/sales/668987-vietnam.jpg", saleTitle: "Arts du Vietnam" },
    { title: "Statue asiatique - Bouddha", adjudication: 6800, image: "/images/sales/669011-asie.jpg", saleTitle: "Art d'Asie" },
    { title: "Madone à l'Enfant - École italienne", adjudication: 15000, image: "/images/sales/668791-vierge-kazan.jpg", saleTitle: "Art Ancien" },
  ];

  useEffect(() => {
    const fetchPastSales = async () => {
      setIsLoading(true);
      try {
        const today = new Date().toISOString();
        const { data, error } = await supabase
          .from('interencheres_sales')
          .select('id, title, sale_date, lot_count, cover_image_url, sale_url')
          .lt('sale_date', today)
          .order('sale_date', { ascending: false });

        if (error) {
          console.error('Error fetching past sales:', error);
        } else {
          setPastSales(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPastSales();
  }, []);

  // Grouper les ventes par année
  const salesByYear = useMemo(() => {
    const grouped: Record<string, PastSale[]> = {};
    
    pastSales.forEach(sale => {
      if (sale.sale_date) {
        const year = format(parseISO(sale.sale_date), 'yyyy');
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push(sale);
      }
    });

    // Trier les années par ordre décroissant
    const sortedYears = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));
    const result: { year: string; sales: PastSale[] }[] = [];
    sortedYears.forEach(year => {
      result.push({ year, sales: grouped[year] });
    });

    return result;
  }, [pastSales]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Ventes Passées et Résultats | Douze pages & associés</title>
        <meta name="description" content="Découvrez les résultats de nos ventes aux enchères passées et nos plus belles adjudications." />
      </Helmet>

      <Header />

      <main className="pt-28 md:pt-32">
        {/* Hero Section */}
        <section className="bg-[hsl(var(--brand-blue-100))] py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-base md:text-lg font-semibold text-brand-primary tracking-widest uppercase mb-4">
              Ventes Passées
            </h1>
            <p className="text-lg md:text-xl text-brand-primary/80 max-w-2xl mx-auto">
              Résultats d'adjudication et belles enchères
            </p>
          </div>
        </section>

        {/* Nos Plus Belles Enchères */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center mb-12">
              <div className="flex-1 h-px bg-border"></div>
              <div className="mx-6 flex items-center gap-3">
                <Trophy className="w-6 h-6 text-brand-gold" />
                <h2 className="font-serif text-2xl md:text-3xl text-brand-primary">
                  Nos Plus Belles Enchères
                </h2>
                <Trophy className="w-6 h-6 text-brand-gold" />
              </div>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {bellesEncheres.map((item, index) => (
                <div 
                  key={index} 
                  className="bg-card border border-border group hover:shadow-xl transition-all duration-300"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-muted">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      {item.saleTitle}
                    </p>
                    <h3 className="font-serif text-base font-medium mb-3 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-brand-gold font-serif text-xl font-semibold">
                      {item.adjudication.toLocaleString('fr-FR')} €
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ventes Passées par Année */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center mb-12">
              <div className="flex-1 h-px bg-border"></div>
              <h2 className="mx-6 section-title bg-brand-primary text-brand-primary-foreground border border-brand-primary px-8 py-3">
                ARCHIVES DES VENTES
              </h2>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                <span className="ml-3 text-muted-foreground">Chargement des ventes...</span>
              </div>
            ) : salesByYear.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p>Aucune vente passée enregistrée.</p>
              </div>
            ) : (
              <div className="space-y-16">
                {salesByYear.map(({ year, sales }) => (
                  <div key={year}>
                    {/* Titre de l'année */}
                    <div className="flex items-center gap-4 mb-8">
                      <h3 className="font-serif text-3xl md:text-4xl font-light text-brand-primary">
                        {year}
                      </h3>
                      <div className="flex-1 h-px bg-border"></div>
                      <span className="text-sm text-muted-foreground">
                        {sales.length} vente{sales.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Grille des ventes */}
                    <div className="grid md:grid-cols-3 gap-8">
                      {sales.map((sale) => (
                        <Link
                          key={sale.id}
                          to={`/vente/${sale.id}`}
                          className="bg-card border border-border hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col"
                        >
                          <div className="aspect-[3/4] overflow-hidden bg-muted">
                            {sale.cover_image_url ? (
                              <img 
                                src={sale.cover_image_url} 
                                alt={sale.title}
                                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <Calendar className="w-12 h-12 opacity-30" />
                              </div>
                            )}
                          </div>
                          <div className="p-6 flex flex-col flex-1">
                            <h4 className="font-serif text-lg font-semibold mb-2 line-clamp-2 group-hover:text-brand-gold transition-colors">
                              {sale.title}
                            </h4>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {sale.sale_date 
                                  ? format(parseISO(sale.sale_date), "d MMMM yyyy", { locale: fr })
                                  : 'Date non précisée'
                                }
                              </span>
                            </div>
                            {sale.lot_count && (
                              <p className="text-sm text-muted-foreground">
                                {sale.lot_count} lots
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Estimation */}
        <section className="pt-10 md:pt-12 pb-0">
          <div className="bg-brand-primary text-brand-primary-foreground p-6 md:p-10 text-center card-shadow">
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
      </main>

      <Footer />
    </div>
  );
};

export default VentesPassees;

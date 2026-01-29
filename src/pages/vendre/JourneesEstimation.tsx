import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Clock, Loader2 } from "lucide-react";
import TimelineLayout from "@/components/TimelineLayout";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Expertise {
  id: string;
  title: string;
  start_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  description: string | null;
  specialty: string | null;
}

const JourneesEstimation = () => {
  const [expertises, setExpertises] = useState<Expertise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExpertises = async () => {
      setIsLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('svv_events')
          .select('*')
          .eq('event_type', 'expertise')
          .eq('is_active', true)
          .gte('start_date', today)
          .order('start_date', { ascending: true });

        if (error) {
          console.error('Error fetching expertises:', error);
        } else {
          setExpertises(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpertises();
  }, []);

  // Grouper par mois
  const expertisesByMonth = useMemo(() => {
    const grouped: Record<string, Expertise[]> = {};
    
    expertises.forEach(exp => {
      const monthKey = format(parseISO(exp.start_date), 'MMMM yyyy', { locale: fr });
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(exp);
    });

    return Object.entries(grouped);
  }, [expertises]);

  return (
    <>
      <Helmet>
        <title>Journées d'Estimation Gratuites | Douze pages & associés</title>
        <meta name="description" content="Faites estimer vos objets gratuitement lors de nos journées d'estimation. Bijoux, tableaux, mobilier, vins..." />
      </Helmet>

      <TimelineLayout pageTitle="Journées d'Estimation Gratuites" mode="vendre">
        {/* Informations */}
        <section className="py-6 bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-muted-foreground">
                <strong>Sans rendez-vous</strong> — Apportez vos objets (bijoux, tableaux, argenterie, mobilier, vins...) 
                et recevez une estimation gratuite par nos commissaires-priseurs.
              </p>
            </div>
          </div>
        </section>

        {/* Liste des journées */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                <span className="ml-3 text-muted-foreground">Chargement des journées...</span>
              </div>
            ) : expertisesByMonth.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-6">Aucune journée d'estimation programmée pour le moment.</p>
                <Button variant="outline-brand" asChild>
                  <Link to="/contact">Demander une estimation en ligne</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-12 max-w-4xl mx-auto">
                {expertisesByMonth.map(([month, exps]) => (
                  <div key={month}>
                    {/* Titre du mois */}
                    <h2 className="text-xl md:text-2xl text-brand-primary capitalize mb-6 pb-2 border-b border-border">
                      {month}
                    </h2>

                    {/* Cartes des journées */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {exps.map((exp) => (
                        <div
                          key={exp.id}
                          className="bg-card border border-border p-6 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex items-start gap-4">
                            {/* Date badge */}
                            <div className="bg-violet-600 text-white px-4 py-3 text-center shrink-0">
                              <span className="block text-2xl font-light">
                                {format(parseISO(exp.start_date), 'd')}
                              </span>
                              <span className="block text-xs uppercase tracking-wide">
                                {format(parseISO(exp.start_date), 'MMM', { locale: fr })}
                              </span>
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                              <h3 className="text-lg font-medium mb-2">
                                {exp.title}
                              </h3>
                              
                              {(exp.start_time || exp.end_time) && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {exp.start_time}{exp.end_time ? ` - ${exp.end_time}` : ''}
                                  </span>
                                </div>
                              )}
                              
                              {exp.location && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{exp.location}</span>
                                </div>
                              )}

                              {exp.specialty && (
                                <span className="inline-block bg-violet-100 text-violet-800 text-xs px-2 py-1 rounded">
                                  {exp.specialty}
                                </span>
                              )}

                              {exp.description && (
                                <p className="text-sm text-muted-foreground mt-3">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Infos pratiques */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="section-title text-center mb-12">CE QUE NOUS ESTIMONS</h2>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-4">Bijoux & Montres</h3>
                <p className="text-base text-muted-foreground">
                  Haute joaillerie, montres de prestige, pièces anciennes, or et pierres précieuses.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium mb-4">Art & Tableaux</h3>
                <p className="text-base text-muted-foreground">
                  Peintures, dessins, sculptures, estampes de toutes époques et écoles.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium mb-4">Mobilier & Objets</h3>
                <p className="text-base text-muted-foreground">
                  Meubles anciens, objets d'art, argenterie, céramiques, verrerie.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium mb-4">Vins & Spiritueux</h3>
                <p className="text-base text-muted-foreground">
                  Grands crus, millésimes rares, caves complètes, cognacs et whiskies.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium mb-4">Livres & Manuscrits</h3>
                <p className="text-base text-muted-foreground">
                  Éditions anciennes, reliures, autographes, documents historiques.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium mb-4">Collections</h3>
                <p className="text-base text-muted-foreground">
                  Militaria, jouets anciens, instruments scientifiques, objets de curiosité.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pt-10 md:pt-12 pb-0">
          <div className="bg-brand-primary text-brand-primary-foreground p-6 md:p-10 text-center card-shadow">
            <h2 className="text-lg md:text-xl font-light mb-6">
              Vous ne pouvez pas vous déplacer ?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/vendre/estimation-en-ligne"
                className="inline-block bg-background text-brand-primary px-8 py-3 font-sans text-xs tracking-widest hover:bg-background/90 transition-colors"
              >
                ESTIMATION EN LIGNE
              </Link>
              <Link 
                to="/vendre/inventaire-domicile"
                className="inline-block border border-brand-primary-foreground text-brand-primary-foreground px-8 py-3 font-sans text-xs tracking-widest hover:bg-brand-primary-foreground/10 transition-colors"
              >
                INVENTAIRE À DOMICILE
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </TimelineLayout>
    </>
  );
};

export default JourneesEstimation;

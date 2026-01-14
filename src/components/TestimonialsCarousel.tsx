import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface Testimonial {
  name: string;
  date: string;
  rating: number;
  text: string;
  context?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Marie-Claire D.",
    date: "Décembre 2024",
    rating: 5,
    text: "Un accueil chaleureux et professionnel. La vente de la succession de ma mère s'est déroulée dans les meilleures conditions. L'équipe a su valoriser chaque objet avec respect et expertise.",
    context: "Vente succession",
  },
  {
    name: "Jean-Pierre M.",
    date: "Novembre 2024",
    rating: 5,
    text: "Excellente expérience pour l'achat d'une montre ancienne. Les descriptions étaient précises, l'état correspondait parfaitement. Je recommande vivement cet hôtel des ventes.",
    context: "Achat horlogerie",
  },
  {
    name: "François L.",
    date: "Octobre 2024",
    rating: 5,
    text: "Commissaire-priseur très compétent et à l'écoute. L'estimation de mes tableaux était juste et les résultats de la vente ont dépassé mes attentes. Merci à toute l'équipe !",
    context: "Vente art moderne",
  },
  {
    name: "Catherine B.",
    date: "Septembre 2024",
    rating: 5,
    text: "Service impeccable du début à la fin. L'expertise à domicile était très pratique et l'équipe a été d'une grande aide pour organiser la vente de notre collection familiale.",
    context: "Inventaire à domicile",
  },
  {
    name: "Antoine R.",
    date: "Août 2024",
    rating: 5,
    text: "Première vente aux enchères pour moi et certainement pas la dernière. L'ambiance était conviviale, les explications claires. J'ai pu acquérir une belle pièce de mobilier corse.",
    context: "Achat mobilier",
  },
  {
    name: "Dominique S.",
    date: "Juillet 2024",
    rating: 5,
    text: "Nous avons confié la vente de bijoux de famille et nous sommes très satisfaits du résultat. Transparence totale sur les frais et un suivi exemplaire tout au long du processus.",
    context: "Vente bijoux",
  },
  {
    name: "Pierre-Antoine G.",
    date: "Juin 2024",
    rating: 5,
    text: "Professionnalisme remarquable. L'expertise de nos vins a été réalisée avec soin et les enchères se sont très bien passées. Une maison de confiance en Corse.",
    context: "Vente vins",
  },
  {
    name: "Isabelle V.",
    date: "Mai 2024",
    rating: 5,
    text: "Très belle découverte que cet hôtel des ventes ajaccien. L'équipe est passionnée et cela se ressent. Les objets sont bien présentés et les ventes en ligne fonctionnent parfaitement.",
    context: "Achat en ligne",
  },
];

const TestimonialsCarousel = () => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const scrollCarousel = useCallback(() => {
    if (!carouselRef.current || isHovering) return;

    const carousel = carouselRef.current;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;

    if (carousel.scrollLeft >= maxScroll - 10) {
      carousel.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      carousel.scrollBy({ left: 380, behavior: "smooth" });
    }
  }, [isHovering]);

  useEffect(() => {
    const interval = setInterval(scrollCarousel, 5000);
    return () => clearInterval(interval);
  }, [scrollCarousel]);

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container">
        <h2 className="section-title mb-4">TÉMOIGNAGES</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Ils nous honorent de leur confiance depuis 2012
        </p>

        <div
          className="relative"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide justify-center md:justify-start"
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-80 md:w-96 snap-start first:ml-auto last:mr-auto md:first:ml-0 md:last:mr-0"
              >
                <div className="bg-background border border-border p-6 h-full flex flex-col">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className="fill-brand-gold text-brand-gold"
                      />
                    ))}
                  </div>

                  {/* Text */}
                  <p className="text-sm text-foreground leading-relaxed mb-6 flex-1">
                    "{testimonial.text}"
                  </p>

                  {/* Author */}
                  <div className="border-t border-border pt-4">
                    <p className="font-serif text-sm font-medium">
                      {testimonial.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {testimonial.date}
                      </p>
                      {testimonial.context && (
                        <p className="text-xs text-brand-gold">
                          {testimonial.context}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation arrows */}
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 border border-brand-primary bg-background text-brand-primary flex items-center justify-center hover:bg-brand-primary hover:text-brand-primary-foreground transition-colors hidden md:flex"
            onClick={() =>
              carouselRef.current?.scrollBy({ left: -380, behavior: "smooth" })
            }
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 border border-brand-primary bg-background text-brand-primary flex items-center justify-center hover:bg-brand-primary hover:text-brand-primary-foreground transition-colors hidden md:flex"
            onClick={() =>
              carouselRef.current?.scrollBy({ left: 380, behavior: "smooth" })
            }
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;

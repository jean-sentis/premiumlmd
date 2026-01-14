import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Calendar, MapPin, User, Mail, Phone, ArrowLeft } from 'lucide-react';

interface Exposition {
  id: string;
  exposition_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
}

interface SaleInfoAccordionProps {
  sale: {
    id: string;
    title: string;
    sale_date: string | null;
    location: string | null;
    description: string | null;
    fees_info: string | null;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
  };
  expositions?: Exposition[];
}

const SaleInfoAccordion = ({ sale, expositions }: SaleInfoAccordionProps) => {
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "EEEE d MMMM yyyy", { locale: fr });
  };

  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5).replace(':', 'h');
  };

  return (
    <Accordion type="multiple" className="border rounded divide-y" defaultValue={["sale-info"]}>
      {/* Informations sur la vente */}
      <AccordionItem value="sale-info" className="border-0">
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 text-sm font-medium uppercase tracking-wide">
          Informations sur la vente
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-4 text-sm">
            {/* Date de vente */}
            {sale.sale_date && (
              <div>
                <h4 className="font-medium text-foreground underline mb-1">Vente</h4>
                <p className="text-muted-foreground capitalize">
                  {formatDateTime(sale.sale_date)}
                </p>
              </div>
            )}

            {/* Expositions */}
            {expositions && expositions.length > 0 && (
              <div>
                <h4 className="font-medium text-foreground underline mb-1">Expositions</h4>
                <div className="space-y-1 text-muted-foreground">
                  {expositions.map((expo) => (
                    <p key={expo.id} className="capitalize">
                      {formatDate(expo.exposition_date)}
                      {expo.start_time && expo.end_time && (
                        <> de {formatTime(expo.start_time)} à {formatTime(expo.end_time)}</>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Lieu */}
            {sale.location && (
              <div>
                <h4 className="font-medium text-foreground underline mb-1">Lieu</h4>
                <p className="text-muted-foreground whitespace-pre-line">{sale.location}</p>
              </div>
            )}

            {/* Contact */}
            {(sale.contact_name || sale.contact_email || sale.contact_phone) && (
              <div>
                <h4 className="font-medium text-foreground underline mb-1">Contact</h4>
                <div className="text-muted-foreground space-y-1">
                  {sale.contact_name && <p>{sale.contact_name}</p>}
                  {sale.contact_phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {sale.contact_phone}
                    </p>
                  )}
                  {sale.contact_email && (
                    <p className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <a href={`mailto:${sale.contact_email}`} className="hover:text-brand-gold">
                        {sale.contact_email}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {sale.description && (
              <div>
                <h4 className="font-medium text-foreground underline mb-1">Description</h4>
                <p className="text-muted-foreground whitespace-pre-line">{sale.description}</p>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Conditions de vente */}
      <AccordionItem value="conditions" className="border-0">
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 text-sm font-medium uppercase tracking-wide">
          Conditions de vente
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="text-sm text-muted-foreground space-y-4">
            {sale.fees_info ? (
              <p className="whitespace-pre-line">{sale.fees_info}</p>
            ) : (
              <>
                <p>
                  <strong>Frais acheteurs :</strong> 25% TTC du prix d'adjudication.
                </p>
                <p>
                  Les lots sont vendus dans l'état dans lequel ils se trouvent au moment de la vente.
                  L'absence de mention dans le catalogue n'implique aucunement que le lot soit en parfait
                  état de conservation ou exempt de dommages, accidents, incidents ou restaurations.
                </p>
                <p>
                  Les dimensions et poids des lots sont donnés à titre indicatif.
                </p>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Retourner au catalogue */}
      <AccordionItem value="catalog" className="border-0">
        <Link
          to={`/vente/${sale.id}`}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium uppercase tracking-wide text-brand-gold hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retourner au catalogue
        </Link>
      </AccordionItem>
    </Accordion>
  );
};

export default SaleInfoAccordion;

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail, MailOpen, Clock, AlertTriangle, Phone, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getInterestStyle, getOverdueInfo } from "./detail/interest-config";

export interface EstimationRequest {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  description: string;
  estimated_value: string | null;
  object_category: string | null;
  photo_urls: string[];
  source: string;
  ai_analysis: any;
  ai_analyzed_at: string | null;
  status: string;
  auctioneer_notes: string | null;
  auctioneer_decision: string | null;
  decided_at: string | null;
  response_template: string | null;
  response_message: string | null;
  responded_at: string | null;
  created_at: string;
  related_lot_id: string | null;
}

const SOURCE_LABELS: Record<string, string> = {
  estimation_form: "Estimation en ligne",
  objet_similaire: "Objet similaire",
  contact: "Contact",
};

function getPhotoUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${path}`;
}

interface EstimationCardProps {
  estimation: EstimationRequest;
  onClick: () => void;
}

export function EstimationCard({ estimation, onClick }: EstimationCardProps) {
  const isResponded = estimation.status === "responded";
  const overdue = getOverdueInfo(estimation.created_at, estimation.status);
  const interestStyle = isResponded && estimation.auctioneer_decision
    ? getInterestStyle(estimation.auctioneer_decision)
    : null;
  const responseMode = (estimation as any).response_mode;
  const delegateTo = (estimation as any).delegate_to;

  return (
    <div
      onClick={onClick}
      className={`group rounded-xl border cursor-pointer transition-all hover:shadow-md hover:border-border
        ${interestStyle ? interestStyle.border : "border-border/50"}
        ${!isResponded ? "bg-brand-gold/5 border-l-4 border-l-blue-400" : "bg-card"}
      `}
    >
      {/* Photo */}
      <div className="aspect-[4/3] overflow-hidden rounded-t-xl bg-muted">
        {estimation.photo_urls?.length > 0 ? (
          <img
            src={getPhotoUrl(estimation.photo_urls[0])}
            alt=""
            className="w-full h-full object-contain bg-muted/30"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Mail className="w-8 h-8 opacity-20" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${!isResponded ? "font-semibold" : ""}`}>
            {estimation.nom}
          </span>
          {!isResponded ? (
            <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          ) : (
            <MailOpen className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
          )}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
          {estimation.description}
        </p>

        <div className="flex items-center gap-1.5 flex-wrap">
          {isResponded ? (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-700"
            >
              <MailOpen className="w-3 h-3 mr-0.5" />
              Répondu
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700"
            >
              <Clock className="w-3 h-3 mr-0.5" />
              En attente
            </Badge>
          )}

          {overdue && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-300"
            >
              <AlertTriangle className="w-3 h-3 mr-0.5" />+{overdue.daysOverdue}j
            </Badge>
          )}

          {interestStyle && (
            <Badge className={`${interestStyle.bg} ${interestStyle.text} ${interestStyle.border} border text-[10px] px-1.5 py-0`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${interestStyle.dot} mr-1`} />
              {interestStyle.label}
            </Badge>
          )}

          {responseMode === "phone" && <Phone className="w-3 h-3 text-muted-foreground" />}
          {responseMode === "delegate" && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <UserPlus className="w-3 h-3" />
              {delegateTo}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
          <span>{format(new Date(estimation.created_at), "dd MMM yyyy · HH:mm", { locale: fr })}</span>
          {estimation.source && (
            <span>{SOURCE_LABELS[estimation.source] || estimation.source}</span>
          )}
        </div>
      </div>
    </div>
  );
}

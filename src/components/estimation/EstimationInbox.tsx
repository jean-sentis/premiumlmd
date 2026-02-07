import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Mail,
  MailOpen,
  Clock,
  Phone,
  UserPlus,
  Loader2,
  RefreshCw,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getInterestStyle,
  getEffectiveInterest,
  getOverdueInfo,
} from "./detail/interest-config";

interface EstimationRequest {
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

interface EstimationInboxProps {
  onSelectEstimation: (estimation: EstimationRequest) => void;
  selectedId?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  estimation_form: "Estimation en ligne",
  objet_similaire: "Objet similaire",
  contact: "Contact",
};

export function EstimationInbox({
  onSelectEstimation,
  selectedId,
}: EstimationInboxProps) {
  const [estimations, setEstimations] = useState<EstimationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const fetchEstimations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("estimation_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching estimations:", error);
    } else {
      setEstimations((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEstimations();
  }, []);

  const filtered = estimations.filter((e) => {
    const matchesSearch =
      !searchQuery ||
      e.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "responded"
        ? e.status === "responded"
        : statusFilter === "overdue"
          ? e.status !== "responded" &&
            getOverdueInfo(e.created_at, e.status) !== null
          : statusFilter === "pending"
            ? e.status !== "responded"
            : true);
    return matchesSearch && matchesStatus;
  });

  const getPhotoUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${path}`;
  };

  // Count stats
  const respondedCount = estimations.filter(
    (e) => e.status === "responded"
  ).length;
  const pendingCount = estimations.filter(
    (e) => e.status !== "responded"
  ).length;
  const overdueCount = estimations.filter(
    (e) =>
      e.status !== "responded" &&
      getOverdueInfo(e.created_at, e.status) !== null
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchEstimations}
            className="h-9 w-9"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1 flex-wrap">
          <Badge
            variant={statusFilter === null ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => setStatusFilter(null)}
          >
            Tous ({estimations.length})
          </Badge>
          <Badge
            variant={statusFilter === "pending" ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() =>
              setStatusFilter(statusFilter === "pending" ? null : "pending")
            }
          >
            En attente ({pendingCount})
          </Badge>
          {overdueCount > 0 && (
            <Badge
              variant={statusFilter === "overdue" ? "default" : "outline"}
              className="cursor-pointer text-xs text-red-600 border-red-300"
              onClick={() =>
                setStatusFilter(statusFilter === "overdue" ? null : "overdue")
              }
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              En retard ({overdueCount})
            </Badge>
          )}
          <Badge
            variant={statusFilter === "responded" ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() =>
              setStatusFilter(
                statusFilter === "responded" ? null : "responded"
              )
            }
          >
            Répondu ({respondedCount})
          </Badge>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune demande d'estimation</p>
          </div>
        ) : (
          filtered.map((est) => {
            const isSelected = selectedId === est.id;
            const isResponded = est.status === "responded";
            const overdue = getOverdueInfo(est.created_at, est.status);

            // Interest level from CP decision or AI recommendation
            const effectiveInterest = getEffectiveInterest(
              est.auctioneer_decision,
              est.ai_analysis?.recommendation
            );
            const interestStyle = getInterestStyle(effectiveInterest);

            // Response mode icon
            const responseMode = (est as any).response_mode;
            const delegateTo = (est as any).delegate_to;

            return (
              <div
                key={est.id}
                onClick={() => onSelectEstimation(est)}
                className={`flex gap-3 p-3 border-b cursor-pointer transition-colors hover:bg-muted/50 border-l-4 ${
                  interestStyle
                    ? interestStyle.borderLeft
                    : "border-l-transparent"
                } ${isSelected ? "bg-muted" : ""} ${
                  !isResponded && !isSelected ? "bg-brand-gold/5" : ""
                }`}
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {est.photo_urls?.length > 0 ? (
                    <img
                      src={getPhotoUrl(est.photo_urls[0])}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Mail className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm truncate ${
                        !isResponded ? "font-semibold" : ""
                      }`}
                    >
                      {est.nom}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {format(new Date(est.created_at), "dd MMM HH:mm", {
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {est.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {/* Status badge */}
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

                    {/* Overdue badge */}
                    {overdue && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-300"
                      >
                        <AlertTriangle className="w-3 h-3 mr-0.5" />+
                        {overdue.daysOverdue}j
                      </Badge>
                    )}

                    {/* Response mode icon */}
                    {responseMode === "phone" && (
                      <Phone className="w-3 h-3 text-muted-foreground" />
                    )}
                    {responseMode === "delegate" && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <UserPlus className="w-3 h-3" />
                        {delegateTo}
                      </span>
                    )}

                    {/* Source */}
                    {est.source && (
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {SOURCE_LABELS[est.source] || est.source}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

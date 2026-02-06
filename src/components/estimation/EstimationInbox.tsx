import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Mail,
  MailOpen,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  new: { label: "Nouveau", icon: Mail, color: "bg-blue-100 text-blue-800" },
  ai_analyzed: { label: "Analysé IA", icon: Sparkles, color: "bg-amber-100 text-amber-800" },
  in_review: { label: "En examen", icon: Eye, color: "bg-purple-100 text-purple-800" },
  accepted: { label: "Accepté", icon: CheckCircle2, color: "bg-green-100 text-green-800" },
  declined: { label: "Décliné", icon: XCircle, color: "bg-red-100 text-red-800" },
  responded: { label: "Répondu", icon: MailOpen, color: "bg-gray-100 text-gray-800" },
};

const SOURCE_LABELS: Record<string, string> = {
  estimation_form: "Estimation en ligne",
  objet_similaire: "Objet similaire",
  contact: "Contact",
};

export function EstimationInbox({ onSelectEstimation, selectedId }: EstimationInboxProps) {
  const [estimations, setEstimations] = useState<EstimationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const fetchEstimations = async () => {
    setLoading(true);
    // Use service role via edge function or direct query depending on access
    // For demo, we'll query directly (admin page)
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
    const matchesStatus = !statusFilter || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPhotoUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${path}`;
  };

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
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={fetchEstimations} className="h-9 w-9">
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
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = estimations.filter((e) => e.status === key).length;
            if (count === 0) return null;
            return (
              <Badge
                key={key}
                variant={statusFilter === key ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setStatusFilter(statusFilter === key ? null : key)}
              >
                {config.label} ({count})
              </Badge>
            );
          })}
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
            const statusInfo = STATUS_CONFIG[est.status] || STATUS_CONFIG.new;
            const StatusIcon = statusInfo.icon;
            const isSelected = selectedId === est.id;
            const isUnread = est.status === "new" || est.status === "ai_analyzed";

            return (
              <div
                key={est.id}
                onClick={() => onSelectEstimation(est)}
                className={`flex gap-3 p-3 border-b cursor-pointer transition-colors hover:bg-muted/50 ${
                  isSelected ? "bg-muted" : ""
                } ${isUnread ? "bg-brand-gold/5" : ""}`}
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
                    <span className={`text-sm truncate ${isUnread ? "font-semibold" : ""}`}>
                      {est.nom}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {format(new Date(est.created_at), "dd MMM HH:mm", { locale: fr })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {est.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusInfo.color}`}>
                      <StatusIcon className="w-3 h-3 mr-0.5" />
                      {statusInfo.label}
                    </Badge>
                    {est.source && (
                      <span className="text-[10px] text-muted-foreground">
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

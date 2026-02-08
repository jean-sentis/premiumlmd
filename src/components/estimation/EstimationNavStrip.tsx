import { Mail, MailOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INTEREST_LEVELS } from "./detail/interest-config";
import type { EstimationRequest } from "./EstimationCard";
import type { FilterType } from "./EstimationFilters";

function getPhotoUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${path}`;
}

const FILTER_LABELS: Record<string, string> = {
  all: "Tous",
  unread: "Non lus",
  pending: "En attente",
  overdue: "En retard",
  responded: "Répondus",
};

interface EstimationNavStripProps {
  estimations: EstimationRequest[];
  selectedId: string;
  onSelect: (est: EstimationRequest) => void;
  onBackToList: () => void;
  activeFilter: FilterType;
  onFilterChange: (f: FilterType) => void;
}

export function EstimationNavStrip({
  estimations,
  selectedId,
  onSelect,
  onBackToList,
  activeFilter,
  onFilterChange,
}: EstimationNavStripProps) {
  // Build quick filter buttons for the vertical strip
  const filterLabel = FILTER_LABELS[activeFilter] || INTEREST_LEVELS[activeFilter as keyof typeof INTEREST_LEVELS]?.label || activeFilter;

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* Header: current filter + TOUS button */}
      <div className="p-2 border-b space-y-1.5">
        <Button
          variant="default"
          size="sm"
          onClick={onBackToList}
          className="w-full gap-1.5 text-xs"
        >
          <ArrowLeft className="w-3 h-3" />
          TOUS
        </Button>
        <div className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-wider px-1 truncate">
          {filterLabel}
        </div>
      </div>

      {/* Thumbnail list */}
      <div className="flex-1 overflow-y-auto">
        {estimations.map((est) => {
          const isSelected = est.id === selectedId;
          const isResponded = est.status === "responded";

          return (
            <button
              key={est.id}
              onClick={() => onSelect(est)}
              className={`w-full p-1.5 border-b border-border/30 transition-colors relative
                ${isSelected ? "bg-muted ring-2 ring-inset ring-primary/30" : "hover:bg-muted/50"}
              `}
            >
              {/* Read/unread indicator */}
              <div className="absolute top-1.5 right-1.5">
                {isResponded ? (
                  <MailOpen className="w-3 h-3 text-muted-foreground/30" />
                ) : (
                  <Mail className="w-3 h-3 text-blue-500" />
                )}
              </div>

              {/* Thumbnail */}
              <div className="aspect-square rounded-md overflow-hidden bg-muted mb-1">
                {est.photo_urls?.length > 0 ? (
                  <img
                    src={getPhotoUrl(est.photo_urls[0])}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Mail className="w-4 h-4 opacity-20" />
                  </div>
                )}
              </div>

              {/* Name */}
              <p className={`text-[10px] truncate ${!isResponded ? "font-semibold" : "text-muted-foreground"}`}>
                {est.nom}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

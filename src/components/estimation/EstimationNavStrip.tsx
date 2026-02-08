import { Mail, MailOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EstimationRequest } from "./EstimationCard";
import type { FilterType } from "./EstimationFilters";

function getPhotoUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${path}`;
}

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
}: EstimationNavStripProps) {

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* Header: current filter + TOUS button */}
      <div className="p-2 border-b">
        <Button
          variant="default"
          size="sm"
          onClick={onBackToList}
          className="w-full gap-1.5 text-xs"
        >
          <ArrowLeft className="w-3 h-3" />
          TOUS
        </Button>
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
                  <span className="relative">
                    <Mail className="w-3 h-3 text-blue-500" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 ring-1 ring-background" />
                  </span>
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

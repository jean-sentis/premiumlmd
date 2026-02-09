import { Search, Mail, Clock, CheckCircle2, AlertTriangle, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { INTEREST_LEVELS } from "./detail/interest-config";
import { RefreshCw } from "lucide-react";

export type FilterType =
  | "all"
  | "unread"
  | "pending"
  | "overdue"
  | "responded"
  | string; // interest level keys

interface EstimationFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: FilterType;
  onFilterChange: (f: FilterType) => void;
  counts: {
    all: number;
    unread: number;
    pending: number;
    overdue: number;
    responded: number;
    byInterest: Record<string, number>;
  };
  onRefresh: () => void;
}

export function EstimationFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  counts,
  onRefresh,
}: EstimationFiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Status filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <FilterBadge
          active={activeFilter === "all"}
          onClick={() => onFilterChange("all")}
          count={counts.all}
        >
          Tous
        </FilterBadge>

        <FilterBadge
          active={activeFilter === "unread"}
          onClick={() => onFilterChange("unread")}
          count={counts.unread}
          icon={<span className="relative w-3 h-3 flex items-center justify-center"><Mail className="w-3 h-3" /><span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" /></span>}
          accentClass="text-blue-700"
        >
          Non lus
        </FilterBadge>

        <FilterBadge
          active={activeFilter === "pending"}
          onClick={() => onFilterChange("pending")}
          count={counts.pending}
          icon={<Clock className="w-3 h-3" />}
        >
          En attente
        </FilterBadge>

        {counts.overdue > 0 && (
          <FilterBadge
            active={activeFilter === "overdue"}
            onClick={() => onFilterChange("overdue")}
            count={counts.overdue}
            icon={<AlertTriangle className="w-3 h-3" />}
            accentClass="text-red-600"
          >
            En retard
          </FilterBadge>
        )}

        {/* Separator */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* Interest level filters */}
        {Object.entries(INTEREST_LEVELS).map(([key, config]) => {
          const count = counts.byInterest[key] || 0;
          if (count === 0) return null;
          return (
            <FilterBadge
              key={key}
              active={activeFilter === key}
              onClick={() => onFilterChange(key)}
              count={count}
              dotColor={config.dot}
            >
              {config.label}
            </FilterBadge>
          );
        })}

        {/* Separator */}
        <div className="w-px h-5 bg-border mx-1" />

        <FilterBadge
          active={activeFilter === "responded"}
          onClick={() => onFilterChange("responded")}
          count={counts.responded}
          icon={<CheckCircle2 className="w-3 h-3" />}
        >
          Répondus
        </FilterBadge>
      </div>

      {/* Search — at the end */}
      <div className="relative flex-shrink-0 w-56 ml-auto">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-9"
        />
      </div>
    </div>
  );
}

function FilterBadge({
  active,
  onClick,
  count,
  icon,
  dotColor,
  accentClass,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  icon?: React.ReactNode;
  dotColor?: string;
  accentClass?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors border
        ${active
          ? "bg-foreground text-background border-foreground"
          : `border-border/60 text-muted-foreground hover:bg-muted/50 ${accentClass || ""}`
        }
      `}
    >
      {dotColor && <span className={`inline-block w-2 h-2 rounded-full ${dotColor}`} />}
      {icon}
      {children}
      <span className={`ml-0.5 text-[10px] ${active ? "opacity-70" : "opacity-50"}`}>
        {count}
      </span>
    </button>
  );
}

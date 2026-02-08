import { User, Mail, Phone, Tag, Euro, ExternalLink } from "lucide-react";

interface SellerInfoPanelProps {
  estimation: {
    nom: string;
    email: string;
    telephone: string | null;
    description: string;
    estimated_value: string | null;
    object_category: string | null;
    photo_urls: string[];
    related_lot_id: string | null;
  };
  getPhotoUrl: (path: string) => string;
}

function formatDescription(desc: string) {
  const parts = desc.split("---");
  return parts[0]?.trim() || desc;
}

export function SellerInfoPanel({ estimation, getPhotoUrl }: SellerInfoPanelProps) {
  return (
    <div className="space-y-3 h-full overflow-y-auto pr-1">
      {/* No redundant header — already shown in the menu bar */}

      {/* Contact details */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {estimation.nom}
        </span>
        <span className="flex items-center gap-1">
          <Mail className="w-3 h-3" />
          {estimation.email}
        </span>
        {estimation.telephone && (
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {estimation.telephone}
          </span>
        )}
        {estimation.object_category && (
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {estimation.object_category}
          </span>
        )}
        {estimation.estimated_value && (
          <span className="flex items-center gap-1">
            <Euro className="w-3 h-3" />
            {estimation.estimated_value}
          </span>
        )}
      </div>

      {/* Photos */}
      {estimation.photo_urls?.length > 0 && (
        <div className={`grid gap-2 ${
          estimation.photo_urls.length === 1 
            ? "grid-cols-1" 
            : "grid-cols-2"
        }`}>
          {estimation.photo_urls.map((url, i) => (
            <a
              key={i}
              href={getPhotoUrl(url)}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-lg overflow-hidden border hover:opacity-90 transition-opacity bg-muted/20 ${
                estimation.photo_urls.length === 1 ? "" : ""
              }`}
            >
              <img
                src={getPhotoUrl(url)}
                alt={`Photo ${i + 1}`}
                className={`w-full object-contain ${
                  estimation.photo_urls.length === 1 ? "max-h-72" : "max-h-56"
                }`}
              />
            </a>
          ))}
        </div>
      )}

      {/* Description */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Description</p>
        <p className="text-sm bg-muted/30 p-3 rounded-lg border border-border/30 leading-relaxed">
          {formatDescription(estimation.description)}
        </p>
      </div>

      {estimation.related_lot_id && (
        <a
          href={`/lot/${estimation.related_lot_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          Voir le lot référencé
        </a>
      )}
    </div>
  );
}

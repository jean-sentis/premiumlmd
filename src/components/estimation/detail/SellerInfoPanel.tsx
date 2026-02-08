import { useState } from "react";
import { User, Mail, Phone, Tag, Euro, ExternalLink } from "lucide-react";
import ImageViewer from "@/components/ImageViewer";

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
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const photoUrls = estimation.photo_urls?.map(getPhotoUrl) || [];

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className="space-y-3 h-full overflow-y-auto pr-1">
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

      {/* Photo — single preview, click to open viewer with all photos */}
      {photoUrls.length > 0 && (
        <button
          onClick={() => openViewer(0)}
          className="w-full rounded-lg overflow-hidden border hover:opacity-90 transition-opacity bg-muted/20 cursor-zoom-in relative group"
        >
          <img
            src={photoUrls[0]}
            alt="Photo principale"
            className="w-full object-contain max-h-56"
          />
          {photoUrls.length > 1 && (
            <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md">
              +{photoUrls.length - 1} photo{photoUrls.length > 2 ? "s" : ""}
            </span>
          )}
        </button>
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

      {/* Full-screen image viewer */}
      {viewerOpen && (
        <ImageViewer
          images={photoUrls}
          currentIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onNavigate={setViewerIndex}
          alt={`Estimation ${estimation.nom}`}
        />
      )}
    </div>
  );
}

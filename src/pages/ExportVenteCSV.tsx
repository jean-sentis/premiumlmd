import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface Sale {
  id: string;
  title: string;
  sale_date: string | null;
  location: string | null;
  sale_type: string | null;
  specialty: string | null;
  lot_count: number | null;
  description: string | null;
  sale_url: string | null;
  cover_image_url: string | null;
  status: string | null;
  fees_info: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface Lot {
  id: string;
  lot_number: number;
  title: string;
  description: string | null;
  estimate_low: number | null;
  estimate_high: number | null;
  estimate_currency: string | null;
  adjudication_price: number | null;
  dimensions: string | null;
  images: string[] | null;
  lot_url: string | null;
  is_after_sale: boolean | null;
  after_sale_price: number | null;
}

interface Exposition {
  id: string;
  exposition_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  notes: string | null;
}

const escapeCSV = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const ExportVenteCSV = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setStatus("error");
      setError("ID de vente manquant");
      return;
    }

    const generateCSV = async () => {
      try {
        // Fetch sale data
        const { data: sale, error: saleError } = await supabase
          .from("interencheres_sales")
          .select("*")
          .eq("id", id)
          .single();

        if (saleError || !sale) {
          throw new Error("Vente non trouvée");
        }

        // Fetch lots
        const { data: lots, error: lotsError } = await supabase
          .from("interencheres_lots")
          .select("*")
          .eq("sale_id", id)
          .order("lot_number", { ascending: true });

        if (lotsError) {
          throw new Error("Erreur lors du chargement des lots");
        }

        // Fetch expositions
        const { data: expositions, error: expoError } = await supabase
          .from("interencheres_expositions")
          .select("*")
          .eq("sale_id", id)
          .order("exposition_date", { ascending: true });

        if (expoError) {
          throw new Error("Erreur lors du chargement des expositions");
        }

        // Build CSV content
        const lines: string[] = [];

        // Section: VENTE
        lines.push("=== INFORMATIONS VENTE ===");
        lines.push("Champ,Valeur");
        lines.push(`Titre,${escapeCSV(sale.title)}`);
        lines.push(`Date,${escapeCSV(sale.sale_date ? new Date(sale.sale_date).toLocaleString("fr-FR") : "")}`);
        lines.push(`Lieu,${escapeCSV(sale.location)}`);
        lines.push(`Type,${escapeCSV(sale.sale_type)}`);
        lines.push(`Spécialité,${escapeCSV(sale.specialty)}`);
        lines.push(`Statut,${escapeCSV(sale.status)}`);
        lines.push(`Nombre de lots,${escapeCSV(sale.lot_count)}`);
        lines.push(`Description,${escapeCSV(sale.description)}`);
        lines.push(`URL,${escapeCSV(sale.sale_url)}`);
        lines.push(`Image couverture,${escapeCSV(sale.cover_image_url)}`);
        lines.push(`Frais,${escapeCSV(sale.fees_info)}`);
        lines.push(`Contact nom,${escapeCSV(sale.contact_name)}`);
        lines.push(`Contact email,${escapeCSV(sale.contact_email)}`);
        lines.push(`Contact téléphone,${escapeCSV(sale.contact_phone)}`);
        lines.push("");

        // Section: EXPOSITIONS
        lines.push("=== EXPOSITIONS ===");
        if (expositions && expositions.length > 0) {
          lines.push("Date,Heure début,Heure fin,Lieu,Notes");
          expositions.forEach((expo: Exposition) => {
            lines.push([
              escapeCSV(expo.exposition_date),
              escapeCSV(expo.start_time),
              escapeCSV(expo.end_time),
              escapeCSV(expo.location),
              escapeCSV(expo.notes),
            ].join(","));
          });
        } else {
          lines.push("Aucune exposition programmée");
        }
        lines.push("");

        // Section: LOTS
        lines.push("=== LOTS ===");
        if (lots && lots.length > 0) {
          lines.push("N°,Titre,Estimation basse,Estimation haute,Devise,Adjudication,Description,Dimensions,Images,URL,After-sale,Prix after-sale");
          lots.forEach((lot) => {
            const imagesArray = lot.images as unknown as string[] | null;
            const images = Array.isArray(imagesArray) ? imagesArray.join(" | ") : "";
            lines.push([
              escapeCSV(lot.lot_number),
              escapeCSV(lot.title),
              escapeCSV(lot.estimate_low),
              escapeCSV(lot.estimate_high),
              escapeCSV(lot.estimate_currency),
              escapeCSV(lot.adjudication_price),
              escapeCSV(lot.description),
              escapeCSV(lot.dimensions),
              escapeCSV(images),
              escapeCSV(lot.lot_url),
              escapeCSV(lot.is_after_sale ? "Oui" : "Non"),
              escapeCSV(lot.after_sale_price),
            ].join(","));
          });
        } else {
          lines.push("Aucun lot dans cette vente");
        }

        // Generate and download file
        const csvContent = lines.join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        const safeTitle = (sale.title || "vente").replace(/[^a-zA-Z0-9]/g, "-").substring(0, 50);
        link.href = url;
        link.download = `export-${safeTitle}-${id.substring(0, 8)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setStatus("success");

        // Redirect to sale page after 2 seconds
        setTimeout(() => {
          navigate(`/vente/${id}`);
        }, 2000);

      } catch (err) {
        console.error("Export error:", err);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    };

    generateCSV();
  }, [id, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-brand-gold mx-auto mb-4" />
            <p className="text-lg font-serif">Génération du fichier CSV...</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-serif text-green-700">Export réussi !</p>
            <p className="text-sm text-muted-foreground mt-2">
              Redirection vers la vente...
            </p>
          </>
        )}
        
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-lg font-serif text-red-700">Erreur d'export</p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-brand-gold text-black font-medium hover:bg-brand-gold/90 transition-colors"
            >
              Retour
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ExportVenteCSV;

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import LotCard from "./LotCard";
import { pickBestInterencheresImages } from "@/lib/interencheres-images";

interface Lot {
  id: string;
  lot_number: number;
  title: string;
  description: string | null;
  estimate_low: number | null;
  estimate_high: number | null;
  images: string[];
  dimensions: string | null;
  lot_url: string;
}

interface LotsGridProps {
  saleId: string;
  saleTitle: string;
  specialty?: string | null;
}

const LotsGrid = ({ saleId, saleTitle, specialty }: LotsGridProps) => {
  const [lots, setLots] = useState<Lot[]>([]);
  const [filteredLots, setFilteredLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchLots = async () => {
      console.log('[LotsGrid] Fetching lots for sale:', saleId);
      setIsLoading(true);

      const { data, error } = await supabase
        .from('interencheres_lots')
        .select('*')
        .eq('sale_id', saleId)
        .order('lot_number', { ascending: true });

      console.log('[LotsGrid] Fetch result:', { count: data?.length, error });

      if (error) {
        console.error('Error fetching lots:', error);
      } else if (data) {
        // Parse images JSON and cast to proper types
        const parsedLots: Lot[] = data.map(lot => {
          const rawImages = Array.isArray(lot.images) ? (lot.images as string[]) : [];
          const images = pickBestInterencheresImages(rawImages, 12);

          return {
            id: lot.id,
            lot_number: lot.lot_number,
            title: lot.title,
            description: lot.description,
            estimate_low: lot.estimate_low,
            estimate_high: lot.estimate_high,
            images,
            dimensions: lot.dimensions,
            lot_url: lot.lot_url,
          };
        });
        setLots(parsedLots);
        setFilteredLots(parsedLots);

        // Calculate max price for slider
        const prices = parsedLots
          .map(l => l.estimate_high || l.estimate_low || 0)
          .filter(p => p > 0);
        if (prices.length > 0) {
          const max = Math.max(...prices);
          setMaxPrice(max);
          setPriceRange([0, max]);
        }
      }

      setIsLoading(false);
    };

    fetchLots();
  }, [saleId]);

  // Filter lots based on search and price
  useEffect(() => {
    let filtered = lots;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lot => 
        lot.title.toLowerCase().includes(term) ||
        (lot.description && lot.description.toLowerCase().includes(term))
      );
    }
    
    // Price filter
    filtered = filtered.filter(lot => {
      const price = lot.estimate_low || lot.estimate_high || 0;
      return price >= priceRange[0] && (priceRange[1] === maxPrice || price <= priceRange[1]);
    });
    
    setFilteredLots(filtered);
  }, [searchTerm, priceRange, lots, maxPrice]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary mr-2" />
        <span className="text-muted-foreground">Chargement des lots...</span>
      </div>
    );
  }

  if (lots.length === 0) {
    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="h-px bg-foreground/30 flex-1 max-w-[100px]"></div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-wide px-8 text-center">
            CATALOGUE
          </h2>
          <div className="h-px bg-foreground/30 flex-1 max-w-[100px]"></div>
        </div>

        <div className="text-center py-12 text-muted-foreground">
          Aucun lot n’est encore affiché pour cette vente.
          <div className="mt-2 text-sm">Si vous venez d’ajouter la vente, le catalogue peut être en cours de synchronisation.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-center mb-8">
        <div className="h-px bg-foreground/30 flex-1 max-w-[100px]"></div>
        <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-wide px-8 text-center">
          CATALOGUE
        </h2>
        <div className="h-px bg-foreground/30 flex-1 max-w-[100px]"></div>
      </div>
      
      <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
        {lots.length} lots disponibles dans cette vente. Cliquez sur un lot pour voir les détails.
      </p>
      
      {/* Filters */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un lot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters ? 'bg-brand-primary text-brand-primary-foreground border-brand-primary' : 'border-border hover:border-brand-gold'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm">Filtres</span>
          </button>
        </div>
        
        {/* Price filter */}
        {showFilters && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Estimation</span>
              <span className="text-sm text-muted-foreground">
                {priceRange[0].toLocaleString('fr-FR')} € - {priceRange[1].toLocaleString('fr-FR')} €
              </span>
            </div>
            <Slider
              value={priceRange}
              onValueChange={(value) => setPriceRange(value as [number, number])}
              max={maxPrice}
              min={0}
              step={50}
              className="w-full"
            />
          </div>
        )}
        
        {/* Results count */}
        {(searchTerm || priceRange[0] > 0 || priceRange[1] < maxPrice) && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            {filteredLots.length} lot{filteredLots.length > 1 ? 's' : ''} trouvé{filteredLots.length > 1 ? 's' : ''}
          </p>
        )}
      </div>
      
      {/* Lots grid with spacing for shadow effect */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
        {filteredLots.map((lot) => (
          <LotCard
            key={lot.id}
            id={lot.id}
            saleId={saleId}
            lotNumber={lot.lot_number}
            title={lot.title}
            description={lot.description || undefined}
            estimateLow={lot.estimate_low}
            estimateHigh={lot.estimate_high}
            images={lot.images}
            dimensions={lot.dimensions}
            lotUrl={lot.lot_url}
            shadowClass="card-shadow"
          />
        ))}
      </div>
      
      {filteredLots.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucun lot ne correspond à votre recherche.
        </div>
      )}
    </div>
  );
};

export default LotsGrid;

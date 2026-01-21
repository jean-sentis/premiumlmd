import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Image, Trash2, Loader2, AlertCircle, ArrowLeft, GripVertical, X } from 'lucide-react';

interface Sale {
  id: string;
  title: string;
  sale_date: string | null;
}

interface Lot {
  id: string;
  lot_number: number;
  title: string;
  images: string[];
}


export default function AdminLots() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [lots, setLots] = useState<Lot[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingLots, setLoadingLots] = useState(false);
  const [uploadingLotId, setUploadingLotId] = useState<string | null>(null);
  const [uploadQueue, setUploadQueue] = useState<{lotId: string, total: number, done: number}[]>([]);
  const [dragOverLotId, setDragOverLotId] = useState<string | null>(null);
  const [draggingImage, setDraggingImage] = useState<{lotId: string, index: number} | null>(null);

  // Accès libre pour tout utilisateur connecté
  const isAdmin = !!user;

  // Charger les ventes
  useEffect(() => {
    const fetchSales = async () => {
      const { data, error } = await supabase
        .from('interencheres_sales')
        .select('id, title, sale_date')
        // On trie par date de création pour voir immédiatement les ventes nouvellement importées
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('Error fetching sales:', error);
        toast.error('Erreur lors du chargement des ventes');
      } else {
        setSales(data || []);
      }
      setLoadingSales(false);
    };

    if (isAdmin) {
      fetchSales();
    }
  }, [isAdmin]);

  // Charger les lots
  useEffect(() => {
    if (!selectedSaleId) {
      setLots([]);
      return;
    }

    const fetchLots = async () => {
      setLoadingLots(true);
      const { data, error } = await supabase
        .from('interencheres_lots')
        .select('id, lot_number, title, images')
        .eq('sale_id', selectedSaleId)
        .order('lot_number');

      if (error) {
        console.error('Error fetching lots:', error);
        toast.error('Erreur lors du chargement des lots');
      } else {
        const lotsWithImages = (data || []).map(lot => ({
          ...lot,
          images: (lot.images as string[] | null) || []
        }));
        setLots(lotsWithImages);
      }
      setLoadingLots(false);
    };

    fetchLots();
  }, [selectedSaleId]);

  // Upload multiple images
  const handleMultipleImageUpload = useCallback(async (lotId: string, files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (fileArray.length === 0) {
      toast.error('Aucune image valide sélectionnée');
      return;
    }

    const oversized = fileArray.filter(f => f.size > 20 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(`${oversized.length} fichier(s) dépassent 20 Mo`);
      return;
    }

    setUploadingLotId(lotId);
    setUploadQueue(prev => [...prev, { lotId, total: fileArray.length, done: 0 }]);

    const lot = lots.find(l => l.id === lotId);
    const currentImages = [...(lot?.images || [])];
    let successCount = 0;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const storagePath = `${selectedSaleId}/${lotId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('sale-images')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('sale-images')
          .getPublicUrl(storagePath);

        currentImages.push(publicUrl);
        successCount++;

        setUploadQueue(prev => prev.map(q => 
          q.lotId === lotId ? { ...q, done: i + 1 } : q
        ));
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    // Sauvegarder toutes les images
    if (successCount > 0) {
      const { error: updateError } = await supabase
        .from('interencheres_lots')
        .update({ images: currentImages })
        .eq('id', lotId);

      if (updateError) {
        toast.error('Erreur lors de la sauvegarde');
      } else {
        setLots(prev => prev.map(l => 
          l.id === lotId ? { ...l, images: currentImages } : l
        ));
        toast.success(`${successCount} image(s) uploadée(s)`);
      }
    }

    setUploadingLotId(null);
    setUploadQueue(prev => prev.filter(q => q.lotId !== lotId));
  }, [selectedSaleId, lots]);

  // Réordonner les images (drag & drop)
  const handleImageReorder = useCallback(async (lotId: string, fromIndex: number, toIndex: number) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot || fromIndex === toIndex) return;

    const newImages = [...lot.images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);

    // Update local state immediately
    setLots(prev => prev.map(l => 
      l.id === lotId ? { ...l, images: newImages } : l
    ));

    // Save to database
    const { error } = await supabase
      .from('interencheres_lots')
      .update({ images: newImages })
      .eq('id', lotId);

    if (error) {
      toast.error('Erreur lors de la réorganisation');
      // Revert on error
      setLots(prev => prev.map(l => 
        l.id === lotId ? { ...l, images: lot.images } : l
      ));
    }
  }, [lots]);

  // Supprimer une image
  const handleDeleteImage = useCallback(async (lotId: string, imageUrl: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;

    try {
      const urlParts = imageUrl.split('/sale-images/');
      if (urlParts.length === 2) {
        const storagePath = urlParts[1];
        await supabase.storage.from('sale-images').remove([storagePath]);
      }

      const newImages = lot.images.filter(img => img !== imageUrl);
      const { error } = await supabase
        .from('interencheres_lots')
        .update({ images: newImages })
        .eq('id', lotId);

      if (error) throw error;

      setLots(prev => prev.map(l => 
        l.id === lotId ? { ...l, images: newImages } : l
      ));

      toast.success('Image supprimée');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    }
  }, [lots]);

  // Drag handlers pour la zone de drop (upload de fichiers)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Vérifier si c'est un fichier externe (pas un réordonnancement interne)
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, lotId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Seulement pour les fichiers externes
    if (e.dataTransfer.types.includes('Files') && !draggingImage) {
      setDragOverLotId(lotId);
    }
  }, [draggingImage]);

  const handleDragLeave = useCallback((e: React.DragEvent, lotId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Vérifier qu'on quitte vraiment la zone (pas un enfant)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      if (dragOverLotId === lotId) {
        setDragOverLotId(null);
      }
    }
  }, [dragOverLotId]);

  const handleDrop = useCallback((e: React.DragEvent, lotId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverLotId(null);

    // Ignorer si c'est un réordonnancement interne
    if (draggingImage) {
      return;
    }

    // Récupérer les fichiers
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      console.log(`Dropping ${files.length} files on lot ${lotId}`);
      handleMultipleImageUpload(lotId, files);
    }
  }, [draggingImage, handleMultipleImageUpload]);

  // Drag handlers pour le réordonnancement
  const handleImageDragStart = useCallback((e: React.DragEvent, lotId: string, index: number) => {
    setDraggingImage({ lotId, index });
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleImageDragEnd = useCallback(() => {
    setDraggingImage(null);
  }, []);

  const handleImageDragOver = useCallback((e: React.DragEvent, lotId: string, targetIndex: number) => {
    e.preventDefault();
    if (draggingImage && draggingImage.lotId === lotId && draggingImage.index !== targetIndex) {
      handleImageReorder(lotId, draggingImage.index, targetIndex);
      setDraggingImage({ lotId, index: targetIndex });
    }
  }, [draggingImage, handleImageReorder]);

  // États d'interface
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-semibold">Connexion requise</h2>
            <p className="text-muted-foreground">
              Vous devez être connecté pour accéder à cette page.
            </p>
            <Button onClick={() => navigate('/auth')}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Accès refusé</h2>
            <p className="text-muted-foreground">
              Vous n'avez pas les droits d'administration.
            </p>
            <p className="text-sm text-muted-foreground">
              Connecté en tant que: {user.email}
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getUploadProgress = (lotId: string) => {
    const queue = uploadQueue.find(q => q.lotId === lotId);
    if (!queue) return null;
    return { done: queue.done, total: queue.total };
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Upload images lots</h1>
          </div>
          
          {/* Sélecteur de vente inline */}
          <Select value={selectedSaleId} onValueChange={setSelectedSaleId}>
            <SelectTrigger className="w-80">
              <SelectValue placeholder={loadingSales ? "Chargement..." : "Choisir une vente"} />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {sales.map(sale => (
                <SelectItem key={sale.id} value={sale.id}>
                  <span className="truncate">{sale.title}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Liste des lots - compacte */}
        {!selectedSaleId ? (
          <div className="text-center py-12 text-muted-foreground">
            ← Sélectionnez une vente pour afficher ses lots
          </div>
        ) : loadingLots ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : lots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Aucun lot dans cette vente
          </div>
        ) : (
          <div className="space-y-2">
            {/* Stats rapides */}
            <div className="text-sm text-muted-foreground mb-4">
              {lots.length} lots • {lots.filter(l => l.images.length > 0).length} avec images
            </div>
            
            {lots.map(lot => {
              const progress = getUploadProgress(lot.id);
              const isDragOver = dragOverLotId === lot.id;
              
              return (
                <div 
                  key={lot.id}
                  className={`border rounded-lg p-3 transition-colors ${isDragOver ? 'ring-2 ring-primary bg-primary/5' : 'bg-card'}`}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, lot.id)}
                  onDragLeave={(e) => handleDragLeave(e, lot.id)}
                  onDrop={(e) => handleDrop(e, lot.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Numéro lot */}
                    <div className="flex-shrink-0 w-12 h-12 bg-muted rounded flex items-center justify-center font-mono font-bold text-lg">
                      {lot.lot_number}
                    </div>

                    {/* Titre + images */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate mb-2">{lot.title}</p>
                      
                      {/* Images en ligne */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {lot.images.map((img, idx) => (
                          <div 
                            key={`${img}-${idx}`}
                            draggable
                            onDragStart={(e) => handleImageDragStart(e, lot.id, idx)}
                            onDragEnd={handleImageDragEnd}
                            onDragOver={(e) => handleImageDragOver(e, lot.id, idx)}
                            className={`relative group cursor-move ${
                              draggingImage?.lotId === lot.id && draggingImage?.index === idx ? 'opacity-50' : ''
                            }`}
                          >
                            <img
                              src={img}
                              alt={`${idx + 1}`}
                              className="h-12 w-12 object-cover rounded border"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                            />
                            <button
                              onClick={() => handleDeleteImage(lot.id, img)}
                              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                        
                        {/* Bouton upload compact */}
                        <label className={`h-12 w-12 border-2 border-dashed rounded flex items-center justify-center cursor-pointer transition-colors ${
                          isDragOver ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary'
                        }`}>
                          {progress ? (
                            <span className="text-xs">{progress.done}/{progress.total}</span>
                          ) : uploadingLotId === lot.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 text-muted-foreground" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => e.target.files && handleMultipleImageUpload(lot.id, e.target.files)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

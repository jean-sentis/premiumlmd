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

const ALLOWED_EMAILS = ['js@caspevi.com', 'admin@example.com'];

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

  // Vérification simple d'accès
  const isAdmin = user?.email && (ALLOWED_EMAILS.includes(user.email) || user.email.endsWith('@lovable.dev'));

  // Charger les ventes
  useEffect(() => {
    const fetchSales = async () => {
      const { data, error } = await supabase
        .from('interencheres_sales')
        .select('id, title, sale_date')
        .order('sale_date', { ascending: false })
        .limit(50);

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

  // Drag handlers pour la zone de drop
  const handleDragOver = useCallback((e: React.DragEvent, lotId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingImage) {
      setDragOverLotId(lotId);
    }
  }, [draggingImage]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverLotId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, lotId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverLotId(null);

    if (draggingImage) {
      // C'est un réordonnancement interne
      return;
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Admin - Gestion des images</h1>
            <p className="text-muted-foreground">
              Glissez-déposez vos photos (max 20 Mo/image) • Réorganisez par drag & drop
            </p>
          </div>
        </div>

        {/* Sélection de vente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sélectionner une vente</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedSaleId} onValueChange={setSelectedSaleId}>
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder={loadingSales ? "Chargement..." : "Choisir une vente"} />
              </SelectTrigger>
              <SelectContent>
                {sales.map(sale => (
                  <SelectItem key={sale.id} value={sale.id}>
                    {sale.title}
                    {sale.sale_date && ` - ${new Date(sale.sale_date).toLocaleDateString('fr-FR')}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Liste des lots */}
        {selectedSaleId && (
          <div className="space-y-4">
            {loadingLots ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : lots.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Aucun lot dans cette vente
                </CardContent>
              </Card>
            ) : (
              lots.map(lot => {
                const progress = getUploadProgress(lot.id);
                const isDragOver = dragOverLotId === lot.id;
                
                return (
                  <Card 
                    key={lot.id}
                    className={`transition-colors ${isDragOver ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Infos lot */}
                        <div className="flex-shrink-0 w-full md:w-48">
                          <h3 className="font-semibold">
                            Lot {lot.lot_number}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {lot.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {lot.images.length} image(s)
                          </p>
                        </div>

                        {/* Zone de drop + images */}
                        <div 
                          className="flex-1"
                          onDragOver={(e) => handleDragOver(e, lot.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, lot.id)}
                        >
                          {/* Images existantes avec drag & drop */}
                          <div className="flex flex-wrap gap-2 mb-3 min-h-[80px]">
                            {lot.images.map((img, idx) => (
                              <div 
                                key={`${img}-${idx}`}
                                draggable
                                onDragStart={(e) => handleImageDragStart(e, lot.id, idx)}
                                onDragEnd={handleImageDragEnd}
                                onDragOver={(e) => handleImageDragOver(e, lot.id, idx)}
                                className={`relative group cursor-move ${
                                  draggingImage?.lotId === lot.id && draggingImage?.index === idx 
                                    ? 'opacity-50' 
                                    : ''
                                }`}
                              >
                                <div className="absolute top-0 left-0 bg-black/60 text-white text-xs px-1 rounded-br z-10">
                                  <GripVertical className="h-3 w-3 inline" /> {idx + 1}
                                </div>
                                <img
                                  src={img}
                                  alt={`Image ${idx + 1}`}
                                  className="h-20 w-20 object-cover rounded border hover:ring-2 hover:ring-primary transition-all"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                                  }}
                                />
                                <button
                                  onClick={() => handleDeleteImage(lot.id, img)}
                                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            
                            {/* Zone de drop visuelle */}
                            <label 
                              className={`h-20 min-w-[80px] px-4 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer transition-colors ${
                                isDragOver 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
                              }`}
                            >
                              <Upload className="h-5 w-5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground mt-1">
                                {progress ? `${progress.done}/${progress.total}` : 'Ajouter'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                disabled={uploadingLotId === lot.id}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleMultipleImageUpload(lot.id, e.target.files);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                          </div>

                          {/* Progress bar */}
                          {progress && (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all duration-300"
                                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {progress.done}/{progress.total}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

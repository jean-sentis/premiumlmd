import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Image, Trash2, Loader2, Check, AlertCircle, ArrowLeft } from 'lucide-react';

interface Sale {
  id: string;
  title: string;
  sale_date: string | null;
}

interface Lot {
  id: string;
  lot_number: number;
  title: string;
  images: string[] | null;
}

const ALLOWED_EMAILS = ['admin@example.com']; // À personnaliser

export default function AdminLots() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [lots, setLots] = useState<Lot[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingLots, setLoadingLots] = useState(false);
  const [uploadingLotId, setUploadingLotId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Vérification simple d'accès (à renforcer avec un vrai système de rôles)
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

  // Charger les lots quand une vente est sélectionnée
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
        // Cast images as string[] since they're stored as jsonb array
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

  // Upload d'une image
  const handleImageUpload = useCallback(async (lotId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Le fichier doit être une image');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 20 Mo');
      return;
    }

    setUploadingLotId(lotId);
    setUploadProgress(prev => ({ ...prev, [lotId]: 0 }));

    try {
      // Générer un nom de fichier unique
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const storagePath = `${selectedSaleId}/${lotId}/${fileName}`;

      // Upload vers le storage
      const { error: uploadError } = await supabase.storage
        .from('sale-images')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Construire l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('sale-images')
        .getPublicUrl(storagePath);

      // Mettre à jour le lot avec la nouvelle image
      const lot = lots.find(l => l.id === lotId);
      const currentImages = lot?.images || [];
      const newImages = [...currentImages, publicUrl];

      const { error: updateError } = await supabase
        .from('interencheres_lots')
        .update({ images: newImages })
        .eq('id', lotId);

      if (updateError) throw updateError;

      // Mettre à jour l'état local
      setLots(prev => prev.map(l => 
        l.id === lotId ? { ...l, images: newImages } : l
      ));

      toast.success('Image uploadée avec succès');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingLotId(null);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[lotId];
        return newProgress;
      });
    }
  }, [selectedSaleId, lots]);

  // Supprimer une image
  const handleDeleteImage = useCallback(async (lotId: string, imageUrl: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;

    try {
      // Extraire le chemin du storage de l'URL
      const urlParts = imageUrl.split('/sale-images/');
      if (urlParts.length === 2) {
        const storagePath = urlParts[1];
        await supabase.storage.from('sale-images').remove([storagePath]);
      }

      // Mettre à jour le lot
      const newImages = (lot.images || []).filter(img => img !== imageUrl);
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

  // État de chargement auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Non connecté
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

  // Non admin
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
              Uploadez des photos pour chaque lot (max 20 Mo/image)
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
              lots.map(lot => (
                <Card key={lot.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Infos lot */}
                      <div className="flex-shrink-0 w-full md:w-64">
                        <h3 className="font-semibold">
                          Lot {lot.lot_number}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {lot.title}
                        </p>
                      </div>

                      {/* Images existantes */}
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {(lot.images || []).map((img, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={img}
                                alt={`Image ${idx + 1}`}
                                className="h-20 w-20 object-cover rounded border"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                                }}
                              />
                              <button
                                onClick={() => handleDeleteImage(lot.id, img)}
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          {(!lot.images || lot.images.length === 0) && (
                            <div className="h-20 w-20 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                              <Image className="h-6 w-6" />
                            </div>
                          )}
                        </div>

                        {/* Upload */}
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            disabled={uploadingLotId === lot.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(lot.id, file);
                                e.target.value = '';
                              }
                            }}
                            className="flex-1"
                          />
                          {uploadingLotId === lot.id && (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

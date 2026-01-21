import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Loader2, AlertCircle, ArrowLeft, FileSpreadsheet, X, Play, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import * as ExcelJS from 'exceljs';

interface DroppedFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: string;
}

interface ParsedLot {
  lot: string;
  title: string;
  estimate: string;
  image: string;
  url: string;
}

interface ParsedSale {
  title: string;
  date: string;
  location: string;
  url: string;
  frais?: string;
}

export default function AdminLots() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const isAdmin = !!user;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const newFiles = files.map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      status: 'pending' as const
    }));
    
    setDroppedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${files.length} fichier(s) ajouté(s)`);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      status: 'pending' as const
    }));
    
    setDroppedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${files.length} fichier(s) ajouté(s)`);
  }, []);

  const removeFile = useCallback((id: string) => {
    setDroppedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setDroppedFiles([]);
  }, []);

  // Parser un fichier Excel et extraire les données
  const parseExcelFile = async (file: File): Promise<{ sale: ParsedSale; lots: ParsedLot[] } | null> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('Aucune feuille trouvée');
      }

      const lots: ParsedLot[] = [];
      let saleTitle = '';
      let saleDate = '';
      let saleUrl = '';

      // Parcourir les lignes (en supposant que la première ligne contient les en-têtes)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const values = row.values as (string | number | undefined)[];
        
        // Adapter selon la structure de votre fichier Excel
        // Format attendu: N° lot | Titre | Estimation | Image URL | Lot URL
        const lotNumber = values[1]?.toString() || '';
        const title = values[2]?.toString() || '';
        const estimate = values[3]?.toString() || '';
        const imageUrl = values[4]?.toString() || '';
        const lotUrl = values[5]?.toString() || '';

        if (lotNumber && title) {
          lots.push({
            lot: lotNumber,
            title,
            estimate,
            image: imageUrl,
            url: lotUrl
          });

          // Extraire les infos de la vente du premier lot
          if (!saleUrl && lotUrl) {
            const urlMatch = lotUrl.match(/(https?:\/\/[^/]+\/[^/]+\/[^/]+\/)/);
            if (urlMatch) {
              saleUrl = urlMatch[1];
            }
          }
        }
      });

      // Construire les infos de vente à partir du nom du fichier ou des données
      saleTitle = file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
      saleDate = new Date().toISOString().split('T')[0];

      if (lots.length === 0) {
        throw new Error('Aucun lot trouvé dans le fichier');
      }

      return {
        sale: {
          title: saleTitle,
          date: saleDate,
          location: 'Avignon',
          url: saleUrl || `https://www.interencheres.com/vente/${Date.now()}`
        },
        lots
      };
    } catch (error) {
      console.error('Erreur parsing Excel:', error);
      return null;
    }
  };

  // Importer les fichiers
  const handleImport = async () => {
    const pendingFiles = droppedFiles.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) {
      toast.error('Aucun fichier à importer');
      return;
    }

    setIsImporting(true);

    for (const droppedFile of pendingFiles) {
      const { file, id } = droppedFile;
      
      // Marquer comme en cours
      setDroppedFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'processing' as const } : f
      ));

      try {
        // Vérifier le type de fichier
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        const lowerName = file.name.toLowerCase();
        const isImage = file.type.startsWith('image/') || 
          lowerName.endsWith('.jpg') || 
          lowerName.endsWith('.jpeg') || 
          lowerName.endsWith('.png') || 
          lowerName.endsWith('.webp') ||
          lowerName.endsWith('.gif');

        if (isImage) {
          // Upload vers le storage
          const fileName = `${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('sale-images')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          setDroppedFiles(prev => prev.map(f => 
            f.id === id ? { ...f, status: 'done' as const, result: `Image uploadée: ${fileName}` } : f
          ));
        } else if (isExcel) {
          // Parser le fichier Excel
          const parsed = await parseExcelFile(file);
          
          if (!parsed) {
            throw new Error('Impossible de parser le fichier');
          }

          // Appeler l'edge function
          const { data, error } = await supabase.functions.invoke('import-lots-json', {
            body: {
              sale: parsed.sale,
              lots: parsed.lots,
              houseId: '12-p-avignon'
            }
          });

          if (error) throw error;

          setDroppedFiles(prev => prev.map(f => 
            f.id === id ? { 
              ...f, 
              status: 'done' as const, 
              result: `${parsed.lots.length} lots importés` 
            } : f
          ));
        } else {
          throw new Error('Type de fichier non supporté');
        }
      } catch (error) {
        console.error('Erreur import:', error);
        setDroppedFiles(prev => prev.map(f => 
          f.id === id ? { 
            ...f, 
            status: 'error' as const, 
            result: error instanceof Error ? error.message : 'Erreur inconnue' 
          } : f
        ));
      }
    }

    setIsImporting(false);
    toast.success('Import terminé');
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />;
    }
    return <FileSpreadsheet className="h-5 w-5 text-primary flex-shrink-0" />;
  };

  const getStatusColor = (status: DroppedFile['status']) => {
    switch (status) {
      case 'processing': return 'text-amber-500';
      case 'done': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-semibold">Connexion requise</h2>
            <Button onClick={() => navigate('/auth')}>Se connecter</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingCount = droppedFiles.filter(f => f.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Import fichiers</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Button 
                onClick={handleImport} 
                disabled={isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Importer ({pendingCount})
              </Button>
            )}
            {droppedFiles.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAll}>
                Tout effacer
              </Button>
            )}
          </div>
        </div>

        {/* Zone de dépôt */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-all
            ${isDragOver 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-muted-foreground/30 hover:border-primary/50'
            }
          `}
        >
          <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="text-lg font-medium mb-2">
            Déposez vos fichiers ici
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Excel (.xlsx), CSV, images...
          </p>
          <label className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                Ou cliquez pour sélectionner
                <input
                  type="file"
                  multiple
                  accept=".xlsx,.xls,.csv,image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </span>
            </Button>
          </label>
        </div>

        {/* Liste des fichiers */}
        {droppedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {droppedFiles.length} fichier(s) • {pendingCount} en attente
            </p>
            
            <div className="grid gap-2">
              {droppedFiles.map(({ file, id, status, result }) => (
                <div 
                  key={id}
                  className="flex items-center gap-3 p-3 bg-card border rounded-lg"
                >
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className={`text-xs ${getStatusColor(status)}`}>
                      {status === 'pending' && `${(file.size / 1024).toFixed(1)} Ko`}
                      {status === 'processing' && 'Import en cours...'}
                      {status === 'done' && (result || 'Importé')}
                      {status === 'error' && (result || 'Erreur')}
                    </p>
                  </div>
                  {status === 'processing' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFile(id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

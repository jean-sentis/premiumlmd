import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Loader2, AlertCircle, ArrowLeft, FileSpreadsheet, X } from 'lucide-react';

interface DroppedFile {
  file: File;
  id: string;
}

export default function AdminLots() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

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
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`
    }));
    
    setDroppedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${files.length} fichier(s) ajouté(s)`);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`
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
          
          {droppedFiles.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              Tout effacer
            </Button>
          )}
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
            Excel, CSV, images... je ferai le tri
          </p>
          <label className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                Ou cliquez pour sélectionner
                <input
                  type="file"
                  multiple
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
              {droppedFiles.length} fichier(s) en attente
            </p>
            
            <div className="grid gap-2">
              {droppedFiles.map(({ file, id }) => (
                <div 
                  key={id}
                  className="flex items-center gap-3 p-3 bg-card border rounded-lg"
                >
                  <FileSpreadsheet className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} Ko • {file.type || 'type inconnu'}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeFile(id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

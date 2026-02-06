import { useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface PhotoItem {
  file: File;
  preview: string;
  uploading?: boolean;
  uploadedUrl?: string;
}

interface PhotoUploadGridProps {
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
  maxPhotos?: number;
}

export function PhotoUploadGrid({ photos, onPhotosChange, maxPhotos = 6 }: PhotoUploadGridProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > maxPhotos) {
      toast({
        title: "Limite atteinte",
        description: `Maximum ${maxPhotos} photos par demande`,
        variant: "destructive",
      });
      return;
    }

    const newPhotos: PhotoItem[] = files
      .filter((f) => f.type.startsWith("image/"))
      .filter((f) => {
        if (f.size > 15 * 1024 * 1024) {
          toast({ title: "Fichier trop volumineux", description: `${f.name} dépasse 15 Mo`, variant: "destructive" });
          return false;
        }
        return true;
      })
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

    onPhotosChange([...photos, ...newPhotos]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (preview: string) => {
    URL.revokeObjectURL(preview);
    onPhotosChange(photos.filter((p) => p.preview !== preview));
  };

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed rounded-lg p-5 text-center cursor-pointer hover:border-brand-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <Upload className="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cliquez ou glissez vos photos ici</p>
        <p className="text-xs text-muted-foreground mt-1">JPEG, PNG • Max 15 Mo • {maxPhotos} photos max</p>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.preview} className="relative group aspect-square">
              <img
                src={photo.preview}
                alt="Objet à estimer"
                className="w-full h-full object-cover rounded-lg"
              />
              {photo.uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removePhoto(photo.preview)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

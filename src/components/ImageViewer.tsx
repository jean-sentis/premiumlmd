import { useState, useRef, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageViewerProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  alt: string;
}

const ImageViewer = ({
  images,
  currentIndex,
  onClose,
  onNavigate,
  alt,
}: ImageViewerProps) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const currentImage = images[currentIndex];

  // Reset zoom when image changes
  useEffect(() => {
    resetView();
  }, [currentIndex]);

  const resetView = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.3, 12));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => {
      const newZoom = Math.max(z / 1.3, 0.3);
      if (newZoom <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  // Smooth progressive scroll zoom centered on cursor
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    
    setZoom((prevZoom) => {
      const newZoom = Math.min(Math.max(prevZoom * factor, 0.3), 12);

      // Zoom toward cursor position
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const cursorX = e.clientX - rect.left - rect.width / 2;
        const cursorY = e.clientY - rect.top - rect.height / 2;
        const ratio = 1 - newZoom / prevZoom;

        setPosition((prev) => ({
          x: prev.x + (cursorX - prev.x) * ratio,
          y: prev.y + (cursorY - prev.y) * ratio,
        }));
      }
      return newZoom;
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, zoom, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (zoom > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  }, [zoom, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging && zoom > 1 && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  }, [isDragging, zoom, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const prevImage = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  const nextImage = useCallback(() => {
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, images.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          prevImage();
          break;
        case "ArrowRight":
          nextImage();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "0":
          resetView();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, prevImage, nextImage, handleZoomIn, handleZoomOut, resetView]);

  // Double-click to toggle zoom
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoom < 2) {
      const newZoom = 3;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left - rect.width / 2;
        const clickY = e.clientY - rect.top - rect.height / 2;
        setPosition({ x: -clickX * (newZoom - 1), y: -clickY * (newZoom - 1) });
      }
      setZoom(newZoom);
    } else {
      resetView();
    }
  }, [zoom, resetView]);

  // Click on backdrop (outside image) to close
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(8px)" }}
    >
      {/* Top toolbar — semi-transparent */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
        <div className="flex items-center gap-3">
          <span className="text-white/80 text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </span>
          {zoom !== 1 && (
            <span className="text-white/50 text-xs">
              {Math.round(zoom * 100)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={handleZoomOut}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Zoom arrière (−)"
          >
            <ZoomOut className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Zoom avant (+)"
          >
            <ZoomIn className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={resetView}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Réinitialiser (0)"
          >
            <RotateCcw className="w-4.5 h-4.5" />
          </button>
          <div className="w-px h-5 bg-white/20 mx-1.5" />
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            title="Fermer (Échap)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image area — transparent background */}
      <div
        className="flex-1 relative overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        onClick={handleBackdropClick}
        style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in" }}
      >
        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white rounded-full transition-all"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
            )}
            {currentIndex < images.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white rounded-full transition-all"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            )}
          </>
        )}

        {/* Image */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            ref={imageRef}
            src={currentImage}
            alt={alt}
            className="max-w-[90vw] max-h-[80vh] select-none pointer-events-auto"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.15s ease-out",
              filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.5))",
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom thumbnails — only if multiple images */}
      {images.length > 1 && (
        <div className="px-4 py-2.5" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="flex items-center justify-center gap-2 overflow-x-auto">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(idx)}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentIndex
                    ? "border-white opacity-100 scale-105"
                    : "border-transparent opacity-40 hover:opacity-70"
                }`}
              >
                <img
                  src={img}
                  alt={`Miniature ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Help hint */}
      <div className="absolute bottom-20 left-4 text-white/30 text-[10px] hidden md:block">
        Molette : zoom progressif • Double-clic : zoom ×3 • Glisser : déplacer • ← → : naviguer • Échap : fermer
      </div>
    </div>
  );
};

export default ImageViewer;

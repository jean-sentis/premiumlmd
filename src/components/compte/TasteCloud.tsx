import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface TasteData {
  styles: string[];
  ambiances: string[];
  categories: string[];
  periods: string[];
  materials: string[];
  colors: string[];
  budget_min?: number;
  budget_max?: number;
}

interface TasteCloudProps {
  data: TasteData;
  onRemoveTag?: (category: keyof TasteData, value: string) => void;
  isEditable?: boolean;
}

const categoryLabels: Record<string, { label: string; color: string; bgColor: string }> = {
  styles: { label: 'Style', color: 'text-amber-800', bgColor: 'bg-amber-100' },
  ambiances: { label: 'Ambiance', color: 'text-rose-800', bgColor: 'bg-rose-100' },
  categories: { label: 'Catégorie', color: 'text-blue-800', bgColor: 'bg-blue-100' },
  periods: { label: 'Époque', color: 'text-emerald-800', bgColor: 'bg-emerald-100' },
  materials: { label: 'Matériau', color: 'text-purple-800', bgColor: 'bg-purple-100' },
  colors: { label: 'Couleur', color: 'text-pink-800', bgColor: 'bg-pink-100' },
};

export const TasteCloud: React.FC<TasteCloudProps> = ({ 
  data, 
  onRemoveTag,
  isEditable = false 
}) => {
  const allTags: { category: keyof TasteData; value: string; config: typeof categoryLabels[string] }[] = [];

  // Collect all tags with their categories
  Object.entries(categoryLabels).forEach(([key, config]) => {
    const values = data[key as keyof TasteData];
    if (Array.isArray(values)) {
      values.forEach(value => {
        allTags.push({ category: key as keyof TasteData, value, config });
      });
    }
  });

  // Add budget if defined
  const hasBudget = data.budget_min || data.budget_max;

  if (allTags.length === 0 && !hasBudget) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm italic">
        Les concepts apparaîtront ici au fil de la conversation...
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Tag cloud */}
      <div className="flex flex-wrap gap-2 justify-center">
        <AnimatePresence mode="popLayout">
          {allTags.map(({ category, value, config }, index) => (
            <motion.div
              key={`${category}-${value}`}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.05,
                type: "spring",
                stiffness: 200
              }}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                ${config.bgColor} ${config.color}
                text-sm font-medium
                shadow-sm border border-white/50
                ${isEditable ? 'pr-2' : ''}
              `}
            >
              <span className="opacity-60 text-xs">{config.label}:</span>
              <span>{value}</span>
              {isEditable && onRemoveTag && (
                <button
                  onClick={() => onRemoveTag(category, value)}
                  className="ml-1 p-0.5 rounded-full hover:bg-black/10 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Budget tag */}
        {hasBudget && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
              bg-slate-100 text-slate-800
              text-sm font-medium
              shadow-sm border border-white/50"
          >
            <span className="opacity-60 text-xs">Budget:</span>
            <span>
              {data.budget_min ? `${data.budget_min.toLocaleString()}€` : '?'} 
              {' - '}
              {data.budget_max ? `${data.budget_max.toLocaleString()}€` : '?'}
            </span>
          </motion.div>
        )}
      </div>

      {/* Visual indicator of confidence/completeness */}
      <div className="mt-4 flex justify-center">
        <div className="flex gap-1">
          {Object.keys(categoryLabels).map((key) => {
            const values = data[key as keyof TasteData];
            const hasValue = Array.isArray(values) && values.length > 0;
            const config = categoryLabels[key];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: hasValue ? 1 : 0.3 }}
                className={`w-2 h-2 rounded-full ${hasValue ? config.bgColor.replace('100', '400') : 'bg-slate-200'}`}
                title={config.label}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

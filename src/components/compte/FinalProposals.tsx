import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProposalLot {
  id: string;
  title: string;
  imageUrl: string;
}

interface FinalProposalsProps {
  lots: ProposalLot[];
  onValidate: (validatedIds: string[], rejectedIds: string[]) => void;
}

export const FinalProposals: React.FC<FinalProposalsProps> = ({
  lots,
  onValidate,
}) => {
  const [lotStates, setLotStates] = useState<Record<string, 'yes' | 'no' | null>>(
    Object.fromEntries(lots.map(lot => [lot.id, null]))
  );

  const toggleLot = (lotId: string, value: 'yes' | 'no') => {
    setLotStates(prev => ({
      ...prev,
      [lotId]: prev[lotId] === value ? null : value,
    }));
  };

  const answeredCount = Object.values(lotStates).filter(v => v !== null).length;
  const allAnswered = answeredCount === lots.length;
  const someAnswered = answeredCount > 0;

  const handleSubmit = () => {
    const validated = Object.entries(lotStates)
      .filter(([_, state]) => state === 'yes')
      .map(([id]) => id);
    const rejected = Object.entries(lotStates)
      .filter(([_, state]) => state === 'no')
      .map(([id]) => id);
    onValidate(validated, rejected);
  };

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-foreground font-medium mb-3">
        Cliquez sur ✓ ou ✗ pour chaque objet :
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {lots.map((lot, index) => (
          <motion.div
            key={lot.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`
              relative aspect-square rounded-lg overflow-hidden border-2 transition-all
              ${lotStates[lot.id] === 'yes' ? 'border-emerald-500 ring-2 ring-emerald-200' : ''}
              ${lotStates[lot.id] === 'no' ? 'border-red-300 opacity-50' : ''}
              ${lotStates[lot.id] === null ? 'border-border hover:border-primary/50' : ''}
            `}
          >
            <img 
              src={lot.imageUrl} 
              alt={lot.title}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            
            {/* Title */}
            <div className="absolute inset-x-0 bottom-0 p-2">
              <p className="text-white text-xs line-clamp-2 mb-8">{lot.title}</p>
            </div>
            
            {/* Yes/No buttons */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
              <button
                onClick={() => toggleLot(lot.id, 'yes')}
                className={`
                  p-2 rounded-full transition-all shadow-lg
                  ${lotStates[lot.id] === 'yes' 
                    ? 'bg-emerald-500 text-white scale-110' 
                    : 'bg-white/90 hover:bg-emerald-100 text-muted-foreground hover:text-emerald-600'
                  }
                `}
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleLot(lot.id, 'no')}
                className={`
                  p-2 rounded-full transition-all shadow-lg
                  ${lotStates[lot.id] === 'no' 
                    ? 'bg-red-500 text-white scale-110' 
                    : 'bg-white/90 hover:bg-red-100 text-muted-foreground hover:text-red-600'
                  }
                `}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Status indicator */}
            {lotStates[lot.id] === 'yes' && (
              <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            {lotStates[lot.id] === 'no' && (
              <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                <X className="w-3 h-3 text-white" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="text-center text-xs text-muted-foreground">
        {answeredCount} / {lots.length} réponses
      </div>

      {someAnswered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Button
            onClick={handleSubmit}
            size="sm"
            className="w-full"
            variant={allAnswered ? "default" : "outline"}
          >
            {allAnswered ? "Valider mes réponses" : `Valider (${answeredCount}/${lots.length})`}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InteractiveListProps {
  items: string[];
  question: string;
  onValidate: (validatedItems: string[], rejectedItems: string[]) => void;
}

export const InteractiveList: React.FC<InteractiveListProps> = ({
  items,
  question,
  onValidate,
}) => {
  const [itemStates, setItemStates] = useState<Record<string, 'yes' | 'no' | null>>(
    Object.fromEntries(items.map(item => [item, null]))
  );

  const toggleItem = (item: string, value: 'yes' | 'no') => {
    setItemStates(prev => ({
      ...prev,
      [item]: prev[item] === value ? null : value,
    }));
  };

  const allAnswered = Object.values(itemStates).every(v => v !== null);
  const someAnswered = Object.values(itemStates).some(v => v !== null);

  const handleSubmit = () => {
    const validated = Object.entries(itemStates)
      .filter(([_, state]) => state === 'yes')
      .map(([item]) => item);
    const rejected = Object.entries(itemStates)
      .filter(([_, state]) => state === 'no')
      .map(([item]) => item);
    onValidate(validated, rejected);
  };

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-foreground font-medium">{question}</p>
      
      <div className="space-y-2">
        {items.map((item, index) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              flex items-center justify-between gap-3 px-3 py-2 rounded-lg border
              ${itemStates[item] === 'yes' ? 'bg-emerald-50 border-emerald-300' : ''}
              ${itemStates[item] === 'no' ? 'bg-red-50 border-red-200 opacity-60' : ''}
              ${itemStates[item] === null ? 'bg-muted/50 border-border' : ''}
            `}
          >
            <span className={`text-sm ${itemStates[item] === 'no' ? 'line-through text-muted-foreground' : ''}`}>
              {item}
            </span>
            
            <div className="flex gap-1.5">
              <button
                onClick={() => toggleItem(item, 'yes')}
                className={`
                  p-1.5 rounded-full transition-all
                  ${itemStates[item] === 'yes' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-muted hover:bg-emerald-100 text-muted-foreground hover:text-emerald-600'
                  }
                `}
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => toggleItem(item, 'no')}
                className={`
                  p-1.5 rounded-full transition-all
                  ${itemStates[item] === 'no' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-muted hover:bg-red-100 text-muted-foreground hover:text-red-600'
                  }
                `}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
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
            {allAnswered ? "Valider mes choix" : "Valider (réponses partielles)"}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

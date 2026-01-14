import { ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface LotActionCheckboxProps {
  id: string;
  label: string;
  icon: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const LotActionCheckbox = ({ 
  id, 
  label, 
  icon, 
  checked, 
  onChange, 
  disabled,
  className 
}: LotActionCheckboxProps) => {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 border rounded transition-all cursor-pointer",
        checked 
          ? "border-brand-gold bg-brand-gold/5" 
          : "border-border hover:border-brand-gold/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div className="text-muted-foreground">
        {icon}
      </div>
      <label 
        htmlFor={id} 
        className="flex-1 text-sm font-medium cursor-pointer select-none"
      >
        {label}
      </label>
      <Checkbox 
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="data-[state=checked]:bg-brand-gold data-[state=checked]:border-brand-gold"
      />
    </div>
  );
};

export default LotActionCheckbox;

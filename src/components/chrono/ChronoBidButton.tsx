import { ExternalLink } from "lucide-react";

interface ChronoBidButtonProps {
  lotUrl: string;
  className?: string;
  variant?: "primary" | "secondary";
}

const ChronoBidButton = ({ lotUrl, className = "", variant = "primary" }: ChronoBidButtonProps) => {
  const baseClasses = "flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs uppercase tracking-wider transition-colors";
  
  const variantClasses = variant === "primary"
    ? "bg-brand-gold text-white hover:bg-brand-gold/90 font-medium"
    : "border border-brand-gold text-brand-gold hover:bg-brand-gold/10";

  return (
    <a
      href={lotUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      <ExternalLink className="w-3 h-3" />
      Enchérir sur Interenchères
    </a>
  );
};

export default ChronoBidButton;

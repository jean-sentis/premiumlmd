import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { getDemoNow } from "@/lib/site-config";

interface ChronoCountdownProps {
  endDate: Date;
  className?: string;
  variant?: "large" | "compact" | "inline";
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

const getTimeRemaining = (endDate: Date): TimeRemaining => {
  const now = getDemoNow(); // Utilise la date de démo avec l'heure réelle
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired: false };
};

const ChronoCountdown = ({ endDate, className = "", variant = "large" }: ChronoCountdownProps) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(getTimeRemaining(endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(endDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (timeRemaining.isExpired) {
    return (
      <div className={`bg-muted/50 border border-brand-gold/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Clock className="w-5 h-5" />
          <span className="font-serif text-lg tracking-wide">VENTE CLÔTURÉE</span>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className="text-xs text-muted-foreground">Temps restant pour enchérir :</span>
        <span className="text-sm font-medium text-brand-gold">
          {timeRemaining.days > 0 && `${timeRemaining.days}j `}
          {String(timeRemaining.hours).padStart(2, "0")}h{String(timeRemaining.minutes).padStart(2, "0")}m{String(timeRemaining.seconds).padStart(2, "0")}s
        </span>
      </div>
    );
  }

  // Inline variant for sticky bar - just the time values
  if (variant === "inline") {
    return (
      <span className={className}>
        {timeRemaining.days > 0 && `${timeRemaining.days}j `}
        {String(timeRemaining.hours).padStart(2, "0")}h{String(timeRemaining.minutes).padStart(2, "0")}m{String(timeRemaining.seconds).padStart(2, "0")}s
      </span>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-brand-gold/5 via-brand-gold/10 to-brand-gold/5 border border-brand-gold/30 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-brand-gold" />
        <span className="text-xs uppercase tracking-[0.2em] text-brand-gold font-medium">
          Temps restant pour enchérir
        </span>
      </div>

      <div className="flex items-center justify-center gap-3 md:gap-6">
        {/* Days */}
        <div className="text-center">
          <div className="bg-brand-gold/20 border border-brand-gold/50 rounded-lg px-4 py-3 min-w-[72px]">
            <span className="font-serif text-3xl md:text-4xl font-bold text-brand-gold">
              {String(timeRemaining.days).padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground mt-2 block">Jours</span>
        </div>

        <span className="text-2xl text-brand-gold/50 font-light">:</span>

        {/* Hours */}
        <div className="text-center">
          <div className="bg-brand-gold/20 border border-brand-gold/50 rounded-lg px-4 py-3 min-w-[72px]">
            <span className="font-serif text-3xl md:text-4xl font-bold text-brand-gold">
              {String(timeRemaining.hours).padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground mt-2 block">Heures</span>
        </div>

        <span className="text-2xl text-brand-gold/50 font-light">:</span>

        {/* Minutes */}
        <div className="text-center">
          <div className="bg-brand-gold/20 border border-brand-gold/50 rounded-lg px-4 py-3 min-w-[72px]">
            <span className="font-serif text-3xl md:text-4xl font-bold text-brand-gold">
              {String(timeRemaining.minutes).padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground mt-2 block">Minutes</span>
        </div>

        <span className="text-2xl text-brand-gold/50 font-light">:</span>

        {/* Seconds */}
        <div className="text-center">
          <div className="bg-brand-gold/20 border border-brand-gold/50 rounded-lg px-4 py-3 min-w-[72px] animate-pulse">
            <span className="font-serif text-3xl md:text-4xl font-bold text-brand-gold">
              {String(timeRemaining.seconds).padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground mt-2 block">Secondes</span>
        </div>
      </div>
    </div>
  );
};

export default ChronoCountdown;

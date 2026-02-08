import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { INTEREST_LEVELS, type InterestLevel, getInterestStyle } from "./interest-config";

interface InterestDropdownProps {
  value: string | null;
  onChange: (level: string) => void;
  disabled?: boolean;
}

export function InterestDropdown({ value, onChange, disabled }: InterestDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentStyle = getInterestStyle(value);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`
          flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-colors
          ${currentStyle
            ? `${currentStyle.bg} ${currentStyle.text} ${currentStyle.border}`
            : "border-border text-muted-foreground hover:bg-muted/50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {currentStyle && (
          <span className={`inline-block w-2 h-2 rounded-full ${currentStyle.dot}`} />
        )}
        <span>{currentStyle?.label || "Intérêt…"}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 bg-background border rounded-lg shadow-lg p-1.5 min-w-[160px]">
          {Object.entries(INTEREST_LEVELS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
              className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors ${
                value === key
                  ? `${config.bg} ${config.text} font-medium`
                  : "hover:bg-muted"
              }`}
            >
              <span className={`inline-block w-2 h-2 rounded-full ${config.dot}`} />
              {config.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

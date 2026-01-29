interface ResultCardProps {
  title: string;
  artist?: string;
  price: string;
  date?: string;
  imageUrl: string;
  variant?: "default" | "light";
}

const ResultCard = ({ title, artist, price, date, imageUrl, variant = "default" }: ResultCardProps) => {
  const isLight = variant === "light";
  
  return (
    <div className="group cursor-pointer">
      <div className="card-shadow bg-card mb-4 overflow-hidden">
        <div className="aspect-square w-full bg-muted">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>
      <div className="text-center">
        {artist && (
          <p className={`font-sans text-xs tracking-wide mb-1 ${isLight ? "text-white/70" : "text-muted-foreground"}`}>
            {artist}
          </p>
        )}
        <h4 className={`text-sm font-medium mb-1 line-clamp-2 ${isLight ? "text-white" : ""}`}>
          {title}
        </h4>
        <p className={`text-lg font-semibold ${isLight ? "text-white" : ""}`}>{price}</p>
        {date && (
          <p className={`font-sans text-xs mt-1 ${isLight ? "text-white/70" : "text-muted-foreground"}`}>{date}</p>
        )}
      </div>
    </div>
  );
};

export default ResultCard;

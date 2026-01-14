import { Link } from "react-router-dom";

interface ActionCardProps {
  title: string;
  to: string;
  variant?: "default" | "active";
}

const ActionCard = ({ title, to, variant = "default" }: ActionCardProps) => {
  const isActive = variant === "active";

  return (
    <Link
      to={to}
      className={`
        block border border-foreground card-shadow
        transition-all duration-200
        ${isActive ? "bg-foreground text-background" : "bg-background text-foreground"}
      `}
    >
      <div className={`${isActive ? "border-b-4 border-foreground" : ""}`}>
        {isActive && <div className="h-2 bg-foreground" />}
      </div>
      <div className="px-8 py-6 text-center">
        <span className="font-sans text-sm tracking-widest font-medium">
          {title}
        </span>
      </div>
      <div className={`h-1 ${isActive ? "" : "bg-foreground"}`} />
    </Link>
  );
};

export default ActionCard;

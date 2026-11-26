import { forwardRef } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { useSaleLotCounts } from "@/hooks/use-sale-lot-counts";
import { isSaleWithoutContent, saleIdFromPath } from "@/lib/prototype-pages";
import { cn } from "@/lib/utils";
import { isPublicSale } from "@/lib/demo-publication";

const SaleLink = forwardRef<HTMLAnchorElement, LinkProps & { saleId: string }>(
  ({ saleId, to, className, onClick, ...props }, ref) => {
    const { data, isPending } = useSaleLotCounts();
    // Sales still in preparation keep their catalogue even with no populated lot yet.
    const unavailable = isPending
      || isSaleWithoutContent(data?.counts.get(saleId), Boolean(data?.preparation.has(saleId)));
    if (!unavailable) {
      return <Link ref={ref} to={to} className={className} onClick={onClick} {...props} />;
    }
    return (
      <a
        ref={ref}
        id={props.id}
        title={props.title}
        aria-label={props["aria-label"]}
        role="link"
        aria-disabled="true"
        aria-busy={isPending || undefined}
        tabIndex={-1}
        className={cn(className?.split(" ").filter((name) => name !== "group").join(" "), !isPending && "sale-unavailable")}
        onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}
      >{props.children}</a>
    );
  },
);
SaleLink.displayName = "SaleLink";

const SaleAwareLink = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const path = typeof props.to === "string" ? props.to : props.to.pathname ?? "";
  const saleId = saleIdFromPath(path);
  if (saleId && !isPublicSale(saleId)) return null;
  return saleId ? <SaleLink {...props} saleId={saleId} ref={ref} /> : <Link {...props} ref={ref} />;
});
SaleAwareLink.displayName = "SaleAwareLink";
export default SaleAwareLink;

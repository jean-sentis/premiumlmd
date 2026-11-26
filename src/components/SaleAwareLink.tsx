import { forwardRef } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { useSaleLotCounts } from "@/hooks/use-sale-lot-counts";
import { isEmptySale, saleIdFromPath } from "@/lib/prototype-pages";
import { cn } from "@/lib/utils";

const SaleLink = forwardRef<HTMLAnchorElement, LinkProps & { saleId: string }>(
  ({ saleId, to, className, onClick, ...props }, ref) => {
    const { data } = useSaleLotCounts();
    if (!isEmptySale(data?.get(saleId))) {
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
        tabIndex={-1}
        className={cn(className?.split(" ").filter((name) => name !== "group").join(" "), "sale-unavailable")}
        onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}
      >{props.children}</a>
    );
  },
);
SaleLink.displayName = "SaleLink";

const SaleAwareLink = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const path = typeof props.to === "string" ? props.to : props.to.pathname ?? "";
  const saleId = saleIdFromPath(path);
  return saleId ? <SaleLink {...props} saleId={saleId} ref={ref} /> : <Link {...props} ref={ref} />;
});
SaleAwareLink.displayName = "SaleAwareLink";
export default SaleAwareLink;
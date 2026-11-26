import { forwardRef, type AnchorHTMLAttributes, type HTMLAttributes } from "react";
import { DEMO_PHONE } from "@/lib/demo-publication";

export const DemoPhone = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ children, ...props }, ref) => (
    <span {...props} ref={ref} title="Numéro fictif — démonstration" aria-label={`Numéro fictif : ${DEMO_PHONE}`}>
      {children ?? DEMO_PHONE}
    </span>
  ),
);
DemoPhone.displayName = "DemoPhone";

export function InactiveSocial({ href: _href, target: _target, rel: _rel, onClick: _onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <span {...props} aria-disabled="true" title="Publication de démonstration — lien désactivé" />;
}
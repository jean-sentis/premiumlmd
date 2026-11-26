import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { COMPLETE_SPECIALTIES } from "@/lib/prototype-pages";

type Props = { kind: "specialty" | "sale" };

export default function PrototypePageNotice(props: Props) {
  const [open, setOpen] = useState(true);
  const specialty = props.kind === "specialty";
  const destinations = specialty
    ? COMPLETE_SPECIALTIES.map((item) => ({ to: `/specialites/${item.id}`, title: item.title }))
    : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent overlayClassName="z-[120]" className="z-[121] max-w-[calc(100%-2rem)] sm:max-w-lg rounded-lg max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="leading-snug tracking-normal pr-5">
            {specialty ? "Cette spécialité est encore en maquette" : "Cette vente est encore en maquette"}
          </DialogTitle>
          <DialogDescription className="pt-2 leading-relaxed">
            {specialty
              ? "Son contenu n’est pas encore complet. Pour découvrir des exemples de pages renseignées :"
              : "Aucun lot n’est encore consultable sur cette page. Cette vente porte la mention « Sans lots · Maquette » dans les listes de ventes."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {destinations.map((item) => (
            <Button key={item.to} asChild variant="outline" className="h-auto min-h-10 justify-between whitespace-normal text-left py-3">
              <Link to={item.to}>{item.title}<ArrowRight className="shrink-0" aria-hidden="true" /></Link>
            </Button>
          ))}
        </div>
        <Button variant="ghost" onClick={() => setOpen(false)}>Rester sur cette page</Button>
      </DialogContent>
    </Dialog>
  );
}
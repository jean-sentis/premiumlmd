import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Instagram, Linkedin, Facebook, Menu, Phone, Heart, Mail, Youtube, User, Home, X } from "lucide-react";
import LiveClock from "./LiveClock";
import { motion, AnimatePresence } from "framer-motion";
import logo12P from "@/assets/logo-12p.png";
import { useSubmenu } from "@/contexts/SubmenuContext";
import { useUserActionCounts } from "@/hooks/useUserActionCounts";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { usePlanning } from "@/contexts/PlanningContext";

// Badge de comptage
const ActionBadge = ({
  count
}: {
  count: number;
}) => {
  if (count === 0) return null;
  return <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-[hsl(var(--brand-gold))] text-white text-[10px] font-bold rounded-full px-1">
      {count > 99 ? "99+" : count}
    </span>;
};

// Images des spécialités
import imgArgenterie from "@/assets/menu/argenterie.png";
import imgArtModerne from "@/assets/menu/art-moderne.png";
import imgBijouxMontres from "@/assets/menu/bijoux-montres.png";
import imgCollections from "@/assets/menu/collections.png";
import imgVins from "@/assets/menu/vins-spiritueux.png";
import imgMobilier from "@/assets/menu/mobilier.png";
import imgModeTextile from "@/assets/menu/mode-textile.png";
import imgVoitures from "@/assets/menu/voitures.png";
interface HeaderProps {
  showLogo?: boolean;
  isFixed?: boolean;
}

// 8 spécialités définies avec images
const specialites = [{
  to: "/specialites/argenterie",
  label: "Argenterie",
  image: imgArgenterie
}, {
  to: "/specialites/art-moderne",
  label: "Art moderne",
  image: imgArtModerne
}, {
  to: "/specialites/bijoux-montres",
  label: "Bijoux et montres",
  image: imgBijouxMontres
}, {
  to: "/specialites/collections",
  label: "Collections",
  image: imgCollections
}, {
  to: "/specialites/vins-spiritueux",
  label: "Grands Vins et Spiritueux",
  image: imgVins
}, {
  to: "/specialites/mobilier-objets-art",
  label: "Mobilier\nObjets d'art",
  image: imgMobilier
}, {
  to: "/specialites/mode-textile",
  label: "Mode et textile",
  image: imgModeTextile
}, {
  to: "/specialites/voitures-collection",
  label: "Voitures de collection",
  image: imgVoitures
}];
const acheterSubMenu = [{
  to: "/acheter/guide",
  label: "Guide de l'acheteur"
}, {
  to: "/acheter/ventes-a-venir",
  label: "Ventes à venir"
}, {
  to: "/acheter/ventes-passees",
  label: "Ventes passées"
}, {
  to: "/acheter/after-sale",
  label: "After Sale"
}];
const vendreSubMenu = [{
  to: "/vendre/guide",
  label: "Guide du vendeur"
}, {
  to: "/vendre/estimation-en-ligne",
  label: "Estimation et expertise"
}, {
  to: "/vendre/inventaire-domicile",
  label: "Inventaire à domicile"
}];
const aproposSubMenu = [{
  to: "/la-maison",
  label: "Notre maison"
}, {
  to: "/aventures-encheres",
  label: "Aventures d'enchères"
}];
type MenuType = "acheter" | "vendre" | "specialites" | "apropos" | null;
const Header = ({
  showLogo = true,
  isFixed = true
}: HeaderProps) => {
  const headerRef = useRef<HTMLElement | null>(null);
  const mainBarRef = useRef<HTMLDivElement | null>(null);
  const estimationCtaRef = useRef<HTMLAnchorElement | null>(null);
  const acheterTriggerRef = useRef<HTMLButtonElement | null>(null);
  const acheterGuideRef = useRef<HTMLAnchorElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hoverMenu, setHoverMenu] = useState<MenuType>(null);
  const [acheterSubmenuX, setAcheterSubmenuX] = useState(0);
  const menuTimeout = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    setSubmenuVisible
  } = useSubmenu();
  const { togglePlanning } = usePlanning();
  const actionCounts = useUserActionCounts();

  // Menu réellement ouvert = uniquement le hover (pas de menu "permanent")
  const activeMenu = hoverMenu;

  // Menu juste "coché" (mise en évidence) selon la route
  const highlightMenu: MenuType = (() => {
    const p = location.pathname;
    if (p.startsWith("/acheter") || p.startsWith("/vente") || p.startsWith("/calendrier")) return "acheter";
    if (p.startsWith("/vendre")) return "vendre";
    if (p.startsWith("/specialites")) return "specialites";
    if (p.startsWith("/la-maison") || p.startsWith("/equipe") || p.startsWith("/region-talents")) return "apropos";
    return null;
  })();

  // Sync with context (used for page spacing elsewhere)
  useEffect(() => {
    setSubmenuVisible(activeMenu !== null);
  }, [activeMenu, setSubmenuVisible]);

  // Expose header heights as CSS vars
  // - --header-height: full header height (including submenus) => used to push page content below everything
  // - --header-main-height: height of the main header bars only (excluding submenus)
  // - --header-sticky-top: stable anchor for all sticky elements (must NOT depend on hover/open menus)

  // 1) Stable vars: should not change when menus open/close (prevents sticky "jump")
  useLayoutEffect(() => {
    const mainEl = mainBarRef.current;
    if (!mainEl) return;
    let lastStickyTop: number | null = null;
    let lastMainH: number | null = null;
    const setStableVars = () => {
      const mainH = Math.round(mainEl.getBoundingClientRect().height);

      // Sticky anchor (stable): juste sous le header principal (+18px).
      // IMPORTANT: on n'applique PAS ici le -25px (il est géré par les sticky bars/titres),
      // sinon le titre peut passer derrière la barre supérieure.
      const stickyTop = Math.max(0, mainH + 18);

      // Évite les micro-variations (polices, subpixel) qui font "sauter" de quelques px.
      if (lastMainH !== null && Math.abs(mainH - lastMainH) < 2 && lastStickyTop !== null && Math.abs(stickyTop - lastStickyTop) < 2) {
        return;
      }
      lastMainH = mainH;
      lastStickyTop = stickyTop;
      document.documentElement.style.setProperty("--header-main-height", `${mainH}px`);
      document.documentElement.style.setProperty("--header-sticky-top", `${stickyTop}px`);
    };

    // Mesure immédiate + après chargement des polices (réduit le shift initial)
    setStableVars();
    window.requestAnimationFrame(() => setStableVars());
    (document as any).fonts?.ready?.then?.(() => setStableVars());
    window.addEventListener("resize", setStableVars);
    return () => {
      window.removeEventListener("resize", setStableVars);
    };
  }, []);

  // 2) Full header height: can vary with submenus (used only to push page content)
  useLayoutEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;
    const setFullHeightVar = () => {
      const fullH = Math.round(headerEl.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--header-height", `${fullH}px`);
    };
    setFullHeightVar();
    const ro = new ResizeObserver(() => setFullHeightVar());
    ro.observe(headerEl);
    window.addEventListener("resize", setFullHeightVar);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setFullHeightVar);
    };
  }, [activeMenu]);

  // Reset hover menu on route change
  useEffect(() => {
    setHoverMenu(null);
  }, [location.pathname]);

  // Aligner "Guide de l'acheteur" sous le "A" de "Acheter" (offset stable, sans dérive)
  useLayoutEffect(() => {
    // Quand on quitte le menu Acheter, on remet l'offset à 0 pour éviter toute accumulation.
    if (activeMenu !== "acheter") {
      if (acheterSubmenuX !== 0) setAcheterSubmenuX(0);
      return;
    }

    // Point clé : on force un état "neutre" (x=0), puis on mesure, puis on applique l'offset.
    // Sinon on mesure un élément déjà transformé et on additionne les décalages à chaque hover.
    if (acheterSubmenuX !== 0) setAcheterSubmenuX(0);
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        const trigger = acheterTriggerRef.current;
        const guide = acheterGuideRef.current;
        if (!trigger || !guide) return;
        const triggerRect = trigger.getBoundingClientRect();
        const guideRect = guide.getBoundingClientRect();

        // Alignement: bord gauche de "Acheter" (≈ lettre A) avec bord gauche de "Guide" (lettre G)
        const newOffset = Math.round(triggerRect.left - guideRect.left);
        setAcheterSubmenuX(newOffset);
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, [activeMenu]);
  const handleMenuEnter = (menu: MenuType) => {
    if (menuTimeout.current) clearTimeout(menuTimeout.current);
    setHoverMenu(menu);
  };
  const handleMenuLeave = () => {
    menuTimeout.current = setTimeout(() => setHoverMenu(null), 150);
  };
  return <header ref={headerRef} className={`${isFixed ? "fixed top-0 left-0 right-0 z-[100]" : "relative"} bg-white text-foreground transition-all duration-300 border-0 border-b-0 shadow-none`}>
      <div ref={mainBarRef}>
        {/* Barre supérieure */}
        <div className="bg-[hsl(var(--brand-primary))] text-white">
          <div className="container flex items-center justify-between py-2.5 md:py-1.5 text-xs md:text-sm tracking-tight">
            {/* Gauche - Maison de Ventes */}
            <span className="hidden md:block font-serif uppercase text-xs md:text-sm tracking-[0.08em]">
              Maison de Ventes aux enchères
            </span>
            
            {/* Centre - Téléphone + Email */}
            <div className="flex items-center gap-4 absolute left-1/2 transform -translate-x-1/2">
              <a href="tel:+33495121212" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity text-xs md:text-sm tracking-tight">
                <Phone size={14} />
                <span className="font-medium">Ajaccio</span>
                <span className="opacity-80">04 95 12 12 12</span>
              </a>
              <a href="mailto:jean@lemarteaudigital.fr" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <Mail size={14} />
              </a>
            </div>
            
            {/* Droite - Réseaux sociaux (masqués sur mobile) */}
            <div className="hidden md:flex items-center gap-3 ml-auto">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Instagram size={16} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Facebook size={16} />
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Youtube size={16} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Linkedin size={16} />
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="!border-0 [&>*]:!border-0" onMouseLeave={handleMenuLeave}>
        <div className="container relative flex items-end justify-between py-3">
          {/* Logo seul */}
          {showLogo && <div className="flex items-start flex-shrink-0">
              <Link to="/">
                <img src={logo12P} alt="Douze pages & associés" className="h-24 md:h-32 w-auto" />
              </Link>
            </div>}
          
          {/* Icône Accueil - alignée verticalement avec le menu */}
          <Link to="/" className="hidden md:block absolute text-gray-600 hover:text-[hsl(var(--brand-primary))] transition-colors self-center" style={{
            left: 'calc(180px + (50% - 180px) / 2 - 196px)',
            top: '50%',
            transform: 'translateY(-50%)'
          }} title="Accueil">
            <Home size={28} />
          </Link>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center self-center">
            {/* Acheter */}
            <div className="relative" onMouseEnter={() => handleMenuEnter("acheter")}>
              <button ref={acheterTriggerRef} className={`font-sans text-[13px] font-medium tracking-tight uppercase px-4 py-2.5 transition-colors relative ${highlightMenu === "acheter" ? "text-[hsl(var(--brand-primary))]" : "text-gray-700 hover:text-[hsl(var(--brand-primary))]"}`}>
                Acheter
                {(highlightMenu === "acheter" || activeMenu === "acheter") && <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[hsl(var(--brand-secondary))]" />}
              </button>
            </div>

            {/* Vendre */}
            <div className="relative" onMouseEnter={() => handleMenuEnter("vendre")}>
              <button className={`font-sans text-[13px] font-medium tracking-tight uppercase px-4 py-2.5 transition-colors relative ${highlightMenu === "vendre" ? "text-[hsl(var(--brand-primary))]" : "text-gray-700 hover:text-[hsl(var(--brand-primary))]"}`}>
                Vendre
                {(highlightMenu === "vendre" || activeMenu === "vendre") && <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[hsl(var(--brand-secondary))]" />}
              </button>
            </div>

            {/* Spécialités */}
            <div className="relative" onMouseEnter={() => handleMenuEnter("specialites")}>
              <button className={`font-sans text-[13px] font-medium tracking-tight uppercase px-4 py-2.5 transition-colors relative ${highlightMenu === "specialites" ? "text-[hsl(var(--brand-primary))]" : "text-gray-700 hover:text-[hsl(var(--brand-primary))]"}`}>
                Spécialités
                {(highlightMenu === "specialites" || activeMenu === "specialites") && <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[hsl(var(--brand-secondary))]" />}
              </button>
            </div>

            {/* À propos */}
            <div className="relative" onMouseEnter={() => handleMenuEnter("apropos")}>
              <button className={`font-sans text-[13px] font-medium tracking-tight uppercase px-4 py-2.5 transition-colors relative ${highlightMenu === "apropos" ? "text-[hsl(var(--brand-primary))]" : "text-gray-700 hover:text-[hsl(var(--brand-primary))]"}`}>
                À propos
                {(highlightMenu === "apropos" || activeMenu === "apropos") && <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[hsl(var(--brand-secondary))]" />}
              </button>
            </div>

            {/* Coups de ♥ */}
            <Link to="/region-talents" className="font-sans text-[13px] font-medium tracking-tight uppercase px-4 py-2.5 text-gray-700 hover:text-[hsl(var(--brand-primary))] transition-colors flex items-center gap-1" onMouseEnter={() => setHoverMenu(null)}>
              Coups de
              <Heart size={16} className="text-[hsl(var(--brand-secondary))] fill-[hsl(var(--brand-secondary))]" />
            </Link>

            {/* Contact */}
            <Link to="/contact" className="font-sans text-[13px] font-medium tracking-tight uppercase px-4 py-2.5 text-gray-700 hover:text-[hsl(var(--brand-primary))] transition-colors" onMouseEnter={() => setHoverMenu(null)}>
              Contact
            </Link>

            {/* Compte - dans le menu */}
            <Link to="/compte" className="font-sans text-[13px] font-medium tracking-tight uppercase px-4 py-2.5 text-gray-700 hover:text-[hsl(var(--brand-primary))] transition-colors flex items-center gap-2" onMouseEnter={() => setHoverMenu(null)} title="Mon compte">
              <User size={14} />
              <span>Compte</span>
              <ActionBadge count={actionCounts.purchaseOrders + actionCounts.phoneBids + actionCounts.alertsWithResults} />
            </Link>
          </nav>

          {/* Bloc droite desktop - Estimation gratuite + Calendrier empilés */}
          <div className="hidden md:flex flex-col items-end justify-center gap-1 self-stretch py-3">
            {/* Estimation gratuite - lien vers le formulaire */}
            <Link ref={estimationCtaRef} to="/vendre/estimation-en-ligne#estimation-form" className="text-foreground hover:text-[hsl(var(--brand-primary))] transition-colors whitespace-nowrap">
              <span className="font-serif text-sm font-medium">Estimation gratuite</span>
            </Link>
            
            {/* Calendrier - toggle planning */}
            <button 
              onClick={togglePlanning}
              className="text-foreground hover:text-[hsl(var(--brand-primary))] transition-colors cursor-pointer"
            >
              <LiveClock />
            </button>
          </div>

          {/* Mobile menu button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button className="p-2 hover:opacity-70 transition-opacity">
                <Menu size={24} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-white text-foreground border-l-gray-200 overflow-y-auto pt-14">
              <div className="flex flex-col h-full">
                {/* Close button + Logo */}
                <div className="flex items-center justify-between mb-6 px-2">
                  <img src={logo12P} alt="Douze pages & associés" className="h-14 w-auto" />
                  <SheetClose asChild>
                    <button className="p-2 hover:opacity-70 transition-opacity" aria-label="Fermer le menu">
                      <X size={24} className="text-gray-600" />
                    </button>
                  </SheetClose>
                </div>

                {/* Navigation links */}
                <nav className="flex flex-col gap-2">
                  {/* Acheter section */}
                  <div className="border-b border-gray-100 pb-4">
                    <span className="font-sans text-xs font-medium tracking-tight uppercase block mb-2 text-[hsl(var(--brand-primary))]">
                      Acheter
                    </span>
                    {acheterSubMenu.map(link => <SheetClose asChild key={link.to + link.label}>
                        <Link to={link.to} className="block text-sm py-1.5 pl-4 text-gray-600 hover:text-[hsl(var(--brand-secondary))] transition-colors tracking-tight">
                          {link.label}
                        </Link>
                      </SheetClose>)}
                  </div>

                  {/* Vendre section */}
                  <div className="border-b border-gray-100 pb-4 pt-2">
                    <span className="font-sans text-xs font-medium tracking-tight uppercase block mb-2 text-[hsl(var(--brand-primary))]">
                      Vendre
                    </span>
                    {vendreSubMenu.map(link => <SheetClose asChild key={link.to + link.label}>
                        <Link to={link.to} className="block text-sm py-1.5 pl-4 text-gray-600 hover:text-[hsl(var(--brand-secondary))] transition-colors tracking-tight">
                          {link.label}
                        </Link>
                      </SheetClose>)}
                  </div>

                  {/* Spécialités section */}
                  <div className="border-b border-gray-100 pb-4 pt-2">
                    <span className="font-sans text-xs font-medium tracking-tight uppercase block mb-2 text-[hsl(var(--brand-primary))]">
                      Spécialités
                    </span>
                    {specialites.map(link => <SheetClose asChild key={link.to}>
                        <Link to={link.to} className="block text-sm py-1.5 pl-4 text-gray-600 hover:text-[hsl(var(--brand-secondary))] transition-colors tracking-tight">
                          {link.label.replace('\n', ' ')}
                        </Link>
                      </SheetClose>)}
                  </div>

                  {/* À propos section */}
                  <div className="border-b border-gray-100 pb-4 pt-2">
                    <span className="font-sans text-xs font-medium tracking-tight uppercase block mb-2 text-[hsl(var(--brand-primary))]">
                      À propos
                    </span>
                    {aproposSubMenu.map(link => <SheetClose asChild key={link.to + link.label}>
                        <Link to={link.to} className="block text-sm py-1.5 pl-4 text-gray-600 hover:text-[hsl(var(--brand-secondary))] transition-colors tracking-tight">
                          {link.label}
                        </Link>
                      </SheetClose>)}
                  </div>

                  {/* Coups de ♥ */}
                  <SheetClose asChild>
                    <Link to="/region-talents" className="font-sans text-xs font-medium tracking-tight uppercase py-3 flex items-center gap-1 text-[hsl(var(--brand-primary))]">
                      Coups de
                      <Heart size={16} className="text-[hsl(var(--brand-secondary))] fill-[hsl(var(--brand-secondary))]" />
                    </Link>
                  </SheetClose>

                  {/* Contact */}
                  <SheetClose asChild>
                    <Link to="/contact" className="font-sans text-xs font-medium tracking-tight uppercase py-3 text-[hsl(var(--brand-primary))]">
                      Contact
                    </Link>
                  </SheetClose>

                  {/* Mon Compte */}
                  <SheetClose asChild>
                    <Link to="/compte" className="font-sans text-xs font-medium tracking-tight uppercase py-3 flex items-center gap-2 text-[hsl(var(--brand-primary))]">
                      <User size={14} />
                      Mon compte
                      <ActionBadge count={actionCounts.purchaseOrders + actionCounts.phoneBids + actionCounts.alertsWithResults} />
                    </Link>
                  </SheetClose>
                </nav>
              </div>
            </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Sous-menu horizontal - Spécialités avec images */}
      <AnimatePresence>
          {activeMenu === "specialites" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="hidden md:block overflow-hidden relative z-[110] -mt-14"
              onMouseEnter={() => {
                if (menuTimeout.current) clearTimeout(menuTimeout.current);
              }}
              onMouseLeave={handleMenuLeave}
            >
              <div className="flex justify-center py-2">
                {/*
                  Largeur contrôlée : contenu + 40px max (20px de padding gauche/droite)
                  On applique le fond uniquement sur le bloc "fit" pour ne pas masquer le header.
                */}
                <div className="w-fit bg-background px-5">
                  <div className="flex items-center justify-center gap-5">
                    {specialites.map((item) => (
                      <Link key={item.to} to={item.to} className="flex flex-col items-center gap-1.5 group">
                        {item.image ? (
                          <div
                            className="flex items-center justify-center overflow-hidden"
                            style={{
                              width: "var(--specialites-menu-image-size)",
                              height: "var(--specialites-menu-image-size)",
                            }}
                          >
                            <img
                              src={item.image}
                              alt={item.label}
                              width={60}
                              height={60}
                              loading="lazy"
                              className="w-full h-full object-contain transition-all duration-300 group-hover:scale-110"
                            />
                          </div>
                        ) : (
                          <div
                            className="flex items-center justify-center bg-muted rounded"
                            style={{
                              width: "var(--specialites-menu-image-size)",
                              height: "var(--specialites-menu-image-size)",
                            }}
                          >
                            <span className="text-lg text-muted-foreground">◆</span>
                          </div>
                        )}
                        <span className="text-xs md:text-sm text-muted-foreground group-hover:text-[hsl(var(--brand-secondary))] transition-colors text-center tracking-tight max-w-[120px] leading-tight whitespace-pre-line">
                          {item.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sous-menu horizontal - Autres menus (sans images) */}
        <AnimatePresence>
          {activeMenu && activeMenu !== "specialites" && <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -20
      }} transition={{
        duration: 0.5,
        ease: "easeOut"
      }} className="hidden md:flex justify-center absolute inset-x-0 z-[110]" style={{
        top: "calc(var(--header-main-height, 145px) - 45px)"
      }} onMouseEnter={() => {
        if (menuTimeout.current) clearTimeout(menuTimeout.current);
      }} onMouseLeave={handleMenuLeave}>
              <motion.div className="inline-flex items-center justify-center gap-1 h-[35px] px-6 rounded-sm max-w-[800px] bg-transparent" style={{
          paddingBottom: '5px'
        }} animate={{
          x: activeMenu === "acheter" ? acheterSubmenuX : 0
        }} transition={{
          duration: 0.2,
          ease: "easeOut"
        }}>
                {(activeMenu === "acheter" ? acheterSubMenu : activeMenu === "vendre" ? vendreSubMenu : aproposSubMenu).map(item => {
            const isActive = location.pathname === item.to;
            return <Link key={item.to + item.label} to={item.to} ref={activeMenu === "acheter" && item.to === "/acheter/guide" ? acheterGuideRef : undefined} className={`relative px-3 py-1.5 text-sm transition-colors whitespace-nowrap tracking-tight ${isActive ? "text-[hsl(var(--brand-primary))] font-medium" : "text-gray-600 hover:text-[hsl(var(--brand-primary))]"}`}>
                      {item.label}
                      {isActive && <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[hsl(var(--brand-secondary))]" />}
                    </Link>;
          })}
              </motion.div>
            </motion.div>}
        </AnimatePresence>
    </header>;
};
export default Header;
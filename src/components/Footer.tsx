import { Link } from "react-router-dom";
import { Instagram, Facebook, MapPin, Phone, Clock, Mail, Linkedin, Youtube, CreditCard, User } from "lucide-react";
import logo12P from "@/assets/logo-12p-nb.png";
import { COMPANY_INFO, OPENING_HOURS, SOCIAL_LINKS } from "@/lib/site-config";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
          
          {/* Logo, Description & Adresse */}
          <div className="lg:col-span-1">
            <Link to="/">
              <img src={logo12P} alt={COMPANY_INFO.name} className="h-20 mb-4" />
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              {COMPANY_INFO.tagline}
            </p>
            <address className="not-italic text-sm text-muted-foreground mt-2">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                <span>
                  {COMPANY_INFO.address.street}<br />
                  {COMPANY_INFO.address.postalCode} {COMPANY_INFO.address.city}
                </span>
              </div>
            </address>
            
            {/* Lien Mon compte - visible uniquement sur mobile */}
            <Link 
              to="/compte"
              className="md:hidden flex items-center gap-2 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <User size={16} />
              <span>Mon compte</span>
            </Link>
          </div>

          {/* Navigation Acheter - masqué sur mobile (doublon menu hamburger) */}
          <div className="hidden md:block">
            <h4 className="font-sans text-xs tracking-widest mb-4 font-medium">ACHETER</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/acheter/guide" className="text-muted-foreground hover:text-foreground transition-colors">Guide de l'acheteur</Link></li>
              <li><Link to="/acheter/ventes-a-venir" className="text-muted-foreground hover:text-foreground transition-colors">Ventes à venir</Link></li>
              <li><Link to="/acheter/ventes-passees" className="text-muted-foreground hover:text-foreground transition-colors">Ventes passées</Link></li>
              <li><Link to="/acheter/after-sale" className="text-muted-foreground hover:text-foreground transition-colors">After Sale</Link></li>
            </ul>
          </div>

          {/* Navigation Vendre - masqué sur mobile (doublon menu hamburger) */}
          <div className="hidden md:block">
            <h4 className="font-sans text-xs tracking-widest mb-4 font-medium">VENDRE</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/vendre/guide" className="text-muted-foreground hover:text-foreground transition-colors">Guide du vendeur</Link></li>
              <li><Link to="/vendre/estimation-en-ligne" className="text-muted-foreground hover:text-foreground transition-colors">Estimation et expertise</Link></li>
              <li><Link to="/vendre/inventaire-domicile" className="text-muted-foreground hover:text-foreground transition-colors">Inventaire à domicile</Link></li>
            </ul>
          </div>

          {/* Navigation À propos - masqué sur mobile (doublon menu hamburger) */}
          <div className="hidden md:block">
            <h4 className="font-sans text-xs tracking-widest mb-4 font-medium">À PROPOS</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/la-maison" className="text-muted-foreground hover:text-foreground transition-colors">Notre maison</Link></li>
              <li><Link to="/region-talents" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">Nos coups de <span className="text-[hsl(var(--brand-secondary))]">♥</span></Link></li>
              <li><Link to="/aventures-encheres" className="text-muted-foreground hover:text-foreground transition-colors">Aventures d'enchères</Link></li>
            </ul>
          </div>

          {/* Contact & Horaires */}
          <div>
            <h4 className="font-sans text-xs tracking-widest mb-4 font-medium">CONTACT</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Phone size={16} className="mt-0.5 flex-shrink-0" />
                <a href={COMPANY_INFO.phoneLink} className="hover:text-brand-primary transition-colors">
                  {COMPANY_INFO.phone}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Mail size={16} className="mt-0.5 flex-shrink-0" />
                <a href={COMPANY_INFO.emailLink} className="hover:text-brand-primary transition-colors">
                  {COMPANY_INFO.email}
                </a>
              </div>
              <div className="flex items-start gap-2 mt-4">
                <Clock size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">Horaires</p>
                  <p className="text-sm">{OPENING_HOURS.summary}</p>
                  <p className="text-sm">{OPENING_HOURS.saturday}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Estimation gratuite & Régler un achat - sur la même ligne */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Link 
            to="/vendre/estimation-en-ligne"
            className="inline-flex items-center gap-3 border-2 border-[hsl(var(--brand-gold))] px-5 py-2.5 hover:bg-[hsl(var(--brand-gold))]/5 transition-colors"
          >
            <span className="font-serif text-sm font-medium text-foreground">
              Estimation gratuite en 48h
            </span>
            <span className="text-xs text-muted-foreground">
              — sans engagement
            </span>
          </Link>
          <Link 
            to="/paiement"
            className="inline-flex items-center gap-2 border-2 border-[hsl(var(--brand-gold))] px-5 py-2.5 hover:bg-[hsl(var(--brand-gold))]/5 transition-colors"
          >
            <CreditCard size={16} className="text-brand-gold" />
            <span className="font-serif text-sm font-medium text-foreground">
              Régler un achat
            </span>
          </Link>
        </div>
      </div>

      {/* Bottom bar - Mentions légales + Réseaux sociaux */}
      <div className="border-t border-border bg-brand-primary">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-brand-primary-foreground">
            {/* Mentions légales à gauche */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <Link to="/mentions-legales" className="hover:underline">Mentions légales</Link>
              <Link to="/cgv" className="hover:underline">CGV</Link>
              <Link to="/politique-confidentialite" className="hover:underline">Confidentialité</Link>
            </div>

            {/* Réseaux sociaux au centre */}
            <div className="flex items-center gap-4">
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Instagram size={18} />
              </a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Facebook size={18} />
              </a>
              <a href={SOCIAL_LINKS.pinterest} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Youtube size={18} />
              </a>
              <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Linkedin size={18} />
              </a>
              <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>

            {/* Création à droite */}
            <span>
              Création{" "}
              <a 
                href="https://lemarteaudigital.fr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline font-medium"
              >
                Le Marteau Digital
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

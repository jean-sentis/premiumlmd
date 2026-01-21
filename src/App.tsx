import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SubmenuProvider } from "@/contexts/SubmenuContext";
import { PlanningProvider } from "@/contexts/PlanningContext";
import { AuthProvider } from "@/hooks/useAuth";
import ScrollToTop from "./components/ScrollToTop";
import FloatingPlanningButton from "./components/FloatingPlanningButton";
// PlanningPanel supprimé - remplacé par InlinePlanningSlot dans chaque page
import Index from "./pages/Index";
import Vendre from "./pages/Vendre";
import Acheter from "./pages/Acheter";
import VenteDetail from "./pages/VenteDetail";
import LotDetail from "./pages/LotDetail";
import LaMaison from "./pages/LaMaison";
import Contact from "./pages/Contact";
import Specialites from "./pages/Specialites";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import BijouxMontres from "./pages/specialites/BijouxMontres";
import VinsSpiriteux from "./pages/specialites/VinsSpiriteux";
import ArtXXeme from "./pages/specialites/ArtXXeme";
import VoituresCollection from "./pages/specialites/VoituresCollection";
import Ceramiques from "./pages/specialites/Ceramiques";
import Militaria from "./pages/specialites/Militaria";
import Argenterie from "./pages/specialites/Argenterie";
import ArtModerne from "./pages/specialites/ArtModerne";
import Collections from "./pages/specialites/Collections";
import MobilierObjetsArt from "./pages/specialites/MobilierObjetsArt";
import ModeTextile from "./pages/specialites/ModeTextile";
import Expertises from "./pages/Expertises";
import Calendrier from "./pages/Calendrier";
import Glossaire from "./pages/Glossaire";
import VentesPassees from "./pages/VentesPassees";
import AventuresEncheres from "./pages/AventuresEncheres";
import RegionTalents from "./pages/RegionTalents";

// Nouvelles pages Acheter
import VentesAVenir from "./pages/acheter/VentesAVenir";
import VentesPasseesFiltre from "./pages/acheter/VentesPassees";
import GuideAcheteur from "./pages/acheter/GuideAcheteur";
import AfterSale from "./pages/acheter/AfterSale";
import AfterSaleLotDetail from "./pages/acheter/AfterSaleLotDetail";

// Nouvelles pages Vendre
// JourneesEstimation supprimée - redirigée vers EstimationEnLigne
import InventaireDomicile from "./pages/vendre/InventaireDomicile";
import EstimationEnLigne from "./pages/vendre/EstimationEnLigne";
import GuideVendeur from "./pages/vendre/GuideVendeur";
import TestShadows from "./pages/TestShadows";
import Paiement from "./pages/Paiement";

// Pages Mon Compte
import MonCompte from "./pages/compte/MonCompte";
import CompteAccueil from "./pages/compte/CompteAccueil";
import Profil from "./pages/compte/Profil";
import Favoris from "./pages/compte/Favoris";
import CentresInterets from "./pages/compte/CentresInterets";
import ViePrivee from "./pages/compte/ViePrivee";
import MesOrdres from "./pages/compte/MesOrdres";
import EncheresPhone from "./pages/compte/EncheresPhone";
// ParametrerServices supprimé - explications intégrées aux fiches lots
import Newsletter from "./pages/compte/Newsletter";
import MesAlertes from "./pages/compte/MesAlertes";
import CeQueJaime from "./pages/compte/CeQueJaime";
import Enlevement from "./pages/compte/Enlevement";
import MesAdjudications from "./pages/compte/MesAdjudications";
import ReglerAchats from "./pages/compte/ReglerAchats";
import ExportFonctionnalites from "./pages/ExportFonctionnalites";
import ExportOffres from "./pages/ExportOffres";
import ExportWordPress from "./pages/ExportWordPress";
import ExportAdaptation from "./pages/ExportAdaptation";
import OffresCommerciales from "./pages/OffresCommerciales";
import AdminLots from "./pages/admin/AdminLots";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SubmenuProvider>
              <PlanningProvider>
                <ScrollToTop />
                <FloatingPlanningButton />
                {/* InlinePlanningSlot est maintenant intégré dans chaque page */}
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/vendre" element={<Vendre />} />
                <Route path="/acheter" element={<Acheter />} />
                <Route path="/vente/:slug" element={<VenteDetail />} />
                <Route path="/vente/:saleId/lot/:lotId" element={<LotDetail />} />
                <Route path="/lot/:lotId" element={<LotDetail />} />
                <Route path="/la-maison" element={<LaMaison />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/specialites" element={<Specialites />} />
                <Route path="/specialites/argenterie" element={<Argenterie />} />
                <Route path="/specialites/art-moderne" element={<ArtModerne />} />
                <Route path="/specialites/bijoux-montres" element={<BijouxMontres />} />
                <Route path="/specialites/collections" element={<Collections />} />
                <Route path="/specialites/vins-spiritueux" element={<VinsSpiriteux />} />
                <Route path="/specialites/mobilier-objets-art" element={<MobilierObjetsArt />} />
                <Route path="/specialites/mode-textile" element={<ModeTextile />} />
                <Route path="/specialites/voitures-collection" element={<VoituresCollection />} />
                <Route path="/specialites/art-xxeme" element={<ArtXXeme />} />
                <Route path="/specialites/ceramiques" element={<Ceramiques />} />
                <Route path="/specialites/militaria" element={<Militaria />} />
                <Route path="/expertises" element={<Expertises />} />
                <Route path="/calendrier" element={<Calendrier />} />
                <Route path="/glossaire" element={<Glossaire />} />
                <Route path="/equipe" element={<Navigate to="/la-maison" replace />} />
                <Route path="/ventes-passees" element={<VentesPassees />} />
                <Route path="/aventures-encheres" element={<AventuresEncheres />} />
                <Route path="/region-talents" element={<RegionTalents />} />
                <Route path="/paiement" element={<Paiement />} />
                
                {/* Nouvelles routes Acheter */}
                <Route path="/acheter/ventes-a-venir" element={<VentesAVenir />} />
                <Route path="/acheter/ventes-passees" element={<VentesPasseesFiltre />} />
                <Route path="/acheter/guide" element={<GuideAcheteur />} />
                <Route path="/acheter/after-sale" element={<AfterSale />} />
                <Route path="/acheter/after-sale/:lotId" element={<AfterSaleLotDetail />} />
                
                {/* Nouvelles routes Vendre */}
                <Route path="/vendre/journees-estimation" element={<Navigate to="/vendre/estimation-en-ligne#expertises-itinerantes" replace />} />
                <Route path="/vendre/inventaire-domicile" element={<InventaireDomicile />} />
                <Route path="/vendre/estimation-en-ligne" element={<EstimationEnLigne />} />
                <Route path="/vendre/guide" element={<GuideVendeur />} />
                
                {/* Routes Mon Compte */}
                {/* Route /compte/services supprimée */}
                <Route path="/compte" element={<MonCompte />}>
                  <Route index element={<CompteAccueil />} />
                  <Route path="profil" element={<Profil />} />
                  <Route path="newsletter" element={<Newsletter />} />
                  <Route path="favoris" element={<Favoris />} />
                  <Route path="ce-que-jaime" element={<CeQueJaime />} />
                  <Route path="interets" element={<CentresInterets />} />
                  <Route path="alertes" element={<MesAlertes />} />
                  <Route path="vie-privee" element={<ViePrivee />} />
                  <Route path="ordres" element={<MesOrdres />} />
                  <Route path="encheres-telephone" element={<EncheresPhone />} />
                  <Route path="adjudications" element={<MesAdjudications />} />
                  <Route path="enlevement" element={<Enlevement />} />
                  <Route path="paiement" element={<ReglerAchats />} />
                </Route>
                
                {/* Page de test */}
                <Route path="/test-shadows" element={<TestShadows />} />
                <Route path="/test-shadows/*" element={<TestShadows />} />
                
                {/* Export fonctionnalités */}
                <Route path="/export-fonctionnalites" element={<ExportFonctionnalites />} />
                <Route path="/export-offres" element={<ExportOffres />} />
                <Route path="/export-wordpress" element={<ExportWordPress />} />
                <Route path="/export-adaptation" element={<ExportAdaptation />} />
                <Route path="/offres" element={<OffresCommerciales />} />
                
                {/* Admin */}
                <Route path="/admin/lots" element={<AdminLots />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
              </PlanningProvider>
            </SubmenuProvider>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

import { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import CompteSidebar from '@/components/compte/CompteSidebar';

const MonCompte = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  // Scroll to top when navigating between sub-routes
  useEffect(() => {
    // Ensure the route content is mounted before scrolling
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }, [location.pathname]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { state: { returnTo: location.pathname }, replace: true });
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-pulse text-muted-foreground">Chargement...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Mon Espace | Douze pages & associés</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30">
        <Header />
        
        {/* Spacer pour compenser le header fixe */}
        <div style={{ height: 'var(--header-height, 180px)' }}></div>

        <div className="flex min-h-[calc(100vh-180px-300px)] relative z-0">
          {/* Sidebar */}
          <CompteSidebar />

          {/* Main Content */}
          <main className="flex-1 p-6 lg:p-10 relative z-0">
            <Outlet />
          </main>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default MonCompte;

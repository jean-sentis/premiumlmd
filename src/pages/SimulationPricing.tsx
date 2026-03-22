import { Helmet } from "react-helmet-async";
import { useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SimulationPricing = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const sendSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'supabase-init',
          url: import.meta.env.VITE_SUPABASE_URL,
          key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          accessToken: session.access_token,
          userId: session.user.id,
        }, '*');
      }
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', sendSession);
    }

    return () => {
      if (iframe) iframe.removeEventListener('load', sendSession);
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Simulateur Pricing Convictions | Douze pages & associés</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <iframe
          ref={iframeRef}
          title="Simulateur pricing convictions"
          src="/simulateur-pricing-convictions.html"
          className="h-screen w-full border-0"
          loading="lazy"
        />
      </div>
    </>
  );
};

export default SimulationPricing;

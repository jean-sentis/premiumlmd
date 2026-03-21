import { Helmet } from "react-helmet-async";

const SimulationPricing = () => {
  return (
    <>
      <Helmet>
        <title>Simulateur Pricing Convictions | Douze pages & associés</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <iframe
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

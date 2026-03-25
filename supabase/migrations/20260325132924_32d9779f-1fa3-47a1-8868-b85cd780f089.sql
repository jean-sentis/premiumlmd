
-- Table des ventes (créées par le commissaire-priseur)
CREATE TABLE public.estimation_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  specialty TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des vendeurs (pour recherche par email/nom)
CREATE TABLE public.estimation_sellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  estimation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter les FK sur estimation_requests
ALTER TABLE public.estimation_requests
  ADD COLUMN sale_id UUID REFERENCES public.estimation_sales(id),
  ADD COLUMN seller_id UUID REFERENCES public.estimation_sellers(id);

-- RLS pour estimation_sales (admins seulement)
ALTER TABLE public.estimation_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage estimation sales"
  ON public.estimation_sales FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Public read estimation sales"
  ON public.estimation_sales FOR SELECT
  TO public
  USING (true);

-- RLS pour estimation_sellers (admins seulement)
ALTER TABLE public.estimation_sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage estimation sellers"
  ON public.estimation_sellers FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Public read estimation sellers"
  ON public.estimation_sellers FOR SELECT
  TO public
  USING (true);

-- Index pour recherche
CREATE INDEX idx_estimation_sellers_email ON public.estimation_sellers(email);
CREATE INDEX idx_estimation_sellers_nom ON public.estimation_sellers(nom);
CREATE INDEX idx_estimation_requests_sale_id ON public.estimation_requests(sale_id);
CREATE INDEX idx_estimation_requests_seller_id ON public.estimation_requests(seller_id);

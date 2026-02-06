
-- Table pour les demandes d'estimation
CREATE TABLE public.estimation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Infos demandeur (peut être anonyme ou connecté)
  user_id UUID REFERENCES auth.users(id),
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  
  -- Détails de l'objet
  description TEXT NOT NULL,
  estimated_value TEXT, -- ex: "500-1000€"
  object_category TEXT, -- bijoux, tableaux, mobilier, etc.
  photo_urls TEXT[] DEFAULT '{}',
  
  -- Contexte (d'où vient la demande)
  source TEXT NOT NULL DEFAULT 'estimation_form', -- estimation_form, objet_similaire, contact
  related_lot_id UUID REFERENCES public.interencheres_lots(id),
  
  -- Analyse IA
  ai_analysis JSONB, -- { summary, estimated_range, authenticity_notes, market_insights, recommendation }
  ai_analyzed_at TIMESTAMPTZ,
  
  -- Décision commissaire-priseur
  status TEXT NOT NULL DEFAULT 'new', -- new, ai_analyzed, in_review, accepted, declined, responded
  auctioneer_notes TEXT,
  auctioneer_decision TEXT, -- interested, not_interested, need_more_info, to_follow
  decided_at TIMESTAMPTZ,
  
  -- Réponse envoyée
  response_template TEXT, -- clé du template utilisé
  response_message TEXT, -- message personnalisé
  responded_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.estimation_requests ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs connectés peuvent voir leurs propres demandes
CREATE POLICY "Users can view their own estimation requests"
  ON public.estimation_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs connectés peuvent créer des demandes
CREATE POLICY "Users can create estimation requests"
  ON public.estimation_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Accès complet pour le service role (admin / edge functions)
CREATE POLICY "Service role full access for estimation_requests"
  ON public.estimation_requests FOR ALL
  USING (true)
  WITH CHECK (true);

-- Politique publique INSERT pour les demandes anonymes (sans user_id)
CREATE POLICY "Anonymous users can create estimation requests"
  ON public.estimation_requests FOR INSERT
  WITH CHECK (user_id IS NULL);

-- Trigger updated_at
CREATE TRIGGER update_estimation_requests_updated_at
  BEFORE UPDATE ON public.estimation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket pour les photos d'estimation
INSERT INTO storage.buckets (id, name, public) 
VALUES ('estimation-photos', 'estimation-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies storage : tout le monde peut uploader
CREATE POLICY "Anyone can upload estimation photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'estimation-photos');

-- Photos publiquement accessibles (pour que l'IA puisse les analyser)
CREATE POLICY "Estimation photos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'estimation-photos');

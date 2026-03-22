
CREATE TABLE public.pricing_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config_name text NOT NULL DEFAULT 'Ma configuration',
  prices jsonb NOT NULL DEFAULT '{}'::jsonb,
  discounts jsonb NOT NULL DEFAULT '[]'::jsonb,
  hotels jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pricing configs"
  ON public.pricing_configs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pricing configs"
  ON public.pricing_configs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pricing configs"
  ON public.pricing_configs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pricing configs"
  ON public.pricing_configs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

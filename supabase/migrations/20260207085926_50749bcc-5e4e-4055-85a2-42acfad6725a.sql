
-- Ajouter le mode de réponse (phone, email, delegate) et le nom du délégué
ALTER TABLE public.estimation_requests 
ADD COLUMN IF NOT EXISTS response_mode text,
ADD COLUMN IF NOT EXISTS delegate_to text;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin')),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own assigned roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE email LIKE '%@lemarteaudigital.fr' AND email_confirmed_at IS NOT NULL;
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = 'admin') $$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

ALTER POLICY "Service role full access for bordereaux" ON public.bordereaux TO service_role;
ALTER POLICY "Service role full access for estimation_requests" ON public.estimation_requests TO service_role;
DROP POLICY "Users can update their own bordereaux" ON public.bordereaux;
CREATE POLICY "Admins can manage bordereaux" ON public.bordereaux FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
REVOKE ALL ON public.bordereaux FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bordereaux TO authenticated;
GRANT ALL ON public.bordereaux TO service_role;
ALTER TABLE public.bordereaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimation_requests ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.estimation_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estimation_requests TO authenticated;
GRANT ALL ON public.estimation_requests TO service_role;
REVOKE SELECT, UPDATE, DELETE ON public.estimation_requests FROM anon;

DROP POLICY "Anyone can check slot availability" ON public.pickup_appointments;
CREATE POLICY "Admins can manage pickup appointments" ON public.pickup_appointments FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
REVOKE ALL ON public.pickup_appointments FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pickup_appointments TO authenticated;
GRANT ALL ON public.pickup_appointments TO service_role;
ALTER TABLE public.pickup_appointments ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.get_booked_pickup_slots(start_date date, end_date date)
RETURNS TABLE(appointment_date date, appointment_time time without time zone)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
 SELECT DISTINCT p.appointment_date, p.appointment_time
 FROM public.pickup_appointments p
 WHERE (SELECT auth.uid()) IS NOT NULL
 AND end_date >= start_date AND end_date <= start_date + 90
 AND p.appointment_date BETWEEN start_date AND end_date
$$;
REVOKE ALL ON FUNCTION public.get_booked_pickup_slots(date,date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_pickup_slots(date,date) TO authenticated;

ALTER POLICY "Service role write for interencheres_lots" ON public.interencheres_lots TO service_role;
ALTER POLICY "Service role write for interencheres_sales" ON public.interencheres_sales TO service_role;
ALTER POLICY "Service role write for interencheres_expositions" ON public.interencheres_expositions TO service_role;
ALTER POLICY "Service role write for interencheres_cache" ON public.interencheres_cache TO service_role;
CREATE POLICY "Admins can manage catalogue lots" ON public.interencheres_lots FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can manage catalogue sales" ON public.interencheres_sales FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can manage expositions" ON public.interencheres_expositions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can manage scraper cache" ON public.interencheres_cache FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY "Public read access for interencheres_cache" ON public.interencheres_cache;
REVOKE ALL ON public.interencheres_cache FROM anon;
GRANT ALL ON public.interencheres_cache TO service_role;
DROP POLICY "Public read estimation sales" ON public.estimation_sales;
DROP POLICY "Public read estimation sellers" ON public.estimation_sellers;
REVOKE ALL ON public.estimation_sales, public.estimation_sellers FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estimation_sales, public.estimation_sellers TO authenticated;
GRANT ALL ON public.estimation_sales, public.estimation_sellers TO service_role;

ALTER POLICY "Service role can manage sale images" ON storage.objects TO service_role;
CREATE POLICY "Admins can manage sale images" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'sale-images' AND public.is_admin())
WITH CHECK (bucket_id = 'sale-images' AND public.is_admin());
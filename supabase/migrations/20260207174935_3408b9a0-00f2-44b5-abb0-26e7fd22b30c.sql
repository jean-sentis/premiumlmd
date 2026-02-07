
-- Create admin check function (security definer to access auth.users)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND email LIKE '%@lemarteaudigital.fr'
  )
$$;

-- Add PERMISSIVE SELECT policy so admins can read ALL estimation_requests
CREATE POLICY "Admins can view all estimation requests"
ON public.estimation_requests
FOR SELECT
USING (public.is_admin());

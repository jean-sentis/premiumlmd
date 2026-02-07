
-- Add PERMISSIVE UPDATE policy so admins can update ALL estimation_requests
CREATE POLICY "Admins can update all estimation requests"
ON public.estimation_requests
FOR UPDATE
USING (public.is_admin());

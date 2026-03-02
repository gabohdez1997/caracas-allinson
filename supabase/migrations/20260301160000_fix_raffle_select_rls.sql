-- Allow authenticated users to view all raffles (including drafts and cancelled)
CREATE POLICY "Authenticated users can view all raffles." ON public.raffles
    FOR SELECT TO authenticated USING (true);

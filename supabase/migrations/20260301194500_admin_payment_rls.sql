-- Allow administrators to read and update all payments
CREATE POLICY "Authenticated users can view all payments." ON public.payments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update all payments." ON public.payments
    FOR UPDATE TO authenticated USING (true);

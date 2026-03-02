-- Set up missing RLS policies for admin operations on events and raffles

-- RAFFLES
CREATE POLICY "Authenticated users can create raffles." ON public.raffles
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update raffles." ON public.raffles
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete raffles." ON public.raffles
    FOR DELETE TO authenticated USING (true);

-- EVENTS
CREATE POLICY "Authenticated users can create events." ON public.events
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update events." ON public.events
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete events." ON public.events
    FOR DELETE TO authenticated USING (true);

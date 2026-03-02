-- Add buyer_id column to tickets table for public 'Cédula de Identidad'
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS buyer_id TEXT;

-- For public payments from unauthenticated users, we need to allow INSERTs.
-- The existing policy only allows authenticated users to insert their own.
-- This new policy allows anyone to insert a payment report (which starts as 'pending').
CREATE POLICY "Anyone can report a payment." ON public.payments
    FOR INSERT WITH CHECK (true);

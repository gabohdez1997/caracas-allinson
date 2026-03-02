-- 1. Add new columns to payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS buyer_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS buyer_phone TEXT;

-- 2. Migrate existing data (Join tickets to payments to grab the buyer info, if there's any active payment)
UPDATE public.payments p
SET 
    buyer_name = t.buyer_name,
    buyer_id = t.buyer_id,
    buyer_phone = t.buyer_phone
FROM public.tickets t
WHERE p.ticket_id = t.id 
  AND t.buyer_name IS NOT NULL;

-- 3. Drop columns from the tickets table since they are no longer needed there
ALTER TABLE public.tickets DROP COLUMN IF EXISTS buyer_name;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS buyer_id;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS buyer_phone;

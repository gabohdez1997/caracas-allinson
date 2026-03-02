-- Migration to add exchange_rate to payments table
ALTER TABLE public.payments ADD COLUMN exchange_rate DECIMAL(10,4);

-- Comment for clarity
COMMENT ON COLUMN public.payments.exchange_rate IS 'The exchange rate (USD/VES) active at the time the payment was reported.';

-- Backfill existing payments
UPDATE public.payments p
SET exchange_rate = (
    SELECT rate 
    FROM public.exchange_rates er 
    WHERE er.currency = 'USD' 
    AND er.effective_date = DATE(p.payment_date AT TIME ZONE 'UTC')
    LIMIT 1
)
WHERE exchange_rate IS NULL;


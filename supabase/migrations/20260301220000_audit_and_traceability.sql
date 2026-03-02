-- 1. Payment Traceability
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS requested_tickets JSONB;

-- Backfill requested_tickets from currently existing active tickets linked to the payment
UPDATE public.payments p
SET requested_tickets = (
    SELECT jsonb_agg(ticket_number)
    FROM public.tickets t
    WHERE t.id = p.ticket_id
)
WHERE p.requested_tickets IS NULL;


-- 2. System Audit Module
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action_name TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    entity_type TEXT NOT NULL, -- 'raffles', 'events', 'payments', 'tickets'
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Null implies public/anonymous action
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for audit_logs (Only admins can view)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit logs." ON public.audit_logs
    FOR SELECT TO authenticated USING (true);


-- 3. Audit Trigger Function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger AS $$
DECLARE
    user_id uuid;
BEGIN
    user_id := auth.uid();
    
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (action_name, entity_type, entity_id, old_data, performed_by)
        VALUES (TG_OP, TG_TABLE_NAME::text, OLD.id, row_to_json(OLD)::jsonb, user_id);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (action_name, entity_type, entity_id, old_data, new_data, performed_by)
        VALUES (TG_OP, TG_TABLE_NAME::text, NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, user_id);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (action_name, entity_type, entity_id, new_data, performed_by)
        VALUES (TG_OP, TG_TABLE_NAME::text, NEW.id, row_to_json(NEW)::jsonb, user_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Attach Triggers to Tables
DROP TRIGGER IF EXISTS audit_raffles_trigger ON public.raffles;
CREATE TRIGGER audit_raffles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.raffles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_events_trigger ON public.events;
CREATE TRIGGER audit_events_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_payments_trigger ON public.payments;
CREATE TRIGGER audit_payments_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_tickets_trigger ON public.tickets;
CREATE TRIGGER audit_tickets_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

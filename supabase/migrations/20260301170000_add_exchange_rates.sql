-- TABLE: exchange_rates
CREATE TABLE public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    currency TEXT NOT NULL CHECK (currency IN ('USD', 'EUR')),
    rate DECIMAL(10,4) NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(currency, effective_date)
);

-- RLS POLICIES
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Allow public read access to exchange rates
CREATE POLICY "Exchange rates are viewable by everyone." ON public.exchange_rates
    FOR SELECT USING (true);

-- Allow cron job (anon) to insert/update rates
CREATE POLICY "Allow anon insert exchange rates" ON public.exchange_rates
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow anon update exchange rates" ON public.exchange_rates
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

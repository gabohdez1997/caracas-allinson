-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROLES
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PERMISSIONS
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- e.g., 'raffles.create', 'raffles.read', 'payments.verify'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ROLE_PERMISSIONS
CREATE TABLE public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);

-- USER_ROLES
CREATE TABLE public.user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, role_id)
);

-- PROFILES (Extended user data)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RAFFLES
CREATE TABLE public.raffles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price_per_ticket DECIMAL(10,2) NOT NULL,
    total_tickets INTEGER NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    draw_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TICKETS
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raffle_id UUID REFERENCES public.raffles(id) ON DELETE CASCADE,
    ticket_number INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id), -- Nullable for physical sales
    buyer_name TEXT, -- For non-registered users
    buyer_phone TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(raffle_id, ticket_number)
);

-- EVENTS
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- BANKS
CREATE TABLE public.banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PAYMENTS
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'VES',
    reference_number TEXT,
    bank_name TEXT,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    reported_by UUID REFERENCES auth.users(id),
    verifier_id UUID REFERENCES auth.users(id),
    ticket_id UUID REFERENCES public.tickets(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- DEFAULT DATA (Admin Role)
INSERT INTO public.roles (name, description) VALUES ('admin', 'System Administrator') ON CONFLICT DO NOTHING;
INSERT INTO public.roles (name, description) VALUES ('user', 'Standard User') ON CONFLICT DO NOTHING;

-- DEFAULT DATA (Banks)
INSERT INTO public.banks (code, name) VALUES 
('0001', 'BANCO CENTRAL DE VENEZUELA'),
('0102', 'BANCO DE VENEZUELA, S.A. BANCO UNIVERSAL'),
('0104', 'BANCO VENEZOLANO DE CRÉDITO, S.A BANCO UNIVERSAL'),
('0105', 'BANCO MERCANTIL C.A., BANCO UNIVERSAL'),
('0108', 'BANCO PROVINCIAL, S.A. BANCO UNIVERSAL'),
('0114', 'BANCO DEL CARIBE C.A., BANCO UNIVERSAL'),
('0115', 'BANCO EXTERIOR C.A., BANCO UNIVERSAL'),
('0128', 'BANCO CARONÍ C.A., BANCO UNIVERSAL'),
('0134', 'BANESCO BANCO UNIVERSAL, C.A.'),
('0137', 'BANCO SOFITASA BANCO UNIVERSAL, C.A .'),
('0138', 'BANCO PLAZA, BANCO UNIVERSAL'),
('0146', 'BANCO DE LA GENTE EMPRENDEDORA C.A.'),
('0151', 'BANCO FONDO COMÚN, C.A BANCO UNIVERSAL'),
('0156', '100% BANCO, BANCO COMERCIAL, C.A'),
('0157', 'DELSUR, BANCO UNIVERSAL C.A.'),
('0163', 'BANCO DEL TESORO C.A., BANCO UNIVERSAL'),
('0166', 'BANCO AGRÍCOLA DE VENEZUELA C.A., BANCO UNIVERSAL'),
('0168', 'BANCRECER S.A., BANCO MICROFINANCIERO'),
('0169', 'R4, BANCO MICROFINANCIERO, C.A.'),
('0171', 'BANCO ACTIVO C.A., BANCO UNIVERSAL'),
('0172', 'BANCAMIGA BANCO UNIVERSAL, C.A.'),
('0173', 'BANCO INTERNACIONAL DE DESARROLLO C.A., BANCO UNIVERSAL'),
('0174', 'BANPLUS BANCO UNIVERSAL, C.A.'),
('0175', 'BANCO DIGITAL DE LOS TRABAJADORES, BANCO UNIVERSAL C.A.'),
('0177', 'BANCO DE LA FUERZA ARMADA NACIONAL BOLIVARIANA, B.U.'),
('0178', 'N58 BANCO DIGITAL, BANCO MICROFINANCIERO'),
('0191', 'BANCO NACIONAL DE CRÉDITO C.A., BANCO UNIVERSAL'),
('0601', 'INSTITUTO MUNICIPAL DE CRÉDITO POPULAR')
ON CONFLICT (code) DO NOTHING;

-- RLS POLICIES (Basic examples)
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active raffles
CREATE POLICY "Public raffles are viewable by everyone." ON public.raffles
    FOR SELECT USING (status IN ('active', 'completed'));

-- Allow public read access to events
CREATE POLICY "Events are viewable by everyone." ON public.events
    FOR SELECT USING (true);

-- Allow authenticated users to report payments
CREATE POLICY "Users can report their own payments." ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can view their own payments." ON public.payments
    FOR SELECT USING (auth.uid() = reported_by);

-- DRBAC functions would go here to check user_roles -> role_permissions

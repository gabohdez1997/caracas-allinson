-- Seed DRBAC Base Permissions
INSERT INTO public.permissions (name, description) VALUES
    ('eventos.lectura', 'Puede ver la lista y el detalle de eventos en el panel de control'),
    ('eventos.escritura', 'Puede crear, editar y eliminar eventos'),
    ('rifas.lectura', 'Puede ver la lista y el detalle de rifas en el panel de control'),
    ('rifas.escritura', 'Puede crear, editar y eliminar rifas'),
    ('pagos.lectura', 'Puede ver los reportes de pagos en espera de revisión'),
    ('pagos.escritura', 'Puede aprobar o rechazar reportes de pagos'),
    ('usuarios.lectura', 'Puede ver la lista completa de usuarios del sistema'),
    ('usuarios.escritura', 'Puede editar los detalles de los usuarios (nombre, teléfono, cuenta)'),
    ('roles.gestionar', 'Tienen acceso total a la creación y gestión de la Matriz DRBAC'),
    ('auditoria.lectura', 'Puede leer los registros de registro de auditoría de seguridad del sistema')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to the default 'admin' role
DO $$
DECLARE
    admin_role_id UUID;
    perm RECORD;
BEGIN
    -- Get the admin role ID
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin' LIMIT 1;
    
    IF admin_role_id IS NOT NULL THEN
        -- Loop through all permissions and assign them to the admin role
        FOR perm IN SELECT id FROM public.permissions LOOP
            INSERT INTO public.role_permissions (role_id, permission_id) 
            VALUES (admin_role_id, perm.id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- Policies for DRBAC tables
-- Ensure everyone can read roles (authenticated or not, though mostly authenticated will need it)
DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
CREATE POLICY "Anyone can view roles" ON public.roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view permissions" ON public.permissions;
CREATE POLICY "Anyone can view permissions" ON public.permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view role_permissions" ON public.role_permissions;
CREATE POLICY "Anyone can view role_permissions" ON public.role_permissions FOR SELECT USING (true);

-- Only users with 'roles.manage' could potentially edit these, but we will handle mutation via the secure backend API using the Service Role Key for now.

import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { supabase as normalClient } from '$lib/supabase';

// Helper to get an admin bypass client
function getAdminClient() {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in the environment variables.");
    }
    return createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

// Ensure the caller is genuinely an admin or has the required permission
async function verifyUsersAccess(request: Request, requiredPermission: string) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        console.log("[users API] Missing Authorization header");
        return false;
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await normalClient.auth.getUser(token);

    if (authErr || !user) {
        console.error("[users API] auth.getUser failed:", authErr);
        return false;
    }

    // Check custom roles table via adminClient to bypass RLS
    const adminClient = getAdminClient();
    const { data: userRoles, error: rolesErr } = await adminClient
        .from('user_roles')
        .select(`
            roles (
                name,
                role_permissions (
                    permissions ( name )
                )
            )
        `)
        .eq('user_id', user.id);

    if (rolesErr) {
        console.error("[users API] DB query for user_roles failed:", rolesErr);
    }

    let hasAccess = false;
    let foundRoles: string[] = [];

    if (userRoles) {
        for (const ur of userRoles as any[]) {
            const roleName = ur.roles?.name;
            if (roleName) foundRoles.push(roleName);

            if (roleName === 'admin') hasAccess = true;
            if (ur.roles?.role_permissions) {
                for (const rp of ur.roles.role_permissions) {
                    if (rp.permissions?.name === requiredPermission) {
                        hasAccess = true;
                    }
                }
            }
        }
    }

    return hasAccess;
}

export async function GET({ request }) {
    try {
        const hasAccess = await verifyUsersAccess(request, 'usuarios.lectura');
        if (!hasAccess) {
            return json({ error: 'Unauthorized. "usuarios.lectura" required.' }, { status: 403 });
        }

        const adminClient = getAdminClient();

        // 1. Fetch all users from Supabase Auth
        const { data: authData, error: authError } = await adminClient.auth.admin.listUsers();
        if (authError) throw authError;

        // 2. Fetch profiles
        const { data: profiles, error: profError } = await adminClient.from('profiles').select('*');
        if (profError) throw profError;

        // 3. Fetch user roles
        const { data: roles, error: roleError } = await adminClient.from('user_roles').select('user_id, roles(name)');
        if (roleError) throw roleError;

        // Combine the data
        const usersList = authData.users.map(u => {
            const profile = profiles.find(p => p.id === u.id);
            const userRole = roles.find(r => r.user_id === u.id);
            return {
                id: u.id,
                email: u.email,
                created_at: u.created_at,
                email_confirmed_at: u.email_confirmed_at,
                first_name: profile?.first_name || '',
                last_name: profile?.last_name || '',
                phone: profile?.phone || '',
                status: profile?.status || 'active',
                role: (userRole?.roles as any)?.name || 'user'
            };
        });

        return json({ success: true, users: usersList });

    } catch (e: any) {
        return json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function PUT({ request }) {
    try {
        const hasAccess = await verifyUsersAccess(request, 'usuarios.escritura');
        if (!hasAccess) {
            return json({ error: 'Unauthorized. "usuarios.escritura" required.' }, { status: 403 });
        }

        const payload = await request.json();
        const { userId, status, roleName, first_name, last_name, phone, password, confirm_account } = payload;

        if (!userId) return json({ error: 'User ID is required' }, { status: 400 });

        const adminClient = getAdminClient();

        // Update profile fields
        const profileUpdates: any = {};
        if (status !== undefined) profileUpdates.status = status;
        if (first_name !== undefined) profileUpdates.first_name = first_name;
        if (last_name !== undefined) profileUpdates.last_name = last_name;
        if (phone !== undefined) profileUpdates.phone = phone;

        if (Object.keys(profileUpdates).length > 0) {
            const { error: updateErr } = await adminClient.from('profiles').update(profileUpdates).eq('id', userId);
            if (updateErr) throw updateErr;
        }

        // Update role
        if (roleName) {
            // Find role ID
            const { data: roleRow, error: roleErr } = await adminClient.from('roles').select('id').eq('name', roleName).single();
            if (roleErr || !roleRow) throw roleErr || new Error("Role not found");

            // Upsert user_role
            const { error: urErr } = await adminClient.from('user_roles').upsert({
                user_id: userId,
                role_id: roleRow.id
            }, { onConflict: 'user_id,role_id' }); // Assuming user_id works as unique conflict or similar logic
            if (urErr) throw urErr;
        }

        // Update Auth Credentials (Password / Email Confirm)
        if (password || confirm_account) {
            const authUpdates: any = {};
            if (password) authUpdates.password = password;
            if (confirm_account) authUpdates.email_confirm = true;

            const { error: authUpdateErr } = await adminClient.auth.admin.updateUserById(userId, authUpdates);
            if (authUpdateErr) throw authUpdateErr;
        }

        return json({ success: true });
    } catch (e: any) {
        return json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function DELETE({ request }) {
    try {
        const hasAccess = await verifyUsersAccess(request, 'usuarios.escritura');
        if (!hasAccess) {
            return json({ error: 'Unauthorized. "usuarios.escritura" required.' }, { status: 403 });
        }

        const payload = await request.json();
        const { userId } = payload;

        if (!userId) return json({ error: 'User ID is required' }, { status: 400 });

        const adminClient = getAdminClient();

        // Delete from auth.users. Cascading behavior in the DB schema will clean up profiles/user_roles.
        const { error: delErr } = await adminClient.auth.admin.deleteUser(userId);
        if (delErr) throw delErr;

        return json({ success: true });
    } catch (e: any) {
        return json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const hasAccess = await verifyUsersAccess(request, 'usuarios.escritura');
        if (!hasAccess) {
            return json({ error: 'Unauthorized. "usuarios.escritura" required.' }, { status: 403 });
        }

        const payload = await request.json();
        const { email, password, first_name, last_name, phone, roleName, status } = payload;

        if (!email || !password) return json({ error: 'Email and password are required' }, { status: 400 });

        const adminClient = getAdminClient();

        // 1. Create auth user
        const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true // auto-confirm since admin created it
        });

        if (authErr || !authData.user) throw authErr || new Error("Failed to create Auth User");

        const newUserId = authData.user.id;

        // 2. Set Profile Data
        const profileUpdates = {
            id: newUserId,
            first_name: first_name || '',
            last_name: last_name || '',
            phone: phone || '',
            status: status || 'active'
        };

        const { error: profErr } = await adminClient.from('profiles').upsert(profileUpdates);
        if (profErr) {
            // rollback? Or just throw. We'll throw for now
            console.error("Profile creation failed", profErr);
        }

        // 3. Set Role (Default to what they passed, or 'user')
        const finalRole = roleName || 'user';
        const { data: roleRow, error: roleErr } = await adminClient.from('roles').select('id').eq('name', finalRole).single();

        if (!roleErr && roleRow) {
            await adminClient.from('user_roles').upsert({
                user_id: newUserId,
                role_id: roleRow.id
            }, { onConflict: 'user_id,role_id' });
        }

        return json({ success: true, userId: newUserId });
    } catch (e: any) {
        return json({ success: false, error: e.message }, { status: 500 });
    }
}

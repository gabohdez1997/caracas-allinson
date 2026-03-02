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

// Verify if user has 'roles.manage' permission
async function verifyRolesManageAccess(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        console.log("[roles API] Missing Authorization header");
        return false;
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await normalClient.auth.getUser(token);

    if (authErr || !user) {
        console.error("[roles API] auth.getUser failed:", authErr);
        return false;
    }

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
        console.error("[roles API] DB query for user_roles failed:", rolesErr);
    }

    if (!userRoles) {
        console.log("[roles API] userRoles is null or empty");
        return false;
    }

    let hasAccess = false;
    for (const ur of userRoles as any[]) {
        if (ur.roles?.name === 'admin') hasAccess = true;
        if (ur.roles?.role_permissions) {
            for (const rp of ur.roles.role_permissions) {
                if (rp.permissions?.name === 'roles.gestionar') {
                    hasAccess = true;
                }
            }
        }
    }

    if (!hasAccess) {
        console.log("[roles API] User lacks roles.gestionar. Found roles:", JSON.stringify(userRoles, null, 2));
    }

    return hasAccess;
}

export async function GET({ request }) {
    try {
        const hasAccess = await verifyRolesManageAccess(request);
        if (!hasAccess) {
            return json({ error: 'Unauthorized. "roles.manage" permission required.' }, { status: 403 });
        }

        const adminClient = getAdminClient();

        // Fetch all roles with their assigned permissions
        const { data: roles, error: rolesErr } = await adminClient
            .from('roles')
            .select(`
                id, name, description,
                role_permissions (
                    permission_id,
                    permissions ( name, description )
                )
            `)
            .order('created_at', { ascending: true });

        if (rolesErr) throw rolesErr;

        // Fetch all possible permissions available in the system
        const { data: permissions, error: permsErr } = await adminClient
            .from('permissions')
            .select('id, name, description')
            .order('name', { ascending: true });

        if (permsErr) throw permsErr;

        return json({ success: true, roles, permissions });

    } catch (e: any) {
        return json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const hasAccess = await verifyRolesManageAccess(request);
        if (!hasAccess) return json({ error: 'Unauthorized.' }, { status: 403 });

        const payload = await request.json();
        const { name, description, permissionIds } = payload;

        if (!name) return json({ error: 'Role name is required' }, { status: 400 });

        const adminClient = getAdminClient();

        // 1. Insert Role
        const { data: newRole, error: roleErr } = await adminClient
            .from('roles')
            .insert([{ name, description }])
            .select()
            .single();

        if (roleErr) throw roleErr;

        // 2. Insert Permissions
        if (permissionIds && Array.isArray(permissionIds) && permissionIds.length > 0) {
            const permsToInsert = permissionIds.map(pid => ({
                role_id: newRole.id,
                permission_id: pid
            }));
            const { error: rpErr } = await adminClient.from('role_permissions').insert(permsToInsert);
            if (rpErr) throw rpErr;
        }

        return json({ success: true, role: newRole });
    } catch (e: any) {
        return json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function PUT({ request }) {
    try {
        const hasAccess = await verifyRolesManageAccess(request);
        if (!hasAccess) return json({ error: 'Unauthorized.' }, { status: 403 });

        const payload = await request.json();
        const { roleId, name, description, permissionIds } = payload;

        if (!roleId || !name) return json({ error: 'Role ID and name are required' }, { status: 400 });

        const adminClient = getAdminClient();

        // 1. Check if trying to edit 'admin' logic (optional guard, but good practice)
        if (name === 'admin') {
            // we could prevent editing the admin role completely, but we'll let it pass for now
        }

        // 2. Update Role details
        const { error: roleErr } = await adminClient
            .from('roles')
            .update({ name, description })
            .eq('id', roleId);

        if (roleErr) throw roleErr;

        // 3. Update Permissions (Delete all, then Insert new)
        const { error: delErr } = await adminClient.from('role_permissions').delete().eq('role_id', roleId);
        if (delErr) throw delErr;

        if (permissionIds && Array.isArray(permissionIds) && permissionIds.length > 0) {
            const permsToInsert = permissionIds.map(pid => ({
                role_id: roleId,
                permission_id: pid
            }));
            const { error: rpErr } = await adminClient.from('role_permissions').insert(permsToInsert);
            if (rpErr) throw rpErr;
        }

        return json({ success: true });
    } catch (e: any) {
        return json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function DELETE({ request }) {
    try {
        const hasAccess = await verifyRolesManageAccess(request);
        if (!hasAccess) return json({ error: 'Unauthorized.' }, { status: 403 });

        const payload = await request.json();
        const { roleId } = payload;

        if (!roleId) return json({ error: 'Role ID is required' }, { status: 400 });

        const adminClient = getAdminClient();

        // Prevent deleting the base 'admin' or 'user' roles if they exist
        const { data: roleData } = await adminClient.from('roles').select('name').eq('id', roleId).single();
        if (roleData && (roleData.name === 'admin' || roleData.name === 'user')) {
            return json({ error: 'Cannot delete system core roles' }, { status: 400 });
        }

        // Deleting the role cascades into role_permissions and user_roles automatically per SQL schema
        const { error: delErr } = await adminClient.from('roles').delete().eq('id', roleId);
        if (delErr) throw delErr;

        return json({ success: true });
    } catch (e: any) {
        return json({ success: false, error: e.message }, { status: 500 });
    }
}

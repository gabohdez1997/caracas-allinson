import { supabase } from '../supabase';

export const authState = $state({
    session: null as any,
    user: null as any,
    profile: null as any,
    roles: [] as string[],
    permissions: [] as string[],
    initialized: false
});

export async function initializeAuth() {
    // Get initial session
    const { data, error } = await supabase.auth.getSession();
    const session = data?.session || null;
    if (error) {
        console.error("Error getting session:", error.message);
    }
    await updateAuthState(session);

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
        await updateAuthState(session);
    });
}

async function updateAuthState(session: any) {
    authState.session = session;
    authState.user = session?.user || null;

    if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        authState.profile = profile;

        // Fetch roles and their nested permissions
        const { data: userRoles } = await supabase
            .from('user_roles')
            .select(`
                roles (
                    name,
                    role_permissions (
                        permissions (
                            name
                        )
                    )
                )
            `)
            .eq('user_id', session.user.id);

        if (userRoles) {
            authState.roles = userRoles.map((ur: any) => ur.roles.name);

            // Extract and flatten all permissions from all roles
            const allPerms = new Set<string>();
            userRoles.forEach((ur: any) => {
                if (ur.roles && ur.roles.role_permissions) {
                    ur.roles.role_permissions.forEach((rp: any) => {
                        if (rp.permissions && rp.permissions.name) {
                            allPerms.add(rp.permissions.name);
                        }
                    });
                }
            });
            authState.permissions = Array.from(allPerms);
        } else {
            authState.roles = [];
            authState.permissions = [];
        }
    } else {
        authState.profile = null;
        authState.roles = [];
        authState.permissions = [];
    }

    authState.initialized = true;
}

export async function logout() {
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error("Error signing out:", error);
    } finally {
        // Force cleanup local state
        authState.session = null;
        authState.user = null;
        authState.profile = null;
        authState.roles = [];
        authState.permissions = [];
    }
}

export function isAdmin() {
    return authState.roles.includes('admin');
}

export function hasPermission(permissionName: string) {
    return authState.permissions.includes(permissionName) || isAdmin(); // Admin could intuitively have all, but explicit check is better. Assuming explicit seeding.
}

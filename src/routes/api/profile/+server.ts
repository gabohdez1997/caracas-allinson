import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export async function GET({ request }) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return json({ error: 'No authorization header' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileErr) throw profileErr;

        return json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone: profile.phone
            }
        });
    } catch (e: any) {
        return json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function PUT({ request }) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return json({ error: 'No authorization header' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');

        // This validates the token and identifies the user making the request
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await request.json();
        const { first_name, last_name, phone, new_password } = payload;

        // 1. Update the profile in the public.profiles table
        // Notice we are updating EXACTLY the user.id that matches the token
        const { error: profileErr } = await supabase
            .from('profiles')
            .update({
                first_name: first_name?.trim(),
                last_name: last_name?.trim(),
                phone: phone?.trim(),
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (profileErr) throw profileErr;

        // 2. If the user provided a new password, update it using their own session context
        if (new_password && new_password.length >= 6) {
            // We must create a client loaded with the user's specific access token to call updateUser()
            // Fortunately the normal client .setSession() is stateful, so to avoid race conditions 
            // across multiple concurrent server requests we can do a quick one-off client or just use the admin workaround.
            // Actually, we can use user token directly if we instantiate a scoped client.
            // A simpler way: we'll use the user's auth token directly. 
            // SvelteKit endpoint doesn't automatically impersonate the JWT in the global `supabase` client.

            // To properly update Auth user data securely without the service role, we need a scoped client
            const { createClient } = await import('@supabase/supabase-js');
            const scopedClient = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                },
                auth: { persistSession: false }
            });

            const { error: passUpdateErr } = await scopedClient.auth.updateUser({
                password: new_password
            });

            if (passUpdateErr) throw passUpdateErr;
        }

        return json({ success: true });

    } catch (e: any) {
        return json({ success: false, error: e.message }, { status: 500 });
    }
}

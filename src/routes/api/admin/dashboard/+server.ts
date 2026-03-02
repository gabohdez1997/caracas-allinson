import { json } from "@sveltejs/kit";
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { supabase as normalClient } from '$lib/supabase';

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

export async function GET({ request }) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return json({ error: "Missing tokens" }, { status: 401 });

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authErr } = await normalClient.auth.getUser(token);
        if (authErr || !user) return json({ error: "Invalid auth" }, { status: 401 });

        const adminClient = getAdminClient();

        // Optimize: Run all queries in parallel to significantly reduce latency
        const [
            rafflesResult,
            eventsResult,
            paymentsCountResult,
            usersResult,
            pendingListResult,
            auditResult
        ] = await Promise.all([
            // 1. Total Active Raffles
            adminClient.from("raffles").select('*', { count: 'exact', head: true }).eq("status", "active"),
            // 2. Total Upcoming Events
            adminClient.from("events").select('*', { count: 'exact', head: true }).eq("status", "upcoming"),
            // 3. Pending Payments Count
            adminClient.from("payments").select('*', { count: 'exact', head: true }).eq("status", "pending"),
            // 4. Total Registered Users
            adminClient.from("profiles").select('*', { count: 'exact', head: true }),
            // 5. Recent Pending Payments (Top 5)
            adminClient.from("payments")
                .select('reference_number, amount, currency, bank_name, created_at')
                .eq("status", "pending")
                .order("created_at", { ascending: false })
                .limit(5),
            // 6. Recent Audit Logs (Top 5)
            adminClient.from("audit_logs")
                .select('action_name, entity_type, created_at, performed_by')
                .order("created_at", { ascending: false })
                .limit(5)
        ]);

        // Error checking for all results
        if (rafflesResult.error) console.error("Dashboard Raffles Error:", rafflesResult.error);
        if (eventsResult.error) console.error("Dashboard Events Error:", eventsResult.error);
        if (paymentsCountResult.error) console.error("Dashboard Payments Count Error:", paymentsCountResult.error);
        if (usersResult.error) console.error("Dashboard Users Error:", usersResult.error);
        if (pendingListResult.error) console.error("Dashboard Pending List Error:", pendingListResult.error);
        if (auditResult.error) console.error("Dashboard Audit Error:", auditResult.error);

        return json({
            success: true,
            stats: {
                activeRaffles: rafflesResult.count || 0,
                upcomingEvents: eventsResult.count || 0,
                pendingPayments: paymentsCountResult.count || 0,
                totalUsers: usersResult.count || 0
            },
            pendingPaymentsList: pendingListResult.data || [],
            auditLogs: auditResult.data || []
        });

    } catch (e: any) {
        console.error("Dashboard Main API Error:", e);
        return json({ success: false, error: e.message }, { status: 500 });
    }
}

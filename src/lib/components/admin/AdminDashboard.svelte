<script lang="ts">
    import { onMount } from "svelte";
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import { authState, hasPermission } from "$lib/stores/auth.svelte";

    let stats = $state({
        activeRaffles: 0,
        upcomingEvents: 0,
        pendingPayments: 0,
        totalUsers: 0,
    });

    let pendingPaymentsList: any[] = $state([]);
    let auditLogs: any[] = $state([]);
    let loading = $state(true);

    onMount(async () => {
        try {
            const token = authState.session?.access_token;
            if (!token) return;

            const res = await fetch("/api/admin/dashboard", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                stats = data.stats;
                pendingPaymentsList = data.pendingPaymentsList || [];
                auditLogs = data.auditLogs || [];
            }
        } catch (e) {
            console.error("Dashboard failed to load", e);
        } finally {
            loading = false;
        }
    });
</script>

<div class="w-[95%] max-w-[1600px] mx-auto space-y-8 pt-8 pb-12 relative z-10">
    <div>
        <h1
            class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500 dark:from-teal-400 dark:to-emerald-300 drop-shadow-sm mb-2"
        >
            Panel de Control
        </h1>
        <p class="text-slate-600 dark:text-slate-400 font-medium">
            Métricas principales del sistema y centro de mando.
        </p>
    </div>

    {#if loading}
        <div class="flex justify-center py-20">
            <div
                class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color-primary)]"
            ></div>
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Rifas -->
            <GlassCard
                class="p-6 relative overflow-hidden group"
                elevation="medium"
            >
                <div
                    class="absolute -right-6 -top-6 text-teal-500/10 group-hover:text-teal-500/20 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="120"
                        height="120"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path
                            d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                        ></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"
                        ></polyline><line x1="12" y1="22.08" x2="12" y2="12"
                        ></line></svg
                    >
                </div>
                <div class="relative z-10">
                    <h3
                        class="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1 uppercase tracking-wider"
                    >
                        Rifas Activas
                    </h3>
                    <p
                        class="text-4xl font-bold text-slate-800 dark:text-white mb-4"
                    >
                        {stats.activeRaffles}
                    </p>
                    {#if hasPermission("rifas.lectura")}
                        <a
                            href="/admin/raffles"
                            class="text-sm text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1"
                        >
                            Administrar <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path d="M5 12h14"></path><path
                                    d="m12 5 7 7-7 7"
                                ></path></svg
                            >
                        </a>
                    {/if}
                </div>
            </GlassCard>

            <!-- Eventos -->
            <GlassCard
                class="p-6 relative overflow-hidden group"
                elevation="medium"
            >
                <div
                    class="absolute -right-6 -top-6 text-orange-500/10 group-hover:text-orange-500/20 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="120"
                        height="120"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><rect x="3" y="4" width="18" height="18" rx="2" ry="2"
                        ></rect><line x1="16" y1="2" x2="16" y2="6"></line><line
                            x1="8"
                            y1="2"
                            x2="8"
                            y2="6"
                        ></line><line x1="3" y1="10" x2="21" y2="10"
                        ></line></svg
                    >
                </div>
                <div class="relative z-10">
                    <h3
                        class="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1 uppercase tracking-wider"
                    >
                        Próximos Eventos
                    </h3>
                    <p
                        class="text-4xl font-bold text-slate-800 dark:text-white mb-4"
                    >
                        {stats.upcomingEvents}
                    </p>
                    {#if hasPermission("eventos.lectura")}
                        <a
                            href="/admin/events"
                            class="text-sm text-orange-600 dark:text-orange-400 font-semibold hover:underline flex items-center gap-1"
                        >
                            Administrar <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path d="M5 12h14"></path><path
                                    d="m12 5 7 7-7 7"
                                ></path></svg
                            >
                        </a>
                    {/if}
                </div>
            </GlassCard>

            <!-- Pagos -->
            <GlassCard
                class="p-6 relative overflow-hidden group"
                elevation="medium"
            >
                <div
                    class="absolute -right-6 -top-6 text-green-500/10 group-hover:text-green-500/20 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="120"
                        height="120"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><line x1="12" y1="1" x2="12" y2="23"></line><path
                            d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                        ></path></svg
                    >
                </div>
                <div class="relative z-10">
                    <h3
                        class="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1 uppercase tracking-wider"
                    >
                        Pagos Pendientes
                    </h3>
                    <p
                        class="text-4xl font-bold text-slate-800 dark:text-white mb-4"
                    >
                        {stats.pendingPayments}
                    </p>
                    {#if hasPermission("pagos.lectura")}
                        <a
                            href="/admin/payments"
                            class="text-sm text-green-600 dark:text-green-400 font-semibold hover:underline flex items-center gap-1"
                        >
                            Revisar <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path d="M5 12h14"></path><path
                                    d="m12 5 7 7-7 7"
                                ></path></svg
                            >
                        </a>
                    {/if}
                </div>
            </GlassCard>

            <!-- Usuarios -->
            <GlassCard
                class="p-6 relative overflow-hidden group"
                elevation="medium"
            >
                <div
                    class="absolute -right-6 -top-6 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="120"
                        height="120"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                        ></path><circle cx="9" cy="7" r="4"></circle><path
                            d="M22 21v-2a4 4 0 0 0-3-3.87"
                        ></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg
                    >
                </div>
                <div class="relative z-10">
                    <h3
                        class="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1 uppercase tracking-wider"
                    >
                        Usuarios
                    </h3>
                    <p
                        class="text-4xl font-bold text-slate-800 dark:text-white mb-4"
                    >
                        {stats.totalUsers}
                    </p>
                    {#if hasPermission("usuarios.lectura")}
                        <a
                            href="/admin/users"
                            class="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                        >
                            Administrar <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path d="M5 12h14"></path><path
                                    d="m12 5 7 7-7 7"
                                ></path></svg
                            >
                        </a>
                    {/if}
                </div>
            </GlassCard>
        </div>

        <!-- Second Row: Detailed Lists -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Pagos Pendientes -->
            {#if hasPermission("pagos.lectura")}
                <div class="lg:col-span-2 space-y-4">
                    <h2
                        class="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="text-green-500"
                            ><path
                                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                            ></path><polyline points="14 2 14 8 20 8"
                            ></polyline><line x1="16" y1="13" x2="8" y2="13"
                            ></line><line x1="16" y1="17" x2="8" y2="17"
                            ></line><polyline points="10 9 9 9 8 9"
                            ></polyline></svg
                        >
                        Pagos por Aprobar
                    </h2>
                    <GlassCard class="p-0 overflow-hidden" elevation="medium">
                        {#if pendingPaymentsList.length === 0}
                            <div
                                class="p-8 text-center text-slate-500 dark:text-slate-400 italic"
                            >
                                No hay pagos pendientes en la cola. ¡Todo al
                                día!
                            </div>
                        {:else}
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-sm">
                                    <thead
                                        class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50"
                                    >
                                        <tr>
                                            <th
                                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                                >Referencia</th
                                            >
                                            <th
                                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                                >Monto</th
                                            >
                                            <th
                                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                                >Banco</th
                                            >
                                            <th
                                                class="p-4 font-medium text-slate-600 dark:text-slate-300 text-right"
                                                >Acción</th
                                            >
                                        </tr>
                                    </thead>
                                    <tbody
                                        class="divide-y divide-slate-200 dark:divide-slate-700/50"
                                    >
                                        {#each pendingPaymentsList as pago}
                                            <tr
                                                class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                            >
                                                <td
                                                    class="p-4 font-mono text-slate-700 dark:text-slate-300"
                                                    >{pago.reference_number}</td
                                                >
                                                <td
                                                    class="p-4 font-medium text-green-600 dark:text-green-400"
                                                >
                                                    {pago.currency === "USD"
                                                        ? "$"
                                                        : "Bs."}
                                                    {Number(
                                                        pago.amount,
                                                    ).toLocaleString("es-VE")}
                                                </td>
                                                <td
                                                    class="p-4 text-slate-600 dark:text-slate-400"
                                                    >{pago.bank_name ||
                                                        "Caja/Otro"}</td
                                                >
                                                <td class="p-4 text-right">
                                                    <a
                                                        href="/admin/payments"
                                                        class="text-[var(--color-primary)] hover:underline font-medium text-xs"
                                                    >
                                                        Revisar &rarr;
                                                    </a>
                                                </td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        {/if}
                    </GlassCard>
                </div>
            {/if}

            <!-- Auditoría Reciente -->
            {#if hasPermission("auditoria.lectura")}
                <div class="lg:col-span-1 space-y-4">
                    <h2
                        class="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="text-indigo-500"
                            ><path
                                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                            ></path></svg
                        >
                        Auditoría Reciente
                    </h2>
                    <GlassCard class="p-0 overflow-hidden" elevation="medium">
                        {#if auditLogs.length === 0}
                            <div
                                class="p-6 text-center text-slate-500 dark:text-slate-400 text-sm italic"
                            >
                                Sin actividad reciente.
                            </div>
                        {:else}
                            <div
                                class="divide-y divide-slate-200 dark:divide-slate-700/50"
                            >
                                {#each auditLogs as log}
                                    <div
                                        class="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                    >
                                        <div
                                            class="flex items-center justify-between mb-1"
                                        >
                                            <span
                                                class="text-xs font-bold px-2 py-0.5 rounded-full
                                                {log.action_name === 'INSERT'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : log.action_name ===
                                                        'UPDATE'
                                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}"
                                            >
                                                {log.action_name}
                                            </span>
                                            <span
                                                class="text-[10px] text-slate-400"
                                                >{new Date(
                                                    log.created_at,
                                                ).toLocaleTimeString()}</span
                                            >
                                        </div>
                                        <p
                                            class="text-sm text-slate-700 dark:text-slate-300 font-medium capitalize truncate"
                                        >
                                            {log.entity_type}
                                        </p>
                                        <p
                                            class="text-xs text-slate-500 dark:text-slate-400 truncate mt-1"
                                        >
                                            Por: {log.profiles?.email ||
                                                log.performed_by ||
                                                "Sistema / Anónimo"}
                                        </p>
                                    </div>
                                {/each}
                            </div>
                            <div
                                class="bg-slate-50 dark:bg-slate-800/50 p-2 text-center border-t border-slate-200 dark:border-slate-700/50"
                            >
                                <a
                                    href="/admin/audit"
                                    class="text-xs text-[var(--color-primary)] font-medium hover:underline"
                                    >Ver historial completo</a
                                >
                            </div>
                        {/if}
                    </GlassCard>
                </div>
            {/if}
        </div>
    {/if}
</div>

<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import AuthGuard from "$lib/components/AuthGuard.svelte";

    // Example Admin Data
    const stats = [
        {
            title: "Usuarios Activos",
            value: "1,250",
            increase: "+15%",
            icon: "users",
        },
        {
            title: "Ingresos del Mes",
            value: "$15,000",
            increase: "+8%",
            icon: "dollar-sign",
        },
        { title: "Pagos Pendientes", value: "12", alert: true, icon: "clock" },
        { title: "Rifas Activas", value: "4", icon: "ticket" },
    ];

    const recentPayments = [
        {
            id: "1",
            user: "Carlos Pérez",
            amount: 5.0,
            currency: "USD",
            date: "2026-02-24",
            status: "pending",
            ref: "3498",
        },
        {
            id: "2",
            user: "Ana Rojas",
            amount: 350.0,
            currency: "VES",
            date: "2026-02-23",
            status: "verified",
            ref: "9123",
        },
        {
            id: "3",
            user: "Miguel Soto",
            amount: 10.0,
            currency: "USD",
            date: "2026-02-23",
            status: "rejected",
            ref: "0012",
        },
        {
            id: "4",
            user: "Elena Gil",
            amount: 700.0,
            currency: "VES",
            date: "2026-02-22",
            status: "pending",
            ref: "5541",
        },
    ];

    let showPaymentModal = $state(false);
    let selectedPayment = $state<any>(null);

    const openPaymentDetails = (payment: any) => {
        selectedPayment = payment;
        showPaymentModal = true;
    };
</script>

<AuthGuard>
    <div class="max-w-7xl mx-auto space-y-8 pb-8">
        <div class="flex justify-between items-end">
            <div>
                <h1 class="text-3xl font-bold flex items-center gap-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--color-primary)"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-layout-dashboard"
                        ><rect width="7" height="9" x="3" y="3" rx="1" /><rect
                            width="7"
                            height="5"
                            x="14"
                            y="3"
                            rx="1"
                        /><rect
                            width="7"
                            height="9"
                            x="14"
                            y="12"
                            rx="1"
                        /><rect width="7" height="5" x="3" y="16" rx="1" /></svg
                    >
                    Dashboard Administrativo
                </h1>
                <p class="text-slate-600 dark:text-slate-400 mt-2">
                    Visión general del sistema y pagos pendientes.
                </p>
            </div>
            <button
                class="bg-[var(--color-primary)] hover:bg-[#0a3d3d] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow flex items-center gap-2"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><path d="M5 12h14" /><path d="M12 5v14" /></svg
                >
                Nueva Rifa
            </button>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {#each stats as stat}
                <GlassCard
                    class="p-6 flex flex-col justify-between"
                    elevation="medium"
                >
                    <div class="flex justify-between items-start mb-4">
                        <h3
                            class="text-slate-600 dark:text-slate-300 font-medium"
                        >
                            {stat.title}
                        </h3>
                        <!-- Simplified icons based on title for mockup -->
                        <div
                            class={`p-2 rounded-lg ${stat.alert ? "bg-red-100 text-red-600" : "bg-slate-100 dark:bg-slate-800 text-[var(--color-primary)]"}`}
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
                                ><circle cx="12" cy="12" r="10" /><polyline
                                    points="12 6 12 12 16 14"
                                /></svg
                            >
                        </div>
                    </div>
                    <div class="flex items-baseline gap-3">
                        <span
                            class={`text-3xl font-bold ${stat.alert ? "text-red-600" : "text-slate-900 dark:text-white"}`}
                            >{stat.value}</span
                        >
                        {#if stat.increase}
                            <span
                                class="text-sm font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full"
                                >{stat.increase}</span
                            >
                        {/if}
                    </div>
                </GlassCard>
            {/each}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Recent Payments Table -->
            <GlassCard class="lg:col-span-2 p-6" elevation="medium">
                <div class="flex justify-between items-center mb-6">
                    <h2
                        class="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--color-secondary)"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="lucide lucide-receipt"
                            ><path
                                d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"
                            /><path
                                d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"
                            /><path d="M12 17V7" /></svg
                        >
                        Reportes de Pago Recientes
                    </h2>
                    <a
                        href="/dashboard/payments"
                        class="text-sm font-medium text-[var(--color-primary)] hover:underline"
                        >Ver todos</a
                    >
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr
                                class="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400"
                            >
                                <th class="pb-3 font-medium">Usuario</th>
                                <th class="pb-3 font-medium">Monto</th>
                                <th class="pb-3 font-medium">Fecha</th>
                                <th class="pb-3 font-medium">Ref</th>
                                <th class="pb-3 font-medium">Estado</th>
                                <th class="pb-3 font-medium text-right"
                                    >Acción</th
                                >
                            </tr>
                        </thead>
                        <tbody class="text-sm">
                            {#each recentPayments as payment}
                                <tr
                                    class="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                    <td
                                        class="py-4 font-medium text-slate-900 dark:text-white"
                                        >{payment.user}</td
                                    >
                                    <td class="py-4"
                                        >{payment.currency}
                                        {payment.amount.toFixed(2)}</td
                                    >
                                    <td class="py-4 text-slate-500"
                                        >{payment.date}</td
                                    >
                                    <td class="py-4 text-slate-500"
                                        >*{payment.ref}</td
                                    >
                                    <td class="py-4">
                                        <span
                                            class={`px-2.5 py-1 text-xs font-semibold rounded-full 
                                        ${
                                            payment.status === "pending"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : payment.status === "verified"
                                                  ? "bg-green-100 text-green-800"
                                                  : "bg-red-100 text-red-800"
                                        }`}
                                        >
                                            {payment.status === "pending"
                                                ? "Pendiente"
                                                : payment.status === "verified"
                                                  ? "Verificado"
                                                  : "Rechazado"}
                                        </span>
                                    </td>
                                    <td class="py-4 text-right">
                                        <button
                                            onclick={() =>
                                                openPaymentDetails(payment)}
                                            class="text-[var(--color-secondary)] hover:text-[#d97c25] font-medium"
                                        >
                                            Revisar
                                        </button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            <!-- Quick Actions Sidebar -->
            <GlassCard class="p-6 h-fit" elevation="medium">
                <h2
                    class="text-xl font-bold mb-6 text-slate-900 dark:text-white"
                >
                    Acciones Rápidas
                </h2>
                <div class="space-y-3">
                    <button
                        class="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[var(--color-primary)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group"
                    >
                        <span
                            class="font-medium text-slate-700 dark:text-slate-200 group-hover:text-[var(--color-primary)]"
                            >Gestionar Usuarios</span
                        >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="text-slate-400 group-hover:text-[var(--color-primary)]"
                            ><path d="m9 18 6-6-6-6" /></svg
                        >
                    </button>
                    <button
                        class="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[var(--color-primary)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group"
                    >
                        <span
                            class="font-medium text-slate-700 dark:text-slate-200 group-hover:text-[var(--color-primary)]"
                            >Configurar Permisos (DRBAC)</span
                        >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="text-slate-400 group-hover:text-[var(--color-primary)]"
                            ><path d="m9 18 6-6-6-6" /></svg
                        >
                    </button>
                    <button
                        class="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[var(--color-primary)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group"
                    >
                        <span
                            class="font-medium text-slate-700 dark:text-slate-200 group-hover:text-[var(--color-primary)]"
                            >Reportes de Sistema</span
                        >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="text-slate-400 group-hover:text-[var(--color-primary)]"
                            ><path d="m9 18 6-6-6-6" /></svg
                        >
                    </button>
                </div>
            </GlassCard>
        </div>
    </div>

    <!-- Simple Payment Verification Modal -->
    {#if showPaymentModal && selectedPayment}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <GlassCard class="w-full max-w-md p-6 relative" elevation="high">
                <button
                    class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    onclick={() => (showPaymentModal = false)}
                    aria-label="Cerrar modal"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
                    >
                </button>

                <h3 class="text-xl font-bold mb-4 pr-8">Verificar Pago</h3>

                <div class="space-y-4 mb-8">
                    <div
                        class="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2"
                    >
                        <span class="text-slate-500">Usuario:</span>
                        <span class="font-medium text-slate-900 dark:text-white"
                            >{selectedPayment.user}</span
                        >
                    </div>
                    <div
                        class="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2"
                    >
                        <span class="text-slate-500">Monto:</span>
                        <span
                            class="font-bold text-[var(--color-primary)] text-lg"
                            >{selectedPayment.currency}
                            {selectedPayment.amount.toFixed(2)}</span
                        >
                    </div>
                    <div
                        class="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2"
                    >
                        <span class="text-slate-500">Referencia:</span>
                        <span class="font-medium text-slate-900 dark:text-white"
                            >...{selectedPayment.ref}</span
                        >
                    </div>
                    <div
                        class="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2"
                    >
                        <span class="text-slate-500">Fecha:</span>
                        <span class="font-medium text-slate-900 dark:text-white"
                            >{selectedPayment.date}</span
                        >
                    </div>
                </div>

                <div class="flex gap-4">
                    <button
                        class="flex-1 py-2.5 rounded-lg bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors"
                        onclick={() => {
                            selectedPayment.status = "rejected";
                            showPaymentModal = false;
                        }}
                    >
                        Rechazar
                    </button>
                    <button
                        class="flex-1 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                        onclick={() => {
                            selectedPayment.status = "verified";
                            showPaymentModal = false;
                        }}
                    >
                        Aprobar Pago
                    </button>
                </div>
            </GlassCard>
        </div>
    {/if}
</AuthGuard>

<script lang="ts">
    import { onMount } from "svelte";
    import { supabase } from "$lib/supabase";
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import AuthGuard from "$lib/components/AuthGuard.svelte";

    let payments = $state<any[]>([]);
    let loading = $state(true);
    let processingId = $state<string | null>(null);

    onMount(async () => {
        await loadPayments();
    });

    async function loadPayments() {
        loading = true;

        // Fetch payments and join ticket & raffle data
        const { data, error } = await supabase
            .from("payments")
            .select(
                `
                id, amount, currency, exchange_rate, reference_number, bank_name, payment_date, status, created_at,
                buyer_name, buyer_id, buyer_phone, requested_tickets,
                tickets ( id, ticket_number, status,
                    raffles ( id, title )
                )
            `,
            )
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error loading payments:", error);
        } else {
            payments = data || [];
        }
        loading = false;
    }

    async function processPayment(
        paymentId: string,
        ticketId: string,
        action: "approve" | "reject",
    ) {
        if (
            !confirm(
                `¿Estás seguro de que deseas ${action === "approve" ? "APROBAR" : "RECHAZAR"} este pago?`,
            )
        )
            return;

        processingId = paymentId;

        const newPaymentStatus = action === "approve" ? "verified" : "rejected";

        // 1. Update Payment Status (Unlink ticket on reject to avoid foreign key violations)
        const paymentUpdatePayload: any = {
            status: newPaymentStatus,
            updated_at: new Date().toISOString(),
        };

        if (action === "reject") {
            paymentUpdatePayload.ticket_id = null;
        }

        const { error: paymentError } = await supabase
            .from("payments")
            .update(paymentUpdatePayload)
            .eq("id", paymentId);

        if (paymentError) {
            console.error("Error updating payment:", paymentError);
            alert("Error al actualizar el pago.");
            processingId = null;
            return;
        }

        // 2. Deal with the Ticket (make it definitively sold, or delete it to free the number)
        let ticketError = null;

        if (action === "approve") {
            const { error: err } = await supabase
                .from("tickets")
                .update({ status: "sold" })
                .eq("id", ticketId);
            ticketError = err;
        } else {
            // Delete the ticket so it completely disappears and its number can be reserved again
            const { error: err } = await supabase
                .from("tickets")
                .delete()
                .eq("id", ticketId);
            ticketError = err;
        }

        if (ticketError) {
            console.error("Error with ticket operation:", ticketError);
            alert(
                "El pago se actualizó, pero hubo un error al aplicar la acción sobre el ticket.",
            );
        }

        // Refresh list
        await loadPayments();
        processingId = null;
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("es-VE", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<AuthGuard requiredPermission="pagos.lectura">
    <div class="w-[95%] max-w-[1600px] mx-auto space-y-8 pb-8 pt-8">
        <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
            <div>
                <h1
                    class="text-3xl font-bold flex items-center gap-3 text-slate-900 dark:text-white"
                >
                    Gestión de Pagos
                </h1>
            </div>
            <div class="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
                <button
                    onclick={loadPayments}
                    class="flex-1 sm:flex-none justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 text-sm"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-refresh-cw"
                        class:animate-spin={loading}
                        ><path
                            d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                        /><path d="M3 3v5h5" /></svg
                    >
                    Actualizar
                </button>
            </div>
        </div>

        <GlassCard class="p-6" elevation="medium">
            <div
                class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50"
            >
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr
                            class="bg-slate-50 dark:bg-slate-800/50 text-sm border-b border-slate-200 dark:border-slate-700/50"
                        >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                >Fecha / Banco / Ref</th
                            >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                >Comprador</th
                            >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                >Rifa / Ticket</th
                            >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                >Monto</th
                            >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                >Tasa</th
                            >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                >Estado</th
                            >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300 text-right"
                                >Acciones</th
                            >
                        </tr>
                    </thead>
                    <tbody
                        class="divide-y divide-slate-200 dark:divide-slate-700/50"
                    >
                        {#if loading}
                            <tr>
                                <td
                                    colspan="6"
                                    class="p-8 text-center text-slate-500"
                                >
                                    <div class="flex justify-center mb-4">
                                        <div
                                            class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color-primary)]"
                                        ></div>
                                    </div>
                                    Cargando pagos...
                                </td>
                            </tr>
                        {:else if payments.length === 0}
                            <tr>
                                <td
                                    colspan="6"
                                    class="text-center py-12 text-slate-500"
                                >
                                    No hay reportes de pago para mostrar.
                                </td>
                            </tr>
                        {:else}
                            {#each payments as payment}
                                {@const ticket = payment.tickets}
                                {@const raffle = ticket?.raffles}
                                <tr
                                    class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                                >
                                    <td class="p-4 align-top">
                                        <div
                                            class="text-sm font-medium text-slate-900 dark:text-white"
                                        >
                                            {formatDate(payment.created_at)}
                                        </div>
                                        <div
                                            class="text-xs text-slate-500 flex flex-col mt-0.5"
                                        >
                                            <span
                                                >Banco: {payment.bank_name}</span
                                            >
                                            <span
                                                class="font-mono text-slate-600 dark:text-slate-400"
                                                >Ref: {payment.reference_number}</span
                                            >
                                        </div>
                                    </td>

                                    <td class="p-4 align-top">
                                        <div
                                            class="text-sm text-slate-900 dark:text-white font-medium"
                                        >
                                            {payment.buyer_name ||
                                                "Desconocido"}
                                        </div>
                                        <div class="text-xs text-slate-500">
                                            {payment.buyer_id || "N/A"}
                                        </div>
                                        <div class="text-xs text-slate-500">
                                            {payment.buyer_phone || "N/A"}
                                        </div>
                                    </td>

                                    <td class="p-4 align-top">
                                        <div
                                            class="text-sm text-slate-900 dark:text-white max-w-[150px] truncate mb-1"
                                            title={raffle?.title}
                                        >
                                            {raffle?.title ||
                                                "Contexto de Rifa Perdido"}
                                        </div>
                                        <div class="flex flex-wrap gap-1">
                                            {#if payment.requested_tickets && Array.isArray(payment.requested_tickets)}
                                                {#each payment.requested_tickets as tNum}
                                                    <span
                                                        class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] dark:bg-[var(--color-secondary)]/20"
                                                    >
                                                        #{tNum}
                                                    </span>
                                                {/each}
                                            {:else}
                                                <span
                                                    class="text-xs text-slate-400 italic"
                                                    >Sin datos</span
                                                >
                                            {/if}
                                        </div>
                                    </td>

                                    <td class="p-4 align-top">
                                        <div
                                            class="text-sm font-bold {payment.currency ===
                                            'USD'
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-slate-900 dark:text-white'}"
                                        >
                                            {Number(
                                                payment.amount,
                                            ).toLocaleString("es-VE")}
                                            {payment.currency}
                                        </div>
                                    </td>

                                    <td class="p-4 align-top">
                                        {#if payment.exchange_rate}
                                            <div
                                                class="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded inline-block"
                                            >
                                                {Number(
                                                    payment.exchange_rate,
                                                ).toFixed(2)} Bs/$
                                            </div>
                                        {:else}
                                            <span
                                                class="text-xs text-slate-400 italic"
                                                >No registr.</span
                                            >
                                        {/if}
                                    </td>

                                    <td class="p-4 align-top">
                                        {#if payment.status === "pending"}
                                            <span
                                                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                            >
                                                <div
                                                    class="w-1.5 h-1.5 rounded-full bg-yellow-500"
                                                ></div>
                                                En Revisión
                                            </span>
                                        {:else if payment.status === "verified"}
                                            <span
                                                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                            >
                                                <div
                                                    class="w-1.5 h-1.5 rounded-full bg-green-500"
                                                ></div>
                                                Aprobado
                                            </span>
                                        {:else if payment.status === "rejected"}
                                            <span
                                                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                            >
                                                <div
                                                    class="w-1.5 h-1.5 rounded-full bg-red-500"
                                                ></div>
                                                Rechazado
                                            </span>
                                        {/if}
                                    </td>

                                    <td class="p-4 align-top text-right">
                                        <div class="flex justify-end gap-2">
                                            {#if payment.status === "pending" && ticket?.id}
                                                <button
                                                    onclick={() =>
                                                        processPayment(
                                                            payment.id,
                                                            ticket.id,
                                                            "approve",
                                                        )}
                                                    disabled={processingId !==
                                                        null}
                                                    class="p-2 text-green-600 hover:bg-green-50 dark:text-green-500 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Aprobar Pago"
                                                >
                                                    {#if processingId === payment.id}
                                                        <div
                                                            class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-600"
                                                        ></div>
                                                    {:else}
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
                                                            class="lucide lucide-check-circle-2"
                                                            ><path
                                                                d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                                                            /><path
                                                                d="m9 12 2 2 4-4"
                                                            /></svg
                                                        >
                                                    {/if}
                                                </button>
                                                <button
                                                    onclick={() =>
                                                        processPayment(
                                                            payment.id,
                                                            ticket.id,
                                                            "reject",
                                                        )}
                                                    disabled={processingId !==
                                                        null}
                                                    class="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Rechazar Pago (Devuelve Ticket)"
                                                >
                                                    {#if processingId === payment.id}
                                                        <div
                                                            class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-500"
                                                        ></div>
                                                    {:else}
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
                                                            class="lucide lucide-x-circle"
                                                            ><circle
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                            /><path
                                                                d="m15 9-6 6"
                                                            /><path
                                                                d="m9 9 6 6"
                                                            /></svg
                                                        >
                                                    {/if}
                                                </button>
                                            {/if}
                                        </div>
                                    </td>
                                </tr>
                            {/each}
                        {/if}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    </div>
</AuthGuard>

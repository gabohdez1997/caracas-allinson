<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import { supabase } from "$lib/supabase";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { authState } from "$lib/stores/auth.svelte";

    let allRaffles: any[] = $state([]);
    let loading = $state(true);

    onMount(async () => {
        const { data, error } = await supabase
            .from("raffles")
            .select("*")
            .in("status", ["active", "completed"])
            .order("created_at", { ascending: false });

        if (!error && data) {
            allRaffles = data;
        }
        loading = false;
    });

    function handlePurchase(raffleId: string) {
        if (!authState.user) {
            alert("Debes iniciar sesión para reportar un pago o comprar.");
            goto("/login");
            return;
        }
        goto(`/raffles/${raffleId}/report-payment`);
    }
</script>

<div class="max-w-7xl mx-auto py-8">
    <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold flex items-center gap-3">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-secondary)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-ticket"
                ><path
                    d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
                /><path d="M13 5v2" /><path d="M13 17v2" /><path
                    d="M13 11v2"
                /></svg
            >
            Todas las Rifas
        </h1>
    </div>

    {#if loading}
        <div class="flex justify-center p-12">
            <div
                class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"
            ></div>
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each allRaffles as raffle}
                <GlassCard
                    class="overflow-hidden flex flex-col h-full transform transition-all hover:scale-[1.02] group"
                    elevation="medium"
                >
                    {#if raffle.image_url}
                        <div
                            class="relative h-52 w-full overflow-hidden border-b border-slate-100 dark:border-slate-800"
                        >
                            <img
                                src={raffle.image_url}
                                alt={raffle.title}
                                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div class="absolute top-4 right-4">
                                <span
                                    class={`px-3 py-1 text-xs font-bold rounded-full shadow-lg backdrop-blur-md ${raffle.status === "active" ? "bg-green-500/90 text-white" : "bg-slate-500/90 text-white"}`}
                                >
                                    {raffle.status === "active"
                                        ? "Activa"
                                        : "Finalizada"}
                                </span>
                            </div>
                        </div>
                    {/if}

                    <div class="p-6 flex flex-col flex-grow">
                        <h3
                            class="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[var(--color-primary)] transition-colors"
                        >
                            {raffle.title}
                        </h3>

                        <p
                            class="text-slate-600 dark:text-slate-300 mb-6 line-clamp-2 text-sm"
                        >
                            {raffle.description}
                        </p>

                        <div
                            class="space-y-3 mb-8 bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50"
                        >
                            <div class="flex justify-between items-center">
                                <span
                                    class="text-sm text-slate-500 dark:text-slate-400 font-medium"
                                    >Precio Ticket</span
                                >
                                <span
                                    class="font-bold text-xl text-[var(--color-primary)]"
                                >
                                    ${Number(raffle.price_per_ticket).toFixed(
                                        2,
                                    )}
                                </span>
                            </div>
                            <div
                                class="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/50"
                            >
                                <span
                                    class="text-sm text-slate-500 dark:text-slate-400 font-medium"
                                    >Sorteo</span
                                >
                                <span
                                    class="text-sm font-semibold text-slate-700 dark:text-slate-200"
                                >
                                    {raffle.draw_date
                                        ? new Date(
                                              raffle.draw_date,
                                          ).toLocaleDateString()
                                        : "Por definir"}
                                </span>
                            </div>
                        </div>

                        {#if raffle.status === "active"}
                            <button
                                onclick={() => handlePurchase(raffle.id)}
                                class="w-full py-3 rounded-xl bg-[var(--color-secondary)] text-white font-bold hover:bg-[#d97c25] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path
                                        d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"
                                    />
                                    <path
                                        d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"
                                    />
                                    <path d="M12 17V7" />
                                </svg>
                                Reportar Pago
                            </button>
                        {:else}
                            <button
                                disabled
                                class="w-full py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold cursor-not-allowed text-center"
                            >
                                Rifa Cerrada
                            </button>
                        {/if}
                    </div>
                </GlassCard>
            {:else}
                <div
                    class="col-span-full py-12 text-center text-slate-500 dark:text-slate-400"
                >
                    <p>No se encontraron rifas disponibles en este momento.</p>
                </div>
            {/each}
        </div>
    {/if}
</div>

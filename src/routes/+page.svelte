<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import bgImage from "$lib/assets/images/caracas.jpg";
    import { supabase } from "$lib/supabase";
    import { onMount } from "svelte";
    import { authState } from "$lib/stores/auth.svelte";
    import AdminDashboard from "$lib/components/admin/AdminDashboard.svelte";

    let activeRaffles: any[] = $state([]);
    let upcomingEvents: any[] = $state([]);
    let loading = $state(true);

    onMount(async () => {
        const [rafflesRes, eventsRes] = await Promise.all([
            supabase
                .from("raffles")
                .select("*")
                .eq("status", "active")
                .order("created_at", { ascending: false })
                .limit(2),
            supabase
                .from("events")
                .select("*")
                .eq("status", "upcoming")
                .order("event_date", { ascending: true })
                .limit(3),
        ]);

        if (rafflesRes.data) activeRaffles = rafflesRes.data;
        if (eventsRes.data) upcomingEvents = eventsRes.data;

        loading = false;
    });
</script>

{#if authState.user}
    <AdminDashboard />
{:else}
    <div class="space-y-12 pb-12 w-full">
        <!-- Hero Section with Parallax -->
        <div
            class="relative w-full min-h-[100vh] flex items-center justify-center bg-fixed bg-center bg-cover bg-no-repeat overflow-hidden"
            style="background-image: url('{bgImage}')"
        >
            <!-- Gradients and overlays to make text readable -->
            <div
                class="absolute inset-0 bg-slate-900/60 mix-blend-multiply backdrop-blur-[2px]"
            ></div>
            <div
                class="absolute inset-0 bg-gradient-to-t from-[var(--bg-light)] dark:from-[var(--bg-dark)] via-transparent to-transparent"
            ></div>

            <section
                class="relative z-10 text-center py-20 px-4 w-full max-w-7xl mx-auto drop-shadow-lg"
            >
                <div class="p-8 md:p-12 max-w-4xl mx-auto">
                    <h1
                        class="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-white"
                    >
                        <!-- Bienvenido a <span
                        class="text-[var(--color-primary)] drop-shadow-md"
                        >Caracas</span
                    >
                    y -->
                        Caracas & Allinson
                        <!-- <span class="text-[var(--color-secondary)] drop-shadow-md"
                    ></span> -->
                    </h1>
                    <p
                        class="text-xl md:text-2xl text-slate-100 dark:text-slate-200 max-w-3xl mx-auto mb-10 font-medium"
                    >
                        Encuentra las mejores rifas y eventos en la ciudad.
                        Participa y gana increíbles premios.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="#rifas"
                            class="px-8 py-3 rounded-full bg-[var(--color-primary)] text-white font-semibold hover:bg-[#0a3d3d] transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-white/20"
                        >
                            ¡Prueba tu Suerte!
                        </a>
                        <!-- <a
                        href="/raffles"
                        class="px-8 py-3 rounded-full bg-white/10 backdrop-blur-md text-white border-2 border-white/50 font-semibold hover:bg-white/20 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        Ver Todas
                    </a> -->
                    </div>
                </div>
            </section>
        </div>

        <!-- Main Content Area -->
        <div
            class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 w-full"
        >
            <!-- Active Raffles Section -->
            <section id="rifas" class="lg:col-span-2">
                <h2 class="text-3xl font-bold mb-6 flex items-center gap-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
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
                    Rifas Activas
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {#if loading}
                        <div class="col-span-full py-12 flex justify-center">
                            <div
                                class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color-primary)]"
                            ></div>
                        </div>
                    {:else if activeRaffles.length === 0}
                        <p
                            class="text-slate-500 dark:text-slate-400 italic col-span-full py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800"
                        >
                            No hay rifas activas en este momento.
                        </p>
                    {:else}
                        {#each activeRaffles as raffle}
                            <GlassCard
                                class="overflow-hidden flex flex-col h-full transform transition-all hover:scale-[1.02]"
                                elevation="medium"
                            >
                                {#if raffle.image_url}
                                    <div
                                        class="w-full h-48 shrink-0 overflow-hidden bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800"
                                    >
                                        <!-- svelte-ignore a11y_img_redundant_alt -->
                                        <img
                                            src={raffle.image_url}
                                            alt="Cover image for {raffle.title}"
                                            class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                            loading="lazy"
                                        />
                                    </div>
                                {/if}
                                <div class="p-6 flex-grow flex flex-col">
                                    <h3
                                        class="text-xl font-bold text-slate-900 dark:text-white mb-2"
                                    >
                                        {raffle.title}
                                    </h3>
                                    <p
                                        class="text-slate-600 dark:text-slate-300 mb-6 line-clamp-2 text-sm"
                                    >
                                        {raffle.description}
                                    </p>

                                    <div
                                        class="space-y-3 mb-6 bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50"
                                    >
                                        <div
                                            class="flex justify-between items-center text-sm"
                                        >
                                            <span
                                                class="text-slate-500 dark:text-slate-400 font-medium"
                                                >Precio Ticket:</span
                                            >
                                            <span
                                                class="font-bold text-lg text-[var(--color-primary)]"
                                                >${Number(
                                                    raffle.price_per_ticket,
                                                ).toFixed(2)}</span
                                            >
                                        </div>
                                        <div
                                            class="flex justify-between items-center text-sm"
                                        >
                                            <span
                                                class="text-slate-500 dark:text-slate-400 font-medium"
                                                >Sorteo:</span
                                            >
                                            <span
                                                class="font-semibold text-slate-700 dark:text-slate-200"
                                                >{raffle.draw_date
                                                    ? new Date(
                                                          raffle.draw_date,
                                                      ).toLocaleDateString()
                                                    : "Por definir"}</span
                                            >
                                        </div>
                                    </div>

                                    <a
                                        href="/raffles/{raffle.id}/report-payment"
                                        class="w-full py-3 rounded-xl bg-[var(--color-secondary)] text-white font-bold hover:bg-[#d97c25] transition-all shadow-md hover:shadow-lg mt-auto text-center block active:scale-95"
                                    >
                                        Adquirir Tickets
                                    </a>
                                </div>
                            </GlassCard>
                        {/each}
                    {/if}
                </div>
            </section>

            <!-- Sidebar (Events & Stats) -->
            <aside class="space-y-8">
                <section>
                    <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--color-primary)"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="lucide lucide-calendar-days"
                            ><path d="M8 2v4" /><path d="M16 2v4" /><rect
                                width="18"
                                height="18"
                                x="3"
                                y="4"
                                rx="2"
                            /><path d="M3 10h18" /><path d="M8 14h.01" /><path
                                d="M12 14h.01"
                            /><path d="M16 14h.01" /><path d="M8 18h.01" /><path
                                d="M12 18h.01"
                            /><path d="M16 18h.01" /></svg
                        >
                        Próximos Eventos
                    </h2>
                    <div class="space-y-4">
                        {#if loading}
                            <div class="py-12 flex justify-center">
                                <div
                                    class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color-primary)]"
                                ></div>
                            </div>
                        {:else if upcomingEvents.length === 0}
                            <p
                                class="text-slate-500 dark:text-slate-400 italic py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800"
                            >
                                No hay eventos próximos.
                            </p>
                        {:else}
                            {#each upcomingEvents as event}
                                <GlassCard
                                    class="overflow-hidden border-l-4 border-[var(--color-secondary)] hover:shadow-md transition-shadow group"
                                    elevation="low"
                                >
                                    {#if event.image_url}
                                        <div
                                            class="w-full h-40 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800"
                                        >
                                            <!-- svelte-ignore a11y_img_redundant_alt -->
                                            <img
                                                src={event.image_url}
                                                alt="Cover image for {event.title}"
                                                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                        </div>
                                    {/if}
                                    <div class="p-5 flex-1">
                                        <h3
                                            class="font-bold text-lg mb-2 text-slate-900 dark:text-white group-hover:text-[var(--color-primary)] transition-colors"
                                        >
                                            {event.title}
                                        </h3>
                                        <div
                                            class="text-sm text-slate-600 dark:text-slate-300 space-y-2 mb-4"
                                        >
                                            <p class="flex items-center gap-2">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    class="text-[var(--color-secondary)]"
                                                    ><path
                                                        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                                                    /><circle
                                                        cx="12"
                                                        cy="10"
                                                        r="3"
                                                    /></svg
                                                >
                                                {event.location}
                                            </p>
                                            <p class="flex items-center gap-2">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    class="text-[var(--color-primary)]"
                                                    ><circle
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                    /><polyline
                                                        points="12 6 12 12 16 14"
                                                    /></svg
                                                >
                                                {new Date(
                                                    event.event_date,
                                                ).toLocaleDateString()} a las
                                                {new Date(
                                                    event.event_date,
                                                ).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                        <a
                                            href={`/events/${event.id}`}
                                            class="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:text-[#0a3d3d] font-bold transition-colors"
                                            >Ver detalles <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                ><path d="M5 12h14" /><path
                                                    d="m12 5 7 7-7 7"
                                                /></svg
                                            ></a
                                        >
                                    </div>
                                </GlassCard>
                            {/each}
                        {/if}
                    </div>
                </section>
            </aside>
        </div>
    </div>
{/if}

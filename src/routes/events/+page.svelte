<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import { supabase } from "$lib/supabase";
    import { onMount } from "svelte";

    let allEvents: any[] = $state([]);
    let loading = $state(true);

    onMount(async () => {
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .in("status", ["upcoming", "ongoing"])
            .order("event_date", { ascending: true });

        if (!error && data) {
            allEvents = data;
        }
        loading = false;
    });
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
            Todos los Eventos
        </h1>
    </div>

    {#if loading}
        <div class="flex justify-center p-12">
            <div
                class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"
            ></div>
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each allEvents as event}
                <GlassCard
                    class="overflow-hidden flex flex-col h-full hover:shadow-xl transition-all group"
                    elevation="medium"
                >
                    {#if event.image_url}
                        <div
                            class="relative h-56 w-full overflow-hidden border-b border-slate-100 dark:border-slate-800"
                        >
                            <img
                                src={event.image_url}
                                alt={event.title}
                                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div class="absolute top-4 right-4">
                                <span
                                    class={`px-3 py-1 text-xs font-bold rounded-full shadow-sm backdrop-blur-md ${event.status === "upcoming" ? "bg-blue-500/90 text-white" : "bg-green-500/90 text-white"}`}
                                >
                                    {event.status === "upcoming"
                                        ? "Próximo"
                                        : "En curso"}
                                </span>
                            </div>
                        </div>
                    {/if}

                    <div class="p-6 flex flex-col flex-grow">
                        <h3
                            class="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[var(--color-primary)] transition-colors"
                        >
                            {event.title}
                        </h3>

                        <p
                            class="text-slate-600 dark:text-slate-300 mb-6 flex-grow line-clamp-3 text-sm leading-relaxed"
                        >
                            {event.description}
                        </p>

                        <div
                            class="grid grid-cols-1 gap-3 mb-8 bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50"
                        >
                            <div
                                class="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"
                            >
                                <div
                                    class="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="var(--color-secondary)"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        ><path
                                            d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                                        /><circle cx="12" cy="10" r="3" /></svg
                                    >
                                </div>
                                <span class="font-semibold"
                                    >{event.location}</span
                                >
                            </div>
                            <div
                                class="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"
                            >
                                <div
                                    class="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="var(--color-primary)"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        ><circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                        /><polyline
                                            points="12 6 12 12 16 14"
                                        /></svg
                                    >
                                </div>
                                <span class="font-semibold"
                                    >{new Date(
                                        event.event_date,
                                    ).toLocaleDateString("es-ES", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })} - {new Date(
                                        event.event_date,
                                    ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}</span
                                >
                            </div>
                        </div>

                        <a
                            href={`/events/${event.id}`}
                            class="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[#0a3d3d] text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-center"
                        >
                            Ver Detalles del Evento
                        </a>
                    </div>
                </GlassCard>
            {:else}
                <div
                    class="col-span-full py-12 text-center text-slate-500 dark:text-slate-400"
                >
                    <p>No hay eventos programados próximamente.</p>
                </div>
            {/each}
        </div>
    {/if}
</div>

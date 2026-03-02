<script lang="ts">
    import { supabase } from "$lib/supabase";
    import AuthGuard from "$lib/components/AuthGuard.svelte";
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import { onMount } from "svelte";

    let logs: any[] = $state([]);
    let loading = $state(true);

    onMount(() => {
        loadLogs();
    });

    async function loadLogs() {
        loading = true;

        const { data, error } = await supabase
            .from("audit_logs")
            .select(`*`)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error loading audit logs:", error);
        } else {
            logs = data || [];
        }
        loading = false;
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

    // A helper to quickly colorize actions
    function getActionColor(actionStr: string) {
        switch (actionStr.toUpperCase()) {
            case "INSERT":
                return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
            case "DELETE":
                return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
            case "UPDATE":
                return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
            default:
                return "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800";
        }
    }
</script>

<AuthGuard requiredPermission="auditoria.lectura">
    <div class="w-[95%] max-w-[1600px] mx-auto space-y-8 pb-8 pt-8">
        <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
            <div>
                <h1
                    class="text-3xl font-bold flex items-center gap-3 text-slate-900 dark:text-white"
                >
                    Auditoría del Sistema
                </h1>
            </div>
            <div class="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
                <button
                    onclick={loadLogs}
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
                    >
                        <path
                            d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                        />
                        <path d="M3 3v5h5" />
                    </svg>
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
                                >Fecha</th
                            >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                >Acción</th
                            >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                >Tabla / Entidad</th
                            >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                >Usuario Responsable</th
                            >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                >Detalles Anteriores</th
                            >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                >Detalles Nuevos</th
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
                                    Cargando bitácora...
                                </td>
                            </tr>
                        {:else if logs.length === 0}
                            <tr>
                                <td
                                    colspan="6"
                                    class="text-center py-12 text-slate-500"
                                >
                                    No hay registros de auditoría almacenados
                                    aún.
                                </td>
                            </tr>
                        {:else}
                            {#each logs as log}
                                <tr
                                    class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0 text-sm"
                                >
                                    <td
                                        class="p-4 align-top whitespace-nowrap text-slate-900 dark:text-slate-300"
                                    >
                                        {formatDate(log.created_at)}
                                    </td>
                                    <td class="p-4 align-top">
                                        <span
                                            class="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold {getActionColor(
                                                log.action_name,
                                            )}"
                                        >
                                            {log.action_name}
                                        </span>
                                    </td>
                                    <td class="p-4 align-top">
                                        <div
                                            class="font-medium text-slate-900 dark:text-white capitalize"
                                        >
                                            {log.entity_type}
                                        </div>
                                        <div
                                            class="text-[10px] text-slate-500 font-mono mt-1 w-32 truncate"
                                            title={log.entity_id}
                                        >
                                            {log.entity_id}
                                        </div>
                                    </td>
                                    <td class="p-4 align-top">
                                        {#if log.performed_by}
                                            <span
                                                class="font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded"
                                            >
                                                Superadmin ({log.performed_by.slice(
                                                    0,
                                                    8,
                                                )}...)
                                            </span>
                                        {:else}
                                            <span
                                                class="text-xs text-slate-500 italic"
                                                >Público / Anónimo</span
                                            >
                                        {/if}
                                    </td>
                                    <td class="p-4 align-top">
                                        {#if log.old_data}
                                            <div
                                                class="bg-slate-100 dark:bg-slate-900 p-2 rounded max-h-32 overflow-y-auto max-w-[250px]"
                                            >
                                                <pre
                                                    class="text-[10px] text-slate-700 dark:text-slate-400 font-mono whitespace-pre-wrap">{JSON.stringify(
                                                        log.old_data,
                                                        null,
                                                        2,
                                                    )}</pre>
                                            </div>
                                        {:else}
                                            <span
                                                class="text-xs text-slate-400 italic"
                                                >N/A</span
                                            >
                                        {/if}
                                    </td>
                                    <td class="p-4 align-top">
                                        {#if log.new_data}
                                            <div
                                                class="bg-slate-100 dark:bg-slate-900 p-2 rounded max-h-32 overflow-y-auto max-w-[250px]"
                                            >
                                                <pre
                                                    class="text-[10px] text-slate-700 dark:text-slate-400 font-mono whitespace-pre-wrap">{JSON.stringify(
                                                        log.new_data,
                                                        null,
                                                        2,
                                                    )}</pre>
                                            </div>
                                        {:else}
                                            <span
                                                class="text-xs text-slate-400 italic"
                                                >N/A</span
                                            >
                                        {/if}
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

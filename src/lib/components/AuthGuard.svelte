<script lang="ts">
    import { authState, isAdmin, hasPermission } from "$lib/stores/auth.svelte";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import GlassCard from "$lib/components/ui/GlassCard.svelte";

    let { children, requiredPermission = "" } = $props();
    let checking = $state(true);
    let authorized = $state(false);
    let blocked = $state(false);

    onMount(() => {
        // We wait a brief moment for authState to initialize if it hasn't already
        const checkAuth = setInterval(() => {
            if (authState.initialized) {
                clearInterval(checkAuth);
                if (authState.user) {
                    if (authState.profile?.status === "blocked") {
                        blocked = true;
                        authorized = false;
                    } else if (
                        requiredPermission &&
                        hasPermission(requiredPermission)
                    ) {
                        authorized = true;
                    } else if (!requiredPermission && isAdmin()) {
                        // Fallback constraint for older routes
                        authorized = true;
                    }
                    checking = false;
                } else {
                    goto("/login"); // Redirect unauthenticated users to login
                }
            }
        }, 50);

        return () => clearInterval(checkAuth);
    });
</script>

{#if checking}
    <div class="flex items-center justify-center min-h-[50vh]">
        <div
            class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"
        ></div>
    </div>
{:else if authorized}
    {@render children()}
{:else if blocked}
    <div class="max-w-md mx-auto mt-16 text-center">
        <GlassCard class="p-8 border-red-500/30 dark:border-red-500/20">
            <h2 class="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                Cuenta Suspendida
            </h2>
            <p class="text-slate-600 dark:text-slate-400 mb-6">
                Tu perfil ha sido bloqueado por violaciones a nuestras
                políticas. No puedes acceder al sistema.
            </p>
            <a
                href="/"
                class="inline-block bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-6 py-2 rounded-md hover:opacity-90 transition-opacity font-medium"
                >Volver al Inicio</a
            >
        </GlassCard>
    </div>
{:else}
    <div class="max-w-md mx-auto mt-16 text-center">
        <GlassCard class="p-8">
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                Acceso Denegado
            </h2>
            <p class="text-slate-600 dark:text-slate-400 mb-6">
                No tienes permisos de administrador para ver esta página.
            </p>
            <a
                href="/"
                class="inline-block bg-[var(--color-primary)] text-white px-6 py-2 rounded-md hover:opacity-90 transition-opacity"
                >Volver al Inicio</a
            >
        </GlassCard>
    </div>
{/if}

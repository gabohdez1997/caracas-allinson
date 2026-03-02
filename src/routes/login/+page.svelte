<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import bgImage from "$lib/assets/images/caracas.jpg";
    import { supabase } from "$lib/supabase";
    import { goto } from "$app/navigation";
    import { translateAuthError } from "$lib/utils/errors";

    let email = $state("");
    let password = $state("");
    let loading = $state(false);
    let errorMsg = $state("");

    async function handleLogin(e: Event) {
        e.preventDefault();
        loading = true;
        errorMsg = "";

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            errorMsg = translateAuthError(error.message);
            loading = false;
        } else {
            goto("/");
        }
    }
</script>

<svelte:head>
    <title>Iniciar Sesión | Caracas & Allison</title>
</svelte:head>

<!-- Fullscreen Hero Wrapper with Parallax -->
<div
    class="relative w-full min-h-screen flex items-center justify-center bg-fixed bg-center bg-cover bg-no-repeat overflow-hidden py-24"
    style="background-image: url('{bgImage}')"
>
    <!-- Background Overlays -->
    <div
        class="absolute inset-0 bg-slate-900/60 mix-blend-multiply backdrop-blur-[2px]"
    ></div>
    <div
        class="absolute inset-0 bg-gradient-to-t from-[var(--bg-light)] dark:from-[var(--bg-dark)] via-transparent to-transparent"
    ></div>

    <div class="relative z-10 w-full max-w-md mx-auto p-4 drop-shadow-lg">
        <GlassCard class="p-8 w-full" elevation="high">
            <div class="text-center mb-8">
                <h1
                    class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2"
                >
                    Bienvenido
                </h1>
                <p class="text-slate-600 dark:text-slate-400">
                    Ingresa tus credenciales para continuar
                </p>
            </div>

            {#if errorMsg}
                <div
                    class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                    role="alert"
                >
                    <span class="block sm:inline">{errorMsg}</span>
                </div>
            {/if}

            <form method="POST" onsubmit={handleLogin} class="space-y-6">
                <div>
                    <label
                        for="email"
                        class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                        >Correo Electrónico</label
                    >
                    <div class="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autocomplete="email"
                            required
                            bind:value={email}
                            class="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                <div>
                    <label
                        for="password"
                        class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                        >Contraseña</label
                    >
                    <div class="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autocomplete="current-password"
                            required
                            bind:value={password}
                            class="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-primary)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-opacity disabled:opacity-50"
                    >
                        {loading ? "Iniciando..." : "Iniciar Sesión"}
                    </button>
                </div>
            </form>

            <!-- <div class="mt-6 text-center">
                <p class="text-sm text-slate-600 dark:text-slate-400">
                    ¿No tienes cuenta?
                    <a
                        href="/signup"
                        class="font-medium text-[var(--color-primary)] hover:opacity-80"
                    >
                        Regístrate aquí
                    </a>
                </p>
            </div> -->
        </GlassCard>
    </div>
</div>

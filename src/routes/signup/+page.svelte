<script lang="ts">
    // Make sure we're using the correct alias or relative path if aliased
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import bgImage from "$lib/assets/images/caracas.jpg";
    import { supabase } from "$lib/supabase";
    import { goto } from "$app/navigation";
    import { translateAuthError } from "$lib/utils/errors";

    let email = $state("");
    let password = $state("");
    let firstName = $state("");
    let lastName = $state("");
    let loading = $state(false);
    let errorMsg = $state("");
    let successMsg = $state("");

    async function handleSignup(e: Event) {
        e.preventDefault();
        loading = true;
        errorMsg = "";
        successMsg = "";

        // 1. Sign up user (Auth)
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                },
            },
        });

        if (error) {
            errorMsg = translateAuthError(error.message);
            loading = false;
            return;
        }

        // 2. Insert into profiles (Handled automatically if Postgres trigger exists, but we can do it manually just in case if needed depending on exact migration DB config. In this case, we'll let the user manage it or create a simple fallback)
        if (data.user) {
            const { error: profileError } = await supabase
                .from("profiles")
                .upsert({
                    id: data.user.id,
                    first_name: firstName,
                    last_name: lastName,
                    updated_at: new Date().toISOString(),
                });

            if (profileError) {
                console.error("Profile creation error:", profileError);
                // Non-fatal, authentication still succeeded mostly
            }
        }

        successMsg =
            "¡Registro exitoso! Por favor revisa tu correo para confirmar tu cuenta si es necesario, o inicia sesión.";
        loading = false;

        setTimeout(() => {
            goto("/login");
        }, 3000);
    }
</script>

<svelte:head>
    <title>Registro | Caracas & Allison</title>
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
                    Crear Cuenta
                </h1>
                <p class="text-slate-600 dark:text-slate-400">
                    Únete a Caracas & Allison
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

            {#if successMsg}
                <div
                    class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
                    role="alert"
                >
                    <span class="block sm:inline">{successMsg}</span>
                </div>
            {/if}

            <form onsubmit={handleSignup} class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            for="firstName"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Nombre</label
                        >
                        <div class="mt-1">
                            <input
                                id="firstName"
                                type="text"
                                required
                                bind:value={firstName}
                                class="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label
                            for="lastName"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Apellido</label
                        >
                        <div class="mt-1">
                            <input
                                id="lastName"
                                type="text"
                                required
                                bind:value={lastName}
                                class="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label
                        for="email"
                        class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                        >Correo Electrónico</label
                    >
                    <div class="mt-1">
                        <input
                            id="email"
                            type="email"
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
                            type="password"
                            required
                            bind:value={password}
                            class="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                <div class="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-primary)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-opacity disabled:opacity-50"
                    >
                        {loading ? "Registrando..." : "Registrarse"}
                    </button>
                </div>
            </form>

            <div class="mt-6 text-center">
                <p class="text-sm text-slate-600 dark:text-slate-400">
                    ¿Ya tienes cuenta?
                    <a
                        href="/login"
                        class="font-medium text-[var(--color-primary)] hover:opacity-80"
                    >
                        Inicia sesión
                    </a>
                </p>
            </div>
        </GlassCard>
    </div>
</div>

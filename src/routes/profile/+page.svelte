<script lang="ts">
    import { onMount } from "svelte";
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import { authState } from "$lib/stores/auth.svelte";
    import { goto } from "$app/navigation";

    let loading = $state(true);
    let saving = $state(false);

    let formFirstName = $state("");
    let formLastName = $state("");
    let formPhone = $state("");
    let formEmail = $state("");
    let formNewPassword = $state("");
    let formConfirmPassword = $state("");

    onMount(() => {
        if (!authState.initialized) {
            // wait
            return;
        }
        if (!authState.user) {
            goto("/login");
            return;
        }
        loadProfileStats();
    });

    // Also watch for auth init if we hit page fast
    $effect(() => {
        if (authState.initialized && authState.user && loading) {
            loadProfileStats();
        } else if (authState.initialized && !authState.user) {
            goto("/login");
        }
    });

    async function loadProfileStats() {
        if (!authState.session) return;
        loading = true;
        try {
            const res = await fetch("/api/profile", {
                headers: {
                    Authorization: `Bearer ${authState.session.access_token}`,
                },
            });
            const data = await res.json();
            if (data.success) {
                formEmail = data.user.email;
                formFirstName = data.user.first_name || "";
                formLastName = data.user.last_name || "";
                formPhone = data.user.phone || "";
            } else {
                alert(data.error || "No se pudo cargar el perfil.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function saveProfile() {
        if (!authState.session) return;

        if (formNewPassword) {
            if (formNewPassword.length < 6) {
                return alert(
                    "La nueva contraseña debe tener al menos 6 caracteres.",
                );
            }
            if (formNewPassword !== formConfirmPassword) {
                return alert("Las contraseñas no coinciden.");
            }
        }

        saving = true;
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authState.session.access_token}`,
                },
                body: JSON.stringify({
                    first_name: formFirstName,
                    last_name: formLastName,
                    phone: formPhone,
                    new_password: formNewPassword || undefined,
                }),
            });

            const data = await res.json();
            if (data.success) {
                alert("¡Perfil actualizado con éxito!");
                formNewPassword = "";
                formConfirmPassword = "";

                // Refresh local store profile just in case needed by Navbar
                if (authState.profile) {
                    authState.profile.first_name = formFirstName;
                    authState.profile.last_name = formLastName;
                }
            } else {
                alert(
                    data.error || "Ocurrió un error al actualizar el perfil.",
                );
            }
        } catch (e) {
            console.error(e);
            alert("Error de red al actualizar el perfil.");
        } finally {
            saving = false;
        }
    }
</script>

<div class="w-[95%] max-w-3xl mx-auto space-y-8 pb-8 pt-8">
    <div class="flex justify-between items-end">
        <div>
            <h1
                class="text-3xl font-bold flex items-center gap-3 text-slate-900 dark:text-white"
            >
                Ajustes de Perfil
            </h1>
            <p class="text-slate-600 dark:text-slate-400 mt-2">
                Actualiza tu información personal y credenciales de acceso.
            </p>
        </div>
    </div>

    <GlassCard class="p-6 md:p-8" elevation="high">
        {#if loading}
            <div class="py-12 flex justify-center">
                <div
                    class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color-primary)]"
                ></div>
            </div>
        {:else}
            <form
                onsubmit={(e) => {
                    e.preventDefault();
                    saveProfile();
                }}
                class="space-y-6"
            >
                <!-- Información Personal -->
                <div>
                    <h3
                        class="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2"
                    >
                        Información Personal
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label
                                for="first_name"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                                >Nombre</label
                            >
                            <input
                                id="first_name"
                                type="text"
                                bind:value={formFirstName}
                                class="w-full px-4 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
                                placeholder="Tu nombre"
                            />
                        </div>
                        <div>
                            <label
                                for="last_name"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                                >Apellido</label
                            >
                            <input
                                id="last_name"
                                type="text"
                                bind:value={formLastName}
                                class="w-full px-4 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
                                placeholder="Tu apellido"
                            />
                        </div>
                        <div>
                            <label
                                for="phone"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                                >Teléfono</label
                            >
                            <input
                                id="phone"
                                type="text"
                                bind:value={formPhone}
                                class="w-full px-4 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
                                placeholder="0414-0000000"
                            />
                        </div>
                        <div>
                            <label
                                for="email"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                                >Correo Electrónico</label
                            >
                            <input
                                id="email"
                                type="text"
                                value={formEmail}
                                disabled
                                class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed opacity-70"
                            />
                            <p class="text-[10px] text-slate-500 mt-1">
                                El correo no puede modificarse.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Seguridad -->
                <div class="pt-4">
                    <h3
                        class="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2"
                    >
                        Seguridad
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label
                                for="new_password"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                                >Nueva Contraseña</label
                            >
                            <input
                                id="new_password"
                                type="password"
                                bind:value={formNewPassword}
                                class="w-full px-4 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
                                placeholder="Dejar en blanco para conservar actual"
                            />
                        </div>
                        <div>
                            <label
                                for="confirm_password"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                                >Confirmar Nueva Contraseña</label
                            >
                            <input
                                id="confirm_password"
                                type="password"
                                bind:value={formConfirmPassword}
                                disabled={!formNewPassword}
                                class="w-full px-4 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow disabled:opacity-50"
                                placeholder="Repite la contraseña"
                            />
                        </div>
                    </div>
                </div>

                <div
                    class="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700"
                >
                    <button
                        type="submit"
                        disabled={saving}
                        class="bg-[var(--color-primary)] hover:bg-[#0a3d3d] text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow flex items-center justify-center min-w-[140px] disabled:opacity-50"
                    >
                        {#if saving}
                            <div
                                class="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"
                            ></div>
                        {:else}
                            Guardar Cambios
                        {/if}
                    </button>
                </div>
            </form>
        {/if}
    </GlassCard>
</div>

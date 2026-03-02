<script lang="ts">
    import AuthGuard from "$lib/components/AuthGuard.svelte";
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import { onMount } from "svelte";
    import { authState } from "$lib/stores/auth.svelte";

    let users: any[] = $state([]);
    let loading = $state(true);
    let processingId: string | null = $state(null);

    let editModalOpen = $state(false);
    let editingUser: any = $state(null);

    let createModalOpen = $state(false);
    let newUser: any = $state({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone: "",
        roleName: "user",
        status: "active",
    });

    let rolesAvailable: any[] = $state([]);
    const statusAvailable = ["active", "blocked"];

    onMount(() => {
        loadRoles();
        loadUsers();
    });

    async function loadRoles() {
        try {
            const token = authState.session?.access_token;
            if (!token) return;

            const res = await fetch("/api/admin/roles", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                rolesAvailable = data.roles;
            }
        } catch (e) {
            console.error("Failed to load roles", e);
        }
    }

    async function loadUsers() {
        loading = true;
        try {
            const token = authState.session?.access_token;
            if (!token) return;

            const res = await fetch("/api/admin/users", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const rawText = await res.text();
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                console.error("Failed to parse API response:", rawText);
                throw new Error("Invalid server response format");
            }

            if (data.success) {
                users = data.users;
            } else {
                console.error("Error fetching users:", data.error);
                if (
                    data.error.includes("SUPABASE_SERVICE_ROLE_KEY is missing")
                ) {
                    alert(
                        "Por favor, configure SUPABASE_SERVICE_ROLE_KEY en el archivo .env para que la gestión de usuarios funcione.",
                    );
                } else {
                    alert(data.error);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    function openEditModal(user: any) {
        editingUser = { ...user };
        editModalOpen = true;
    }

    async function handleSaveEdit() {
        if (!editingUser) return;
        processingId = editingUser.id;

        try {
            const token = authState.session?.access_token;
            const res = await fetch("/api/admin/users", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: editingUser.id,
                    status: editingUser.status,
                    roleName: editingUser.role,
                    first_name: editingUser.first_name,
                    last_name: editingUser.last_name,
                    phone: editingUser.phone,
                    password: editingUser.new_password || undefined,
                    confirm_account: editingUser.confirm_account || false,
                }),
            });

            const data = await res.json();
            if (data.success) {
                await loadUsers();
                editModalOpen = false;
            } else {
                alert(data.error || "Error al actualizar usuario");
            }
        } catch (e) {
            console.error(e);
        } finally {
            processingId = null;
        }
    }

    async function handleCreateUser() {
        if (!newUser.email || !newUser.password) {
            alert("El correo y la contraseña son obligatorios");
            return;
        }

        processingId = "create";
        try {
            const token = authState.session?.access_token;
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newUser),
            });

            const data = await res.json();
            if (data.success) {
                await loadUsers();
                createModalOpen = false;
                newUser = {
                    email: "",
                    password: "",
                    first_name: "",
                    last_name: "",
                    phone: "",
                    roleName: "user",
                    status: "active",
                };
                alert("Usuario creado exitosamente");
            } else {
                alert(data.error || "Error al crear usuario");
            }
        } catch (e) {
            console.error(e);
            alert("Ocurrió un error de red al intentar crear el usuario");
        } finally {
            processingId = null;
        }
    }

    async function deleteUser(userId: string) {
        if (
            !confirm(
                "¿ESTAS ABSOLUTAMENTE SEGURO de eliminar este usuario? Toda la historia, tickets, y registro en base de datos será destruido de forma permanente.",
            )
        )
            return;

        processingId = userId;
        try {
            const token = authState.session?.access_token;
            const res = await fetch("/api/admin/users", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId }),
            });

            const data = await res.json();
            if (data.success) {
                await loadUsers();
            } else {
                alert(data.error || "Error al eliminar usuario");
            }
        } catch (e) {
            console.error(e);
        } finally {
            processingId = null;
        }
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("es-VE", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }
</script>

<AuthGuard requiredPermission="usuarios.lectura">
    <div class="w-[95%] max-w-[1600px] mx-auto space-y-8 pb-8 pt-8">
        <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
            <div>
                <h1
                    class="text-3xl font-bold flex items-center gap-3 text-slate-900 dark:text-white"
                >
                    Gestión de Usuarios
                </h1>
            </div>
            <div class="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
                <button
                    onclick={loadUsers}
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
                <button
                    onclick={() => (createModalOpen = true)}
                    class="flex-1 sm:flex-none justify-center bg-[var(--color-primary)] hover:bg-[#0a3d3d] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow flex items-center gap-2 text-sm"
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
                        class="lucide lucide-plus"
                        ><path d="M5 12h14" /><path d="M12 5v14" /></svg
                    >
                    Nuevo Usuario
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
                                >Usuario</th
                            >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                >Detalles</th
                            >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                >Registro</th
                            >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                >Rol</th
                            >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                >Estado</th
                            >
                            <th
                                class="p-4 font-medium text-slate-600 dark:text-slate-300"
                                >Verificado</th
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
                                    Consultando base de datos principal...
                                </td>
                            </tr>
                        {:else if users.length === 0}
                            <tr>
                                <td
                                    colspan="6"
                                    class="text-center py-12 text-slate-500"
                                >
                                    No se encontraron usuarios o la clave
                                    Service Role no ha sido configurada.
                                </td>
                            </tr>
                        {:else}
                            {#each users as user}
                                <tr
                                    class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0 text-sm"
                                >
                                    <td class="p-4 align-top">
                                        <div
                                            class="font-medium text-slate-900 dark:text-white capitalize"
                                        >
                                            {user.first_name || "Sin Nombre"}
                                            {user.last_name || ""}
                                        </div>
                                        <div
                                            class="text-xs text-slate-500 font-mono mt-1"
                                        >
                                            {user.email || "N/A"}
                                        </div>
                                    </td>

                                    <td class="p-4 align-top">
                                        {#if user.phone}
                                            <div
                                                class="text-xs text-slate-600 dark:text-slate-400"
                                            >
                                                Telf: {user.phone}
                                            </div>
                                        {/if}
                                        <div
                                            class="text-[10px] text-slate-400 font-mono"
                                            title={user.id}
                                        >
                                            ID: {user.id.slice(0, 8)}...
                                        </div>
                                    </td>

                                    <td
                                        class="p-4 align-top text-slate-600 dark:text-slate-400"
                                    >
                                        {formatDate(user.created_at)}
                                    </td>

                                    <td class="p-4 align-top">
                                        <span
                                            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold capitalize {user.role ===
                                            'admin'
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}"
                                        >
                                            {user.role}
                                        </span>
                                    </td>

                                    <td class="p-4 align-top">
                                        <span
                                            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold capitalize {user.status ===
                                            'blocked'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}"
                                        >
                                            {user.status === "blocked"
                                                ? "Bloqueado"
                                                : "Activo"}
                                        </span>
                                    </td>

                                    <td class="p-4 align-top">
                                        {#if user.email_confirmed_at}
                                            <span
                                                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                            >
                                                Sí
                                            </span>
                                        {:else}
                                            <span
                                                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                            >
                                                No
                                            </span>
                                        {/if}
                                    </td>

                                    <td class="p-4 align-top text-right">
                                        <div class="flex justify-end gap-2">
                                            <button
                                                onclick={() =>
                                                    openEditModal(user)}
                                                disabled={processingId !== null}
                                                class="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-500 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                title="Editar Roles y Accesos"
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
                                                    class="lucide lucide-pencil"
                                                    ><path
                                                        d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
                                                    /><path
                                                        d="m15 5 4 4"
                                                    /></svg
                                                >
                                            </button>
                                            <button
                                                onclick={() =>
                                                    deleteUser(user.id)}
                                                disabled={processingId !==
                                                    null ||
                                                    user.id ===
                                                        authState.session?.user
                                                            ?.id}
                                                class="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                title={user.id ===
                                                authState.session?.user?.id
                                                    ? "No puedes destruir tu propia cuenta"
                                                    : "Eliminación Definitiva (Hard Delete)"}
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
                                                    class="lucide lucide-trash-2"
                                                    ><path d="M3 6h18" /><path
                                                        d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                                                    /><path
                                                        d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                                                    /><line
                                                        x1="10"
                                                        x2="10"
                                                        y1="11"
                                                        y2="17"
                                                    /><line
                                                        x1="14"
                                                        x2="14"
                                                        y1="11"
                                                        y2="17"
                                                    /></svg
                                                >
                                            </button>
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

    <!-- Edit User Settings Modal -->
    {#if editModalOpen && editingUser}
        <div
            class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
            <GlassCard
                class="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-md"
                elevation="high"
            >
                <h2
                    class="text-xl font-bold mb-4 text-slate-900 dark:text-white"
                >
                    Modificar Accesos del Usuario
                </h2>

                <div
                    class="mb-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-sm border border-slate-200 dark:border-slate-700"
                >
                    <span
                        class="font-medium block text-slate-700 dark:text-slate-300"
                        >ID: {editingUser.id}</span
                    >
                    <span class="text-slate-500 font-mono"
                        >{editingUser.email}</span
                    >
                </div>

                <div class="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                                >Nombre</label
                            >
                            <input
                                type="text"
                                bind:value={editingUser.first_name}
                                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                                >Apellido</label
                            >
                            <input
                                type="text"
                                bind:value={editingUser.last_name}
                                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >Teléfono</label
                        >
                        <input
                            type="text"
                            bind:value={editingUser.phone}
                            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div
                        class="pt-2 border-t border-slate-200 dark:border-slate-700"
                    >
                        <label
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                        >
                            Forzar Cambio de Clave
                        </label>
                        <input
                            type="password"
                            placeholder="Dejar en blanco para no cambiar"
                            bind:value={editingUser.new_password}
                            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        <p class="text-[10px] text-slate-500 mt-1">
                            Escribe una nueva contraseña solo si el usuario te
                            solicitó cambiarla manualmente.
                        </p>
                    </div>

                    {#if !editingUser.email_confirmed_at}
                        <div
                            class="pt-2 border-t border-slate-200 dark:border-slate-700"
                        >
                            <label
                                class="flex items-center space-x-2 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    bind:checked={editingUser.confirm_account}
                                    class="rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-white dark:bg-slate-800"
                                />
                                <span
                                    class="text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Confirmar Cuenta Manualmente
                                </span>
                            </label>
                            <p
                                class="text-[10px] text-amber-600 dark:text-amber-500 mt-1"
                            >
                                El usuario no ha confirmado su correo. Marca
                                esta casilla para validarlo a la fuerza.
                            </p>
                        </div>
                    {/if}

                    <div
                        class="pt-2 border-t border-slate-200 dark:border-slate-700"
                    >
                        <label
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                        >
                            Nivel de Privilegios (Rol)
                        </label>
                        <select
                            bind:value={editingUser.role}
                            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white capitalize"
                        >
                            {#each rolesAvailable as rol}
                                <option value={rol.name}>{rol.name}</option>
                            {/each}
                        </select>
                        <p class="text-[10px] text-slate-500 mt-1">
                            El nivel de acceso depende exclusivamente de los
                            permisos que ese rol contenga en la tabla DRBAC.
                        </p>
                    </div>

                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                        >
                            Estado de la Cuenta
                        </label>
                        <select
                            bind:value={editingUser.status}
                            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white capitalize"
                        >
                            {#each statusAvailable as stat}
                                <option value={stat}
                                    >{stat === "active"
                                        ? "Activo (Permitido)"
                                        : "Bloqueado (Baneado)"}</option
                                >
                            {/each}
                        </select>
                        <p class="text-[10px] text-slate-500 mt-1">
                            Bloquear a un usuario le prohibe navegar dentro de
                            rutas administrativas o comprar, pero su historial
                            de pagos previos se mantiene intacto por seguridad.
                        </p>
                    </div>
                </div>

                <div class="flex justify-end gap-3 mt-8">
                    <button
                        onclick={() => (editModalOpen = false)}
                        disabled={processingId !== null}
                        class="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onclick={handleSaveEdit}
                        disabled={processingId !== null}
                        class="px-4 py-2 bg-[var(--color-primary)] hover:bg-[#0a3d3d] text-white rounded-lg transition-colors shadow font-medium text-sm flex items-center justify-center min-w-[100px] disabled:opacity-50"
                    >
                        {#if processingId === editingUser.id}
                            <div
                                class="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"
                            ></div>
                        {:else}
                            Guardar Cambios
                        {/if}
                    </button>
                </div>
            </GlassCard>
        </div>
    {/if}

    <!-- CREATION MODAL -->
    {#if createModalOpen}
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onclick={() => (createModalOpen = false)}
                role="presentation"
            ></div>

            <GlassCard
                class="relative w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
                elevation="high"
                role="dialog"
            >
                <div class="flex justify-between items-start mb-6">
                    <h2
                        class="text-xl font-bold text-slate-800 dark:text-white"
                    >
                        Crear Nuevo Usuario
                    </h2>
                    <button
                        onclick={() => (createModalOpen = false)}
                        class="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1"
                        aria-label="Cerrar modal"
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
                            ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
                        >
                    </button>
                </div>

                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                                >Nombre</label
                            >
                            <input
                                type="text"
                                bind:value={newUser.first_name}
                                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                                >Apellido</label
                            >
                            <input
                                type="text"
                                bind:value={newUser.last_name}
                                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >Teléfono</label
                        >
                        <input
                            type="text"
                            bind:value={newUser.phone}
                            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div
                        class="pt-4 border-t border-slate-200 dark:border-slate-700"
                    >
                        <label
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >Correo Electrónico *</label
                        >
                        <input
                            type="email"
                            bind:value={newUser.email}
                            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >Contraseña *</label
                        >
                        <input
                            type="password"
                            bind:value={newUser.password}
                            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div
                        class="pt-4 border-t border-slate-200 dark:border-slate-700"
                    >
                        <label
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >Nivel de Privilegios (Rol)</label
                        >
                        <select
                            bind:value={newUser.roleName}
                            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white capitalize"
                        >
                            <option value="user">User (Predeterminado)</option>
                            {#each rolesAvailable as rol}
                                <option value={rol.name}>{rol.name}</option>
                            {/each}
                        </select>
                    </div>
                </div>

                <div class="flex justify-end gap-3 mt-8">
                    <button
                        onclick={() => (createModalOpen = false)}
                        disabled={processingId === "create"}
                        class="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onclick={handleCreateUser}
                        disabled={processingId === "create"}
                        class="px-4 py-2 bg-[var(--color-primary)] hover:bg-[#0a3d3d] text-white rounded-lg transition-colors shadow font-medium text-sm flex items-center justify-center min-w-[100px] disabled:opacity-50"
                    >
                        {#if processingId === "create"}
                            <div
                                class="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"
                            ></div>
                        {:else}
                            Crear Usuario
                        {/if}
                    </button>
                </div>
            </GlassCard>
        </div>
    {/if}
</AuthGuard>

<script lang="ts">
    import AuthGuard from "$lib/components/AuthGuard.svelte";
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import { onMount } from "svelte";
    import { authState } from "$lib/stores/auth.svelte";

    let roles: any[] = $state([]);
    let allPermissions: any[] = $state([]);
    let loading = $state(true);
    let processingId: string | null = $state(null);

    let modalOpen = $state(false);
    let isEditing = $state(false);

    // Form state
    let formRoleId = $state("");
    let formName = $state("");
    let formDescription = $state("");
    let formPermissions = $state<string[]>([]); // array of permission IDs

    onMount(() => {
        loadData();
    });

    async function loadData() {
        loading = true;
        try {
            const token = authState.session?.access_token;
            if (!token) return;

            const res = await fetch("/api/admin/roles", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                roles = data.roles;
                allPermissions = data.permissions;
            } else {
                alert(data.error || "Error al cargar roles");
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    function openNewModal() {
        isEditing = false;
        formRoleId = "";
        formName = "";
        formDescription = "";
        formPermissions = [];
        modalOpen = true;
    }

    function openEditModal(role: any) {
        if (
            role.name === "admin" &&
            !confirm(
                "Estás a punto de modificar el rol principal de Administrador. Si le quitas permisos clave, podrías perder acceso al sistema de por vida. ¿Aún así deseas continuar?",
            )
        ) {
            return;
        }

        isEditing = true;
        formRoleId = role.id;
        formName = role.name;
        formDescription = role.description || "";
        // Extract array of permission IDs from the nested role_permissions array
        formPermissions = role.role_permissions
            ? role.role_permissions.map((rp: any) => rp.permission_id)
            : [];
        modalOpen = true;
    }

    function togglePermission(permId: string) {
        if (formPermissions.includes(permId)) {
            formPermissions = formPermissions.filter((id) => id !== permId);
        } else {
            formPermissions = [...formPermissions, permId];
        }
    }

    async function handleSave() {
        if (!formName) return alert("El nombre del rol es obligatorio.");

        processingId = "save";
        try {
            const token = authState.session?.access_token;
            const res = await fetch("/api/admin/roles", {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    roleId: formRoleId,
                    name: formName.trim().toLowerCase(),
                    description: formDescription.trim(),
                    permissionIds: formPermissions,
                }),
            });

            const data = await res.json();
            if (data.success) {
                await loadData();
                modalOpen = false;
            } else {
                alert(data.error || "Error al guardar el rol");
            }
        } catch (e) {
            console.error(e);
        } finally {
            processingId = null;
        }
    }

    async function deleteRole(roleId: string, roleName: string) {
        if (roleName === "admin" || roleName === "user") {
            return alert("No puedes eliminar los roles vitales del sistema.");
        }

        if (
            !confirm(
                `¿Estás seguro de eliminar el rol "${roleName}"? Cualquier usuario que tenga este rol perderá automáticamente sus permisos.`,
            )
        )
            return;

        processingId = roleId;
        try {
            const token = authState.session?.access_token;
            const res = await fetch("/api/admin/roles", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ roleId }),
            });

            const data = await res.json();
            if (data.success) {
                await loadData();
            } else {
                alert(data.error || "Error al eliminar el rol");
            }
        } catch (e) {
            console.error(e);
        } finally {
            processingId = null;
        }
    }

    // Traducciones amigables y descripciones al español para los permisos
    const permissionMeta: Record<string, { label: string; desc: string }> = {
        "usuarios.lectura": {
            label: "Ver Usuarios",
            desc: "Permite ver la lista y detalles de usuarios.",
        },
        "usuarios.escritura": {
            label: "Gestionar Usuarios",
            desc: "Permite crear, editar o eliminar usuarios.",
        },
        "roles.gestionar": {
            label: "Gestionar Roles (DRBAC)",
            desc: "Control total sobre la creación y asignación de roles.",
        },
        "eventos.lectura": {
            label: "Ver Eventos",
            desc: "Permite visualizar el listado de eventos creados.",
        },
        "eventos.escritura": {
            label: "Crear Eventos",
            desc: "Permite crear, editar o eliminar eventos.",
        },
        "eventos.gestionar": {
            label: "Gestionar Eventos",
            desc: "Control total de administrador sobre eventos.",
        },
        "pagos.lectura": {
            label: "Ver Pagos",
            desc: "Permite ver el historial y reportes de pagos.",
        },
        "pagos.escritura": {
            label: "Aprobar/Rechazar Pagos",
            desc: "Permite procesar pagos pendientes.",
        },
        "rifas.lectura": {
            label: "Ver Rifas",
            desc: "Permite ver la lista y detalles de rifas.",
        },
        "rifas.gestionar": {
            label: "Gestionar Rifas",
            desc: "Permite crear, editar, eliminar o cerrar rifas.",
        },
        "auditoria.lectura": {
            label: "Ver Auditoría",
            desc: "Acceso al historial de cambios (logs) del sistema.",
        },
    };

    // Agrupar permisos por su prefijo (ej: 'usuarios' de 'usuarios.lectura')
    const groupedPermissions = $derived.by(() => {
        const groups: Record<string, any[]> = {};
        allPermissions.forEach((perm) => {
            const prefix = perm.name.split(".")[0] || "otros";
            if (!groups[prefix]) groups[prefix] = [];

            // Auto-generador de etiquetas para permisos no mapeados
            const actionParts = perm.name.split(".");
            const actionStr = actionParts[1] || "";
            let autoLabel = perm.name;
            if (actionStr === "escritura")
                autoLabel = `Escribir/Crear ${prefix}`;
            if (actionStr === "lectura") autoLabel = `Ver ${prefix}`;
            if (actionStr === "gestionar") autoLabel = `Gestionar ${prefix}`;

            // Capitalizar la primera letra
            autoLabel = autoLabel.charAt(0).toUpperCase() + autoLabel.slice(1);

            // Adjuntar metadata traducida o fallback
            const meta = permissionMeta[perm.name] || {
                label: autoLabel,
                desc:
                    perm.description || `Permiso del sistema para ${perm.name}`,
            };
            groups[prefix].push({ ...perm, ...meta });
        });
        return groups;
    });
</script>

<AuthGuard requiredPermission="roles.gestionar">
    <div class="w-[95%] max-w-[1600px] mx-auto space-y-8 pb-8 pt-8">
        <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
            <div>
                <h1
                    class="text-3xl font-bold flex items-center gap-3 text-slate-900 dark:text-white"
                >
                    Gestión de Roles
                </h1>
            </div>
            <div class="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
                <button
                    onclick={loadData}
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
                        class:animate-spin={loading}
                        ><path
                            d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                        /><path d="M3 3v5h5" /></svg
                    >
                    Actualizar
                </button>
                <button
                    onclick={openNewModal}
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
                    Nuevo Rol
                </button>
            </div>
        </div>

        <GlassCard class="p-6" elevation="medium">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#if loading}
                    <div class="col-span-full py-12 text-center text-slate-500">
                        <div
                            class="animate-spin rounded-full h-8 w-8 border-t-2 border-[var(--color-primary)] mx-auto mb-4"
                        ></div>
                        Cargando matriz de permisos...
                    </div>
                {:else if roles.length === 0}
                    <div
                        class="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl"
                    >
                        Aún no se han configurado roles en la base de datos.
                    </div>
                {:else}
                    {#each roles as role}
                        <div
                            class="border border-slate-200 dark:border-slate-700/60 leading-relaxed bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 flex flex-col transition-all hover:border-[var(--color-primary)]/50 group"
                        >
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3
                                        class="text-lg font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2"
                                    >
                                        {#if role.name === "admin" || role.name === "user"}
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
                                                class="text-amber-500"
                                                ><path
                                                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                                                /></svg
                                            >
                                        {/if}
                                        {role.name}
                                    </h3>
                                    <p
                                        class="text-xs text-slate-500 mt-1 h-8 overflow-hidden line-clamp-2"
                                    >
                                        {role.description || "Sin descripción."}
                                    </p>
                                </div>
                                <div class="flex gap-1 transition-opacity">
                                    <button
                                        onclick={() => openEditModal(role)}
                                        disabled={processingId !== null}
                                        class="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-500 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                                        title="Editar Rol"
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
                                            /><path d="m15 5 4 4" /></svg
                                        >
                                    </button>

                                    {#if role.name !== "admin" && role.name !== "user"}
                                        <button
                                            onclick={() =>
                                                deleteRole(role.id, role.name)}
                                            disabled={processingId !== null}
                                            class="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                            title="Eliminar Rol"
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
                                    {/if}
                                </div>
                            </div>

                            <div
                                class="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50"
                            >
                                <span
                                    class="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block"
                                >
                                    Permisos Asignados ({role.role_permissions
                                        ? role.role_permissions.length
                                        : 0} de {allPermissions.length}):
                                </span>
                                <div
                                    class="flex flex-wrap gap-1.5 h-[68px] overflow-y-auto pr-1 custom-scrollbar"
                                >
                                    {#if !role.role_permissions || role.role_permissions.length === 0}
                                        <span
                                            class="text-xs text-slate-400 italic"
                                            >No tiene permisos (Solo lectura
                                            pública)</span
                                        >
                                    {:else}
                                        {#each role.role_permissions as rp}
                                            <span
                                                class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                            >
                                                {rp.permissions?.name}
                                            </span>
                                        {/each}
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        </GlassCard>
    </div>

    <!-- Edit Role Modal -->
    {#if modalOpen}
        <div
            class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
            <GlassCard
                class="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                elevation="high"
            >
                <h2
                    class="text-xl font-bold mb-4 text-slate-900 dark:text-white"
                >
                    {isEditing
                        ? `Modificar Rol: ${formName}`
                        : "Crear Nuevo Rol"}
                </h2>

                <div class="space-y-4 mb-6 relative z-10">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                                >Nombre del Rol (ID)</label
                            >
                            <input
                                type="text"
                                bind:value={formName}
                                disabled={isEditing &&
                                    (formName === "admin" ||
                                        formName === "user")}
                                placeholder="ej. cajero, auditor, soporte..."
                                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white lowercase disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                                >Descripción</label
                            >
                            <input
                                type="text"
                                bind:value={formDescription}
                                placeholder="Breve propósito funcional del rol"
                                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div
                    class="flex-grow overflow-y-auto pr-2 custom-scrollbar border border-slate-200 dark:border-slate-700 rounded-lg relative overflow-hidden"
                >
                    <div
                        class="bg-slate-50 dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20"
                    >
                        <h4
                            class="font-bold text-sm text-slate-800 dark:text-slate-200"
                        >
                            Matriz de Privilegios
                        </h4>
                        <p class="text-[11px] text-slate-500">
                            Selecciona qué secciones y acciones puede ejecutar
                            este rol.
                        </p>
                    </div>

                    <div class="p-4 space-y-6 relative z-10 w-full">
                        {#each Object.entries(groupedPermissions) as [groupName, perms]}
                            <div
                                class="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                            >
                                <div
                                    class="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-700"
                                >
                                    <h5
                                        class="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize"
                                    >
                                        Módulo: {groupName}
                                    </h5>
                                </div>
                                <div
                                    class="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3"
                                >
                                    {#each perms as perm}
                                        <label
                                            class="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                                        >
                                            <div
                                                class="relative flex items-center mt-0.5"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formPermissions.includes(
                                                        perm.id,
                                                    )}
                                                    onchange={() =>
                                                        togglePermission(
                                                            perm.id,
                                                        )}
                                                    class="peer h-4 w-4 shrink-0 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] dark:border-slate-600 dark:bg-slate-700"
                                                />
                                            </div>
                                            <div class="flex-1">
                                                <div
                                                    class="text-sm font-semibold text-slate-900 dark:text-white leading-tight mb-1"
                                                >
                                                    {perm.label}
                                                </div>
                                                <div
                                                    class="text-[11px] text-slate-500 font-mono mb-1.5 opacity-70"
                                                >
                                                    {perm.name}
                                                </div>
                                                <div
                                                    class="text-[12px] text-slate-600 dark:text-slate-400 leading-snug"
                                                >
                                                    {perm.desc}
                                                </div>
                                            </div>
                                        </label>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>

                <div
                    class="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700"
                >
                    <button
                        onclick={() => (modalOpen = false)}
                        disabled={processingId !== null}
                        class="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onclick={handleSave}
                        disabled={processingId !== null}
                        class="px-4 py-2 bg-[var(--color-primary)] hover:bg-[#0a3d3d] text-white rounded-lg transition-colors shadow font-medium text-sm flex items-center justify-center min-w-[100px] disabled:opacity-50"
                    >
                        {#if processingId === "save"}
                            <div
                                class="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"
                            ></div>
                        {:else}
                            Guardar Rol
                        {/if}
                    </button>
                </div>
            </GlassCard>
        </div>
    {/if}
</AuthGuard>

<style>
    /* Custom thin scrollbar for the modal inner scroll */
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #cbd5e1;
        border-radius: 10px;
    }
    :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #475569;
    }
</style>

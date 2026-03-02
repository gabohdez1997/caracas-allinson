<script lang="ts">
    import AuthGuard from "$lib/components/AuthGuard.svelte";
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import { supabase } from "$lib/supabase";
    import { onMount } from "svelte";
    import { authState } from "$lib/stores/auth.svelte";
    import { uploadImageToStorage } from "$lib/utils/storage";

    let raffles: any[] = $state([]);
    let loading = $state(true);
    let uploadingImage = $state(false);

    let isCreateModalOpen = $state(false);
    let newRaffle = $state({
        title: "",
        description: "",
        price_per_ticket: 0,
        total_tickets: 100,
        start_date: new Date().toISOString().slice(0, 16),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 16),
        draw_date: "",
        status: "draft",
    });
    let newRaffleImage: File | null = $state(null);
    let newRaffleImagePreview: string | null = $state(null);

    let isEditModalOpen = $state(false);
    let editRaffle = $state({
        id: "",
        title: "",
        description: "",
        price_per_ticket: 0,
        total_tickets: 100,
        start_date: "",
        end_date: "",
        draw_date: "",
        status: "",
        image_url: "",
    });
    let editRaffleImage: File | null = $state(null);
    let editRaffleImagePreview: string | null = $state(null);

    onMount(async () => {
        await loadRaffles();
    });

    async function loadRaffles() {
        loading = true;
        const { data, error } = await supabase
            .from("raffles")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            raffles = data;
        }
        loading = false;
    }

    async function handleCreateRaffle(e: Event) {
        e.preventDefault();
        if (!authState.user) return;

        uploadingImage = true;
        let finalImageUrl = null;

        if (newRaffleImage) {
            const { url, error } = await uploadImageToStorage(
                "public_assets",
                "raffles",
                newRaffleImage,
            );
            if (error) {
                alert(
                    `Error de upload de imagen nuevo: ${(error as any).message || JSON.stringify(error) || error}`,
                );
                uploadingImage = false;
                return;
            }
            finalImageUrl = url;
        }

        const { data, error } = await supabase
            .from("raffles")
            .insert([
                {
                    ...newRaffle,
                    image_url: finalImageUrl,
                    start_date: new Date(newRaffle.start_date).toISOString(),
                    end_date: new Date(newRaffle.end_date).toISOString(),
                    draw_date: newRaffle.draw_date
                        ? new Date(newRaffle.draw_date).toISOString()
                        : null,
                    created_by: authState.user.id,
                },
            ])
            .select();

        if (!error && data) {
            raffles = [data[0], ...raffles];
            isCreateModalOpen = false;
            // Reset form
            newRaffle.title = "";
            newRaffle.description = "";
            newRaffle.price_per_ticket = 0;
            newRaffle.total_tickets = 100;
            newRaffleImage = null;
            newRaffleImagePreview = null;
        } else {
            console.error("Error creating raffle:", error);
            alert("Error al crear la rifa");
        }
        uploadingImage = false;
    }

    function handleNewImageSelection(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            newRaffleImage = input.files[0];
            newRaffleImagePreview = URL.createObjectURL(input.files[0]);
        }
    }

    function handleEditImageSelection(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            editRaffleImage = input.files[0];
            editRaffleImagePreview = URL.createObjectURL(input.files[0]);
        }
    }

    function openEditModal(raffle: any) {
        const startDate = new Date(raffle.start_date);
        startDate.setMinutes(
            startDate.getMinutes() - startDate.getTimezoneOffset(),
        );

        const endDate = new Date(raffle.end_date);
        endDate.setMinutes(endDate.getMinutes() - endDate.getTimezoneOffset());

        let drawDateStr = "";
        if (raffle.draw_date) {
            const drawDate = new Date(raffle.draw_date);
            drawDate.setMinutes(
                drawDate.getMinutes() - drawDate.getTimezoneOffset(),
            );
            drawDateStr = drawDate.toISOString().slice(0, 16);
        }

        editRaffle = {
            id: raffle.id,
            title: raffle.title,
            description: raffle.description,
            price_per_ticket: raffle.price_per_ticket,
            total_tickets: raffle.total_tickets,
            start_date: startDate.toISOString().slice(0, 16),
            end_date: endDate.toISOString().slice(0, 16),
            draw_date: drawDateStr,
            status: raffle.status,
            image_url: raffle.image_url || "",
        };
        editRaffleImage = null;
        editRaffleImagePreview = raffle.image_url || null;
        isEditModalOpen = true;
    }

    async function handleUpdateRaffle(e: Event) {
        e.preventDefault();

        uploadingImage = true;
        let finalImageUrl = editRaffle.image_url;

        if (editRaffleImage) {
            const { url, error } = await uploadImageToStorage(
                "public_assets",
                "raffles",
                editRaffleImage,
            );
            if (error) {
                alert(
                    `Error de upload de imagen: ${(error as any).message || JSON.stringify(error) || error}`,
                );
                uploadingImage = false;
                return;
            }
            finalImageUrl = url as string;
        }

        const { error } = await supabase
            .from("raffles")
            .update({
                title: editRaffle.title,
                description: editRaffle.description,
                price_per_ticket: editRaffle.price_per_ticket,
                total_tickets: editRaffle.total_tickets,
                start_date: new Date(editRaffle.start_date).toISOString(),
                end_date: new Date(editRaffle.end_date).toISOString(),
                draw_date: editRaffle.draw_date
                    ? new Date(editRaffle.draw_date).toISOString()
                    : null,
                status: editRaffle.status,
                image_url: finalImageUrl as string,
            })
            .eq("id", editRaffle.id);

        if (!error) {
            raffles = raffles.map((r) =>
                r.id === editRaffle.id ? { ...r, ...editRaffle } : r,
            );
            isEditModalOpen = false;
        } else {
            console.error("Error updating raffle:", error);
            alert("Error al actualizar la rifa");
        }
        uploadingImage = false;
    }

    async function deleteRaffle(id: string) {
        if (
            !confirm(
                "¿Estás seguro de que deseas eliminar esta rifa? Esta acción no se puede deshacer.",
            )
        )
            return;

        const { error } = await supabase.from("raffles").delete().eq("id", id);
        if (!error) {
            raffles = raffles.filter((r) => r.id !== id);
        } else {
            console.error("Delete error", error);
        }
    }

    async function updateStatus(id: string, newStatus: string) {
        const { error } = await supabase
            .from("raffles")
            .update({ status: newStatus })
            .eq("id", id);
        if (!error) {
            raffles = raffles.map((r) =>
                r.id === id ? { ...r, status: newStatus } : r,
            );
        }
    }
</script>

<AuthGuard requiredPermission="rifas.lectura">
    <div class="w-[95%] max-w-[1600px] mx-auto space-y-8 pb-8 pt-8">
        <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
            <div>
                <h1
                    class="text-3xl font-bold flex items-center gap-3 text-slate-900 dark:text-white"
                >
                    Gestión de Rifas
                </h1>
            </div>
            <div class="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
                <button
                    onclick={loadRaffles}
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
                    onclick={() => (isCreateModalOpen = true)}
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
                    Nueva Rifa
                </button>
            </div>
        </div>

        <GlassCard class="p-6" elevation="medium">
            {#if loading}
                <div class="flex justify-center p-8">
                    <div
                        class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color-primary)]"
                    ></div>
                </div>
            {:else if raffles.length === 0}
                <div class="text-center py-12 text-slate-500">
                    No hay rifas registradas. Crea una para comenzar.
                </div>
            {:else}
                <div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {#each raffles as raffle}
                        <div
                            class="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                        >
                            <!-- Image Header -->
                            <div
                                class="h-40 w-full bg-slate-100 dark:bg-slate-800 relative"
                            >
                                {#if raffle.image_url}
                                    <img
                                        src={raffle.image_url}
                                        alt="Cover"
                                        class="w-full h-full object-cover"
                                    />
                                {:else}
                                    <div
                                        class="w-full h-full flex flex-col items-center justify-center text-slate-400"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="32"
                                            height="32"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            ><rect
                                                width="18"
                                                height="18"
                                                x="3"
                                                y="3"
                                                rx="2"
                                                ry="2"
                                            /><circle
                                                cx="9"
                                                cy="9"
                                                r="2"
                                            /><path
                                                d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
                                            /></svg
                                        >
                                        <span class="text-xs mt-2"
                                            >Sin imagen</span
                                        >
                                    </div>
                                {/if}
                                <!-- Actions Overlay -->
                                <div class="absolute top-2 right-2 flex gap-1">
                                    <button
                                        onclick={() => openEditModal(raffle)}
                                        class="p-1.5 bg-white/90 dark:bg-slate-800/90 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-md shadow-sm backdrop-blur-sm transition-colors"
                                        title="Editar Rifa"
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
                                            class="lucide lucide-pencil"
                                            ><path
                                                d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
                                            /><path d="m15 5 4 4" /></svg
                                        >
                                    </button>
                                    <button
                                        onclick={() => deleteRaffle(raffle.id)}
                                        class="p-1.5 bg-white/90 dark:bg-slate-800/90 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-md shadow-sm backdrop-blur-sm transition-colors"
                                        title="Eliminar Rifa"
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
                            </div>
                            <!-- Content -->
                            <div class="p-4 flex flex-col flex-1">
                                <h3
                                    class="font-bold text-lg text-slate-900 dark:text-white line-clamp-1 mb-2"
                                >
                                    {raffle.title}
                                </h3>

                                <div class="grid grid-cols-2 gap-2 mb-4">
                                    <div
                                        class="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg text-center border border-slate-100 dark:border-slate-700/50"
                                    >
                                        <div
                                            class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1"
                                        >
                                            Precio
                                        </div>
                                        <div
                                            class="font-bold text-[var(--color-primary)] dark:text-[#2dd4bf]"
                                        >
                                            ${raffle.price_per_ticket}
                                        </div>
                                    </div>
                                    <div
                                        class="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg text-center border border-slate-100 dark:border-slate-700/50"
                                    >
                                        <div
                                            class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1"
                                        >
                                            Tickets
                                        </div>
                                        <div
                                            class="font-bold text-slate-700 dark:text-slate-200"
                                        >
                                            {raffle.total_tickets}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    class="pt-3 border-t border-slate-100 dark:border-slate-700 mt-auto"
                                >
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <span
                                            class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                                            >Estado</span
                                        >
                                        <select
                                            class="bg-transparent font-medium border border-slate-300 dark:border-slate-600 rounded-md text-sm p-1.5 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                            value={raffle.status}
                                            onchange={(e) =>
                                                updateStatus(
                                                    raffle.id,
                                                    (
                                                        e.target as HTMLSelectElement
                                                    ).value,
                                                )}
                                        >
                                            <option
                                                value="draft"
                                                class="text-slate-900"
                                                >Borrador</option
                                            >
                                            <option
                                                value="active"
                                                class="text-slate-900"
                                                >Activa</option
                                            >
                                            <option
                                                value="completed"
                                                class="text-slate-900"
                                                >Completada</option
                                            >
                                            <option
                                                value="cancelled"
                                                class="text-slate-900"
                                                >Cancelada</option
                                            >
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </GlassCard>
    </div>

    <!-- Create Modal -->
    {#if isCreateModalOpen}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto pt-24 pb-12"
        >
            <GlassCard
                class="w-full max-w-lg p-6 relative my-auto"
                elevation="high"
            >
                <button
                    class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    onclick={() => (isCreateModalOpen = false)}
                    aria-label="Cerrar modal"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
                    >
                </button>

                <h3
                    class="text-xl font-bold mb-6 text-slate-900 dark:text-white"
                >
                    Nueva Rifa
                </h3>

                <form onsubmit={handleCreateRaffle} class="space-y-4">
                    <div>
                        <label
                            for="title"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Título de la Rifa</label
                        >
                        <input
                            id="title"
                            type="text"
                            required
                            bind:value={newRaffle.title}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label
                            for="desc"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Descripción</label
                        >
                        <textarea
                            id="desc"
                            rows="3"
                            bind:value={newRaffle.description}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        ></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                for="price"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >Precio por Ticket ($)</label
                            >
                            <input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                bind:value={newRaffle.price_per_ticket}
                                class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label
                                for="total"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >Total de Tickets</label
                            >
                            <input
                                id="total"
                                type="number"
                                min="1"
                                required
                                bind:value={newRaffle.total_tickets}
                                class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                for="start"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >Fecha de Inicio</label
                            >
                            <input
                                id="start"
                                type="datetime-local"
                                required
                                bind:value={newRaffle.start_date}
                                class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label
                                for="end"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >Fecha de Fin</label
                            >
                            <input
                                id="end"
                                type="datetime-local"
                                required
                                bind:value={newRaffle.end_date}
                                class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            for="draw_date"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Fecha del Sorteo (Opcional)</label
                        >
                        <input
                            id="draw_date"
                            type="datetime-local"
                            bind:value={newRaffle.draw_date}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label
                            for="image"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >Imagen de la Rifa (Opcional)</label
                        >
                        <input
                            id="image"
                            type="file"
                            accept="image/*"
                            onchange={handleNewImageSelection}
                            class="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:bg-[#0a3d3d] transition-all"
                        />
                        {#if newRaffleImagePreview}
                            <div
                                class="mt-3 relative w-full h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                            >
                                <img
                                    src={newRaffleImagePreview}
                                    alt="Vista previa"
                                    class="w-full h-full object-cover"
                                />
                            </div>
                        {/if}
                    </div>

                    <div class="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onclick={() => (isCreateModalOpen = false)}
                            class="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={uploadingImage}
                            class="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                        >
                            {#if uploadingImage}
                                <div
                                    class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
                                ></div>
                                Guardando...
                            {:else}
                                Crear Rifa
                            {/if}
                        </button>
                    </div>
                </form>
            </GlassCard>
        </div>
    {/if}

    <!-- Edit Modal -->
    {#if isEditModalOpen}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto pt-24 pb-12"
        >
            <GlassCard
                class="w-full max-w-lg p-6 relative my-auto"
                elevation="high"
            >
                <button
                    class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    onclick={() => (isEditModalOpen = false)}
                    aria-label="Cerrar modal"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
                    >
                </button>

                <h3
                    class="text-xl font-bold mb-6 text-slate-900 dark:text-white"
                >
                    Editar Rifa
                </h3>

                <form onsubmit={handleUpdateRaffle} class="space-y-4">
                    <div>
                        <label
                            for="edit-title"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Título de la Rifa</label
                        >
                        <input
                            id="edit-title"
                            type="text"
                            required
                            bind:value={editRaffle.title}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label
                            for="edit-desc"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Descripción</label
                        >
                        <textarea
                            id="edit-desc"
                            rows="3"
                            bind:value={editRaffle.description}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        ></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                for="edit-price"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >Precio por Ticket ($)</label
                            >
                            <input
                                id="edit-price"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                bind:value={editRaffle.price_per_ticket}
                                class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label
                                for="edit-total"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >Total de Tickets</label
                            >
                            <input
                                id="edit-total"
                                type="number"
                                min="1"
                                required
                                bind:value={editRaffle.total_tickets}
                                class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                for="edit-start"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >Fecha de Inicio</label
                            >
                            <input
                                id="edit-start"
                                type="datetime-local"
                                required
                                bind:value={editRaffle.start_date}
                                class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label
                                for="edit-end"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >Fecha de Fin</label
                            >
                            <input
                                id="edit-end"
                                type="datetime-local"
                                required
                                bind:value={editRaffle.end_date}
                                class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            for="edit-draw_date"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Fecha del Sorteo (Opcional)</label
                        >
                        <input
                            id="edit-draw_date"
                            type="datetime-local"
                            bind:value={editRaffle.draw_date}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label
                            for="edit-status"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Estado</label
                        >
                        <select
                            id="edit-status"
                            bind:value={editRaffle.status}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                            <option value="draft">Borrador</option>
                            <option value="active">Activa</option>
                            <option value="completed">Completada</option>
                            <option value="cancelled">Cancelada</option>
                        </select>
                    </div>

                    <div>
                        <label
                            for="edit-image"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >Imagen de la Rifa (Opcional)</label
                        >
                        <input
                            id="edit-image"
                            type="file"
                            accept="image/*"
                            onchange={handleEditImageSelection}
                            class="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:bg-[#0a3d3d] transition-all"
                        />
                        {#if editRaffleImagePreview}
                            <div
                                class="mt-3 relative w-full h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group"
                            >
                                <img
                                    src={editRaffleImagePreview}
                                    alt="Vista previa"
                                    class="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onclick={() => {
                                        editRaffleImage = null;
                                        editRaffleImagePreview = null;
                                        editRaffle.image_url = "";
                                    }}
                                    class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
                                        ><path d="M18 6 6 18" /><path
                                            d="m6 6 12 12"
                                        /></svg
                                    >
                                </button>
                            </div>
                        {/if}
                    </div>

                    <div class="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onclick={() => (isEditModalOpen = false)}
                            class="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={uploadingImage}
                            class="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                        >
                            {#if uploadingImage}
                                <div
                                    class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
                                ></div>
                                Guardando...
                            {:else}
                                Guardar Cambios
                            {/if}
                        </button>
                    </div>
                </form>
            </GlassCard>
        </div>
    {/if}
</AuthGuard>

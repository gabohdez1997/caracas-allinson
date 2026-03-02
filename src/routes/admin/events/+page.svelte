<script lang="ts">
    import AuthGuard from "$lib/components/AuthGuard.svelte";
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import { supabase } from "$lib/supabase";
    import { onMount } from "svelte";
    import { authState } from "$lib/stores/auth.svelte";
    import { uploadImageToStorage } from "$lib/utils/storage";

    let events: any[] = $state([]);
    let loading = $state(true);
    let uploadingImage = $state(false);

    let isCreateModalOpen = $state(false);
    let newEvent = $state({
        title: "",
        description: "",
        event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 16),
        location: "",
        status: "upcoming",
    });
    let newEventImage: File | null = $state(null);
    let newEventImagePreview: string | null = $state(null);

    let isEditModalOpen = $state(false);
    let editEvent = $state({
        id: "",
        title: "",
        description: "",
        event_date: "",
        location: "",
        status: "",
        image_url: "",
    });
    let editEventImage: File | null = $state(null);
    let editEventImagePreview: string | null = $state(null);

    onMount(async () => {
        await loadEvents();
    });

    async function loadEvents() {
        loading = true;
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            events = data;
        }
        loading = false;
    }

    async function handleCreateEvent(e: Event) {
        e.preventDefault();
        if (!authState.user) return;

        uploadingImage = true;
        let finalImageUrl = null;

        if (newEventImage) {
            const { url, error } = await uploadImageToStorage(
                "public_assets",
                "events",
                newEventImage,
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
            .from("events")
            .insert([
                {
                    ...newEvent,
                    image_url: finalImageUrl,
                    event_date: new Date(newEvent.event_date).toISOString(),
                    created_by: authState.user.id,
                },
            ])
            .select();

        if (!error && data) {
            events = [data[0], ...events];
            isCreateModalOpen = false;
            // Reset form
            newEvent.title = "";
            newEvent.description = "";
            newEvent.location = "";
            newEventImage = null;
            newEventImagePreview = null;
        } else {
            console.error("Error creating event:", error);
            alert("Error al crear el evento");
        }
        uploadingImage = false;
    }

    function handleNewImageSelection(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            newEventImage = input.files[0];
            newEventImagePreview = URL.createObjectURL(input.files[0]);
        }
    }

    function handleEditImageSelection(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            editEventImage = input.files[0];
            editEventImagePreview = URL.createObjectURL(input.files[0]);
        }
    }

    function openEditModal(event: any) {
        const eventDate = new Date(event.event_date);
        eventDate.setMinutes(
            eventDate.getMinutes() - eventDate.getTimezoneOffset(),
        );

        editEvent = {
            id: event.id,
            title: event.title,
            description: event.description,
            event_date: eventDate.toISOString().slice(0, 16),
            location: event.location,
            status: event.status,
            image_url: event.image_url || "",
        };
        editEventImage = null;
        editEventImagePreview = event.image_url || null;
        isEditModalOpen = true;
    }

    async function handleUpdateEvent(e: Event) {
        e.preventDefault();

        uploadingImage = true;
        let finalImageUrl = editEvent.image_url;

        if (editEventImage) {
            const { url, error } = await uploadImageToStorage(
                "public_assets",
                "events",
                editEventImage,
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
            .from("events")
            .update({
                title: editEvent.title,
                description: editEvent.description,
                event_date: new Date(editEvent.event_date).toISOString(),
                location: editEvent.location,
                status: editEvent.status,
                image_url: finalImageUrl as string,
            })
            .eq("id", editEvent.id);

        if (!error) {
            events = events.map((ev) =>
                ev.id === editEvent.id ? { ...ev, ...editEvent } : ev,
            );
            isEditModalOpen = false;
        } else {
            console.error("Error updating event:", error);
            alert("Error al actualizar el evento");
        }
        uploadingImage = false;
    }

    async function deleteEvent(id: string) {
        if (!confirm("¿Estás seguro de que deseas eliminar este evento?"))
            return;

        const { error } = await supabase.from("events").delete().eq("id", id);
        if (!error) {
            events = events.filter((r) => r.id !== id);
        } else {
            console.error("Delete error", error);
        }
    }

    async function updateStatus(id: string, newStatus: string) {
        const { error } = await supabase
            .from("events")
            .update({ status: newStatus })
            .eq("id", id);
        if (!error) {
            events = events.map((r) =>
                r.id === id ? { ...r, status: newStatus } : r,
            );
        }
    }
</script>

<AuthGuard requiredPermission="eventos.lectura">
    <div class="w-[95%] max-w-[1600px] mx-auto space-y-8 pb-8">
        <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
            <div>
                <h1
                    class="text-3xl font-bold flex items-center gap-3 text-slate-900 dark:text-white"
                >
                    Gestión de Eventos
                </h1>
            </div>
            <div class="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
                <button
                    onclick={loadEvents}
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
                    Nuevo Evento
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
            {:else if events.length === 0}
                <div class="text-center py-12 text-slate-500">
                    No hay eventos registrados. Crea uno para comenzar.
                </div>
            {:else}
                <div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {#each events as event}
                        <div
                            class="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                        >
                            <!-- Image Header -->
                            <div
                                class="h-40 w-full bg-slate-100 dark:bg-slate-800 relative"
                            >
                                {#if event.image_url}
                                    <img
                                        src={event.image_url}
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
                                        onclick={() => openEditModal(event)}
                                        class="p-1.5 bg-white/90 dark:bg-slate-800/90 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-md shadow-sm backdrop-blur-sm transition-colors"
                                        title="Editar Evento"
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
                                        onclick={() => deleteEvent(event.id)}
                                        class="p-1.5 bg-white/90 dark:bg-slate-800/90 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-md shadow-sm backdrop-blur-sm transition-colors"
                                        title="Eliminar Evento"
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
                                    {event.title}
                                </h3>
                                <div
                                    class="space-y-2 text-sm text-slate-600 dark:text-slate-300 mb-4 flex-1"
                                >
                                    <div class="flex items-center gap-2">
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
                                            ><path
                                                d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
                                            /><circle
                                                cx="12"
                                                cy="10"
                                                r="3"
                                            /></svg
                                        >
                                        <span class="line-clamp-1"
                                            >{event.location}</span
                                        >
                                    </div>
                                    <div class="flex items-center gap-2">
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
                                            ><rect
                                                width="18"
                                                height="18"
                                                x="3"
                                                y="4"
                                                rx="2"
                                                ry="2"
                                            /><line
                                                x1="16"
                                                x2="16"
                                                y1="2"
                                                y2="6"
                                            /><line
                                                x1="8"
                                                x2="8"
                                                y1="2"
                                                y2="6"
                                            /><line
                                                x1="3"
                                                x2="21"
                                                y1="10"
                                                y2="10"
                                            /></svg
                                        >
                                        <span
                                            >{new Date(
                                                event.event_date,
                                            ).toLocaleString()}</span
                                        >
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
                                            value={event.status}
                                            onchange={(e) =>
                                                updateStatus(
                                                    event.id,
                                                    (
                                                        e.target as HTMLSelectElement
                                                    ).value,
                                                )}
                                        >
                                            <option
                                                value="upcoming"
                                                class="text-slate-900"
                                                >Próximo</option
                                            >
                                            <option
                                                value="ongoing"
                                                class="text-slate-900"
                                                >En curso</option
                                            >
                                            <option
                                                value="completed"
                                                class="text-slate-900"
                                                >Completado</option
                                            >
                                            <option
                                                value="cancelled"
                                                class="text-slate-900"
                                                >Cancelado</option
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
                    Nuevo Evento
                </h3>

                <form onsubmit={handleCreateEvent} class="space-y-4">
                    <div>
                        <label
                            for="title"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Título del Evento</label
                        >
                        <input
                            id="title"
                            type="text"
                            required
                            bind:value={newEvent.title}
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
                            bind:value={newEvent.description}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        ></textarea>
                    </div>

                    <div>
                        <label
                            for="location"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Ubicación</label
                        >
                        <input
                            id="location"
                            type="text"
                            bind:value={newEvent.location}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label
                            for="date"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Fecha del Evento</label
                        >
                        <input
                            id="date"
                            type="datetime-local"
                            required
                            bind:value={newEvent.event_date}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label
                            for="image"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >Imagen del Evento (Opcional)</label
                        >
                        <input
                            id="image"
                            type="file"
                            accept="image/*"
                            onchange={handleNewImageSelection}
                            class="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:bg-[#0a3d3d] transition-all"
                        />
                        {#if newEventImagePreview}
                            <div
                                class="mt-3 relative w-full h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                            >
                                <img
                                    src={newEventImagePreview}
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
                                Crear Evento
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
                    Editar Evento
                </h3>

                <form onsubmit={handleUpdateEvent} class="space-y-4">
                    <div>
                        <label
                            for="edit-title"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Título del Evento</label
                        >
                        <input
                            id="edit-title"
                            type="text"
                            required
                            bind:value={editEvent.title}
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
                            bind:value={editEvent.description}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        ></textarea>
                    </div>

                    <div>
                        <label
                            for="edit-location"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Ubicación</label
                        >
                        <input
                            id="edit-location"
                            type="text"
                            bind:value={editEvent.location}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label
                            for="edit-date"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Fecha del Evento</label
                        >
                        <input
                            id="edit-date"
                            type="datetime-local"
                            required
                            bind:value={editEvent.event_date}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label
                            for="edit-image"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >Imagen del Evento</label
                        >
                        <input
                            id="edit-image"
                            type="file"
                            accept="image/*"
                            onchange={handleEditImageSelection}
                            class="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:bg-[#0a3d3d] transition-all"
                        />
                        {#if editEventImagePreview}
                            <div
                                class="mt-3 relative w-full h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group"
                            >
                                <img
                                    src={editEventImagePreview}
                                    alt="Vista previa"
                                    class="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    class="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    onclick={() => {
                                        editEventImage = null;
                                        editEventImagePreview = null;
                                        editEvent.image_url = "";
                                    }}
                                    title="Eliminar imagen"
                                >
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
                                Actualizar
                            {/if}
                        </button>
                    </div>
                </form>
            </GlassCard>
        </div>
    {/if}
</AuthGuard>

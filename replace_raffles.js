const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('src/routes/admin/raffles/+page.svelte');
let content = fs.readFileSync(targetFile, 'utf8');

const newContent = `                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {#each raffles as raffle}
                        <div class="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                            <!-- Image Header -->
                            <div class="h-40 w-full bg-slate-100 dark:bg-slate-800 relative">
                                {#if raffle.image_url}
                                    <img src={raffle.image_url} alt="Cover" class="w-full h-full object-cover" />
                                {:else}
                                    <div class="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                        <span class="text-xs mt-2">Sin imagen</span>
                                    </div>
                                {/if}
                                <!-- Actions Overlay -->
                                <div class="absolute top-2 right-2 flex gap-1">
                                    <button onclick={() => openEditModal(raffle)} class="p-1.5 bg-white/90 dark:bg-slate-800/90 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-md shadow-sm backdrop-blur-sm transition-colors" title="Editar Rifa">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                    </button>
                                    <button onclick={() => deleteRaffle(raffle.id)} class="p-1.5 bg-white/90 dark:bg-slate-800/90 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-md shadow-sm backdrop-blur-sm transition-colors" title="Eliminar Rifa">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                    </button>
                                </div>
                            </div>
                            <!-- Content -->
                            <div class="p-4 flex flex-col flex-1">
                                <h3 class="font-bold text-lg text-slate-900 dark:text-white line-clamp-1 mb-2">{raffle.title}</h3>
                                
                                <div class="grid grid-cols-2 gap-2 mb-4">
                                    <div class="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg text-center border border-slate-100 dark:border-slate-700/50">
                                        <div class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Precio</div>
                                        <div class="font-bold text-[var(--color-primary)] dark:text-[#2dd4bf]">\${raffle.price_per_ticket}</div>
                                    </div>
                                    <div class="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg text-center border border-slate-100 dark:border-slate-700/50">
                                        <div class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Tickets</div>
                                        <div class="font-bold text-slate-700 dark:text-slate-200">{raffle.total_tickets}</div>
                                    </div>
                                </div>

                                <div class="pt-3 border-t border-slate-100 dark:border-slate-700 mt-auto">
                                    <div class="flex items-center justify-between">
                                        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</span>
                                        <select class="bg-transparent font-medium border border-slate-300 dark:border-slate-600 rounded-md text-sm p-1.5 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" value={raffle.status} onchange={(e) => updateStatus(raffle.id, (e.target).value)}>
                                            <option value="draft" class="text-slate-900">Borrador</option>
                                            <option value="active" class="text-slate-900">Activa</option>
                                            <option value="completed" class="text-slate-900">Completada</option>
                                            <option value="cancelled" class="text-slate-900">Cancelada</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>`;

// Split content by lines
let lines = content.split('\n');

// Find start and end indices for the table wrapper
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<div class="overflow-x-auto">')) {
        startIndex = i;
    }
    if (startIndex !== -1 && lines[i].includes('</GlassCard>')) {
        endIndex = i - 2; // Position right before the closing block
        break;
    }
}

if (startIndex !== -1 && endIndex !== -1) {
    lines.splice(startIndex, endIndex - startIndex + 1, newContent);
    fs.writeFileSync(targetFile, lines.join('\n'));
    console.log("Successfully replaced table with cards grid.");
} else {
    console.log("Error: Could not determine injection boundaries. Start:", startIndex, "End:", endIndex);
}

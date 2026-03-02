<script lang="ts">
    import GlassCard from "../../../components/ui/GlassCard.svelte";

    let amount = $state("");
    let currency = $state("VES");
    let referenceNumber = $state("");
    let bankName = $state("");
    let paymentDate = $state("");

    let isSubmitting = $state(false);
    let successMessage = $state("");

    const submitPayment = (e: Event) => {
        e.preventDefault();
        isSubmitting = true;

        // Mocking an API call
        setTimeout(() => {
            isSubmitting = false;
            successMessage =
                "¡Pago reportado exitosamente! Será verificado a la brevedad.";
            amount = "";
            referenceNumber = "";
            bankName = "";
            paymentDate = "";
        }, 1500);
    };
</script>

<div class="max-w-2xl mx-auto py-12 px-4">
    <div class="text-center mb-8">
        <h1
            class="text-3xl font-bold mb-4 flex items-center justify-center gap-3"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-primary)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-receipt-text"
                ><path
                    d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"
                /><path d="M14 8H8" /><path d="M16 12H8" /><path
                    d="M13 16H8"
                /></svg
            >
            Reportar Pago
        </h1>
        <p class="text-slate-600 dark:text-slate-300">
            Ingresa los detalles de tu transferencia o pago móvil para que
            podamos verificarlo.
        </p>
    </div>

    <GlassCard class="p-8" elevation="high">
        {#if successMessage}
            <div
                class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6"
                role="alert"
            >
                <p class="font-bold">¡Éxito!</p>
                <p>{successMessage}</p>
                <button
                    class="mt-4 text-sm font-semibold underline text-green-800"
                    onclick={() => (successMessage = "")}
                >
                    Reportar otro pago
                </button>
            </div>
        {/if}

        <form onsubmit={submitPayment} class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Amount -->
                <div>
                    <label
                        for="amount"
                        class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
                        >Monto Pagado</label
                    >
                    <div class="relative">
                        <div
                            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                        >
                            <span class="text-slate-500 sm:text-sm">$</span>
                        </div>
                        <input
                            type="number"
                            name="amount"
                            id="amount"
                            bind:value={amount}
                            class="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] sm:text-sm bg-white/50 dark:bg-slate-800/50 dark:border-slate-600 dark:text-white form-input p-2.5 outline-none ring-1 ring-inset ring-gray-300 dark:ring-slate-600"
                            placeholder="0.00"
                            step="0.01"
                            min="0.01"
                            required
                        />
                    </div>
                </div>

                <!-- Currency -->
                <div>
                    <label
                        for="currency"
                        class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
                        >Moneda</label
                    >
                    <select
                        id="currency"
                        name="currency"
                        bind:value={currency}
                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] sm:text-sm bg-white/50 dark:bg-slate-800/50 dark:border-slate-600 dark:text-white form-select p-2.5 outline-none ring-1 ring-inset ring-gray-300 dark:ring-slate-600"
                    >
                        <option value="VES">Bolívares (VES)</option>
                        <option value="USD">Dólares (USD)</option>
                        <option value="EUR">Euros (EUR)</option>
                    </select>
                </div>
            </div>

            <!-- Reference Number -->
            <div>
                <label
                    for="reference"
                    class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
                >
                    Número de Referencia
                    <span class="text-xs text-slate-500 font-normal ml-1"
                        >(Últimos 4 o 6 dígitos)</span
                    >
                </label>
                <input
                    type="text"
                    name="reference"
                    id="reference"
                    bind:value={referenceNumber}
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] sm:text-sm bg-white/50 dark:bg-slate-800/50 dark:border-slate-600 dark:text-white p-2.5 outline-none ring-1 ring-inset ring-gray-300 dark:ring-slate-600"
                    placeholder="Ej. 123456"
                    required
                />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Bank -->
                <div>
                    <label
                        for="bank"
                        class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
                        >Banco de Origen</label
                    >
                    <input
                        type="text"
                        name="bank"
                        id="bank"
                        bind:value={bankName}
                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] sm:text-sm bg-white/50 dark:bg-slate-800/50 dark:border-slate-600 dark:text-white p-2.5 outline-none ring-1 ring-inset ring-gray-300 dark:ring-slate-600"
                        placeholder="Ej. Banesco, Mercantil"
                        required
                    />
                </div>

                <!-- Date -->
                <div>
                    <label
                        for="date"
                        class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
                        >Fecha de Pago</label
                    >
                    <input
                        type="date"
                        name="date"
                        id="date"
                        bind:value={paymentDate}
                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] sm:text-sm bg-white/50 dark:bg-slate-800/50 dark:border-slate-600 dark:text-white p-2.5 outline-none ring-1 ring-inset ring-gray-300 dark:ring-slate-600"
                        required
                    />
                </div>
            </div>

            <div class="pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    class={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] ${isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-[var(--color-secondary)] hover:bg-[#d97c25]"}`}
                >
                    {#if isSubmitting}
                        <svg
                            class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            ></circle>
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Procesando...
                    {:else}
                        Enviar Reporte de Pago
                    {/if}
                </button>
            </div>
        </form>
    </GlassCard>
</div>

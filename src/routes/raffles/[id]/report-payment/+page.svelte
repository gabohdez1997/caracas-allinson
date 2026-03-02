<script lang="ts">
    import { page } from "$app/stores";
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
    import { supabase } from "$lib/supabase";
    import { onMount } from "svelte";
    import { authState } from "$lib/stores/auth.svelte";
    import { goto } from "$app/navigation";

    let raffleId = $derived($page.params.id);
    let raffle = $state<any>(null);
    let loading = $state(true);
    let submitting = $state(false);
    let success = $state(false);
    let banks = $state<any[]>([]);
    let exchangeRates = $state<{ USD: number; EUR: number }>({
        USD: 1,
        EUR: 1,
    });
    let ticketPriceUsd = $state(0);
    let selectedTickets = $state<number[]>([]);
    let soldTickets = $state<number[]>([]);

    let paymentData = $state({
        amount: 0,
        currency: "VES",
        reference_number: "",
        bank_code: "",
        payment_date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD

        // Public Auth Data
        buyer_name: "",
        buyer_phone: "",
        buyer_id: "",

        // Consent
        acceptedTerms: false,
    });

    // Custom Combobox state
    let bankSearchTerm = $state("");
    let isBankDropdownOpen = $state(false);

    let filteredBanks = $derived(
        banks.filter(
            (b) =>
                b.name.toLowerCase().includes(bankSearchTerm.toLowerCase()) ||
                b.code.includes(bankSearchTerm),
        ),
    );

    let selectedBankName = $derived(
        paymentData.bank_code
            ? banks.find((b) => b.code === paymentData.bank_code)?.name
            : "",
    );

    onMount(async () => {
        // Auth removed: Page is fully public

        const { data: raffleData, error: raffleError } = await supabase
            .from("raffles")
            .select("*")
            .eq("id", raffleId)
            .single();

        if (raffleData) {
            raffle = raffleData;
            ticketPriceUsd = raffleData.price_per_ticket;
            // Initially VES (we calculate based on rates below)
        } else {
            console.error(raffleError);
            goto("/raffles"); // Go back if raffle not found
            return;
        }

        // Load banks
        const { data: banksData } = await supabase
            .from("banks")
            .select("*")
            .order("name");
        if (banksData) banks = banksData;

        // Load existing tickets for this raffle
        const { data: ticketsData } = await supabase
            .from("tickets")
            .select("ticket_number")
            .eq("raffle_id", raffleId);

        if (ticketsData) {
            soldTickets = ticketsData.map((t) => t.ticket_number);
        }

        // Load latest exchange rates
        const { data: ratesData } = await supabase
            .from("exchange_rates")
            .select("*")
            .order("effective_date", { ascending: false })
            .limit(2); // Get latest for USD and EUR

        if (ratesData && ratesData.length > 0) {
            ratesData.forEach((r) => {
                if (r.currency === "USD") exchangeRates.USD = r.rate;
                if (r.currency === "EUR") exchangeRates.EUR = r.rate;
            });
        }

        // Initial Calculation (Default is VES)
        calculateAmount();

        loading = false;
    });

    function calculateAmount() {
        // Multiplier based on how many tickets are selected
        const multiplier =
            selectedTickets.length > 0 ? selectedTickets.length : 1;

        if (paymentData.currency === "USD") {
            paymentData.amount = ticketPriceUsd * multiplier;
        } else {
            // VES
            paymentData.amount = Number(
                (ticketPriceUsd * exchangeRates.USD * multiplier).toFixed(2),
            );
        }
    }

    // Effect to recalculate when currency changes or selected tickets change
    $effect(() => {
        const _curr = paymentData.currency;
        const _tickets = selectedTickets.length;
        calculateAmount();
    });

    async function handleReportPayment(e: Event) {
        e.preventDefault();

        if (selectedTickets.length === 0) {
            alert("Debes seleccionar al menos un ticket.");
            return;
        }

        if (
            !paymentData.buyer_name ||
            !paymentData.buyer_phone ||
            !paymentData.buyer_id
        ) {
            alert("Por favor completa tus datos personales para reservar.");
            return;
        }

        if (!paymentData.acceptedTerms) {
            alert("Debes aceptar los términos y condiciones para continuar.");
            return;
        }

        submitting = true;

        // 1. Insert multiple ticket records
        const ticketInserts = selectedTickets.map((num) => ({
            raffle_id: raffle.id,
            ticket_number: num,
            user_id: null,
            status: "reserved",
        }));

        const { data: ticketsCreated, error: ticketsError } = await supabase
            .from("tickets")
            .insert(ticketInserts)
            .select();

        if (ticketsError || !ticketsCreated || ticketsCreated.length === 0) {
            console.error("Ticket insertion error", ticketsError);
            alert(
                "Error al reservar los tickets. Es posible que uno ya haya sido comprado.",
            );
            submitting = false;
            return;
        }

        // 2. Insert Payment record linked to the first ticket created
        const { error: paymentError } = await supabase.from("payments").insert([
            {
                amount: paymentData.amount,
                currency: paymentData.currency,
                exchange_rate: exchangeRates.USD, // Store the rate active at this moment
                reference_number: paymentData.reference_number,
                bank_name: paymentData.bank_code,
                payment_date: paymentData.payment_date,
                status: "pending",
                reported_by: null, // Public payment
                ticket_id: ticketsCreated[0].id,
                buyer_name: paymentData.buyer_name,
                buyer_phone: paymentData.buyer_phone,
                buyer_id: paymentData.buyer_id,
                requested_tickets: selectedTickets,
            },
        ]);

        if (!paymentError) {
            success = true;
        } else {
            console.error("Payment report error", paymentError);
            alert("Error al enviar el reporte. Inténtalo de nuevo.");
        }

        submitting = false;
    }

    function pickRandomTicket() {
        const availableTickets = Array.from(
            { length: raffle.total_tickets },
            (_, i) => i + 1,
        ).filter((num) => !soldTickets.includes(num));

        if (availableTickets.length === 0) {
            alert("¡Todos los tickets han sido vendidos!");
            return;
        }

        const randomIndex = Math.floor(Math.random() * availableTickets.length);
        const randTicket = availableTickets[randomIndex];

        if (!selectedTickets.includes(randTicket)) {
            selectedTickets = [...selectedTickets, randTicket].sort(
                (a, b) => a - b,
            );
        }
    }

    function toggleTicket(num: number) {
        if (soldTickets.includes(num)) return; // Already sold/reserved

        if (selectedTickets.includes(num)) {
            selectedTickets = selectedTickets.filter((t) => t !== num);
        } else {
            selectedTickets = [...selectedTickets, num].sort((a, b) => a - b);
        }
    }
</script>

<div class="max-w-3xl mx-auto py-12 px-4">
    {#if loading}
        <div class="flex justify-center p-12">
            <div
                class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"
            ></div>
        </div>
    {:else if success}
        <GlassCard class="p-8 text-center" elevation="high">
            <div
                class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6"
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
                    class="text-green-600"
                    ><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path
                        d="m9 11 3 3L22 4"
                    /></svg
                >
            </div>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                ¡Reporte Enviado!
            </h2>
            <p class="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                Tu pago para la rifa <strong>{raffle?.title}</strong> ha sido enviado
                a verificación.
            </p>
            <a
                href="/raffles"
                class="inline-block bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
                Volver a Rifas
            </a>
        </GlassCard>
    {:else if raffle}
        <GlassCard class="p-8" elevation="high">
            <div
                class="mb-8 border-b border-slate-200 dark:border-slate-700 pb-6"
            >
                <h1
                    class="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-2"
                >
                    Reportar Pago
                </h1>
                <p class="text-slate-600 dark:text-slate-400">
                    Rifa: <span
                        class="font-semibold text-slate-800 dark:text-slate-200"
                        >{raffle.title}</span
                    >
                </p>
            </div>

            <form onsubmit={handleReportPayment} class="space-y-6">
                <!-- 1. Tickets seleccionados y Botón Suerte -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div class="md:col-span-2">
                        <div
                            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2"
                        >
                            <label
                                for="tickets-chosen"
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                >Selecciona tus Tickets
                            </label>
                            <button
                                type="button"
                                onclick={pickRandomTicket}
                                class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 rounded-md font-medium text-sm transition-colors"
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
                                    class="lucide lucide-dices"
                                    ><rect
                                        width="12"
                                        height="12"
                                        x="2"
                                        y="10"
                                        rx="2"
                                        ry="2"
                                    /><path
                                        d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"
                                    /><path d="M6 18h.01" /><path
                                        d="M10 14h.01"
                                    /><path d="M15 6h.01" /><path
                                        d="M18 9h.01"
                                    /></svg
                                >
                                ¡Prueba tu Suerte!
                            </button>
                        </div>

                        <div
                            class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 max-h-64 overflow-y-auto"
                        >
                            <div
                                class="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2"
                            >
                                {#each Array(raffle.total_tickets)
                                    .fill(0)
                                    .map((_, i) => i + 1) as num}
                                    <button
                                        type="button"
                                        onclick={() => toggleTicket(num)}
                                        disabled={soldTickets.includes(num)}
                                        class="aspect-square flex items-center justify-center rounded-md text-sm font-medium transition-colors
                                        {soldTickets.includes(num)
                                            ? 'bg-red-100 text-red-500 cursor-not-allowed opacity-50 dark:bg-red-900/30'
                                            : selectedTickets.includes(num)
                                              ? 'bg-[var(--color-primary)] text-white shadow-md'
                                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}"
                                    >
                                        {num}
                                    </button>
                                {/each}
                            </div>
                        </div>

                        <div class="mt-3">
                            <label
                                class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                                for="tickets-chosen"
                            >
                                Tickets Elegidos (Solo lectura)
                            </label>
                            <input
                                id="tickets-chosen"
                                type="text"
                                readonly
                                value={selectedTickets.length > 0
                                    ? selectedTickets.join(", ")
                                    : "Ninguno"}
                                class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-500 font-mono"
                            />
                        </div>
                    </div>
                </div>

                <!-- 2. Datos del Comprador -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <div>
                        <label
                            for="buyer-name"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Nombre y Apellido</label
                        >
                        <input
                            id="buyer-name"
                            type="text"
                            required
                            placeholder="Ej. Juan Pérez"
                            bind:value={paymentData.buyer_name}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label
                            for="buyer-id"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Cédula de Identidad</label
                        >
                        <input
                            id="buyer-id"
                            type="text"
                            required
                            placeholder="V-12345678"
                            bind:value={paymentData.buyer_id}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label
                            for="buyer-phone"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Teléfono / WhatsApp</label
                        >
                        <input
                            id="buyer-phone"
                            type="tel"
                            required
                            placeholder="0412 123 4567"
                            bind:value={paymentData.buyer_phone}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                <!-- 3. Monto, Fecha, Banco y Referencia (50% Desktop, 100% Mobile) -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div>
                        <label
                            for="amount"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Monto a Transferir</label
                        >
                        <div class="mt-1 relative rounded-md shadow-sm">
                            <input
                                id="amount"
                                type="number"
                                step="0.01"
                                readonly
                                bind:value={paymentData.amount}
                                class="block w-full pl-3 pr-24 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold"
                            />
                            <div
                                class="absolute inset-y-0 right-0 flex items-center"
                            >
                                <label for="currency" class="sr-only"
                                    >Moneda</label
                                >
                                <select
                                    id="currency"
                                    bind:value={paymentData.currency}
                                    onchange={calculateAmount}
                                    class="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-slate-600 dark:text-slate-300 font-bold sm:text-sm rounded-md"
                                >
                                    <option>VES</option>
                                    <option>USD</option>
                                </select>
                            </div>
                        </div>
                        <p class="text-xs text-slate-500 mt-2">
                            El monto se actualiza según la cantidad de tickets.
                        </p>
                    </div>

                    <div>
                        <label
                            for="date"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Fecha de la Transferencia</label
                        >
                        <input
                            id="date"
                            type="date"
                            required
                            bind:value={paymentData.payment_date}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div class="relative">
                        <label
                            for="bank-search"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Banco Emisor</label
                        >
                        {#if paymentData.bank_code}
                            <div
                                class="mt-1 flex items-center justify-between px-3 py-2 border border-[var(--color-primary)] rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
                            >
                                <span class="truncate">{selectedBankName}</span>
                                <button
                                    type="button"
                                    onclick={() => {
                                        paymentData.bank_code = "";
                                        bankSearchTerm = "";
                                    }}
                                    class="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                    aria-label="Quitar banco seleccionado"
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
                                        class="lucide lucide-x"
                                        ><path d="M18 6 6 18" /><path
                                            d="m6 6 12 12"
                                        /></svg
                                    >
                                </button>
                            </div>
                        {:else}
                            <input
                                id="bank-search"
                                type="text"
                                autocomplete="off"
                                placeholder="Buscar banco emisor..."
                                bind:value={bankSearchTerm}
                                onfocus={() => (isBankDropdownOpen = true)}
                                onblur={() =>
                                    setTimeout(
                                        () => (isBankDropdownOpen = false),
                                        200,
                                    )}
                                class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                            {#if isBankDropdownOpen && filteredBanks.length > 0}
                                <ul
                                    class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                                >
                                    {#each filteredBanks as bank}
                                        <li
                                            class="relative cursor-pointer select-none py-2 pl-3 pr-9 text-slate-900 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                            role="option"
                                            aria-selected={paymentData.bank_code ===
                                                bank.code}
                                            onmousedown={() => {
                                                paymentData.bank_code =
                                                    bank.code;
                                                bankSearchTerm = "";
                                                isBankDropdownOpen = false;
                                            }}
                                        >
                                            <div class="flex items-center">
                                                <span
                                                    class="font-mono text-xs text-slate-500 mr-2"
                                                    >{bank.code}</span
                                                >
                                                <span
                                                    class="block truncate font-normal"
                                                    >{bank.name}</span
                                                >
                                            </div>
                                        </li>
                                    {/each}
                                </ul>
                            {/if}
                        {/if}
                    </div>

                    <div>
                        <label
                            for="ref"
                            class="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Número de Referencia</label
                        >
                        <input
                            id="ref"
                            type="text"
                            required
                            placeholder="Ej. 123456"
                            bind:value={paymentData.reference_number}
                            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                <div
                    class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md border border-blue-100 dark:border-blue-800"
                >
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg
                                class="h-5 w-5 text-blue-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3
                                class="text-sm font-medium text-blue-800 dark:text-blue-300"
                            >
                                Importante sobre las reservas
                            </h3>
                            <div
                                class="mt-2 text-sm text-blue-700 dark:text-blue-400"
                            >
                                <p>
                                    El reporte de este pago <strong
                                        >no garantiza de forma inmediata</strong
                                    > la compra del ticket. Tus tickets permanecerán
                                    en estado "Reservado" hasta que un administrador
                                    valide el pago en nuestras cuentas.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex items-start">
                    <div class="flex items-center h-5">
                        <input
                            id="terms"
                            type="checkbox"
                            required
                            bind:checked={paymentData.acceptedTerms}
                            class="w-4 h-4 text-[var(--color-primary)] bg-slate-100 border-slate-300 rounded focus:ring-[var(--color-primary)] dark:focus:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                        />
                    </div>
                    <label
                        for="terms"
                        class="ml-2 text-sm font-medium text-slate-900 dark:text-slate-300"
                    >
                        He leído y acepto las condiciones de compra.
                    </label>
                </div>

                <div
                    class="pt-6 flex justify-between items-center border-t border-slate-200 dark:border-slate-700"
                >
                    <a
                        href="/raffles"
                        class="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                        Cancelar
                    </a>
                    <button
                        type="submit"
                        disabled={submitting}
                        class="px-6 py-2.5 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                    >
                        {#if submitting}
                            <div
                                class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"
                            ></div>
                            Enviando...
                        {:else}
                            Reportar Pago
                        {/if}
                    </button>
                </div>
            </form>
        </GlassCard>
    {/if}
</div>

<script lang="ts">
    import GlassCard from "$lib/components/ui/GlassCard.svelte";
</script>

<div class="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
    <GlassCard class="p-8 md:p-12 space-y-8" elevation="medium">
        <header
            class="border-b border-slate-200 dark:border-slate-800 pb-6 text-center"
        >
            <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
                Política de Privacidad
            </h1>
            <p class="text-sm text-slate-500 mt-2">
                Última actualización: Marzo 2026
            </p>
        </header>

        <section class="space-y-4">
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-200">
                1. Información que Recopilamos
            </h2>
            <p
                class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed"
            >
                Recopilamos información personal básica como su nombre, correo
                electrónico y datos de contacto necesarios para procesar su
                participación en rifas y eventos en Caracas & Allinson.
            </p>
        </section>

        <section class="space-y-4">
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-200">
                2. Uso de la Información
            </h2>
            <p
                class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed"
            >
                Su información se utiliza exclusivamente para la gestión de su
                cuenta, la validación de pagos y la comunicación de resultados
                de los sorteos o detalles de los eventos.
            </p>
        </section>

        <section class="space-y-4">
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-200">
                3. Seguridad de los Datos
            </h2>
            <p
                class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed"
            >
                Implementamos medidas de seguridad técnicas y organizativas para
                proteger sus datos personales contra el acceso no autorizado o
                la pérdida.
            </p>
        </section>

        <div
            class="pt-8 border-t border-slate-100 dark:border-slate-800 text-center"
        >
            <a
                href="/"
                class="text-[var(--color-primary)] font-semibold hover:underline"
                >Volver al Inicio</a
            >
        </div>
    </GlassCard>
</div>

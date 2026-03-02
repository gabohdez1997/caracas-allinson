<script lang="ts">
    import GlassCard from "./GlassCard.svelte";
    const currentYear = new Date().getFullYear();
</script>

<footer class="w-full mt-auto">
    <div
        class="w-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-t border-white/20 dark:border-slate-800/50 p-8 md:p-12"
    >
        <div class="max-w-7xl mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
                <!-- Brand Section -->
                <div class="md:col-span-1 space-y-4">
                    <div class="flex items-center gap-3">
                        <img
                            src="/img/logo-sin-fondo.png"
                            alt="Logo"
                            class="h-10 w-auto object-contain"
                        />
                        <span
                            class="text-xl font-bold text-[var(--color-primary)] dark:text-white"
                        >
                            Caracas & Allinson
                        </span>
                    </div>
                    <p
                        class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed"
                    >
                        Elevando la experiencia de eventos y rifas con
                        transparencia y elegancia. Tu confianza es nuestra
                        prioridad.
                    </p>
                    <div class="flex items-center gap-4 pt-2">
                        <!-- Facebook -->
                        <a
                            href="javascript:void(0)"
                            aria-label="Facebook"
                            class="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-sm"
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
                                ><path
                                    d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
                                /></svg
                            >
                        </a>
                        <!-- Instagram -->
                        <a
                            href="javascript:void(0)"
                            aria-label="Instagram"
                            class="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-sm"
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
                                ><rect
                                    width="20"
                                    height="20"
                                    x="2"
                                    y="2"
                                    rx="5"
                                    ry="5"
                                /><path
                                    d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
                                /><line
                                    x1="17.5"
                                    x2="17.51"
                                    y1="6.5"
                                    y2="6.5"
                                /></svg
                            >
                        </a>
                        <!-- TikTok -->
                        <a
                            href="javascript:void(0)"
                            aria-label="TikTok"
                            class="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-sm"
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
                                ><path
                                    d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"
                                /></svg
                            >
                        </a>
                    </div>
                </div>

                <!-- Quick Links -->
                <div>
                    <h4
                        class="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-6"
                    >
                        Navegación
                    </h4>
                    <ul class="space-y-4">
                        <li>
                            <a
                                href="/"
                                class="text-sm text-slate-600 dark:text-slate-400 hover:text-[var(--color-primary)] transition-colors"
                                >Inicio</a
                            >
                        </li>
                        <li>
                            <a
                                href="/events"
                                class="text-sm text-slate-600 dark:text-slate-400 hover:text-[var(--color-primary)] transition-colors"
                                >Eventos</a
                            >
                        </li>
                        <li>
                            <a
                                href="/raffles"
                                class="text-sm text-slate-600 dark:text-slate-400 hover:text-[var(--color-primary)] transition-colors"
                                >Rifas</a
                            >
                        </li>
                    </ul>
                </div>

                <!-- Legal -->
                <div>
                    <h4
                        class="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-6"
                    >
                        Legal
                    </h4>
                    <ul class="space-y-4">
                        <li>
                            <a
                                href="/terms"
                                class="text-sm text-slate-600 dark:text-slate-400 hover:text-[var(--color-primary)] transition-colors"
                                >Términos y Condiciones</a
                            >
                        </li>
                        <li>
                            <a
                                href="/privacy"
                                class="text-sm text-slate-600 dark:text-slate-400 hover:text-[var(--color-primary)] transition-colors"
                                >Política de Privacidad</a
                            >
                        </li>
                    </ul>
                </div>

                <!-- Support/Contact placeholder -->
                <div>
                    <h4
                        class="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-6"
                    >
                        Contacto
                    </h4>
                    <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        ¿Tienes dudas? Estamos aquí para ayudarte.
                    </p>
                    <a
                        href="mailto:soporte@caracasyallinson.com"
                        class="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        soporte@caracasyallinson.com
                    </a>
                </div>
            </div>

            <div
                class="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4"
            >
                <p class="text-xs text-slate-500 dark:text-slate-500">
                    &copy; {currentYear} Caracas & Allinson. Todos los derechos reservados.
                </p>
                <div class="flex items-center gap-2 text-xs text-slate-400">
                    <span>Hecho con</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="text-red-500"
                        ><path
                            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                        /></svg
                    >
                    <span>para ti</span>
                </div>
            </div>
        </div>
    </div>
</footer>

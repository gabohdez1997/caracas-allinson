<script lang="ts">
	import "../app.css";
	import GlassCard from "$lib/components/ui/GlassCard.svelte";
	import { page } from "$app/stores";
	import { onMount } from "svelte";
	import type { Snippet } from "svelte";

	import { authState, logout, hasPermission } from "$lib/stores/auth.svelte";
	import { goto } from "$app/navigation";
	import Footer from "$lib/components/ui/Footer.svelte";

	let { children } = $props<{ children: Snippet }>();

	const navItems = [
		{ name: "Inicio", href: "/", public: true },
		{ name: "Eventos", href: "/events", public: true, hideWhenAuth: true },
		{ name: "Rifas", href: "/raffles", public: true, hideWhenAuth: true },
		{
			name: "Gestión Eventos",
			href: "/admin/events",
			reqPerm: "eventos.lectura",
		},
		{
			name: "Gestión Rifas",
			href: "/admin/raffles",
			reqPerm: "rifas.lectura",
		},
		{
			name: "Gestión Pagos",
			href: "/admin/payments",
			reqPerm: "pagos.lectura",
		},
		{
			name: "Gestión Usuarios",
			href: "/admin/users",
			reqPerm: "usuarios.lectura",
		},
		{
			name: "Gestión Roles",
			href: "/admin/roles",
			reqPerm: "roles.gestionar",
		},
		{
			name: "Auditoría",
			href: "/admin/audit",
			reqPerm: "auditoria.lectura",
		},
	];

	let visibleNavItems = $derived(
		navItems.filter((item) => {
			if (item.public) {
				if (item.hideWhenAuth && authState.user) return false;
				return true;
			}
			if (item.reqPerm && authState.user && hasPermission(item.reqPerm))
				return true;
			return false;
		}),
	);

	let isMobileMenuOpen = $state(false);
	let isDarkMode = $state(false);

	// Check if we are on a transparent route (home, login, signup)
	let isTransparentRoute = $derived(
		($page.url.pathname === "/" && !authState.user) ||
			$page.url.pathname === "/login" ||
			$page.url.pathname === "/signup",
	);

	onMount(() => {
		// Check local storage or system preference on load
		if (
			localStorage.theme === "dark" ||
			(!("theme" in localStorage) &&
				window.matchMedia("(prefers-color-scheme: dark)").matches)
		) {
			isDarkMode = true;
			document.documentElement.classList.add("dark");
		} else {
			isDarkMode = false;
			document.documentElement.classList.remove("dark");
		}
	});

	const toggleDarkMode = () => {
		isDarkMode = !isDarkMode;
		if (isDarkMode) {
			document.documentElement.classList.add("dark");
			localStorage.theme = "dark";
		} else {
			document.documentElement.classList.remove("dark");
			localStorage.theme = "light";
		}
	};
</script>

<div
	class="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans relative overflow-x-hidden transition-colors duration-300"
>
	<!-- Main content wrapping -->
	<div class="flex flex-col min-h-screen z-10 relative">
		<!-- Top Navigation -->
		<header
			class="{isTransparentRoute
				? 'absolute top-0 pt-4'
				: 'sticky top-0 pt-4'} z-50 w-full px-4 sm:px-6 lg:px-8"
		>
			<GlassCard
				class="w-full relative flex items-center justify-between px-6 py-4 transition-all duration-300 {isTransparentRoute
					? 'bg-white/10 dark:bg-slate-900/40 backdrop-blur-md border-white/20'
					: ''}"
				elevation={isTransparentRoute ? "none" : "high"}
			>
				<div class="flex items-center gap-4">
					<img
						src="/img/logo-sin-fondo.png"
						alt="Caracas y Allinson Logo"
						class="h-12 w-auto object-contain drop-shadow"
					/>
					<span
						class="text-xl font-bold tracking-tight transition-colors text-[var(--color-primary)] dark:text-white drop-shadow-sm"
						>Caracas & Allinson</span
					>
				</div>

				<!-- Desktop Nav (Absolutely Centered) -->
				<nav
					class="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6"
				>
					{#each visibleNavItems as item}
						<a
							href={item.href}
							class={`text-sm font-medium transition-colors hover:text-[var(--color-secondary)] ${$page.url.pathname === item.href ? "text-[var(--color-secondary)] border-b-2 border-[var(--color-secondary)] pb-1" : "text-slate-600 dark:text-slate-300"}`}
						>
							{item.name}
						</a>
					{/each}
				</nav>

				<div class="flex items-center gap-2 sm:gap-4">
					<!-- Dark Mode Toggle -->
					<button
						onclick={toggleDarkMode}
						class="p-2 rounded-full transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
						aria-label="Toggle Dark Mode"
					>
						{#if isDarkMode}
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
								class="lucide lucide-sun"
								><circle cx="12" cy="12" r="4" /><path
									d="M12 2v2"
								/><path d="M12 20v2" /><path
									d="m4.93 4.93 1.41 1.41"
								/><path d="m17.66 17.66 1.41 1.41" /><path
									d="M2 12h2"
								/><path d="M20 12h2" /><path
									d="m6.34 17.66-1.41 1.41"
								/><path d="m19.07 4.93-1.41 1.41" /></svg
							>
						{:else}
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
								class="lucide lucide-moon"
								><path
									d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
								/></svg
							>
						{/if}
					</button>

					<!-- User Actions (Logout for Admins Only) -->
					{#if authState.initialized}
						{#if authState.user}
							<div class="hidden md:flex items-center gap-4">
								<a
									href="/profile"
									class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[var(--color-primary)] transition-colors"
									title="Ver mi perfil"
								>
									Hola, {authState.profile?.first_name ||
										authState.user.email}
								</a>
								<button
									type="button"
									onclick={async () => {
										await logout();
										window.location.href = "/";
									}}
									class="flex items-center justify-center p-2 rounded-full transition hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
									title="Cerrar sesión"
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
										class="lucide lucide-log-out"
										><path
											d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
										/><polyline
											points="16 17 21 12 16 7"
										/><line
											x1="21"
											x2="9"
											y1="12"
											y2="12"
										/></svg
									>
								</button>
							</div>
						{/if}
					{/if}
					<!-- Mobile Menu Toggle -->
					<button
						class="md:hidden text-slate-600 dark:text-slate-300"
						onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
						aria-label="Toggle Mobile Menu"
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
							class="lucide lucide-menu"
							><line x1="4" x2="20" y1="12" y2="12" /><line
								x1="4"
								x2="20"
								y1="6"
								y2="6"
							/><line x1="4" x2="20" y1="18" y2="18" /></svg
						>
					</button>
				</div>
			</GlassCard>
		</header>

		<!-- Mobile Navigation Dropdown -->
		{#if isMobileMenuOpen}
			<div
				class="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
				onclick={() => (isMobileMenuOpen = false)}
				onkeydown={(e) => {
					if (e.key === "Escape" || e.key === "Enter")
						isMobileMenuOpen = false;
				}}
				role="button"
				tabindex="0"
				aria-label="Close Mobile Menu"
			></div>
			<GlassCard
				class="md:hidden fixed top-24 left-4 right-4 z-50 p-4 flex flex-col gap-2 max-h-[80vh] overflow-y-auto"
				elevation="high"
			>
				{#each visibleNavItems as item}
					<a
						href={item.href}
						class={`text-base font-medium p-2 rounded-lg transition-colors hover:bg-[var(--color-primary)] hover:text-white ${$page.url.pathname === item.href ? "bg-[var(--color-primary)] text-white" : "text-slate-800 dark:text-slate-200"}`}
						onclick={() => (isMobileMenuOpen = false)}
					>
						{item.name}
					</a>
				{/each}

				{#if authState.initialized && authState.user}
					<div class="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
					<div class="flex flex-col gap-2 md:hidden">
						<!-- Enlaces Móviles Adicionales para Usuario -->
						<a
							href="/profile"
							class="text-left font-medium p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-[var(--color-primary)] hover:text-white transition-colors"
							onclick={() => (isMobileMenuOpen = false)}
						>
							Mi Perfil
						</a>

						<button
							class="text-left font-medium p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
							onclick={async () => {
								isMobileMenuOpen = false;
								await logout();
								window.location.href = "/";
							}}
						>
							Cerrar Sesión
						</button>
					</div>
				{/if}
			</GlassCard>
		{/if}

		<!-- Main Page Content -->
		<main
			class="flex-grow flex flex-col w-full {isTransparentRoute
				? ''
				: 'pt-6'}"
		>
			{@render children()}
		</main>

		<!-- Global Footer -->
		<Footer />
	</div>
</div>

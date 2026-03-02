import { initializeAuth } from '$lib/stores/auth.svelte';

export const ssr = false;

export async function load() {
    // Initialize authentication state on load
    await initializeAuth();
}

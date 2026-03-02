<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        children,
        class: className = "",
        elevation = "low",
        ...rest
    } = $props<{
        children: Snippet;
        class?: string;
        elevation?: "none" | "low" | "medium" | "high";
        [key: string]: any;
    }>();

    const elevationClasses = {
        none: "",
        low: "shadow-sm",
        medium: "shadow-md hover:shadow-lg transition-shadow duration-300",
        high: "shadow-lg hover:shadow-xl transition-shadow duration-300",
    };

    let computedClass = $derived(
        `bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 dark:border-slate-700/50 rounded-2xl ${elevationClasses[elevation as keyof typeof elevationClasses]} ${className}`,
    );
</script>

<div class={computedClass} {...rest}>
    {@render children()}
</div>

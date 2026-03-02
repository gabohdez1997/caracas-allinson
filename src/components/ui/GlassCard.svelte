<script lang="ts">
    interface Props {
        children?: import("svelte").Snippet;
        class?: string;
        elevation?: "low" | "medium" | "high";
    }

    let {
        children,
        class: className = "",
        elevation = "medium",
    }: Props = $props();

    const elevationMap = {
        low: "bg-white/5 backdrop-blur-sm border-white/10 shadow-sm",
        medium: "bg-white/10 backdrop-blur-md border-white/20 shadow-lg",
        high: "bg-white/20 backdrop-blur-xl border-white/30 shadow-2xl",
    };
</script>

<div class={`rounded-2xl border ${elevationMap[elevation]} ${className}`}>
    {@render children?.()}
</div>

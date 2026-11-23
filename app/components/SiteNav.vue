<template>
	<header class="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
		<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-1.5 focus:font-mono focus:text-xs focus:font-semibold focus:text-neutral-950">Skip to main content</a>
		<nav class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4" aria-label="Main">
			<NuxtLink to="/" class="flex items-center gap-2.5">
				<img src="/logo.jpg" alt="Aethereal logo" width="24" height="24" class="size-6 rounded-full" />
				<span class="font-mono text-sm"><span class="text-neutral-400">æthereal/</span><span class="font-semibold text-accent">data</span></span>
			</NuxtLink>
			<div class="flex items-center gap-1 font-mono text-xs text-neutral-400">
				<NuxtLink to="/#datasets" class="rounded-md px-3 py-2 hover:bg-white/5 hover:text-white">datasets</NuxtLink>
				<NuxtLink to="/#mcp" class="rounded-md px-3 py-2 hover:bg-white/5 hover:text-white">mcp</NuxtLink>
			</div>
		</nav>
	</header>
</template>

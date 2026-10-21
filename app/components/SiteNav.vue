<template>
	<header class="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
		<nav class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4" aria-label="Main">
			<NuxtLink to="/" class="flex items-center gap-2.5">
				<img src="/logo.jpg" alt="Aethereal logo" width="24" height="24" class="size-6 rounded-full" />
				<span class="font-mono text-sm"><span class="text-neutral-400">æthereal/</span><span class="font-semibold text-accent">data</span></span>
			</NuxtLink>
			<div class="flex items-center gap-1 font-mono text-xs text-neutral-400">
				<NuxtLink to="/#datasets" class="rounded-md px-3 py-2 hover:bg-white/5 hover:text-white">datasets</NuxtLink>
				<NuxtLink to="/stocks" class="rounded-md px-3 py-2 hover:bg-white/5 hover:text-white">stocks</NuxtLink>
				<a href="https://aethereal.top" class="hidden rounded-md px-3 py-2 hover:bg-white/5 hover:text-white sm:inline">aethereal.top ↗</a>
			</div>
		</nav>
	</header>
</template>

<template>
	<header class="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/80 backdrop-blur-xl">
		<nav class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4" aria-label="Main">
			<NuxtLink to="/" class="flex items-center gap-2 font-extrabold tracking-tight">
				<img src="/logo.jpg" alt="Aethereal logo" width="28" height="28" class="size-7 rounded-full" />
				<span>æthereal <span class="font-semibold text-neutral-400">data</span></span>
			</NuxtLink>
			<div class="flex items-center gap-1 text-sm font-medium text-neutral-600">
				<NuxtLink to="/" class="rounded-full px-3 py-2 hover:bg-neutral-100 hover:text-neutral-950">Datasets</NuxtLink>
				<NuxtLink to="/stocks" class="rounded-full px-3 py-2 hover:bg-neutral-100 hover:text-neutral-950">Stocks</NuxtLink>
				<a href="https://aethereal.top" class="hidden rounded-full px-3 py-2 hover:bg-neutral-100 hover:text-neutral-950 sm:inline">aethereal.top ↗</a>
			</div>
		</nav>
	</header>
</template>

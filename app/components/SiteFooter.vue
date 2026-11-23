<template>
	<footer class="border-t border-white/10 bg-black px-4 pt-14">
		<div class="mx-auto flex max-w-6xl flex-col justify-between gap-8 md:flex-row md:items-start">
			<div>
				<NuxtLink to="/" class="flex items-center gap-2.5">
					<img src="/logo.jpg" alt="Aethereal logo" width="28" height="28" loading="lazy" decoding="async" class="size-7 rounded-full" />
					<span class="font-mono"><span class="text-neutral-400">æthereal/</span><span class="font-semibold text-accent">data</span></span>
				</NuxtLink>
				<p class="mt-4 max-w-xs text-sm text-neutral-400">Stocks, markets, macro, and on-chain datasets, refreshed daily. Free CSV, Parquet, and MCP access.</p>
			</div>
			<div class="flex gap-2">
				<a v-for="s in SOCIAL" :key="s.label" :href="s.href" :aria-label="s.label" target="_blank" rel="noopener noreferrer" class="grid size-9 place-items-center rounded-lg border border-white/10 text-neutral-400 hover:border-white/30 hover:text-white">
					<Icon :name="s.icon" class="size-4" aria-hidden="true" />
				</a>
			</div>
		</div>

		<div class="mx-auto mt-12 flex max-w-6xl flex-col justify-between gap-3 border-t border-white/10 py-6 font-mono text-xs text-neutral-500 md:flex-row">
			<p>&copy; {{ new Date().getFullYear() }} Aethereal. All rights reserved.</p>
			<p>Data provided as is. Not financial advice.</p>
		</div>
	</footer>
</template>

<script setup lang="ts">
const SOCIAL = [
	{ label: "X", href: "https://x.com/aethereal_co", icon: "ph:x-logo" },
	{ label: "Discord", href: "https://discord.gg/aethereal", icon: "ph:discord-logo" },
	{ label: "GitHub", href: "https://github.com/Aethereal-Collective", icon: "ph:github-logo" },
	{ label: "LinkedIn", href: "https://www.linkedin.com/company/aethereal-collective", icon: "ph:linkedin-logo" },
	{ label: "Email", href: "mailto:aethereal.hq@gmail.com", icon: "ph:envelope-simple" },
];
</script>

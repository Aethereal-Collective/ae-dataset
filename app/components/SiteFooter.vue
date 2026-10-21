<template>
	<footer class="border-t border-white/10 bg-black px-4 pt-16">
		<div class="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.3fr_2fr]">
			<div>
				<NuxtLink to="/" class="flex items-center gap-2.5">
					<img src="/logo.jpg" alt="Aethereal logo" width="28" height="28" class="size-7 rounded-full" />
					<span class="font-mono"><span class="text-neutral-400">æthereal/</span><span class="font-semibold text-accent">data</span></span>
				</NuxtLink>
				<p class="mt-4 max-w-xs text-sm text-neutral-400">Stocks, markets, macro, and on-chain datasets, refreshed daily. Free CSV, Parquet, and MCP access.</p>
				<div class="mt-6 flex gap-2">
					<a v-for="s in SOCIAL" :key="s.label" :href="s.href" :aria-label="s.label" target="_blank" rel="noopener" class="grid size-9 place-items-center rounded-lg border border-white/10 text-neutral-400 hover:border-white/30 hover:text-white">
						<Icon :name="s.icon" class="size-4" />
					</a>
				</div>
			</div>

			<nav class="grid grid-cols-2 gap-8 sm:grid-cols-3" aria-label="Footer">
				<div v-for="col in COLUMNS" :key="col.title">
					<p class="font-mono text-xs uppercase tracking-wider text-neutral-500">{{ col.title }}</p>
					<ul class="mt-4 space-y-2.5 text-sm">
						<li v-for="l in col.links" :key="l.label">
							<NuxtLink v-if="l.to" :to="l.to" class="text-neutral-300 hover:text-accent">{{ l.label }}</NuxtLink>
							<a v-else :href="l.href" target="_blank" rel="noopener" class="text-neutral-300 hover:text-accent">{{ l.label }}</a>
						</li>
					</ul>
				</div>
			</nav>
		</div>

		<div class="mx-auto mt-16 flex max-w-6xl flex-col justify-between gap-3 border-t border-white/10 py-6 font-mono text-xs text-neutral-500 md:flex-row">
			<p>&copy; {{ new Date().getFullYear() }} Aethereal. Data provided as is, for research and education.</p>
			<p>Not financial advice.</p>
		</div>
	</footer>
</template>

<script setup lang="ts">
import { TOPICS, type Topic } from "#shared/datasets";

const SOCIAL = [
	{ label: "X", href: "https://x.com/aethereal_co", icon: "ph:x-logo" },
	{ label: "Discord", href: "https://discord.gg/aethereal", icon: "ph:discord-logo" },
	{ label: "GitHub", href: "https://github.com/Aethereal-Collective", icon: "ph:github-logo" },
	{ label: "LinkedIn", href: "https://www.linkedin.com/company/aethereal-collective", icon: "ph:linkedin-logo" },
	{ label: "Email", href: "mailto:team@aethereal.top", icon: "ph:envelope-simple" },
];

type Link = { label: string; to?: string; href?: string };
const COLUMNS: { title: string; links: Link[] }[] = [
	{ title: "Datasets", links: (Object.keys(TOPICS) as Topic[]).slice(0, 6).map((t) => ({ label: TOPICS[t], to: `/?topic=${t}#datasets` })) },
	{
		title: "Use the data",
		links: [
			{ label: "All datasets", to: "/#datasets" },
			{ label: "Python quick start", to: "/#quick-start" },
			{ label: "MCP for AI assistants", to: "/#mcp" },
			{ label: "Request a dataset", href: "mailto:team@aethereal.top?subject=Dataset%20request" },
		],
	},
	{
		title: "Aethereal",
		links: [
			{ label: "aethereal.top", href: "https://aethereal.top" },
			{ label: "Research", href: "https://aethereal.top/research" },
			{ label: "Products", href: "https://aethereal.top/products" },
			{ label: "About", href: "https://aethereal.top/about" },
		],
	},
];
</script>

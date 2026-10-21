<template>
	<div class="mx-auto max-w-6xl px-4 pb-24 pt-16 md:pt-24">
		<header class="max-w-3xl">
			<h1 class="text-5xl font-extrabold leading-[0.95] tracking-[-0.03em] md:text-7xl">
				Datasets for
				<span class="chrome-text block pb-1">onchain research.</span>
			</h1>
			<p class="mt-6 text-lg text-neutral-500">Free crypto, blockchain, and market data, updated automatically. Download as CSV or Parquet.</p>
		</header>

		<nav class="mt-10 flex flex-wrap gap-2" aria-label="Filter by category">
			<button v-for="tab in tabs" :key="tab.id" type="button" :class="active === tab.id ? 'bg-neutral-950 text-white' : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'" class="rounded-full px-4 py-2 text-sm font-semibold" @click="active = tab.id">
				{{ tab.label }} <span class="ml-1 opacity-60">{{ tab.count }}</span>
			</button>
		</nav>

		<div class="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
			<NuxtLink v-for="d in shown" :key="d.slug" :to="`/datasets/${d.slug}`" class="group flex flex-col gap-4 rounded-3xl border border-neutral-200 p-6 transition-shadow hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
				<div class="flex items-center justify-between text-xs font-semibold">
					<span class="rounded-full bg-neutral-100 px-3 py-1 text-neutral-700">{{ CATEGORY_LABEL[d.category] }}</span>
					<span class="text-neutral-400">{{ d.source.name }}</span>
				</div>
				<h2 class="text-xl font-bold tracking-tight group-hover:underline">{{ d.title }}</h2>
				<p class="text-sm leading-relaxed text-neutral-500">{{ d.summary }}</p>
				<dl class="mt-auto flex gap-6 border-t border-neutral-100 pt-4 text-xs text-neutral-500">
					<div><dt class="sr-only">Rows</dt><dd>{{ d.stats ? formatNumber(d.stats.rows) + " rows" : "Building…" }}</dd></div>
					<div v-if="d.stats"><dt class="sr-only">Updated</dt><dd>Updated {{ formatDate(d.stats.updatedAt) }}</dd></div>
				</dl>
			</NuxtLink>
		</div>
	</div>
</template>

<script setup lang="ts">
const { data: datasets } = await useFetch("/api/datasets", { default: () => [] });

const active = ref("");
const tabs = computed(() => [
	{ id: "", label: "All", count: datasets.value.length },
	...["crypto", "blockchain"].map((c) => ({ id: c, label: CATEGORY_LABEL[c]!, count: datasets.value.filter((d) => d.category === c).length })),
]);
const shown = computed(() => (active.value ? datasets.value.filter((d) => d.category === active.value) : datasets.value));

useSeoMeta({ title: "" });
</script>

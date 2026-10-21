<template>
	<div>
		<section class="relative flex min-h-[86svh] items-center overflow-hidden px-4 py-20">
			<ChromeBlobs class="opacity-80 md:opacity-100" :spread="1.05" />
			<div class="pointer-events-none absolute inset-x-0 top-1/2 h-[70%] -translate-y-1/2 bg-[radial-gradient(closest-side,rgba(255,255,255,0.95),transparent)]" aria-hidden="true" />

			<div class="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center">
				<h1 class="text-[clamp(3rem,9vw,7rem)] font-extrabold leading-[0.92] tracking-[-0.04em]">
					Crypto data,
					<span class="chrome-text block pb-2">ready to analyze.</span>
				</h1>
				<p class="mt-6 max-w-xl text-lg text-neutral-500 md:text-xl">Clean blockchain and market datasets, refreshed every day. Download as CSV or Parquet.</p>

				<label class="mt-10 flex w-full max-w-xl items-center gap-3 rounded-full border border-neutral-200 bg-white/90 px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur focus-within:border-neutral-400">
					<Icon name="ph:magnifying-glass" class="shrink-0 text-xl text-neutral-400" aria-hidden="true" />
					<input v-model="query" type="search" placeholder="Search datasets: stablecoin, TVL, hacks…" class="w-full bg-transparent text-base outline-none placeholder:text-neutral-400" @keydown.enter="scrollToList" />
				</label>

				<dl class="mt-10 grid w-full max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 sm:grid-cols-4">
					<div v-for="s in heroStats" :key="s.label" class="bg-white/90 px-4 py-4 backdrop-blur">
						<dd class="whitespace-nowrap text-xl font-extrabold tracking-tight">{{ s.value }}</dd>
						<dt class="mt-1 text-xs text-neutral-500">{{ s.label }}</dt>
					</div>
				</dl>
			</div>
		</section>

		<section v-if="featured?.insight" class="px-4 pb-8">
			<NuxtLink :to="`/datasets/${featured.slug}`" class="group mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-neutral-950 text-white md:grid-cols-[1fr_1.3fr]">
				<div class="flex flex-col justify-center gap-4 p-8 md:p-12">
					<span class="w-fit rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">Featured dataset</span>
					<h2 class="text-3xl font-extrabold tracking-tight md:text-4xl">{{ featured.title }}</h2>
					<p class="text-neutral-400">{{ featured.insight.figure.label }}</p>
					<p class="text-5xl font-extrabold tracking-tight">{{ money(featured.insight.figure.value) }}</p>
					<span class="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-transform group-hover:scale-[1.03]">Explore dataset <Icon name="ph:arrow-right" /></span>
				</div>
				<div class="h-64 text-neutral-200 md:h-auto md:min-h-80">
					<Sparkline :points="featured.insight.spark" />
				</div>
			</NuxtLink>
		</section>

		<section id="datasets" class="scroll-mt-20 px-4 py-16">
			<div class="mx-auto max-w-6xl">
				<div class="flex flex-wrap items-end justify-between gap-4">
					<h2 class="text-3xl font-extrabold tracking-tight md:text-4xl">All datasets</h2>
					<nav class="flex flex-wrap gap-2" aria-label="Filter by category">
						<button v-for="tab in tabs" :key="tab.id" type="button" :class="active === tab.id ? 'bg-neutral-950 text-white' : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'" class="rounded-full px-4 py-2 text-sm font-semibold" @click="active = tab.id">
							{{ tab.label }} <span class="ml-1 opacity-60">{{ tab.count }}</span>
						</button>
					</nav>
				</div>

				<div class="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
					<NuxtLink v-for="d in shown" :key="d.slug" :to="`/datasets/${d.slug}`" class="group flex flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white transition-shadow hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
						<div class="h-28 border-b border-neutral-100 bg-neutral-50 px-2 pt-4 text-neutral-900">
							<Sparkline v-if="d.insight && d.insight.spark.length > 2" :points="d.insight.spark" />
							<p v-else-if="d.insight" class="flex h-full items-center justify-center pb-4 text-sm text-neutral-400">Collecting daily history</p>
						</div>
						<div class="flex flex-1 flex-col gap-3 p-6">
							<span class="w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">{{ CATEGORY_LABEL[d.category] }}</span>
							<h3 class="text-xl font-bold tracking-tight group-hover:underline">{{ d.title }}</h3>
							<p class="text-sm leading-relaxed text-neutral-500">{{ d.summary }}</p>
							<p v-if="d.insight" class="text-sm"><span class="font-bold">{{ money(d.insight.figure.value) }}</span> <span class="text-neutral-500">{{ d.insight.figure.label }}</span></p>
							<dl class="mt-auto flex gap-6 border-t border-neutral-100 pt-4 text-xs text-neutral-500">
								<div><dt class="sr-only">Rows</dt><dd>{{ d.stats ? formatNumber(d.stats.rows) + " rows" : "Building…" }}</dd></div>
								<div v-if="d.stats"><dt class="sr-only">Updated</dt><dd>Updated {{ formatDate(d.stats.updatedAt) }}</dd></div>
							</dl>
						</div>
					</NuxtLink>
				</div>
				<p v-if="!shown.length" class="mt-12 text-center text-neutral-500">No dataset matches "{{ query }}".</p>
			</div>
		</section>

		<section class="bg-neutral-50 px-4 py-20">
			<div class="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
				<div>
					<h2 class="text-3xl font-extrabold tracking-tight md:text-4xl">From download to analysis <span class="chrome-text">in seconds.</span></h2>
					<ol class="mt-8 space-y-6">
						<li v-for="(s, i) in steps" :key="s.title" class="flex gap-4">
							<span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-sm font-bold text-white">{{ i + 1 }}</span>
							<div>
								<h3 class="font-bold">{{ s.title }}</h3>
								<p class="mt-1 text-neutral-500">{{ s.body }}</p>
							</div>
						</li>
					</ol>
				</div>
				<pre class="overflow-x-auto rounded-3xl bg-neutral-950 p-6 font-mono text-sm leading-relaxed text-neutral-100"><code>{{ code }}</code></pre>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
const { data } = await useFetch("/api/datasets", { default: () => [] });
const FEATURED = "chain-tvl-history";
const featured = computed(() => data.value.find((d) => d.slug === FEATURED));

const query = ref("");
const active = ref("");
const tabs = computed(() => [
	{ id: "", label: "All", count: data.value.length },
	...["crypto", "blockchain"].map((c) => ({ id: c, label: CATEGORY_LABEL[c]!, count: data.value.filter((d) => d.category === c).length })),
]);
const shown = computed(() => {
	const q = query.value.trim().toLowerCase();
	return data.value.filter((d) => (!active.value || d.category === active.value) && (!q || `${d.title} ${d.description}`.toLowerCase().includes(q)));
});
const scrollToList = () => document.getElementById("datasets")?.scrollIntoView({ behavior: "smooth" });

const heroStats = computed(() => [
	{ label: "Datasets", value: data.value.length },
	{ label: "Rows", value: formatCompact(data.value.reduce((s, d) => s + (d.stats?.rows ?? 0), 0)) },
	{ label: "Formats", value: "CSV, Parquet" },
	{ label: "Updates", value: "Daily" },
]);

const money = (v: number) => "$" + formatCompact(v);

const steps = [
	{ title: "Find a dataset", body: "Every dataset documents its columns and shows a live preview." },
	{ title: "Download or link it", body: "Grab CSV or Parquet, or read the file URL straight from your notebook." },
	{ title: "Analyze", body: "Load it with pandas, Polars, or DuckDB. Data refreshes every day." },
];

const code = `import pandas as pd

hacks = pd.read_csv("https://data.aethereal.top/files/crypto-hacks.csv")

by_type = (hacks.groupby("classification")["amount_usd"]
                .sum().sort_values(ascending=False))
print(by_type.head())`;

useSeoMeta({ title: "" });
</script>

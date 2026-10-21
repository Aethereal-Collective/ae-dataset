<template>
	<div>
		<section class="grid-bg relative overflow-hidden border-b border-white/10">
			<div class="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:py-28 lg:grid-cols-[1fr_1.1fr]">
				<div>
					<p class="font-mono text-xs text-accent">// open crypto datasets, refreshed daily</p>
					<h1 class="mt-5 text-5xl font-extrabold leading-[0.95] tracking-[-0.035em] md:text-6xl">
						Stop scraping.<br />
						<span class="text-neutral-500">Start analyzing.</span>
					</h1>
					<p class="mt-6 max-w-md text-lg text-neutral-400">Clean blockchain and market data with documented columns. One URL away from your notebook.</p>

					<label class="mt-8 flex max-w-md items-center gap-3 rounded-lg border border-white/15 bg-black/60 px-4 py-3.5 font-mono text-sm focus-within:border-accent">
						<span class="text-accent" aria-hidden="true">&gt;</span>
						<input v-model="query" type="search" placeholder="search datasets…" class="w-full bg-transparent outline-none placeholder:text-neutral-600" @keydown.enter="scrollToList" />
						<kbd class="rounded border border-white/15 px-1.5 text-[10px] text-neutral-500">enter</kbd>
					</label>
				</div>

				<NuxtLink v-if="featured?.insight" :to="`/datasets/${featured.slug}`" class="group block rounded-xl border border-white/10 bg-black/50 p-5 backdrop-blur">
					<div class="flex items-start justify-between gap-4 font-mono text-xs">
						<div>
							<p class="text-neutral-500">{{ featured.slug }}.csv</p>
							<p class="mt-2 text-3xl font-semibold tracking-tight text-white">{{ money(featured.insight.figure.value) }}</p>
							<p class="mt-1 text-neutral-400">{{ featured.insight.figure.label }}</p>
						</div>
						<span class="rounded border border-accent/40 px-2 py-1 text-accent">live</span>
					</div>
					<div class="mt-6 h-56 text-accent">
						<Sparkline :points="featured.insight.spark" grid animate :width="2" />
					</div>
					<p class="mt-4 flex justify-between font-mono text-[11px] text-neutral-500">
						<span>last 365 days</span><span class="group-hover:text-white">open dataset →</span>
					</p>
				</NuxtLink>
			</div>
		</section>

		<div class="overflow-hidden border-b border-white/10 bg-black py-3 font-mono text-xs" aria-label="Key figures">
			<div class="ticker flex w-max gap-12 whitespace-nowrap">
				<span v-for="(t, i) in [...ticker, ...ticker]" :key="i" :aria-hidden="i >= ticker.length">
					<span class="text-neutral-500">{{ t.label }}</span> <span class="text-white">{{ t.value }}</span>
				</span>
			</div>
		</div>

		<section id="datasets" class="scroll-mt-14 px-4 py-20">
			<div class="mx-auto max-w-6xl">
				<div class="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p class="font-mono text-xs text-accent">// catalog</p>
						<h2 class="mt-2 text-3xl font-extrabold tracking-tight">Datasets</h2>
					</div>
					<nav class="flex gap-1 rounded-lg border border-white/10 p-1 font-mono text-xs" aria-label="Filter by category">
						<button v-for="tab in tabs" :key="tab.id" type="button" :class="active === tab.id ? 'bg-white text-neutral-950' : 'text-neutral-400 hover:text-white'" class="rounded-md px-3 py-1.5" @click="active = tab.id">
							{{ tab.label }} {{ tab.count }}
						</button>
					</nav>
				</div>

				<div class="mt-8 overflow-hidden rounded-xl border border-white/10">
					<div class="hidden grid-cols-[1.6fr_0.6fr_0.7fr_0.8fr_1fr] gap-4 border-b border-white/10 bg-white/[0.03] px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-neutral-500 md:grid">
						<span>Dataset</span><span>Type</span><span class="text-right">Rows</span><span>Updated</span><span>Trend</span>
					</div>
					<NuxtLink v-for="d in shown" :key="d.slug" :to="`/datasets/${d.slug}`" class="group grid gap-3 border-b border-white/10 px-5 py-5 last:border-b-0 hover:bg-white/[0.03] md:grid-cols-[1.6fr_0.6fr_0.7fr_0.8fr_1fr] md:items-center md:gap-4">
						<div>
							<h3 class="font-semibold group-hover:text-accent">{{ d.title }}</h3>
							<p class="mt-1 text-sm text-neutral-500">{{ d.summary }}</p>
						</div>
						<span class="font-mono text-xs text-neutral-400">{{ CATEGORY_LABEL[d.category]?.toLowerCase() }}</span>
						<span class="font-mono text-sm md:text-right">{{ d.stats ? formatNumber(d.stats.rows) : "building" }}</span>
						<span class="font-mono text-xs text-neutral-400">{{ d.stats ? formatDate(d.stats.updatedAt) : "-" }}</span>
						<div class="h-10 text-accent">
							<Sparkline v-if="d.insight && d.insight.spark.length > 2" :points="d.insight.spark" />
							<span v-else class="flex h-full items-center font-mono text-[11px] text-neutral-600">collecting history</span>
						</div>
					</NuxtLink>
					<p v-if="!shown.length" class="px-5 py-10 text-center font-mono text-sm text-neutral-500">no dataset matches "{{ query }}"</p>
				</div>
			</div>
		</section>

		<section class="border-t border-white/10 px-4 py-20">
			<div class="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
				<div>
					<p class="font-mono text-xs text-accent">// quick start</p>
					<h2 class="mt-2 text-3xl font-extrabold tracking-tight">Three lines to a DataFrame.</h2>
					<p class="mt-4 max-w-md text-neutral-400">Every file has a stable URL. Read it straight from pandas, Polars, or DuckDB, and rerun tomorrow for fresh data.</p>
				</div>
				<div class="overflow-hidden rounded-xl border border-white/10 bg-black">
					<div class="flex items-center gap-1.5 border-b border-white/10 px-4 py-3" aria-hidden="true">
						<span class="size-2.5 rounded-full bg-white/15" /><span class="size-2.5 rounded-full bg-white/15" /><span class="size-2.5 rounded-full bg-white/15" />
						<span class="ml-3 font-mono text-[11px] text-neutral-500">analysis.py</span>
					</div>
					<pre class="overflow-x-auto p-5 font-mono text-sm leading-relaxed text-neutral-200"><code>{{ code }}</code></pre>
				</div>
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
	{ id: "", label: "all", count: data.value.length },
	...["crypto", "blockchain"].map((c) => ({ id: c, label: c, count: data.value.filter((d) => d.category === c).length })),
]);
const shown = computed(() => {
	const q = query.value.trim().toLowerCase();
	return data.value.filter((d) => (!active.value || d.category === active.value) && (!q || `${d.title} ${d.description}`.toLowerCase().includes(q)));
});
const scrollToList = () => document.getElementById("datasets")?.scrollIntoView({ behavior: "smooth" });

const money = (v: number) => "$" + formatCompact(v);
const ticker = computed(() => [
	...data.value.filter((d) => d.insight).map((d) => ({ label: d.insight!.figure.label, value: money(d.insight!.figure.value) })),
	{ label: "Rows available", value: formatCompact(data.value.reduce((s, d) => s + (d.stats?.rows ?? 0), 0)) },
	{ label: "Formats", value: "CSV, Parquet" },
	{ label: "Refresh", value: "daily 01:15 UTC" },
]);

const code = `import pandas as pd

url = "https://data.aethereal.top/files/crypto-hacks.csv"
hacks = pd.read_csv(url, parse_dates=["date"])

hacks.groupby(hacks.date.dt.year)["amount_usd"].sum().tail()`;

useSeoMeta({ title: "" });
</script>

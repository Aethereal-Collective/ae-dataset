<template>
	<div>
		<section class="grid-bg relative overflow-hidden border-b border-white/10">
			<div class="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-[0.9fr_1.1fr]">
				<div>
					<p class="font-mono text-xs text-accent">// financial datasets, refreshed daily</p>
					<h1 class="mt-5 text-5xl font-extrabold leading-[0.95] tracking-[-0.035em] md:text-6xl">
						Stop scraping.<br />
						<span class="text-neutral-500">Start analyzing.</span>
					</h1>
					<p class="mt-6 max-w-md text-lg text-neutral-400">Stocks, FX, macro, and on-chain crypto data as clean CSV and Parquet. One URL away from your notebook.</p>

					<label class="mt-8 flex max-w-md items-center gap-3 rounded-lg border border-white/15 bg-black/60 px-4 py-3.5 font-mono text-sm focus-within:border-accent">
						<span class="text-accent" aria-hidden="true">&gt;</span>
						<input v-model="query" type="search" placeholder="search datasets…" class="w-full bg-transparent outline-none placeholder:text-neutral-600" @keydown.enter="scrollToList" />
						<kbd class="rounded border border-white/15 px-1.5 text-[10px] text-neutral-500">enter</kbd>
					</label>
					<div class="mt-4 flex flex-wrap gap-2 font-mono text-xs">
						<button v-for="(label, id) in TOPICS" :key="id" type="button" class="rounded-full border border-white/10 px-3 py-1.5 text-neutral-400 hover:border-white/30 hover:text-white" @click="pick(id)">
							<span class="mr-1.5 inline-block size-1.5 rounded-full align-middle" :style="{ background: TOPIC_COLOR[id] }" />{{ label }}
						</button>
					</div>
				</div>

				<div class="overflow-hidden rounded-xl border border-white/10 bg-black/70 shadow-2xl shadow-black backdrop-blur">
					<div class="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5" aria-hidden="true">
						<span class="size-2.5 rounded-full bg-white/15" /><span class="size-2.5 rounded-full bg-white/15" /><span class="size-2.5 rounded-full bg-white/15" />
						<span class="ml-3 font-mono text-[11px] text-neutral-500">overview</span>
						<span class="ml-auto font-mono text-[11px] text-accent">● live</span>
					</div>
					<div class="grid grid-cols-2 gap-px bg-white/10">
						<NuxtLink v-for="(p, i) in panels" :key="p.slug" :to="`/datasets/${p.slug}`" :class="i === 0 ? 'col-span-2' : ''" class="group bg-neutral-950 p-4 hover:bg-neutral-900">
							<p class="truncate font-mono text-[11px] text-neutral-500">{{ p.insight.figure.label }}</p>
							<p class="mt-1 text-xl font-semibold tracking-tight md:text-2xl">{{ figure(p.insight.figure) }}</p>
							<div :class="i === 0 ? 'h-28' : 'h-14'" class="mt-3" :style="{ color: TOPIC_COLOR[p.topic] }">
								<Sparkline :points="p.insight.spark" :bars="p.bars" :grid="i === 0" :animate="!p.bars" :width="i === 0 ? 2 : 1.5" />
							</div>
						</NuxtLink>
					</div>
				</div>
			</div>
		</section>

		<div class="border-b border-white/10 bg-black">
			<dl class="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 md:grid-cols-5">
				<div v-for="s in stats" :key="s.label" class="py-6">
					<dt class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">{{ s.label }}</dt>
					<dd class="mt-1 text-2xl font-semibold tracking-tight">{{ s.value }}</dd>
				</div>
			</dl>
		</div>

		<section id="datasets" class="scroll-mt-14 px-4 py-20">
			<div class="mx-auto max-w-6xl">
				<div class="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p class="font-mono text-xs text-accent">// catalog</p>
						<h2 class="mt-2 text-3xl font-extrabold tracking-tight">Datasets</h2>
					</div>
					<nav class="flex flex-wrap gap-1 rounded-lg border border-white/10 p-1 font-mono text-xs" aria-label="Filter by topic">
						<button v-for="tab in tabs" :key="tab.id" type="button" :class="active === tab.id ? 'bg-white text-neutral-950' : 'text-neutral-400 hover:text-white'" class="rounded-md px-3 py-1.5" @click="active = tab.id">
							{{ tab.label }} {{ tab.count }}
						</button>
					</nav>
				</div>

				<div v-for="g in groups" :key="g.id" class="mt-12 first:mt-8">
					<h3 v-if="g.label" class="flex items-center gap-2 font-mono text-sm text-neutral-300">
						<span class="size-2 rounded-full" :style="{ background: TOPIC_COLOR[g.id] }" />{{ g.label }}
						<span class="text-neutral-600">{{ g.items.length }}</span>
					</h3>
					<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<NuxtLink v-for="d in g.items" :key="d.slug" :to="`/datasets/${d.slug}`" class="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/25">
							<div class="grid-bg relative h-32 border-b border-white/10 px-4 pt-6" :style="{ color: TOPIC_COLOR[d.topic], backgroundColor: `color-mix(in srgb, ${TOPIC_COLOR[d.topic]} 7%, transparent)` }">
								<Sparkline v-if="d.insight && d.insight.spark.length > 2" :points="d.insight.spark" :bars="BARS.has(d.slug)" />
								<p v-else class="font-mono text-[11px] text-neutral-500">collecting history</p>
								<span v-if="d.enriched" class="absolute left-3 top-3 rounded bg-accent px-1.5 py-0.5 font-mono text-[10px] font-semibold text-neutral-950">enriched</span>
								<span class="absolute right-3 top-3 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-neutral-300">{{ d.mode === "append" ? "history" : d.columns.some((c) => c.name === "date") ? "time series" : "snapshot" }}</span>
							</div>
							<div class="p-4">
								<h4 class="font-semibold group-hover:text-accent">{{ d.title }}</h4>
								<p class="mt-1 line-clamp-2 text-sm text-neutral-500">{{ d.summary }}</p>
								<p class="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-neutral-500">
									<span>{{ d.stats ? formatCompact(d.stats.rows) + " rows" : "building" }}</span>
									<span>{{ d.columns.length }} cols</span>
									<span v-if="d.stats">{{ formatBytes(d.stats.parquetBytes) }}</span>
									<span v-if="d.stats">{{ ago(d.stats.updatedAt) }}</span>
								</p>
							</div>
						</NuxtLink>
					</div>
				</div>
				<p v-if="!shown.length" class="mt-8 rounded-xl border border-white/10 px-5 py-10 text-center font-mono text-sm text-neutral-500">no dataset matches "{{ query }}"</p>
			</div>
		</section>

		<section class="border-t border-white/10 px-4 py-20">
			<div class="mx-auto max-w-6xl">
				<p class="font-mono text-xs text-accent">// look inside</p>
				<h2 class="mt-2 text-3xl font-extrabold tracking-tight">See the rows before you download.</h2>
				<div class="mt-10 grid gap-6 lg:grid-cols-[320px_1fr]">
					<div class="flex max-h-[480px] flex-col overflow-y-auto">
						<button
							v-for="d in data"
							:key="d.slug"
							type="button"
							:class="peek === d.slug ? 'border-accent text-white' : 'border-white/10 text-neutral-400 hover:text-white'"
							class="border-l-2 px-4 py-3 text-left"
							@click="peek = d.slug"
						>
							<span class="font-semibold">{{ d.title }}</span>
							<span v-if="peek === d.slug" class="mt-1 block text-sm text-neutral-500">{{ d.summary }}</span>
						</button>
					</div>
					<div class="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black">
						<div class="flex items-center justify-between border-b border-white/10 px-4 py-2.5 font-mono text-[11px] text-neutral-500">
							<span>{{ peek }}.csv</span>
							<NuxtLink :to="`/datasets/${peek}`" class="hover:text-white">open dataset →</NuxtLink>
						</div>
						<div class="max-h-[420px] overflow-auto">
							<table v-if="preview?.preview.length" class="w-full whitespace-nowrap text-left font-mono text-xs">
								<thead class="sticky top-0 bg-neutral-900 text-neutral-400">
									<tr><th v-for="c in previewCols" :key="c" class="px-3 py-2 font-medium">{{ c }}</th></tr>
								</thead>
								<tbody class="divide-y divide-white/5 text-neutral-300">
									<tr v-for="(r, i) in preview.preview.slice(0, 12)" :key="i">
										<td v-for="c in previewCols" :key="c" class="max-w-[220px] truncate px-3 py-2" :class="typeof r[c] === 'number' ? 'text-right' : ''">{{ cell(r[c]) }}</td>
									</tr>
								</tbody>
							</table>
							<p v-else class="p-10 text-center font-mono text-sm text-neutral-500">loading…</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<section id="quick-start" class="scroll-mt-14 border-t border-white/10 px-4 py-20">
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

		<section id="mcp" class="scroll-mt-14 border-t border-white/10 px-4 py-20">
			<div class="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
				<div class="overflow-hidden rounded-xl border border-white/10 bg-black lg:order-2">
					<div class="flex items-center gap-1.5 border-b border-white/10 px-4 py-3" aria-hidden="true">
						<span class="size-2.5 rounded-full bg-white/15" /><span class="size-2.5 rounded-full bg-white/15" /><span class="size-2.5 rounded-full bg-white/15" />
						<span class="ml-3 font-mono text-[11px] text-neutral-500">terminal</span>
					</div>
					<pre class="overflow-x-auto p-5 font-mono text-sm leading-relaxed text-neutral-200"><code><span class="text-neutral-500"># Claude Code</span>
claude mcp add --transport http aethereal-data {{ mcpUrl }}

<span class="text-neutral-500"># Cursor, Claude Desktop, or any MCP client</span>
{ "aethereal-data": { "url": "{{ mcpUrl }}" } }</code></pre>
					<div class="border-t border-white/10 p-5 font-mono text-xs leading-relaxed">
						<p class="text-neutral-500">you</p>
						<p class="text-neutral-200">Which attack vector cost DeFi the most since 2020, in today's dollars?</p>
						<p class="mt-3 text-neutral-500">assistant → aggregate_dataset(hacks-enriched, group_by: vector)</p>
					</div>
				</div>
				<div>
					<p class="font-mono text-xs text-accent">// mcp</p>
					<h2 class="mt-2 text-3xl font-extrabold tracking-tight">Ask your AI. It queries the data.</h2>
					<p class="mt-4 max-w-md text-neutral-400">Connect Claude, Cursor, or any MCP client to every dataset here. It can list datasets, read the columns, filter rows, and run group-by aggregations on millions of rows without downloading a file.</p>
					<ul class="mt-6 space-y-2 font-mono text-sm text-neutral-300">
						<li v-for="t in MCP_TOOLS" :key="t"><span class="text-accent">→</span> {{ t }}</li>
					</ul>
				</div>
			</div>
		</section>

		<section class="px-4 pb-20 pt-4">
			<div class="grid-bg mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-xl border border-white/10 p-8 md:flex-row md:items-center md:p-10">
				<div>
					<h2 class="text-2xl font-extrabold tracking-tight">Need a dataset we don't have?</h2>
					<p class="mt-2 text-neutral-400">Tell us what you're analyzing. Popular requests get built first.</p>
				</div>
				<a href="mailto:team@aethereal.top?subject=Dataset%20request" class="shrink-0 rounded-lg bg-accent px-5 py-3 font-semibold text-neutral-950 hover:brightness-110">Request a dataset</a>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import { TOPICS, type Topic } from "#shared/datasets";

const { data } = await useFetch("/api/datasets", { default: () => [] });

const TOPIC_COLOR: Record<Topic, string> = {
	stocks: "#34d399",
	markets: "#60a5fa",
	macro: "#e879f9",
	bitcoin: "#fb923c",
	networks: "#a78bfa",
	stablecoins: "#b5f23d",
	defi: "#7dd3fc",
	exchanges: "#fbbf24",
	security: "#f87171",
};
// Monthly or ranked series read better as bars.
const BARS = new Set([
	"stablecoin-supply-onchain",
	"dex-volume-history",
	"stablecoin-market",
	"defi-protocols",
	"yield-pools",
	"cex-reserves",
	"bitcoin-mining-pools",
	"l2-projects",
	"l2-daily-metrics",
	"protocol-fees",
	"dex-protocols",
	"stablecoins-by-chain",
	"lending-markets",
	"sp500-companies",
	"defi-protocol-status",
	"hacks-enriched",
	"phishing-domains-labeled",
]);

const PANELS = ["global-indices", "bitcoin-network-daily", "us-rates-daily"];
const panels = computed(() =>
	PANELS.map((slug) => data.value.find((d) => d.slug === slug))
		.filter((d) => d?.insight)
		.map((d) => ({ ...d!, insight: d!.insight!, bars: BARS.has(d!.slug) })),
);

const insightOf = (slug: string) => data.value.find((d) => d.slug === slug)?.insight?.figure.value ?? 0;
const stats = computed(() => [
	{ label: "Datasets", value: data.value.length },
	{ label: "Rows", value: formatCompact(data.value.reduce((s, d) => s + (d.stats?.rows ?? 0), 0)) },
	{ label: "Topics", value: Object.keys(TOPICS).length },
	{ label: "Stocks", value: (insightOf("idx-stock-prices") + insightOf("sp500-stock-prices")).toLocaleString("en-US") },
	{ label: "History since", value: "1954" },
]);

const query = ref("");
const route = useRoute();
const active = ref(String(route.query.topic ?? ""));
// Footer topic links land here with ?topic=.
watch(() => route.query.topic, (t) => (active.value = String(t ?? "")));
const tabs = computed(() => [
	{ id: "", label: "all", count: data.value.length },
	...(Object.keys(TOPICS) as Topic[]).map((t) => ({ id: t, label: TOPICS[t].toLowerCase(), count: data.value.filter((d) => d.topic === t).length })),
]);
const shown = computed(() => {
	const q = query.value.trim().toLowerCase();
	return data.value.filter((d) => (!active.value || d.topic === active.value) && (!q || `${d.title} ${d.description}`.toLowerCase().includes(q)));
});
// Grouped by topic when browsing everything, one flat grid when filtering.
const groups = computed(() => {
	if (active.value || query.value.trim()) return shown.value.length ? [{ id: "" as Topic, label: "", items: shown.value }] : [];
	return (Object.keys(TOPICS) as Topic[]).map((t) => ({ id: t, label: TOPICS[t], items: shown.value.filter((d) => d.topic === t) })).filter((g) => g.items.length);
});
const scrollToList = () => document.getElementById("datasets")?.scrollIntoView({ behavior: "smooth" });
const pick = (t: Topic) => {
	active.value = t;
	scrollToList();
};

const peek = ref("cross-asset-daily");
const { data: preview } = await useFetch(() => `/api/datasets/${peek.value}`, { lazy: true, server: false });
const previewCols = computed(() => (preview.value?.columns ?? []).map((c) => c.name).filter((c) => c !== "source" && c !== "pool_id" && c !== "contract"));
const cell = (v: unknown) => (typeof v === "number" ? (Number.isInteger(v) ? formatNumber(v) : v.toFixed(2)) : (v ?? ""));

const figure = (f: { value: number; unit: string }) => (f.unit === "usd" ? "$" + formatCompact(f.value) : f.unit === "pct" ? f.value.toFixed(2) + "%" : formatNumber(f.value));
const ago = (iso: string) => {
	const h = Math.round((Date.now() - new Date(iso).getTime()) / 36e5);
	return h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

const mcpUrl = `${useRuntimeConfig().public.siteUrl}/mcp`;
const MCP_TOOLS = ["list_datasets", "describe_dataset", "query_dataset", "aggregate_dataset"];

const code = `import pandas as pd

url = "https://data.aethereal.top/files/hacks-enriched.csv"
hacks = pd.read_csv(url, parse_dates=["date"])

hacks.groupby("vector")["amount_usd_real"].sum()`;

useSeoMeta({ title: "" });
</script>

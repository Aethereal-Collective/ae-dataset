<template>
	<div v-if="d" class="mx-auto max-w-6xl px-4 pb-24 pt-12 md:pt-16">
		<nav class="text-sm text-neutral-400" aria-label="Breadcrumb">
			<NuxtLink to="/" class="hover:text-white">Datasets</NuxtLink>
			<span class="mx-2">/</span>
			<NuxtLink :to="`/topics/${d.topic}`" class="hover:text-white">{{ TOPICS[d.topic] }}</NuxtLink>
		</nav>

		<header class="mt-5 grid gap-8 lg:grid-cols-[1fr_320px]">
			<div>
				<h1 class="text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">{{ d.title }}</h1>
				<p class="mt-4 max-w-3xl text-lg leading-relaxed text-neutral-400">{{ d.description }}</p>
				<p v-if="d.stats" class="mt-4 max-w-3xl text-sm leading-relaxed text-neutral-500">{{ factLine }}</p>
			</div>

			<aside class="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm">
				<template v-if="d.stats">
					<a :href="`/files/${d.slug}.csv`" class="flex items-center justify-between rounded-2xl bg-accent px-4 py-3 font-semibold text-neutral-950 hover:brightness-110">
						<span><Icon name="ph:download-simple" class="mr-2 align-[-2px]" />Download CSV</span><span class="text-neutral-700">{{ formatBytes(d.stats.csvBytes) }}</span>
					</a>
					<a :href="`/files/${d.slug}.parquet`" class="flex items-center justify-between rounded-2xl border border-white/15 px-4 py-3 font-semibold hover:bg-white/5">
						<span><Icon name="ph:download-simple" class="mr-2 align-[-2px]" />Download Parquet</span><span class="text-neutral-400">{{ formatBytes(d.stats.parquetBytes) }}</span>
					</a>
				</template>
				<p v-else class="rounded-lg bg-white/5 p-4 text-neutral-400">This dataset is being built. Check back in a few minutes.</p>
				<dl class="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-neutral-400">
					<dt>Rows</dt><dd class="text-white">{{ d.stats ? formatNumber(d.stats.rows) : "-" }}</dd>
					<template v-if="d.stats?.firstDate"><dt>Coverage</dt><dd class="text-white">{{ d.stats.firstDate }} to {{ d.stats.lastDate }}</dd></template>
					<dt>Updated</dt><dd class="text-white">{{ d.stats ? formatDate(d.stats.updatedAt) : "-" }}</dd>
					<dt>Schedule</dt><dd class="text-white">{{ d.schedule }}</dd>
					<dt>License</dt><dd class="text-white">{{ d.license }}</dd>
				</dl>
			</aside>
		</header>

		<section class="mt-14">
			<h2 class="text-2xl font-extrabold tracking-tight">Load it in Python</h2>
			<pre class="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black p-5 font-mono text-sm leading-relaxed text-neutral-100"><code>{{ snippet }}</code></pre>
		</section>

		<section class="mt-14">
			<h2 class="text-2xl font-extrabold tracking-tight">Questions about this dataset</h2>
			<div class="mt-4 divide-y divide-white/10 border-y border-white/10">
				<div v-for="f in faq" :key="f.q" class="py-4">
					<h3 class="font-semibold">{{ f.q }}</h3>
					<p class="mt-1.5 leading-relaxed text-neutral-400">{{ f.a }}</p>
				</div>
			</div>
		</section>

		<section class="mt-14">
			<h2 class="text-2xl font-extrabold tracking-tight">How to cite</h2>
			<p class="mt-4 rounded-xl border border-white/10 bg-black p-5 font-mono text-sm leading-relaxed text-neutral-300">{{ citation }}</p>
		</section>

		<section class="mt-14">
			<h2 class="text-2xl font-extrabold tracking-tight">Columns</h2>
			<div class="mt-4 overflow-x-auto rounded-xl border border-white/10">
				<table class="w-full text-left text-sm">
					<thead class="bg-white/[0.03] text-neutral-400">
						<tr><th class="px-4 py-3 font-semibold">Name</th><th class="px-4 py-3 font-semibold">Type</th><th class="px-4 py-3 font-semibold">Description</th></tr>
					</thead>
					<tbody class="divide-y divide-white/5">
						<tr v-for="c in d.columns" :key="c.name">
							<td class="px-4 py-3 font-mono">{{ c.name }}</td>
							<td class="px-4 py-3 text-neutral-400">{{ c.type }}</td>
							<td class="px-4 py-3 text-neutral-300">{{ c.description }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<section v-if="related.length" class="mt-14">
			<h2 class="text-2xl font-extrabold tracking-tight">More {{ TOPICS[d.topic] }} datasets</h2>
			<div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				<NuxtLink v-for="r in related" :key="r.slug" :to="`/datasets/${r.slug}`" class="group rounded-xl border border-white/10 p-4 hover:border-white/25">
					<h3 class="font-semibold group-hover:text-accent">{{ r.title }}</h3>
					<p class="mt-1 line-clamp-2 text-sm text-neutral-500">{{ r.summary }}</p>
				</NuxtLink>
			</div>
		</section>

		<section v-if="d.preview.length" class="mt-14">
			<h2 class="text-2xl font-extrabold tracking-tight">Preview <span class="text-base font-medium text-neutral-400">latest {{ d.preview.length }} rows</span></h2>
			<div class="mt-4 overflow-x-auto rounded-xl border border-white/10">
				<table class="w-full whitespace-nowrap text-left text-sm">
					<thead class="bg-white/[0.03] text-neutral-400">
						<tr><th v-for="c in d.columns" :key="c.name" class="px-4 py-3 font-mono font-semibold">{{ c.name }}</th></tr>
					</thead>
					<tbody class="divide-y divide-white/5">
						<tr v-for="(row, i) in d.preview" :key="i">
							<td v-for="c in d.columns" :key="c.name" class="max-w-xs truncate px-4 py-2.5" :class="c.type === 'number' ? 'text-right font-mono text-accent' : ''">{{ cell(row[c.name], c.type) }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import { TOPICS } from "#shared/datasets";
const route = useRoute();
const { data: d } = await useFetch(`/api/datasets/${route.params.slug}`);
if (!d.value) throw createError({ statusCode: 404, statusMessage: "Dataset not found", fatal: true });

const cell = (v: unknown, type: string) => (v === null || v === undefined || v === "" ? "-" : type === "number" ? formatNumber(Number(v)) : String(v));

const snippet = computed(() => {
	const base = useRuntimeConfig().public.siteUrl;
	return `import pandas as pd\n\ndf = pd.read_csv("${base}/files/${d.value!.slug}.csv")\n# or, faster for large files (needs pyarrow):\n# df = pd.read_parquet("${base}/files/${d.value!.slug}.parquet")\n\nprint(df.head())`;
});

const site = useRuntimeConfig().public.siteUrl;
const url = `${site}/datasets/${d.value.slug}`;
const { data: all } = await useFetch("/api/datasets", { default: () => [] });
const related = computed(() => all.value.filter((x) => x.topic === d.value!.topic && x.slug !== d.value!.slug).slice(0, 6));
const description = `${d.value.summary} Free CSV and Parquet download, updated daily.`;
// One self-contained sentence an answer engine can quote as is.
const factLine = computed(() => {
	const s = d.value!.stats!;
	const range = s.firstDate ? ` covering ${s.firstDate} to ${s.lastDate}` : "";
	return `${d.value!.title} is a free dataset by Aethereal with ${formatNumber(s.rows)} rows and ${d.value!.columns.length} columns${range}, updated daily at 01:15 UTC and available as CSV and Parquet at ${url}.`;
});
// Direct answers to the questions people ask about a dataset; also FAQPage schema.
const faq = computed(() => {
	const x = d.value!;
	const s = x.stats;
	const range = s?.firstDate ? ` It covers ${s.firstDate} to ${s.lastDate}.` : "";
	return [
		{ q: `What is in the ${x.title} dataset?`, a: `${x.description} It has ${x.columns.length} columns: ${x.columns.map((c) => c.name).join(", ")}.` },
		{ q: `How often is ${x.title} updated?`, a: `Daily at 01:15 UTC.${s ? ` It currently has ${formatNumber(s.rows)} rows and was last updated on ${s.updatedAt.slice(0, 10)}.` : ""}${range}` },
		{ q: `How do I download ${x.title}?`, a: `Download it for free, without an account, as CSV from ${site}/files/${x.slug}.csv or as Parquet from ${site}/files/${x.slug}.parquet. AI assistants can also query it through the MCP server at ${site}/mcp.` },
		{ q: `Can I use ${x.title} in my project?`, a: `License: ${x.license}` },
	];
});
const citation = computed(() => `Aethereal (${new Date().getUTCFullYear()}). ${d.value!.title} [Data set]. Aethereal Data. ${url}. Accessed ${(d.value!.stats?.updatedAt ?? new Date().toISOString()).slice(0, 10)}.`);
useSeoMeta({
	title: `${d.value.title} Dataset (CSV, Parquet)`,
	description,
	ogTitle: `${d.value.title} Dataset`,
	ogDescription: description,
	ogUrl: url,
	robots: d.value.listed ? "index, follow" : "noindex, follow",
});
useHead({
	link: [{ rel: "canonical", href: url }],
	script: [
		{
			type: "application/ld+json",
			innerHTML: JSON.stringify([
				{
				"@context": "https://schema.org",
				"@type": "Dataset",
				name: d.value.title,
				description: d.value.description,
				url,
				license: d.value.license,
				isAccessibleForFree: true,
				keywords: [TOPICS[d.value.topic], "dataset", "csv", "parquet", ...d.value.columns.map((c) => c.name)],
				creator: { "@type": "Organization", name: "Aethereal", url: "https://aethereal.top" },
				citation: citation.value,
				dateModified: d.value.stats?.updatedAt,
				temporalCoverage: d.value.stats?.firstDate ? `${d.value.stats.firstDate}/${d.value.stats.lastDate}` : undefined,
				includedInDataCatalog: { "@type": "DataCatalog", name: "Aethereal Data", url: site },
				variableMeasured: d.value.columns.map((c) => ({ "@type": "PropertyValue", name: c.name, description: c.description })),
				distribution: [
					{ "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${site}/files/${d.value.slug}.csv` },
					{ "@type": "DataDownload", encodingFormat: "application/vnd.apache.parquet", contentUrl: `${site}/files/${d.value.slug}.parquet` },
				],
				},
				{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.value.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
				{
					"@context": "https://schema.org",
					"@type": "BreadcrumbList",
					itemListElement: [
						{ "@type": "ListItem", position: 1, name: "Datasets", item: site },
						{ "@type": "ListItem", position: 2, name: TOPICS[d.value.topic], item: `${site}/topics/${d.value.topic}` },
						{ "@type": "ListItem", position: 3, name: d.value.title, item: url },
					],
				},
			]),
		},
	],
});
</script>

<template>
	<div v-if="d" class="mx-auto max-w-6xl px-4 pb-24 pt-12 md:pt-16">
		<nav class="text-sm text-neutral-400" aria-label="Breadcrumb">
			<NuxtLink to="/" class="hover:text-neutral-950">Datasets</NuxtLink>
			<span class="mx-2">/</span>
			<span>{{ CATEGORY_LABEL[d.category] }}</span>
		</nav>

		<header class="mt-5 grid gap-8 lg:grid-cols-[1fr_320px]">
			<div>
				<h1 class="text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">{{ d.title }}</h1>
				<p class="mt-4 max-w-3xl text-lg leading-relaxed text-neutral-500">{{ d.description }}</p>
			</div>

			<aside class="flex flex-col gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 p-5 text-sm">
				<template v-if="d.stats">
					<a :href="`/files/${d.slug}.csv`" class="flex items-center justify-between rounded-2xl bg-neutral-950 px-4 py-3 font-semibold text-white hover:bg-neutral-800">
						<span><Icon name="ph:download-simple" class="mr-2 align-[-2px]" />Download CSV</span><span class="text-neutral-400">{{ formatBytes(d.stats.csvBytes) }}</span>
					</a>
					<a :href="`/files/${d.slug}.parquet`" class="flex items-center justify-between rounded-2xl border border-neutral-300 bg-white px-4 py-3 font-semibold hover:bg-neutral-100">
						<span><Icon name="ph:download-simple" class="mr-2 align-[-2px]" />Download Parquet</span><span class="text-neutral-400">{{ formatBytes(d.stats.parquetBytes) }}</span>
					</a>
				</template>
				<p v-else class="rounded-2xl bg-white p-4 text-neutral-500">This dataset is being built. Check back in a few minutes.</p>
				<dl class="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-neutral-500">
					<dt>Rows</dt><dd class="text-neutral-950">{{ d.stats ? formatNumber(d.stats.rows) : "-" }}</dd>
					<dt>Updated</dt><dd class="text-neutral-950">{{ d.stats ? formatDate(d.stats.updatedAt) : "-" }}</dd>
					<dt>Schedule</dt><dd class="text-neutral-950">{{ d.schedule }}</dd>
					<dt>License</dt><dd class="text-neutral-950">{{ d.license }}</dd>
				</dl>
			</aside>
		</header>

		<section class="mt-14">
			<h2 class="text-2xl font-extrabold tracking-tight">Load it in Python</h2>
			<pre class="mt-4 overflow-x-auto rounded-2xl bg-neutral-950 p-5 font-mono text-sm leading-relaxed text-neutral-100"><code>{{ snippet }}</code></pre>
		</section>

		<section class="mt-14">
			<h2 class="text-2xl font-extrabold tracking-tight">Columns</h2>
			<div class="mt-4 overflow-x-auto rounded-2xl border border-neutral-200">
				<table class="w-full text-left text-sm">
					<thead class="bg-neutral-50 text-neutral-500">
						<tr><th class="px-4 py-3 font-semibold">Name</th><th class="px-4 py-3 font-semibold">Type</th><th class="px-4 py-3 font-semibold">Description</th></tr>
					</thead>
					<tbody class="divide-y divide-neutral-100">
						<tr v-for="c in d.columns" :key="c.name">
							<td class="px-4 py-3 font-mono">{{ c.name }}</td>
							<td class="px-4 py-3 text-neutral-500">{{ c.type }}</td>
							<td class="px-4 py-3 text-neutral-600">{{ c.description }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<section v-if="d.preview.length" class="mt-14">
			<h2 class="text-2xl font-extrabold tracking-tight">Preview <span class="text-base font-medium text-neutral-400">latest {{ d.preview.length }} rows</span></h2>
			<div class="mt-4 overflow-x-auto rounded-2xl border border-neutral-200">
				<table class="w-full whitespace-nowrap text-left text-sm">
					<thead class="bg-neutral-50 text-neutral-500">
						<tr><th v-for="c in d.columns" :key="c.name" class="px-4 py-3 font-mono font-semibold">{{ c.name }}</th></tr>
					</thead>
					<tbody class="divide-y divide-neutral-100">
						<tr v-for="(row, i) in d.preview" :key="i">
							<td v-for="c in d.columns" :key="c.name" class="max-w-xs truncate px-4 py-2.5" :class="c.type === 'number' ? 'text-right font-mono' : ''">{{ cell(row[c.name], c.type) }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
const route = useRoute();
const { data: d } = await useFetch(`/api/datasets/${route.params.slug}`);
if (!d.value) throw createError({ statusCode: 404, statusMessage: "Dataset not found", fatal: true });

const cell = (v: unknown, type: string) => (v === null || v === undefined || v === "" ? "-" : type === "number" ? formatNumber(Number(v)) : String(v));

const snippet = computed(() => {
	const base = useRuntimeConfig().public.siteUrl;
	return `import pandas as pd\n\ndf = pd.read_csv("${base}/files/${d.value!.slug}.csv")\n# or, faster for large files (needs pyarrow):\n# df = pd.read_parquet("${base}/files/${d.value!.slug}.parquet")\n\nprint(df.head())`;
});

useSeoMeta({ title: d.value.title, description: d.value.summary, ogDescription: d.value.summary });
</script>

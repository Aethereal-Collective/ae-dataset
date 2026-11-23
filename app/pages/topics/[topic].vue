<template>
	<div class="mx-auto max-w-6xl px-4 pb-24 pt-12 md:pt-16">
		<nav class="font-mono text-xs text-neutral-500" aria-label="Breadcrumb">
			<NuxtLink to="/" class="hover:text-white">datasets</NuxtLink>
			<span class="mx-2" aria-hidden="true">/</span>
			<span class="text-neutral-300" aria-current="page">{{ topic.toLowerCase() }}</span>
		</nav>
		<h1 class="mt-5 text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">{{ page.title }}</h1>
		<p class="mt-4 max-w-3xl text-lg leading-relaxed text-neutral-400">{{ page.intro }}</p>
		<NuxtLink v-if="page.linkId" :to="page.linkId.to" class="mt-3 inline-block font-mono text-sm text-accent hover:underline">{{ page.linkId.label }} →</NuxtLink>

		<div class="mt-10 overflow-hidden rounded-xl border border-white/10">
			<NuxtLink v-for="d in items" :key="d.slug" :to="`/datasets/${d.slug}`" class="group grid gap-2 border-b border-white/10 px-5 py-5 last:border-b-0 hover:bg-white/[0.03] md:grid-cols-[1fr_auto] md:items-center md:gap-6">
				<div>
					<h2 class="font-semibold group-hover:text-accent">
						{{ d.title }}
						<span v-if="d.enriched" class="ml-2 rounded bg-accent px-1.5 py-0.5 align-middle font-mono text-[10px] font-semibold text-neutral-950">enriched</span>
					</h2>
					<p class="mt-1 text-sm text-neutral-400">{{ d.summary }}</p>
				</div>
				<p class="flex gap-4 font-mono text-xs text-neutral-500">
					<span v-if="d.stats">{{ formatCompact(d.stats.rows) }} rows</span>
					<span v-if="d.stats?.firstDate">{{ String(d.stats.firstDate).slice(0, 4) }}-{{ String(d.stats.lastDate).slice(0, 4) }}</span>
					<span>CSV · Parquet</span>
				</p>
			</NuxtLink>
		</div>

		<p class="mt-10 text-sm text-neutral-500">
			Other topics:
			<template v-for="(label, id, i) in others" :key="id">
				<NuxtLink :to="`/topics/${id}`" class="text-neutral-300 hover:text-accent">{{ label }}</NuxtLink><span v-if="i < Object.keys(others).length - 1">, </span>
			</template>
		</p>
	</div>
</template>

<script setup lang="ts">
import { TOPICS, type Topic } from "#shared/datasets";
import { TOPIC_PAGES } from "#shared/topics";

const id = useRoute().params.topic as Topic;
if (!TOPICS[id]) throw createError({ statusCode: 404, statusMessage: "Topic not found", fatal: true });
const topic = TOPICS[id];
const page = TOPIC_PAGES[id];
const others = Object.fromEntries(Object.entries(TOPICS).filter(([k]) => k !== id));

const { data } = await useFetch("/api/datasets", { default: () => [] });
const items = computed(() => data.value.filter((d) => d.topic === id));

const site = useRuntimeConfig().public.siteUrl;
const url = `${site}/topics/${id}`;
useSeoMeta({ title: page.title, description: page.description, ogTitle: page.title, ogDescription: page.description, ogUrl: url });
useHead({
	link: [{ rel: "canonical", href: url }],
	script: [
		{
			type: "application/ld+json",
			innerHTML: JSON.stringify([
				{
					"@context": "https://schema.org",
					"@type": "CollectionPage",
					name: page.title,
					description: page.description,
					url,
					hasPart: items.value.map((d) => ({ "@type": "Dataset", name: d.title, description: d.summary, url: `${site}/datasets/${d.slug}` })),
				},
				{
					"@context": "https://schema.org",
					"@type": "BreadcrumbList",
					itemListElement: [
						{ "@type": "ListItem", position: 1, name: "Datasets", item: site },
						{ "@type": "ListItem", position: 2, name: topic, item: url },
					],
				},
			]),
		},
	],
});
</script>

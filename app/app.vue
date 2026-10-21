<template>
	<div class="flex min-h-svh flex-col">
		<SiteNav />
		<main class="flex-1">
			<NuxtPage />
		</main>
		<SiteFooter />
	</div>
</template>

<script setup lang="ts">
const description = "Free, ready-to-use financial datasets: stocks, FX, commodities, macro, and on-chain crypto, by Aethereal.";
useSeoMeta({
	titleTemplate: (t) => (t ? `${t} | Aethereal Data` : "Aethereal Data: Stock, Crypto & Macro Datasets"),
	description,
	ogDescription: description,
	ogSiteName: "Aethereal Data",
	ogType: "website",
	themeColor: "#0a0a0a",
	ogImage: `${useRuntimeConfig().public.siteUrl}/og.png`,
	ogImageWidth: 1200,
	ogImageHeight: 630,
	twitterCard: "summary_large_image",
	twitterSite: "@aethereal_co",
});
</script>

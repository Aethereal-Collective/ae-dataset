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
const description = "Free, ready-to-use datasets for crypto, blockchain, and stock market research, by Aethereal.";
useSeoMeta({
	titleTemplate: (t) => (t ? `${t} — Aethereal Data` : "Aethereal Data — Crypto, Blockchain & Stock Datasets"),
	description,
	ogDescription: description,
	ogSiteName: "Aethereal Data",
	ogType: "website",
	themeColor: "#ffffff",
});
</script>

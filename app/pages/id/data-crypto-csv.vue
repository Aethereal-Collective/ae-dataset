<template>
	<div class="mx-auto max-w-4xl px-4 pb-24 pt-12 md:pt-16">
		<nav class="font-mono text-xs text-neutral-500" aria-label="Breadcrumb">
			<NuxtLink to="/" class="hover:text-white">datasets</NuxtLink>
			<span class="mx-2" aria-hidden="true">/</span>
			<NuxtLink to="/topics/markets" class="hover:text-white">markets</NuxtLink>
			<span class="mx-2" aria-hidden="true">/</span>
			<span class="text-neutral-300" aria-current="page">data crypto csv</span>
		</nav>
		<h1 class="mt-5 text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">Dataset Harga Crypto, Bitcoin &amp; On-Chain Gratis (CSV)</h1>
		<p class="mt-5 text-lg leading-relaxed text-neutral-400">
			Download gratis data historis harga harian Bitcoin, Ethereum, Solana, dan 27 koin utama lainnya, plus fitur machine learning, metrik jaringan Bitcoin sejak 2009, suplai stablecoin, TVL DeFi, dan riwayat hack kripto. Format CSV &amp; Parquet, update setiap hari.
		</p>

		<div class="mt-10 overflow-hidden rounded-xl border border-white/10">
			<NuxtLink v-for="d in items" :key="d.slug" :to="`/datasets/${d.slug}`" class="group block border-b border-white/10 px-5 py-5 last:border-b-0 hover:bg-white/[0.03]">
				<h2 class="font-semibold group-hover:text-accent">{{ d.label }}</h2>
				<p class="mt-1 text-sm text-neutral-400">{{ d.body }}</p>
				<p v-if="d.stats" class="mt-2 font-mono text-xs text-neutral-500">{{ formatNumber(d.stats.rows) }} baris · {{ d.stats.firstDate }} sampai {{ d.stats.lastDate }} · CSV dan Parquet</p>
			</NuxtLink>
		</div>

		<section class="mt-14">
			<h2 class="text-2xl font-extrabold tracking-tight">Ambil data harga Bitcoin &amp; crypto dengan Python</h2>
			<pre role="region" aria-label="Contoh kode Python untuk data harga crypto" tabindex="0" class="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black p-5 font-mono text-sm leading-relaxed text-neutral-100"><code>{{ code }}</code></pre>
		</section>

		<section class="mt-14">
			<h2 class="text-2xl font-extrabold tracking-tight">Pertanyaan umum</h2>
			<div class="mt-6 divide-y divide-white/10 border-y border-white/10">
				<div v-for="f in FAQ" :key="f.q" class="py-5">
					<h3 class="font-semibold">{{ f.q }}</h3>
					<p class="mt-2 leading-relaxed text-neutral-400">{{ f.a }}</p>
				</div>
			</div>
		</section>

		<p class="mt-12 text-sm text-neutral-500">
			Halaman data Indonesia lainnya:
			<NuxtLink to="/id/data-saham-idx" class="text-neutral-300 hover:text-accent">Data Saham IDX &amp; IHSG</NuxtLink>,
			<NuxtLink to="/id/data-kurs-usd-idr" class="text-neutral-300 hover:text-accent">Data Kurs USD/IDR</NuxtLink>.
		</p>
	</div>
</template>

<script setup lang="ts">
const site = useRuntimeConfig().public.siteUrl;
const url = `${site}/id/data-crypto-csv`;

const LIST = [
	{ slug: "crypto-prices", label: "Harga Harian 30 Crypto Utama (BTC, ETH, SOL, XRP)", body: "Data OHLCV harian (open, high, low, close, volume) dalam USD sejak hari pertama perdagangan tiap koin." },
	{ slug: "crypto-features", label: "Fitur Machine Learning Crypto (RSI, Volatilitas, Beta)", body: "Return 1/5/20 hari, volatilitas, moving average, RSI, drawdown, serta beta dan korelasi terhadap Bitcoin untuk 30 koin." },
	{ slug: "bitcoin-network-daily", label: "Data On-Chain Jaringan Bitcoin sejak 2009", body: "Harga, hashrate, difficulty, jumlah transaksi, biaya jaringan, dan pendapatan miner harian sejak blok genesis." },
	{ slug: "stablecoin-market-cap-history", label: "Sejarah Market Cap & Suplai Stablecoin", body: "Total suplai stablecoin USD sejak 2017 untuk memantau likuiditas pasar kripto." },
	{ slug: "hacks-enriched", label: "Riwayat Hack Crypto & DeFi Lengkap", body: "Seluruh insiden eksploitasi dan hack kripto lengkap dengan nilai kerugian disesuaikan inflasi, vektor serangan, dan tingkat pemulihan dana." },
];

const { data } = await useFetch("/api/datasets", { default: () => [] });
const items = computed(() => LIST.map((l) => ({ ...l, stats: data.value.find((d) => d.slug === l.slug)?.stats })));

const code = `import pandas as pd

crypto = pd.read_csv("${site}/files/crypto-prices.csv", parse_dates=["date"])
btc = crypto[crypto.symbol == "BTC"].set_index("date")

print(btc[["open", "high", "low", "close", "volume"]].tail())`;

const FAQ = [
	{ q: "Di mana download dataset harga Bitcoin dan crypto gratis dalam CSV?", a: `Di ${site}/datasets/crypto-prices. Berisi data OHLCV harian untuk 30 aset kripto terbesar dalam format CSV dan Parquet, gratis tanpa API key atau registrasi.` },
	{ q: "Apakah tersedia data on-chain dan DeFi?", a: "Ya. Selain harga harian, tersedia data jaringan Bitcoin sejak 2009, suplai stablecoin per chain, volume DEX, TVL protokol DeFi, cadangan exchange (CEX), hingga dataset 160K+ domain phishing kripto." },
	{ q: "Bisa dipakai untuk skripsi atau proyek machine learning?", a: "Bisa. Dataset fitur (crypto-features) sudah menghitung RSI, volatilitas, SMA, drawdown, dan beta ke BTC tanpa data leakage, siap dipakai langsung di Python/pandas." },
	{ q: "Seberapa sering datanya diperbarui?", a: "Setiap hari pukul 01:15 UTC (08:15 WIB), dan juga bisa di-query langsung dari Claude atau Cursor melalui server MCP gratis." },
];

useSeoMeta({
	title: "Dataset Harga Crypto, Bitcoin & On-Chain Gratis (CSV, Parquet)",
	description: "Download gratis data historis harga Bitcoin, Ethereum, Solana (30 koin), fitur ML crypto, data jaringan Bitcoin sejak 2009, dan DeFi dalam CSV & Parquet. Update harian.",
	ogTitle: "Dataset Harga Crypto & Bitcoin Gratis (CSV)",
	ogDescription: "Data historis 30 crypto utama, metrik on-chain Bitcoin, stablecoin, dan DeFi dalam CSV & Parquet.",
	ogUrl: url,
	ogLocale: "id_ID",
});
useHead({
	htmlAttrs: { lang: "id" },
	link: [{ rel: "canonical", href: url }],
	script: [
		{
			type: "application/ld+json",
			innerHTML: JSON.stringify([
				{ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: "id", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
				{
					"@context": "https://schema.org",
					"@type": "CollectionPage",
					inLanguage: "id",
					name: "Dataset Harga Crypto, Bitcoin & On-Chain Gratis",
					url,
					hasPart: LIST.map((l) => ({ "@type": "Dataset", name: l.label, description: l.body, url: `${site}/datasets/${l.slug}` })),
				},
				{
					"@context": "https://schema.org",
					"@type": "BreadcrumbList",
					itemListElement: [
						{ "@type": "ListItem", position: 1, name: "Datasets", item: site },
						{ "@type": "ListItem", position: 2, name: "Markets", item: `${site}/topics/markets` },
						{ "@type": "ListItem", position: 3, name: "Data Crypto CSV", item: url },
					],
				},
			]),
		},
	],
});
</script>

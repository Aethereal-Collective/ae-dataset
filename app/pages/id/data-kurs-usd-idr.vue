<template>
	<div class="mx-auto max-w-4xl px-4 pb-24 pt-12 md:pt-16">
		<nav class="font-mono text-xs text-neutral-500" aria-label="Breadcrumb">
			<NuxtLink to="/" class="hover:text-white">datasets</NuxtLink>
			<span class="mx-2" aria-hidden="true">/</span>
			<NuxtLink to="/topics/markets" class="hover:text-white">markets</NuxtLink>
			<span class="mx-2" aria-hidden="true">/</span>
			<span class="text-neutral-300" aria-current="page">data kurs usd idr</span>
		</nav>
		<h1 class="mt-5 text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">Data Historis Kurs USD/IDR &amp; Forex, Gratis dalam CSV</h1>
		<p class="mt-5 text-lg leading-relaxed text-neutral-400">
			Kurs harian rupiah terhadap dolar AS (USD/IDR) sejak tahun 2000 bersama 23 mata uang utama dunia, dilengkapi data suku bunga AS, inflasi, dan perbandingan lintas aset (IHSG, emas, Bitcoin). Gratis tanpa akun, diperbarui setiap hari.
		</p>

		<div class="mt-10 overflow-hidden rounded-xl border border-white/10">
			<NuxtLink v-for="d in items" :key="d.slug" :to="`/datasets/${d.slug}`" class="group block border-b border-white/10 px-5 py-5 last:border-b-0 hover:bg-white/[0.03]">
				<h2 class="font-semibold group-hover:text-accent">{{ d.label }}</h2>
				<p class="mt-1 text-sm text-neutral-400">{{ d.body }}</p>
				<p v-if="d.stats" class="mt-2 font-mono text-xs text-neutral-500">{{ formatNumber(d.stats.rows) }} baris · {{ d.stats.firstDate }} sampai {{ d.stats.lastDate }} · CSV dan Parquet</p>
			</NuxtLink>
		</div>

		<section class="mt-14">
			<h2 class="text-2xl font-extrabold tracking-tight">Ambil data kurs USD/IDR dengan Python</h2>
			<pre role="region" aria-label="Contoh kode Python untuk kurs USD/IDR" tabindex="0" class="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black p-5 font-mono text-sm leading-relaxed text-neutral-100"><code>{{ code }}</code></pre>
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
			<NuxtLink to="/id/data-crypto-csv" class="text-neutral-300 hover:text-accent">Data Historis Crypto &amp; Bitcoin</NuxtLink>.
		</p>
	</div>
</template>

<script setup lang="ts">
const site = useRuntimeConfig().public.siteUrl;
const url = `${site}/id/data-kurs-usd-idr`;

const LIST = [
	{ slug: "fx-rates", label: "Kurs USD/IDR & 24 Mata Uang Harian", body: "Open, high, low, dan close harian nilai tukar dolar AS terhadap rupiah (IDR), EUR, JPY, SGD, MYR, CNY, dan 18 mata uang lain sejak 2000." },
	{ slug: "cross-asset-daily", label: "USD/IDR vs IHSG, Emas, Minyak, & Bitcoin", body: "Panel harian gabungan yang menyelaraskan kurs USD/IDR dengan IHSG, S&P 500, emas, minyak Brent, DXY, yield US 10Y, dan Bitcoin." },
	{ slug: "us-rates-daily", label: "Suku Bunga The Fed & US Treasury Yield", body: "Fed funds rate harian dan yield obligasi AS 3 bulan sampai 30 tahun sejak 1954 — faktor utama pergerakan USD/IDR." },
	{ slug: "idx-stock-features", label: "Harga Saham IDX dalam USD", body: "120 saham BEI dengan harga penutupan yang sudah dikonversi ke USD menggunakan kurs USD/IDR harian." },
];

const { data } = await useFetch("/api/datasets", { default: () => [] });
const items = computed(() => LIST.map((l) => ({ ...l, stats: data.value.find((d) => d.slug === l.slug)?.stats })));

const code = `import pandas as pd

fx = pd.read_csv("${site}/files/fx-rates.csv", parse_dates=["date"])
idr = fx[fx.currency == "IDR"].set_index("date")

print(idr[["open", "high", "low", "close"]].tail())`;

const FAQ = [
	{ q: "Di mana download data historis kurs USD/IDR dalam CSV?", a: `Di ${site}/datasets/fx-rates. Dataset berisi kurs harian USD terhadap IDR dan 23 mata uang lain sejak tahun 2000 dalam format CSV (siap buka di Excel) dan Parquet, gratis tanpa daftar akun.` },
	{ q: "Apakah data kurs USD/IDR bisa langsung dibuka di Excel?", a: "Bisa. Klik tombol Download CSV, lalu buka langsung di Microsoft Excel atau Google Sheets. Semua angka dan tanggal sudah rapi." },
	{ q: "Seberapa sering data kurs diperbarui?", a: "Otomatis diperbarui setiap hari pukul 01:15 UTC (08:15 WIB)." },
	{ q: "Apakah ada data korelasi USD/IDR dengan IHSG dan suku bunga The Fed?", a: `Ada. Dataset Cross-Asset Daily Panel di ${site}/datasets/cross-asset-daily menggabungkan USD/IDR, IHSG, DXY, US 10Y yield, Fed Funds rate, emas, dan Bitcoin dalam satu tabel harian.` },
];

useSeoMeta({
	title: "Data Historis Kurs USD/IDR & Forex Gratis (CSV, Excel)",
	description: "Download gratis data historis kurs harian USD/IDR (dolar ke rupiah) sejak 2000 bersama 23 mata uang lain dalam CSV dan Parquet. Diperbarui setiap hari tanpa akun.",
	ogTitle: "Data Historis Kurs USD/IDR Gratis (CSV & Parquet)",
	ogDescription: "Kurs harian rupiah terhadap dolar AS sejak 2000 dalam CSV dan Parquet, gratis tanpa daftar akun.",
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
					name: "Data Historis Kurs USD/IDR & Forex",
					url,
					hasPart: LIST.map((l) => ({ "@type": "Dataset", name: l.label, description: l.body, url: `${site}/datasets/${l.slug}` })),
				},
				{
					"@context": "https://schema.org",
					"@type": "BreadcrumbList",
					itemListElement: [
						{ "@type": "ListItem", position: 1, name: "Datasets", item: site },
						{ "@type": "ListItem", position: 2, name: "Markets", item: `${site}/topics/markets` },
						{ "@type": "ListItem", position: 3, name: "Data Kurs USD/IDR", item: url },
					],
				},
			]),
		},
	],
});
</script>

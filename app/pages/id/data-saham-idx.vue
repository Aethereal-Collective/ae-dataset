<template>
	<div class="mx-auto max-w-4xl px-4 pb-24 pt-12 md:pt-16">
		<nav class="font-mono text-xs text-neutral-500" aria-label="Breadcrumb">
			<NuxtLink to="/" class="hover:text-white">datasets</NuxtLink>
			<span class="mx-2">/</span>
			<NuxtLink to="/topics/stocks" class="hover:text-white">stocks</NuxtLink>
			<span class="mx-2">/</span>
			<span class="text-neutral-300">data saham idx</span>
		</nav>
		<h1 class="mt-5 text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">Data Historis Saham IDX dan IHSG, Gratis dalam CSV</h1>
		<p class="mt-5 text-lg leading-relaxed text-neutral-400">
			Harga harian saham Bursa Efek Indonesia (BEI), indeks IHSG dan LQ45, kurs USD/IDR, dan fitur siap pakai untuk analisis atau machine learning. Semua bisa diunduh gratis tanpa daftar akun, dan diperbarui setiap hari.
		</p>

		<div class="mt-10 overflow-hidden rounded-xl border border-white/10">
			<NuxtLink v-for="d in items" :key="d.slug" :to="`/datasets/${d.slug}`" class="group block border-b border-white/10 px-5 py-5 last:border-b-0 hover:bg-white/[0.03]">
				<h2 class="font-semibold group-hover:text-accent">{{ d.label }}</h2>
				<p class="mt-1 text-sm text-neutral-400">{{ d.body }}</p>
				<p v-if="d.stats" class="mt-2 font-mono text-xs text-neutral-500">{{ formatNumber(d.stats.rows) }} baris · {{ d.stats.firstDate }} sampai {{ d.stats.lastDate }} · CSV dan Parquet</p>
			</NuxtLink>
		</div>

		<section class="mt-14">
			<h2 class="text-2xl font-extrabold tracking-tight">Ambil datanya dengan Python</h2>
			<pre role="region" aria-label="Contoh kode Python untuk data saham IDX" tabindex="0" class="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black p-5 font-mono text-sm leading-relaxed text-neutral-100"><code>{{ code }}</code></pre>
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
			<NuxtLink to="/id/data-kurs-usd-idr" class="text-neutral-300 hover:text-accent">Data Kurs USD/IDR</NuxtLink>,
			<NuxtLink to="/id/data-crypto-csv" class="text-neutral-300 hover:text-accent">Data Historis Crypto &amp; Bitcoin</NuxtLink>.
		</p>
	</div>
</template>

<script setup lang="ts">
const site = useRuntimeConfig().public.siteUrl;
const url = `${site}/id/data-saham-idx`;

const LIST = [
	{ slug: "idx-stock-prices", label: "Harga Saham IDX Harian", body: "Open, high, low, close, adjusted close, dan volume untuk 120 saham paling aktif di BEI, dari hari pertama data tersedia." },
	{ slug: "idx-stock-features", label: "Fitur Saham IDX (siap untuk machine learning)", body: "Return 1, 5, dan 20 hari, volatilitas, moving average, RSI, drawdown, beta dan korelasi terhadap IHSG, nilai transaksi, dan harga dalam USD." },
	{ slug: "global-indices", label: "IHSG, LQ45, dan indeks global", body: "Level harian IHSG (IDX Composite) dan LQ45, bersama S&P 500, Nikkei, Hang Seng, STI, dan 25 indeks lain." },
	{ slug: "fx-rates", label: "Kurs USD/IDR", body: "Kurs harian rupiah terhadap dolar AS sejak 2000, bersama 23 mata uang lain." },
	{ slug: "cross-asset-daily", label: "IHSG vs Bitcoin, emas, dan suku bunga", body: "Satu tabel harian berisi IHSG, S&P 500, Bitcoin, emas, minyak, USD/IDR, yield obligasi AS, dan lainnya, siap untuk analisis korelasi." },
];

const { data } = await useFetch("/api/datasets", { default: () => [] });
const items = computed(() => LIST.map((l) => ({ ...l, stats: data.value.find((d) => d.slug === l.slug)?.stats })));

const code = `import pandas as pd

harga = pd.read_csv("${site}/files/idx-stock-prices.csv", parse_dates=["date"])
bbca = harga[harga.ticker == "BBCA"].set_index("date")

print(bbca[["close", "volume"]].tail())`;

const FAQ = [
	{ q: "Di mana download data historis saham IDX gratis?", a: `Di ${site}/datasets/idx-stock-prices. Datanya berisi harga harian 120 saham paling aktif di Bursa Efek Indonesia dalam format CSV dan Parquet, gratis tanpa akun, dan diperbarui setiap hari.` },
	{ q: "Apakah ada data historis IHSG?", a: "Ada. Dataset Global Stock Indices berisi level harian IHSG (^JKSE) dan LQ45, serta indeks utama dunia." },
	{ q: "Saham apa saja yang tersedia?", a: "120 saham paling aktif di BEI, termasuk BBCA, BBRI, BMRI, TLKM, ASII, GOTO, ANTM, dan ADRO. Saham yang sudah delisting tidak termasuk, jadi perhatikan survivorship bias saat backtest." },
	{ q: "Seberapa sering datanya diperbarui?", a: "Setiap hari pukul 01:15 UTC (08:15 WIB)." },
	{ q: "Bisa dipakai lewat ChatGPT atau Claude?", a: `Bisa. Hubungkan asisten AI kamu ke server MCP di ${site}/mcp, lalu tanya langsung, misalnya "berapa return rata-rata BBCA tahun 2025?"` },
];

useSeoMeta({
	title: "Data Historis Saham IDX dan IHSG Gratis (CSV)",
	description: "Download gratis data historis harga saham IDX, IHSG, LQ45, dan kurs USD/IDR dalam CSV dan Parquet. Diperbarui setiap hari, tanpa daftar akun.",
	ogTitle: "Data Historis Saham IDX dan IHSG Gratis",
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
					name: "Data Historis Saham IDX dan IHSG",
					url,
					hasPart: LIST.map((l) => ({ "@type": "Dataset", name: l.label, description: l.body, url: `${site}/datasets/${l.slug}` })),
				},
			]),
		},
	],
});
</script>

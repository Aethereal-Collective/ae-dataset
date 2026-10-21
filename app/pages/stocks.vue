<template>
	<div class="mx-auto max-w-3xl px-4 pb-24 pt-12 md:pt-16">
		<h1 class="text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">Stock market data</h1>
		<p class="mt-4 text-lg leading-relaxed text-neutral-400">
			Exchange price data, including IDX (Bursa Efek Indonesia), comes with licenses that don't allow us to redistribute it as files. Instead, pull it yourself in a few lines of Python.
		</p>

		<section class="mt-12">
			<h2 class="text-2xl font-extrabold tracking-tight">IDX daily prices with yfinance</h2>
			<p class="mt-3 text-neutral-400">IDX tickers use the <code class="font-mono">.JK</code> suffix; the IDX Composite (IHSG) is <code class="font-mono">^JKSE</code>.</p>
			<pre class="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black p-5 font-mono text-sm leading-relaxed text-neutral-100"><code>{{ idx }}</code></pre>
		</section>

		<section class="mt-12">
			<h2 class="text-2xl font-extrabold tracking-tight">Combine with our crypto data</h2>
			<p class="mt-3 text-neutral-400">For example, compare IHSG with total stablecoin supply from our on-chain dataset.</p>
			<pre class="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black p-5 font-mono text-sm leading-relaxed text-neutral-100"><code>{{ combine }}</code></pre>
		</section>

		<p class="mt-12 text-sm text-neutral-400">yfinance is an open-source library that reads Yahoo Finance; check Yahoo's terms for your use case.</p>
	</div>
</template>

<script setup lang="ts">
const origin = useRuntimeConfig().public.siteUrl;

const idx = `# pip install yfinance
import yfinance as yf

df = yf.download(["BBCA.JK", "BBRI.JK", "^JKSE"], start="2024-01-01", interval="1d")
close = df["Close"]
print(close.tail())`;

const combine = `import pandas as pd
import yfinance as yf

ihsg = yf.download("^JKSE", start="2025-01-01")["Close"].squeeze().rename("ihsg")
supply = pd.read_csv("${origin}/files/stablecoin-supply-onchain.csv", parse_dates=["date"])
stable = supply.groupby("date")["total_supply"].sum().rename("stablecoin_supply")

joined = pd.concat([ihsg, stable], axis=1).dropna()
print(joined.corr())`;

useSeoMeta({ title: "Stocks", description: "How to pull IDX and other stock market data in Python, and combine it with crypto datasets." });
</script>

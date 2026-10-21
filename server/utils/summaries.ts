// Small per-dataset summaries for the catalog: a sparkline series and one headline number.
type Row = Record<string, string | number | null>;
export interface Summary {
	spark: number[];
	figure: { label: string; value: number; unit: "usd" | "count" | "pct" };
}

const sumBy = (rows: Row[], key: (r: Row) => string, value: string) => {
	const m = new Map<string, number>();
	for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + Number(r[value] ?? 0));
	return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
};

// Last n non-null values of one column, oldest first, optionally for one series.
const series = (rows: Row[], value: string, n: number, only?: (r: Row) => boolean) =>
	rows
		.filter((r) => (!only || only(r)) && r[value] != null)
		.sort((a, b) => String(a.date ?? a.year).localeCompare(String(b.date ?? b.year)))
		.slice(-n)
		.map((r) => Number(r[value]));
const top = (rows: Row[], value: string, n: number) => rows.slice(0, n).map((r) => Number(r[value] ?? 0));
const total = (rows: Row[], value: string) => rows.reduce((s, r) => s + Number(r[value] ?? 0), 0);
const distinct = (rows: Row[], key: string) => new Set(rows.map((r) => r[key])).size;
const last = (xs: number[]) => xs.at(-1) ?? 0;
const is = (key: string, v: string) => (r: Row) => r[key] === v;

// Share of names above their 200-day average each day: market breadth.
const breadth = (rows: Row[], label: string): Summary => {
	const m = new Map<string, [number, number]>();
	for (const r of rows) {
		if (r.sma_200 == null) continue;
		const [up, n] = m.get(String(r.date)) ?? [0, 0];
		m.set(String(r.date), [up + (Number(r.close) > Number(r.sma_200) ? 1 : 0), n + 1]);
	}
	const s = [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-250).map(([, [up, n]]) => (up / n) * 100);
	return { spark: s, figure: { label, value: Math.round(last(s) * 10) / 10, unit: "pct" } };
};

const SUMMARIES: Record<string, (rows: Row[]) => Summary> = {
	"stablecoin-supply-onchain": (rows) => {
		const daily = sumBy(rows, (r) => String(r.date), "total_supply");
		// ponytail: until there's a month of history, show today's supply per contract instead of a flat line.
		const latest = rows.filter((r) => r.date === daily.at(-1)?.[0]).map((r) => Number(r.total_supply)).sort((a, b) => b - a);
		return { spark: daily.length >= 30 ? daily.map(([, v]) => v) : latest, figure: { label: "USDT + USDC supply", value: daily.at(-1)?.[1] ?? 0, unit: "usd" } };
	},
	"chain-tvl-history": (rows) => {
		const daily = sumBy(rows, (r) => String(r.date), "tvl_usd").slice(-365);
		return { spark: daily.map(([, v]) => v), figure: { label: "TVL, top 25 chains", value: daily.at(-1)?.[1] ?? 0, unit: "usd" } };
	},
	"stablecoin-market-cap-history": (rows) => {
		const last = rows.slice(-365);
		return { spark: last.map((r) => Number(r.circulating_usd)), figure: { label: "USD stablecoins in circulation", value: Number(last.at(-1)?.circulating_usd ?? 0), unit: "usd" } };
	},
	"stablecoin-market": (rows) => {
		const top = rows.slice(0, 12);
		return { spark: top.map((r) => Number(r.circulating_usd)), figure: { label: "USD stablecoins tracked", value: rows.length, unit: "count" } };
	},
	"defi-protocols": (rows) => ({
		spark: rows.slice(0, 20).map((r) => Number(r.tvl_usd)),
		figure: { label: "DeFi protocols with TVL", value: rows.length, unit: "count" },
	}),
	"yield-pools": (rows) => {
		const median = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
		const stable = rows.filter((r) => r.stablecoin === "yes" && Number(r.tvl_usd) > 1e6).map((r) => Number(r.apy ?? 0));
		return { spark: rows.slice(0, 20).map((r) => Number(r.apy ?? 0)), figure: { label: "Median stablecoin APY, pools over $1M", value: median(stable), unit: "pct" } };
	},
	"dex-volume-history": (rows) => {
		const last = rows.slice(-90);
		return { spark: last.map((r) => Number(r.volume_usd)), figure: { label: "DEX volume, last 24h", value: Number(last.at(-1)?.volume_usd ?? 0), unit: "usd" } };
	},
	"cex-reserves": (rows) => ({
		spark: rows.slice(0, 12).map((r) => Number(r.assets_usd)),
		figure: { label: "Held on-chain by exchanges", value: rows.reduce((s, r) => s + Number(r.assets_usd ?? 0), 0), unit: "usd" },
	}),
	"bitcoin-network-daily": (rows) => {
		const s = series(rows, "price_usd", 365);
		return { spark: s, figure: { label: "Bitcoin price", value: last(s), unit: "usd" } };
	},
	"bitcoin-difficulty-adjustments": (rows) => ({ spark: series(rows, "difficulty", 60), figure: { label: "Difficulty adjustments since 2009", value: rows.length, unit: "count" } }),
	"bitcoin-mining-pools": (rows) => ({ spark: top(rows, "blocks", 12), figure: { label: `${rows[0]?.pool} share of blocks`, value: Number(rows[0]?.share_pct ?? 0), unit: "pct" } }),
	"lightning-network-history": (rows) => {
		const s = series(rows, "capacity_btc", 365);
		return { spark: s, figure: { label: "Lightning capacity, BTC", value: Math.round(last(s)), unit: "count" } };
	},
	"l2-daily-metrics": (rows) => {
		const daily = sumBy(rows, (r) => String(r.date), "transactions").slice(-90);
		return { spark: daily.map(([, v]) => v), figure: { label: "L2 transactions, latest day", value: daily.at(-1)?.[1] ?? 0, unit: "count" } };
	},
	"l2-projects": (rows) => ({ spark: top(rows, "tvs_usd", 15), figure: { label: "Value secured by L2s", value: total(rows, "tvs_usd"), unit: "usd" } }),
	"evm-gas-daily": (rows) => {
		const eth = series(rows, "base_fee_gwei", 90, is("chain", "ethereum"));
		return { spark: eth.length > 2 ? eth : rows.filter((r) => r.date === rows.at(-1)?.date).map((r) => Number(r.gas_used_ratio)), figure: { label: "Ethereum base fee, gwei", value: last(eth), unit: "count" } };
	},
	"solana-throughput-daily": (rows) => {
		const s = series(rows, "tps", 90);
		return { spark: s, figure: { label: "Solana TPS", value: Math.round(last(s)), unit: "count" } };
	},
	"protocol-fees": (rows) => ({ spark: top(rows, "fees_30d_usd", 20), figure: { label: "Protocol fees, last 30 days", value: total(rows, "fees_30d_usd"), unit: "usd" } }),
	"dex-protocols": (rows) => ({ spark: top(rows, "volume_30d_usd", 20), figure: { label: "DEX volume, last 30 days", value: total(rows, "volume_30d_usd"), unit: "usd" } }),
	"defi-fees-volume-history": (rows) => {
		const s = series(rows, "fees_usd", 365);
		return { spark: s, figure: { label: "DeFi fees, latest day", value: last(s), unit: "usd" } };
	},
	"stablecoins-by-chain": (rows) => ({ spark: top(rows, "circulating_usd", 12), figure: { label: "Chains with stablecoins", value: rows.length, unit: "count" } }),
	"lending-markets": (rows) => ({ spark: top(rows, "supply_usd", 20), figure: { label: "Supplied to lending markets", value: total(rows, "supply_usd"), unit: "usd" } }),
	"idx-stock-prices": (rows) => ({ spark: series(rows, "close", 365, is("ticker", "BBCA")), figure: { label: "IDX stocks covered", value: distinct(rows, "ticker"), unit: "count" } }),
	"sp500-stock-prices": (rows) => ({ spark: series(rows, "close", 365, is("ticker", "AAPL")), figure: { label: "S&P 500 stocks covered", value: distinct(rows, "ticker"), unit: "count" } }),
	"sp500-companies": (rows) => ({ spark: sumBy(rows.map((r) => ({ ...r, n: 1 })), (r) => String(r.sector), "n").map(([, v]) => v).sort((a, b) => b - a), figure: { label: "S&P 500 companies", value: rows.length, unit: "count" } }),
	"global-indices": (rows) => {
		const s = series(rows, "close", 365, is("symbol", "^JKSE"));
		return { spark: s, figure: { label: "IHSG", value: Math.round(last(s)), unit: "count" } };
	},
	"commodity-prices": (rows) => {
		const s = series(rows, "close", 365, is("symbol", "GC=F"));
		return { spark: s, figure: { label: "Gold, per ounce", value: last(s), unit: "usd" } };
	},
	"fx-rates": (rows) => {
		const s = series(rows, "close", 365, is("symbol", "IDR=X"));
		return { spark: s, figure: { label: "USD/IDR", value: Math.round(last(s)), unit: "count" } };
	},
	"crypto-prices": (rows) => ({ spark: series(rows, "close", 365, is("symbol", "ETH-USD")), figure: { label: "Coins covered", value: distinct(rows, "symbol"), unit: "count" } }),
	"us-rates-daily": (rows) => {
		const s = series(rows, "treasury_10y_pct", 365);
		return { spark: s, figure: { label: "US 10-year Treasury yield", value: last(s), unit: "pct" } };
	},
	"us-macro-monthly": (rows) => {
		const s = series(rows, "unemployment_pct", 120);
		return { spark: s, figure: { label: "US unemployment rate", value: last(s), unit: "pct" } };
	},
	"world-macro-annual": (rows) => ({ spark: series(rows, "gdp_usd", 40, is("iso3", "IDN")), figure: { label: "Countries and regions", value: distinct(rows, "iso3"), unit: "count" } }),
	"cross-asset-daily": (rows) => ({ spark: series(rows, "btc", 365), figure: { label: "Assets and macro series, one calendar", value: 14, unit: "count" } }),
	"idx-stock-features": (rows) => breadth(rows, "IDX stocks above their 200-day average"),
	"crypto-features": (rows) => breadth(rows, "Coins above their 200-day average"),
	"defi-protocol-status": (rows) => {
		const gone = rows.filter((r) => r.status !== "active" && r.status !== "website_down");
		const byYear = sumBy(gone.filter((r) => r.dead_date).map((r) => ({ ...r, n: 1 })), (r) => String(r.dead_date).slice(0, 4), "n");
		return { spark: byYear.map(([, v]) => v), figure: { label: "Protocols dead, rugged, or deprecated", value: gone.length, unit: "count" } };
	},
	"hacks-enriched": (rows) => {
		const yearly = sumBy(rows, (r) => String(r.year), "amount_usd_real");
		return { spark: yearly.map(([, v]) => v), figure: { label: "Lost to hacks, in today's dollars", value: total(rows, "amount_usd_real"), unit: "usd" } };
	},
	"stablecoin-flows-by-chain": (rows) => {
		const daily = sumBy(rows, (r) => String(r.date), "flow_1d_usd").slice(-180);
		const latest = rows.filter((r) => r.date === rows.at(-1)?.date);
		return { spark: daily.map(([, v]) => v), figure: { label: "Stablecoin net inflow, last 30 days", value: total(latest, "flow_30d_usd"), unit: "usd" } };
	},
	"phishing-domains-labeled": (rows) => {
		const hist = Array.from({ length: 5 }, (_, d) => rows.filter((r) => r.label === "phishing" && r.brand_distance === d).length);
		return { spark: hist, figure: { label: "Phishing domains labeled", value: rows.filter((r) => r.label === "phishing").length, unit: "count" } };
	},
};

export const summarize = (slug: string, rows: Row[]): Summary | null => (rows.length && SUMMARIES[slug] ? SUMMARIES[slug]!(rows) : null);

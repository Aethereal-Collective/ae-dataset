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
	"crypto-hacks": (rows) => {
		const monthly = sumBy(rows, (r) => String(r.date).slice(0, 7), "amount_usd").slice(-24);
		const year = new Date().getUTCFullYear().toString();
		const lost = rows.filter((r) => String(r.date).startsWith(year)).reduce((s, r) => s + Number(r.amount_usd ?? 0), 0);
		return { spark: monthly.map(([, v]) => v), figure: { label: `Lost to hacks in ${year}`, value: lost, unit: "usd" } };
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
};

// Rows files can be a few MB; recompute only when a dataset is rebuilt.
const cache = new Map<string, { updatedAt: string; summary: Summary | null }>();

export function summarize(slug: string, updatedAt: string | undefined): Summary | null {
	if (!updatedAt || !SUMMARIES[slug]) return null;
	const hit = cache.get(slug);
	if (hit?.updatedAt === updatedAt) return hit.summary;
	const summary = SUMMARIES[slug]!(readRows(slug));
	cache.set(slug, { updatedAt, summary });
	return summary;
}

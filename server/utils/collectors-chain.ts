// Bitcoin, L2 and network collectors. Same contract as collectors.ts: rows matching the registry columns.
import { RPC, day, getJson } from "./collectors";

type Row = Record<string, string | number | null>;
const today = () => new Date().toISOString().slice(0, 10);
const round = (n: number | null | undefined, digits = 2) => (n == null || !Number.isFinite(n) ? null : Math.round(n * 10 ** digits) / 10 ** digits);

// --- Bitcoin -------------------------------------------------------------------------------

const BTC_CHARTS: [column: string, chart: string][] = [
	["price_usd", "market-price"],
	["hashrate_ths", "hash-rate"],
	["difficulty", "difficulty"],
	["transactions", "n-transactions"],
	["unique_addresses", "n-unique-addresses"],
	["tx_per_block", "n-transactions-per-block"],
	["avg_block_size_mb", "avg-block-size"],
	["fees_btc", "transaction-fees"],
	["miners_revenue_usd", "miners-revenue"],
	["cost_per_tx_usd", "cost-per-transaction"],
	["tx_volume_usd", "estimated-transaction-volume-usd"],
];

export async function bitcoinNetworkDaily(): Promise<Row[]> {
	const byDate = new Map<string, Row>();
	for (const [column, chart] of BTC_CHARTS) {
		const { values } = await getJson<{ values: { x: number; y: number }[] }>(`https://api.blockchain.info/charts/${chart}?timespan=all&format=json&sampled=false`);
		for (const { x, y } of values) {
			const date = day(x);
			const row = byDate.get(date) ?? Object.fromEntries([["date", date], ...BTC_CHARTS.map(([c]) => [c, null])]);
			row[column] = round(y, 4);
			byDate.set(date, row);
		}
	}
	return [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

export async function bitcoinDifficultyAdjustments(): Promise<Row[]> {
	const rows = await getJson<[number, number, number, number][]>("https://mempool.space/api/v1/mining/difficulty-adjustments/all");
	return rows.map(([t, height, difficulty, ratio]) => ({ date: day(t), height, difficulty, change_pct: round((ratio - 1) * 100) })).sort((a, b) => a.height - b.height);
}

export async function bitcoinMiningPools(): Promise<Row[]> {
	const { pools, blockCount } = await getJson<{ pools: { name: string; blockCount: number; emptyBlocks: number; avgMatchRate: number | null }[]; blockCount: number }>("https://mempool.space/api/v1/mining/pools/1y");
	return pools.map((p) => ({ pool: p.name, blocks: p.blockCount, share_pct: round((p.blockCount / blockCount) * 100), empty_blocks: p.emptyBlocks, avg_match_rate: p.avgMatchRate })).sort((a, b) => b.blocks - a.blocks);
}

export async function lightningNetworkHistory(): Promise<Row[]> {
	const rows = await getJson<{ added: number; channel_count: number; total_capacity: number; tor_nodes: number; clearnet_nodes: number; unannounced_nodes: number; clearnet_tor_nodes: number }[]>("https://mempool.space/api/v1/lightning/statistics/all");
	return rows
		.map((r) => ({
			date: day(r.added),
			channels: r.channel_count,
			capacity_btc: round(r.total_capacity / 1e8),
			tor_nodes: r.tor_nodes,
			clearnet_nodes: r.clearnet_nodes,
			clearnet_tor_nodes: r.clearnet_tor_nodes,
			unannounced_nodes: r.unannounced_nodes,
		}))
		.sort((a, b) => a.date.localeCompare(b.date));
}

// --- Layer 2s ------------------------------------------------------------------------------

const L2_METRICS: Record<string, string> = {
	daa: "active_addresses",
	txcount: "transactions",
	fees_paid_usd: "fees_paid_usd",
	app_fees_usd: "app_fees_usd",
	rent_paid_usd: "rent_paid_usd",
	profit_usd: "profit_usd",
	costs_total_usd: "costs_total_usd",
	txcosts_median_usd: "txcost_median_usd",
	stables_mcap: "stables_mcap_usd",
	tvl: "tvl_usd",
	market_cap_usd: "market_cap_usd",
	gas_per_second: "gas_per_second",
};

// The feed only covers the last 90 days; append mode keeps everything older.
export async function l2DailyMetrics(): Promise<Row[]> {
	const points = await getJson<{ metric_key: string; origin_key: string; date: string; value: number }[]>("https://api.growthepie.xyz/v1/fundamentals.json");
	const byKey = new Map<string, Row>();
	for (const p of points) {
		const column = L2_METRICS[p.metric_key];
		if (!column) continue;
		const k = `${p.date}|${p.origin_key}`;
		const row = byKey.get(k) ?? Object.fromEntries([["date", p.date], ["chain", p.origin_key], ...Object.values(L2_METRICS).map((c) => [c, null])]);
		row[column] = round(p.value, 4);
		byKey.set(k, row);
	}
	return [...byKey.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.chain).localeCompare(String(b.chain)));
}

interface L2Project {
	name: string;
	type: string;
	hostChain: string;
	category: string;
	providers?: string[];
	purposes?: string[];
	stage: string;
	isArchived: boolean;
	tvs?: { breakdown?: { total?: number; native?: number; canonical?: number; external?: number } };
}

export async function l2Projects(): Promise<Row[]> {
	const { projects } = await getJson<{ projects: Record<string, L2Project> }>("https://l2beat.com/api/scaling/summary");
	return Object.values(projects)
		.filter((p) => !p.isArchived)
		.map((p) => {
			const t = p.tvs?.breakdown ?? {};
			return {
				name: p.name,
				type: p.type,
				host_chain: p.hostChain,
				category: p.category,
				stack: (p.providers ?? []).join("; "),
				stage: p.stage,
				purposes: (p.purposes ?? []).join("; "),
				tvs_usd: round(t.total, 0),
				native_usd: round(t.native, 0),
				canonical_usd: round(t.canonical, 0),
				external_usd: round(t.external, 0),
			};
		})
		.sort((a, b) => (b.tvs_usd ?? 0) - (a.tvs_usd ?? 0));
}

// --- Raw network sampling ------------------------------------------------------------------

async function rpc<T>(url: string, method: string, params: unknown[]): Promise<T> {
	const j = await getJson<{ result?: T; error?: { message: string } }>(url, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
	});
	if (j.error || j.result == null) throw new Error(`${method}: ${j.error?.message ?? "empty result"}`);
	return j.result;
}

const GWEI = 1e9;

export async function evmGasDaily(): Promise<Row[]> {
	const date = today();
	return Promise.all(
		Object.entries(RPC).map(async ([chain, url]) => {
			// 1,024 blocks is the max most nodes allow in one call; reward percentile 50 = median tip.
			const h = await rpc<{ oldestBlock: string; baseFeePerGas: string[]; gasUsedRatio: number[]; reward: string[][] }>(url, "eth_feeHistory", ["0x400", "latest", [50]]);
			const base = h.baseFeePerGas.slice(0, -1).map((x) => Number(BigInt(x)) / GWEI);
			const tips = h.reward.map((r) => Number(BigInt(r[0]!)) / GWEI).sort((a, b) => a - b);
			const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
			return {
				date,
				chain,
				first_block: Number(BigInt(h.oldestBlock)),
				blocks: h.gasUsedRatio.length,
				base_fee_gwei: round(avg(base), 6),
				priority_fee_gwei: round(tips[Math.floor(tips.length / 2)] ?? 0, 6),
				gas_used_ratio: round(avg(h.gasUsedRatio), 4),
			};
		}),
	);
}

export async function solanaThroughputDaily(): Promise<Row[]> {
	// 60 samples of 60s = the last hour.
	const samples = await rpc<{ numTransactions: number; numNonVoteTransactions: number; numSlots: number; samplePeriodSecs: number }[]>("https://api.mainnet-beta.solana.com", "getRecentPerformanceSamples", [60]);
	const secs = samples.reduce((s, x) => s + x.samplePeriodSecs, 0);
	const sum = (k: "numTransactions" | "numNonVoteTransactions" | "numSlots") => samples.reduce((s, x) => s + x[k], 0);
	return [{ date: today(), tps: round(sum("numTransactions") / secs), non_vote_tps: round(sum("numNonVoteTransactions") / secs), slots_per_sec: round(sum("numSlots") / secs, 3) }];
}

// --- DefiLlama extras ----------------------------------------------------------------------

interface Overview {
	name: string;
	category?: string;
	chains: string[];
	total24h: number | null;
	total7d: number | null;
	total30d: number | null;
	total1y: number | null;
	totalAllTime: number | null;
	change_7dover7d?: number | null;
}
const overview = (kind: string, chart: boolean) =>
	getJson<{ protocols: Overview[]; totalDataChart: [number, number][] }>(`https://api.llama.fi/overview/${kind}?excludeTotalDataChart=${!chart}&excludeTotalDataChartBreakdown=true`);

export async function protocolFees(): Promise<Row[]> {
	const { protocols } = await overview("fees", false);
	return protocols
		.filter((p) => (p.total1y ?? 0) > 0)
		.map((p) => ({
			name: p.name,
			category: p.category ?? null,
			chains: p.chains.join("; "),
			fees_24h_usd: round(p.total24h, 0),
			fees_7d_usd: round(p.total7d, 0),
			fees_30d_usd: round(p.total30d, 0),
			fees_1y_usd: round(p.total1y, 0),
			fees_all_time_usd: round(p.totalAllTime, 0),
		}))
		.sort((a, b) => (b.fees_30d_usd ?? 0) - (a.fees_30d_usd ?? 0));
}

export async function dexProtocols(): Promise<Row[]> {
	const { protocols } = await overview("dexs", false);
	return protocols
		.filter((p) => (p.total1y ?? 0) > 0)
		.map((p) => ({
			name: p.name,
			chains: p.chains.join("; "),
			volume_24h_usd: round(p.total24h, 0),
			volume_7d_usd: round(p.total7d, 0),
			volume_30d_usd: round(p.total30d, 0),
			volume_1y_usd: round(p.total1y, 0),
			volume_all_time_usd: round(p.totalAllTime, 0),
			change_7d_pct: round(p.change_7dover7d),
		}))
		.sort((a, b) => (b.volume_30d_usd ?? 0) - (a.volume_30d_usd ?? 0));
}

export async function defiFeesVolumeHistory(): Promise<Row[]> {
	const charts = { fees_usd: "fees", aggregator_volume_usd: "aggregators", options_volume_usd: "options" };
	const byDate = new Map<string, Row>();
	for (const [column, kind] of Object.entries(charts)) {
		const { totalDataChart } = await overview(kind, true);
		for (const [t, v] of totalDataChart) {
			const date = day(t);
			const row = byDate.get(date) ?? { date, fees_usd: null, aggregator_volume_usd: null, options_volume_usd: null };
			row[column] = Math.round(v);
			byDate.set(date, row);
		}
	}
	return [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

export async function stablecoinsByChain(): Promise<Row[]> {
	const chains = await getJson<{ name: string; totalCirculatingUSD: { peggedUSD?: number } }[]>("https://stablecoins.llama.fi/stablecoinchains");
	return chains
		.map((c) => ({ chain: c.name, circulating_usd: Math.round(c.totalCirculatingUSD.peggedUSD ?? 0) }))
		.filter((c) => c.circulating_usd > 0)
		.sort((a, b) => b.circulating_usd - a.circulating_usd);
}

interface LendBorrow {
	pool: string;
	totalSupplyUsd: number | null;
	totalBorrowUsd: number | null;
	apyBaseBorrow: number | null;
	apyRewardBorrow: number | null;
	ltv: number | null;
}

export async function lendingMarkets(): Promise<Row[]> {
	const [markets, { data: pools }] = await Promise.all([
		getJson<LendBorrow[]>("https://yields.llama.fi/lendBorrow"),
		getJson<{ data: { pool: string; chain: string; project: string; symbol: string; apy: number | null }[] }>("https://yields.llama.fi/pools"),
	]);
	const meta = new Map(pools.map((p) => [p.pool, p]));
	return markets
		.filter((m) => meta.has(m.pool) && (m.totalSupplyUsd ?? 0) > 0)
		.map((m) => {
			const p = meta.get(m.pool)!;
			const supply = m.totalSupplyUsd ?? 0;
			const borrowApy = m.apyBaseBorrow == null && m.apyRewardBorrow == null ? null : (m.apyBaseBorrow ?? 0) - (m.apyRewardBorrow ?? 0);
			return {
				pool_id: m.pool,
				chain: p.chain,
				project: p.project,
				symbol: p.symbol,
				supply_usd: Math.round(supply),
				borrow_usd: m.totalBorrowUsd == null ? null : Math.round(m.totalBorrowUsd),
				utilization_pct: m.totalBorrowUsd == null ? null : round((m.totalBorrowUsd / supply) * 100),
				supply_apy: round(p.apy),
				borrow_apy: round(borrowApy),
				ltv: round(m.ltv, 4),
			};
		})
		.sort((a, b) => b.supply_usd - a.supply_usd);
}

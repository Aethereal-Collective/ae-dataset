// One collector per dataset slug. Each returns plain rows matching the dataset's columns.
type Row = Record<string, string | number | null>;

const day = (unixSeconds: number) => new Date(unixSeconds * 1000).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) });
	if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
	return res.json() as Promise<T>;
}

// --- On-chain stablecoin supply -------------------------------------------------------------

const RPC: Record<string, string> = {
	ethereum: "https://ethereum-rpc.publicnode.com",
	base: "https://base-rpc.publicnode.com",
	arbitrum: "https://arbitrum-one-rpc.publicnode.com",
	bsc: "https://bsc-rpc.publicnode.com",
	polygon: "https://polygon-bor-rpc.publicnode.com",
};
const STABLECOINS: [chain: string, token: string, contract: string][] = [
	["ethereum", "USDT", "0xdAC17F958D2ee523a2206206994597C13D831ec7"],
	["ethereum", "USDC", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
	["base", "USDC", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"],
	["arbitrum", "USDT", "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"],
	["arbitrum", "USDC", "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"],
	["bsc", "USDT", "0x55d398326f99059fF775485246999027B3197955"],
	["bsc", "USDC", "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"],
	["polygon", "USDT", "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"],
	["polygon", "USDC", "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"],
];

async function ethCall(chain: string, to: string, data: string): Promise<string> {
	const j = await getJson<{ result?: string; error?: { message: string } }>(RPC[chain]!, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to, data }, "latest"] }),
	});
	if (j.error || !j.result) throw new Error(`${chain} ${to}: ${j.error?.message ?? "empty result"}`);
	return j.result;
}

// ABI-encoded string return value: offset, length, bytes.
const decodeString = (hex: string) => {
	const b = Buffer.from(hex.slice(2), "hex");
	const len = Number(BigInt("0x" + b.subarray(32, 64).toString("hex")));
	return b.subarray(64, 64 + len).toString("utf8");
};

async function stablecoinSupply(): Promise<Row[]> {
	const date = today();
	return Promise.all(
		STABLECOINS.map(async ([chain, token, contract]) => {
			// symbol(), decimals(), totalSupply()
			const [sym, dec, supply] = await Promise.all([ethCall(chain, contract, "0x95d89b41"), ethCall(chain, contract, "0x313ce567"), ethCall(chain, contract, "0x18160ddd")]);
			const decimals = BigInt(dec);
			const raw = BigInt(supply);
			// Keep 2 decimal places without going through a float for the integer part.
			const whole = Number(raw / 10n ** decimals) + Number((raw % 10n ** decimals) / 10n ** (decimals > 2n ? decimals - 2n : 0n)) / 100;
			return { date, chain, token, symbol_onchain: decodeString(sym), contract, total_supply: whole };
		}),
	);
}

// --- DefiLlama ------------------------------------------------------------------------------

const TOP_CHAINS = 25;

async function chainTvlHistory(): Promise<Row[]> {
	const chains = await getJson<{ name: string; tvl: number }[]>("https://api.llama.fi/v2/chains");
	const top = chains.sort((a, b) => b.tvl - a.tvl).slice(0, TOP_CHAINS);
	const rows: Row[] = [];
	// Sequential on purpose: 25 small requests, gentle on the free API.
	for (const { name } of top) {
		const history = await getJson<{ date: number; tvl: number }[]>(`https://api.llama.fi/v2/historicalChainTvl/${encodeURIComponent(name)}`);
		for (const p of history) if (p.tvl > 0) rows.push({ date: day(p.date), chain: name, tvl_usd: Math.round(p.tvl) });
	}
	return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.chain).localeCompare(String(b.chain)));
}

interface Hack {
	date: number;
	name: string;
	classification: string | null;
	technique: string | null;
	amount: number | null;
	returnedFunds: number | null;
	chain: string[] | null;
	bridgeHack: boolean | null;
	targetType: string | null;
	source: string | null;
}

async function cryptoHacks(): Promise<Row[]> {
	const hacks = await getJson<Hack[]>("https://api.llama.fi/hacks");
	return hacks
		.map((h) => ({
			date: day(h.date),
			name: h.name,
			classification: h.classification,
			technique: h.technique,
			amount_usd: h.amount,
			returned_usd: h.returnedFunds,
			chains: (h.chain ?? []).join("; "),
			bridge_hack: h.bridgeHack ? "yes" : "no",
			target_type: h.targetType,
			source: h.source,
		}))
		.sort((a, b) => b.date.localeCompare(a.date));
}

const pct = (now: number | undefined, before: number | undefined) => (now && before ? Math.round((now / before - 1) * 10000) / 100 : null);
const round2 = (n: number | null | undefined) => (n == null ? null : Math.round(n * 100) / 100);

async function stablecoinMarketCapHistory(): Promise<Row[]> {
	const points = await getJson<{ date: string; totalCirculating: { peggedUSD?: number } }[]>("https://stablecoins.llama.fi/stablecoincharts/all");
	return points.filter((p) => p.totalCirculating.peggedUSD).map((p) => ({ date: day(Number(p.date)), circulating_usd: Math.round(p.totalCirculating.peggedUSD!) }));
}

interface Stable {
	name: string;
	symbol: string;
	pegType: string;
	pegMechanism: string;
	price: number | null;
	chains: string[];
	circulating: { peggedUSD?: number };
	circulatingPrevDay: { peggedUSD?: number };
	circulatingPrevWeek: { peggedUSD?: number };
	circulatingPrevMonth: { peggedUSD?: number };
}

async function stablecoinMarket(): Promise<Row[]> {
	const { peggedAssets } = await getJson<{ peggedAssets: Stable[] }>("https://stablecoins.llama.fi/stablecoins?includePrices=true");
	return peggedAssets
		.filter((s) => s.pegType === "peggedUSD" && (s.circulating.peggedUSD ?? 0) > 0)
		.map((s) => {
			const now = s.circulating.peggedUSD;
			return {
				name: s.name,
				symbol: s.symbol,
				peg_mechanism: s.pegMechanism,
				circulating_usd: Math.round(now ?? 0),
				change_1d_pct: pct(now, s.circulatingPrevDay?.peggedUSD),
				change_7d_pct: pct(now, s.circulatingPrevWeek?.peggedUSD),
				change_30d_pct: pct(now, s.circulatingPrevMonth?.peggedUSD),
				chains: s.chains.length,
				price: s.price == null ? null : Math.round(s.price * 10000) / 10000,
			};
		})
		.sort((a, b) => b.circulating_usd - a.circulating_usd);
}

interface Protocol {
	name: string;
	category: string | null;
	chains: string[];
	tvl: number | null;
	change_1d: number | null;
	change_7d: number | null;
	mcap: number | null;
	listedAt?: number;
}

async function defiProtocols(): Promise<Row[]> {
	const protocols = await getJson<Protocol[]>("https://api.llama.fi/protocols");
	// CEX wallets are in cex-reserves; keep DeFi only.
	return protocols
		.filter((p) => (p.tvl ?? 0) > 0 && p.category !== "CEX")
		.map((p) => ({
			name: p.name,
			category: p.category,
			chains: p.chains.join("; "),
			tvl_usd: Math.round(p.tvl!),
			change_1d_pct: round2(p.change_1d),
			change_7d_pct: round2(p.change_7d),
			mcap_usd: p.mcap ? Math.round(p.mcap) : null,
			listed_date: p.listedAt ? day(p.listedAt) : null,
		}))
		.sort((a, b) => b.tvl_usd - a.tvl_usd);
}

interface Pool {
	pool: string;
	chain: string;
	project: string;
	symbol: string;
	tvlUsd: number;
	apy: number | null;
	apyBase: number | null;
	apyReward: number | null;
	apyMean30d: number | null;
	stablecoin: boolean;
	ilRisk: string;
	exposure: string;
}

async function yieldPools(): Promise<Row[]> {
	const { data } = await getJson<{ data: Pool[] }>("https://yields.llama.fi/pools");
	return data
		.map((p) => ({
			pool_id: p.pool,
			chain: p.chain,
			project: p.project,
			symbol: p.symbol,
			tvl_usd: Math.round(p.tvlUsd),
			apy: round2(p.apy),
			apy_base: round2(p.apyBase),
			apy_reward: round2(p.apyReward),
			apy_mean_30d: round2(p.apyMean30d),
			stablecoin: p.stablecoin ? "yes" : "no",
			il_risk: p.ilRisk,
			exposure: p.exposure,
		}))
		.sort((a, b) => b.tvl_usd - a.tvl_usd);
}

async function dexVolumeHistory(): Promise<Row[]> {
	const { totalDataChart } = await getJson<{ totalDataChart: [number, number][] }>("https://api.llama.fi/overview/dexs?excludeTotalDataChart=false&excludeTotalDataChartBreakdown=true");
	return totalDataChart.filter(([, v]) => v > 0).map(([t, v]) => ({ date: day(t), volume_usd: Math.round(v) }));
}

interface Cex {
	name: string;
	cleanAssetsTvl?: number;
	inflows_24h?: number;
	inflows_1w?: number;
	inflows_1m?: number;
	spotVolume?: number;
	oi?: number;
	derivVolume?: number;
}

async function cexReserves(): Promise<Row[]> {
	const { cexs } = await getJson<{ cexs: Cex[] }>("https://api.llama.fi/cexs");
	const usd = (n?: number) => (n == null ? null : Math.round(n));
	return cexs
		.filter((c) => (c.cleanAssetsTvl ?? 0) > 0)
		.map((c) => ({
			name: c.name,
			assets_usd: usd(c.cleanAssetsTvl),
			inflows_24h_usd: usd(c.inflows_24h),
			inflows_1w_usd: usd(c.inflows_1w),
			inflows_1m_usd: usd(c.inflows_1m),
			spot_volume_usd: usd(c.spotVolume),
			open_interest_usd: usd(c.oi),
			deriv_volume_usd: usd(c.derivVolume),
		}))
		.sort((a, b) => (b.assets_usd ?? 0) - (a.assets_usd ?? 0));
}

export const COLLECTORS: Record<string, () => Promise<Row[]>> = {
	"stablecoin-supply-onchain": stablecoinSupply,
	"chain-tvl-history": chainTvlHistory,
	"crypto-hacks": cryptoHacks,
	"stablecoin-market-cap-history": stablecoinMarketCapHistory,
	"stablecoin-market": stablecoinMarket,
	"defi-protocols": defiProtocols,
	"yield-pools": yieldPools,
	"dex-volume-history": dexVolumeHistory,
	"cex-reserves": cexReserves,
};

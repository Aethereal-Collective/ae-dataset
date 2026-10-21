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

export const COLLECTORS: Record<string, () => Promise<Row[]>> = {
	"stablecoin-supply-onchain": stablecoinSupply,
	"chain-tvl-history": chainTvlHistory,
	"crypto-hacks": cryptoHacks,
};

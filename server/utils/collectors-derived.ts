// Research-ready datasets: built by joining several sources and computing features,
// not by reshaping a single feed.
import { day, getJson } from "./collectors";
import { CRYPTO, IDX, daily, fred } from "./collectors-markets";

type Row = Record<string, string | number | null>;
type Bar = Awaited<ReturnType<typeof daily>>[number];
const round = (n: number | null | undefined, digits = 6) => (n == null || !Number.isFinite(n) ? null : Math.round(n * 10 ** digits) / 10 ** digits);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const std = (xs: number[]) => {
	const m = mean(xs);
	return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
};

// --- Technical features --------------------------------------------------------------------

interface FeatureOpts {
	annual: number; // trading days per year: 252 for stocks, 365 for crypto
	bench?: Map<string, number>; // benchmark daily return by date
	benchRet20?: Map<string, number>;
	since: string;
}

// Features use only data up to and including each row's date, so they are safe as model inputs.
function features(bars: Bar[], o: FeatureOpts) {
	const px = bars.map((b) => b.adj_close ?? b.close!);
	const close = bars.map((b) => b.close!);
	const ret = (i: number, n: number) => (i >= n ? px[i]! / px[i - n]! - 1 : null);
	const r1 = px.map((_, i) => ret(i, 1));
	const sma = (i: number, n: number) => (i >= n - 1 ? mean(close.slice(i - n + 1, i + 1)) : null);

	// Wilder RSI(14).
	const rsi: (number | null)[] = [];
	let gain = 0;
	let loss = 0;
	for (let i = 0; i < px.length; i++) {
		const d = i ? px[i]! - px[i - 1]! : 0;
		if (i <= 14) {
			gain += Math.max(d, 0) / 14;
			loss += Math.max(-d, 0) / 14;
		} else {
			gain = (gain * 13 + Math.max(d, 0)) / 14;
			loss = (loss * 13 + Math.max(-d, 0)) / 14;
		}
		rsi.push(i < 14 ? null : loss === 0 ? 100 : 100 - 100 / (1 + gain / loss));
	}

	let peak = 0;
	return bars.map((b, i) => {
		peak = Math.max(peak, px[i]!);
		const window = r1.slice(Math.max(1, i - 19), i + 1).filter((x): x is number => x != null);
		// Beta and correlation over the last 60 days both series traded.
		let beta: number | null = null;
		let corr: number | null = null;
		if (o.bench && i >= 60) {
			const pairs = bars
				.slice(i - 59, i + 1)
				.map((x, k) => [r1[i - 59 + k], o.bench!.get(x.date)] as const)
				.filter((p): p is readonly [number, number] => p[0] != null && p[1] != null);
			if (pairs.length >= 40) {
				const a = pairs.map((p) => p[0]);
				const m = pairs.map((p) => p[1]);
				const ma = mean(a);
				const mm = mean(m);
				const cov = pairs.reduce((s, [x, y]) => s + (x - ma) * (y - mm), 0) / (pairs.length - 1);
				beta = cov / std(m) ** 2;
				corr = cov / (std(a) * std(m));
			}
		}
		const r20 = ret(i, 20);
		const b20 = o.benchRet20?.get(b.date);
		return {
			i,
			date: b.date,
			close: b.close,
			volume: b.volume,
			ret_1d: round(r1[i]),
			ret_5d: round(ret(i, 5)),
			ret_20d: round(r20),
			vol_20d: window.length >= 15 ? round(std(window) * Math.sqrt(o.annual)) : null,
			sma_20: round(sma(i, 20), 4),
			sma_50: round(sma(i, 50), 4),
			sma_200: round(sma(i, 200), 4),
			rsi_14: round(rsi[i], 2),
			drawdown: round(px[i]! / peak - 1),
			beta_60d: round(beta, 4),
			corr_60d: round(corr, 4),
			rel_strength_20d: r20 != null && b20 != null ? round(r20 - b20) : null,
		};
	});
}

const returnsByDate = (bars: Bar[], n: number) => {
	const m = new Map<string, number>();
	const px = bars.map((b) => b.adj_close ?? b.close!);
	bars.forEach((b, i) => i >= n && m.set(b.date, px[i]! / px[i - n]! - 1));
	return m;
};

export async function idxStockFeatures(): Promise<Row[]> {
	const SINCE = "2015-01-01";
	const ihsg = await daily("^JKSE", "2010-01-01");
	const usdidr = await daily("IDR=X", "2010-01-01");
	const fx = new Map(usdidr.map((b) => [b.date, b.close!]));
	const fxDates = [...fx.keys()].sort();
	// Last known USD/IDR on or before a date (IDX and FX holidays differ).
	const fxAt = (d: string) => {
		let lo = 0;
		let hi = fxDates.length - 1;
		let best: string | undefined;
		while (lo <= hi) {
			const mid = (lo + hi) >> 1;
			if (fxDates[mid]! <= d) (best = fxDates[mid]), (lo = mid + 1);
			else hi = mid - 1;
		}
		return best ? fx.get(best)! : null;
	};
	const bench = returnsByDate(ihsg, 1);
	const benchRet20 = returnsByDate(ihsg, 20);
	const rows: Row[] = [];
	for (const t of IDX.split(" ")) {
		try {
			const bars = await daily(`${t}.JK`, "2010-01-01");
			const value = bars.map((b) => (b.close ?? 0) * (b.volume ?? 0));
			for (const f of features(bars, { annual: 252, bench, benchRet20, since: SINCE })) {
				if (f.date < SINCE) continue;
				const rate = fxAt(f.date);
				const { i, ...rest } = f;
				rows.push({
					...rest,
					ticker: t,
					value_idr: Math.round(value[i]!),
					avg_value_20d_idr: i >= 19 ? Math.round(mean(value.slice(i - 19, i + 1))) : null,
					close_usd: rate ? round(f.close! / rate, 6) : null,
				});
			}
		} catch {
			// Delisted or renamed ticker: skip.
		}
		await sleep(250);
	}
	return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.ticker).localeCompare(String(b.ticker)));
}

export async function cryptoFeatures(): Promise<Row[]> {
	const SINCE = "2017-01-01";
	const btc = await daily("BTC-USD", "2014-01-01");
	const bench = returnsByDate(btc, 1);
	const benchRet20 = returnsByDate(btc, 20);
	const rows: Row[] = [];
	for (const [symbol, name] of CRYPTO) {
		try {
			const bars = await daily(symbol, "2014-01-01");
			for (const f of features(bars, { annual: 365, bench: symbol === "BTC-USD" ? undefined : bench, benchRet20: symbol === "BTC-USD" ? undefined : benchRet20, since: SINCE })) {
				if (f.date < SINCE) continue;
				const { i: _, ...rest } = f;
				rows.push({ ...rest, symbol, name });
			}
		} catch {
			// skip
		}
		await sleep(250);
	}
	return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.symbol).localeCompare(String(b.symbol)));
}

// --- Cross-asset daily panel ---------------------------------------------------------------

const PANEL_YAHOO: [column: string, symbol: string][] = [
	["btc", "BTC-USD"],
	["eth", "ETH-USD"],
	["ihsg", "^JKSE"],
	["sp500", "^GSPC"],
	["nasdaq", "^IXIC"],
	["gold", "GC=F"],
	["brent", "BZ=F"],
	["usd_idr", "IDR=X"],
	["dxy", "DX-Y.NYB"],
	["vix", "^VIX"],
];
const RETURN_COLS = ["btc", "eth", "ihsg", "sp500", "nasdaq", "gold", "brent", "usd_idr", "dxy"];

export async function crossAssetDaily(): Promise<Row[]> {
	const SINCE = "2015-01-01";
	const levels = new Map<string, Map<string, number>>();
	for (const [col, symbol] of PANEL_YAHOO) {
		levels.set(col, new Map((await daily(symbol, "2014-12-01")).map((b) => [b.date, b.close!])));
		await sleep(250);
	}
	const rates = await fred({ DGS10: "us10y", DFF: "fed_funds" });
	for (const col of ["us10y", "fed_funds"]) levels.set(col, new Map(rates.filter((r) => r[col] != null).map((r) => [String(r.date), Number(r[col])])));
	const stables = await getJson<{ date: string; totalCirculating: { peggedUSD?: number } }[]>("https://stablecoins.llama.fi/stablecoincharts/all");
	levels.set("stablecoin_mcap", new Map(stables.filter((p) => p.totalCirculating.peggedUSD).map((p) => [day(Number(p.date)), Math.round(p.totalCirculating.peggedUSD!)])));
	const tvl = await getJson<{ date: number; tvl: number }[]>("https://api.llama.fi/v2/historicalChainTvl");
	levels.set("defi_tvl", new Map(tvl.map((p) => [day(p.date), Math.round(p.tvl)])));

	const cols = [...levels.keys()];
	const last: Record<string, number | null> = Object.fromEntries(cols.map((c) => [c, null]));
	const rows: Row[] = [];
	// Every calendar day; markets closed on a day carry their last close forward (flags say who traded).
	for (let t = Date.parse("2014-12-01"); t <= Date.now(); t += 864e5) {
		const date = new Date(t).toISOString().slice(0, 10);
		const prev = { ...last };
		for (const c of cols) last[c] = levels.get(c)!.get(date) ?? last[c];
		if (date < SINCE) continue;
		const row: Row = { date, idx_open: levels.get("ihsg")!.has(date) ? 1 : 0, us_open: levels.get("sp500")!.has(date) ? 1 : 0 };
		for (const c of cols) row[c] = round(last[c], 4);
		for (const c of RETURN_COLS) row[`ret_${c}`] = last[c] != null && prev[c] ? round(last[c]! / prev[c]! - 1) : null;
		rows.push(row);
	}
	return rows;
}

// --- DeFi protocol status ------------------------------------------------------------------

interface Protocol {
	name: string;
	category: string | null;
	chains: string[];
	tvl: number | null;
	listedAt?: number;
	deadFrom?: string;
	deadUrl?: boolean;
	rugged?: boolean;
	deprecated?: boolean;
	audits?: string;
	gecko_id?: string | null;
	github?: string[];
	oraclesBreakdown?: unknown[];
	parentProtocol?: string;
	hallmarks?: unknown[];
	url?: string;
}

let protocolsCache: { at: number; rows: Protocol[] } | null = null;
async function protocols() {
	if (protocolsCache && Date.now() - protocolsCache.at < 36e5) return protocolsCache.rows;
	protocolsCache = { at: Date.now(), rows: await getJson<Protocol[]>("https://api.llama.fi/protocols") };
	return protocolsCache.rows;
}

const statusOf = (p: Protocol) => (p.rugged ? "rugged" : p.deadFrom ? "dead" : p.deprecated ? "deprecated" : p.deadUrl ? "website_down" : "active");

export async function defiProtocolStatus(): Promise<Row[]> {
	const now = today();
	return (await protocols())
		.filter((p) => p.category !== "CEX")
		.map((p) => {
			const listed = p.listedAt ? day(p.listedAt) : null;
			const end = p.deadFrom && /^\d{4}-\d{2}-\d{2}/.test(p.deadFrom) ? p.deadFrom.slice(0, 10) : null;
			return {
				name: p.name,
				status: statusOf(p),
				category: p.category,
				chain_count: p.chains.length,
				chains: p.chains.join("; "),
				listed_date: listed,
				dead_date: end,
				lifetime_days: listed ? daysBetween(listed, end ?? now) : null,
				tvl_usd: Math.round(p.tvl ?? 0),
				audits: Number(p.audits ?? 0),
				has_token: p.gecko_id ? "yes" : "no",
				has_github: p.github?.length ? "yes" : "no",
				oracle_count: p.oraclesBreakdown?.length ?? 0,
				part_of_family: p.parentProtocol ? "yes" : "no",
				hallmarks: p.hallmarks?.length ?? 0,
			};
		})
		.sort((a, b) => b.tvl_usd - a.tvl_usd);
}

// --- Crypto hacks enriched -----------------------------------------------------------------

const VECTOR: Record<string, string> = {
	"Access Control": "code",
	"Protocol Logic": "code",
	"Token & Share Accounting": "code",
	"Oracle Manipulation": "code",
	"Input Validation": "code",
	Reentrancy: "code",
	"Bridge & Cross-Chain": "code",
	Governance: "code",
	"Market Manipulation": "code",
	"Key Compromise": "keys_and_infra",
	"Frontend & Infrastructure": "keys_and_infra",
	"Social Engineering": "people",
	Rugpull: "insider",
};

export async function hacksEnriched(): Promise<Row[]> {
	const [hacks, cpiRows, protos] = await Promise.all([
		getJson<{ date: number; name: string; classification: string | null; technique: string | null; amount: number | null; returnedFunds: number | null; chain: string[] | null; bridgeHack: boolean | null; targetType: string | null }[]>("https://api.llama.fi/hacks"),
		fred({ CPIAUCSL: "cpi" }),
		protocols(),
	]);
	const cpi = new Map(cpiRows.map((r) => [String(r.date).slice(0, 7), Number(r.cpi)]));
	const cpiNow = Number(cpiRows.at(-1)!.cpi);
	const cpiAt = (month: string) => {
		for (let t = Date.parse(month + "-01"); t > Date.parse("1947-01-01"); t -= 28 * 864e5) {
			const v = cpi.get(new Date(t).toISOString().slice(0, 7));
			if (v) return v;
		}
		return cpiNow;
	};
	const byName = new Map(protos.map((p) => [p.name.toLowerCase(), p]));
	return hacks
		.map((h) => {
			const date = day(h.date);
			const amount = h.amount ?? null;
			const returned = h.returnedFunds ?? null;
			const p = byName.get(h.name.toLowerCase());
			return {
				date,
				year: Number(date.slice(0, 4)),
				name: h.name,
				classification: h.classification,
				technique: h.technique,
				vector: (h.classification && VECTOR[h.classification]) ?? "unknown",
				amount_usd: amount == null ? null : Math.round(amount),
				amount_usd_real: amount == null ? null : Math.round((amount * cpiNow) / cpiAt(date.slice(0, 7))),
				returned_usd: returned == null ? null : Math.round(returned),
				net_loss_usd: amount == null ? null : Math.round(amount - (returned ?? 0)),
				recovery_pct: amount ? round(((returned ?? 0) / amount) * 100, 2) : null,
				chain_count: h.chain?.length ?? 0,
				primary_chain: h.chain?.[0] ?? null,
				chains: (h.chain ?? []).join("; "),
				bridge_hack: h.bridgeHack ? "yes" : "no",
				target_type: h.targetType,
				protocol_category: p?.category ?? null,
				protocol_status_now: p ? statusOf(p) : null,
			};
		})
		.sort((a, b) => b.date.localeCompare(a.date));
}

// --- Stablecoin flows by chain -------------------------------------------------------------

const FLOW_CHAINS = 15;

export async function stablecoinFlowsByChain(): Promise<Row[]> {
	const SINCE = "2021-01-01";
	const chains = (await getJson<{ name: string; totalCirculatingUSD: { peggedUSD?: number } }[]>("https://stablecoins.llama.fi/stablecoinchains"))
		.sort((a, b) => (b.totalCirculatingUSD.peggedUSD ?? 0) - (a.totalCirculatingUSD.peggedUSD ?? 0))
		.slice(0, FLOW_CHAINS);
	const all = await getJson<{ date: string; totalCirculating: { peggedUSD?: number } }[]>("https://stablecoins.llama.fi/stablecoincharts/all");
	const total = new Map(all.map((p) => [day(Number(p.date)), p.totalCirculating.peggedUSD ?? 0]));
	const rows: Row[] = [];
	for (const { name } of chains) {
		const pts = (await getJson<{ date: string; totalCirculating: { peggedUSD?: number } }[]>(`https://stablecoins.llama.fi/stablecoincharts/${encodeURIComponent(name)}`)).map((p) => ({
			date: day(Number(p.date)),
			v: p.totalCirculating.peggedUSD ?? 0,
		}));
		pts.forEach((p, i) => {
			if (p.date < SINCE) return;
			const flow = (n: number) => (i >= n ? Math.round(p.v - pts[i - n]!.v) : null);
			const t = total.get(p.date);
			rows.push({ date: p.date, chain: name, supply_usd: Math.round(p.v), flow_1d_usd: flow(1), flow_7d_usd: flow(7), flow_30d_usd: flow(30), share_pct: t ? round((p.v / t) * 100, 3) : null });
		});
		await sleep(200);
	}
	return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.chain).localeCompare(String(b.chain)));
}

// --- Labeled phishing domains --------------------------------------------------------------

function levenshtein(a: string, b: string, cap: number) {
	if (Math.abs(a.length - b.length) > cap) return cap + 1;
	let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
	for (let i = 1; i <= a.length; i++) {
		const cur = [i];
		let best = i;
		for (let j = 1; j <= b.length; j++) {
			cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
			best = Math.min(best, cur[j]!);
		}
		if (best > cap) return cap + 1;
		prev = cur;
	}
	return prev[b.length]!;
}

const entropy = (s: string) => {
	const f = new Map<string, number>();
	for (const ch of s) f.set(ch, (f.get(ch) ?? 0) + 1);
	return -[...f.values()].reduce((e, n) => e + (n / s.length) * Math.log2(n / s.length), 0);
};

// ponytail: naive "label before the TLD"; multi-part TLDs like co.uk count as the TLD's first part.
const baseLabel = (domain: string) => {
	const parts = domain.split(".");
	return parts.length >= 2 ? parts[parts.length - 2]! : domain;
};
const hostOf = (url: string) => {
	try {
		return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
	} catch {
		return null;
	}
};

const BRANDS = 300;
const DIST_CAP = 4;

export async function phishingDomainsLabeled(): Promise<Row[]> {
	const [mm, dot, protos] = await Promise.all([
		getJson<{ blacklist: string[]; whitelist: string[] }>("https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/main/src/config.json"),
		getJson<{ deny: string[] }>("https://polkadot.js.org/phishing/all.json"),
		protocols(),
	]);
	const phishing = new Set([...mm.blacklist, ...dot.deny].map((d) => d.toLowerCase().replace(/^www\./, "")).filter((d) => d.includes(".")));
	const live = protos.filter((p) => p.url && statusOf(p) === "active").sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0));
	const legit = new Set([...live.map((p) => hostOf(p.url!)), ...mm.whitelist.map((d) => d.toLowerCase())].filter((d): d is string => !!d && !phishing.has(d)));
	// Brands are the base names of the largest live protocols, the ones phishers imitate.
	const brands = [...new Set(live.map((p) => hostOf(p.url!)).filter((d): d is string => !!d).map(baseLabel).filter((b) => b.length >= 4))].slice(0, BRANDS);

	const row = (domain: string, label: string): Row => {
		const base = baseLabel(domain);
		let nearest: string | null = null;
		let dist = DIST_CAP + 1;
		for (const b of brands) {
			const d = levenshtein(base, b, Math.min(dist, DIST_CAP));
			if (d < dist) (dist = d), (nearest = b);
			if (d === 0) break;
		}
		return {
			domain,
			label,
			tld: domain.split(".").pop()!,
			length: domain.length,
			subdomains: domain.split(".").length - 2,
			hyphens: (domain.match(/-/g) ?? []).length,
			digits: (domain.match(/\d/g) ?? []).length,
			entropy: round(entropy(domain), 4),
			punycode: domain.includes("xn--") ? "yes" : "no",
			nearest_brand: dist <= DIST_CAP ? nearest : null,
			brand_distance: dist <= DIST_CAP ? dist : null,
			contains_brand: brands.some((b) => b.length >= 5 && domain.includes(b) && base !== b) ? "yes" : "no",
		};
	};
	return [...[...legit].map((d) => row(d, "legit")), ...[...phishing].map((d) => row(d, "phishing"))];
}

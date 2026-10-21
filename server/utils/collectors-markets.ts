// Stocks, indices, commodities, FX, crypto prices, and macro series.
import { getJson } from "./collectors";

type Row = Record<string, string | number | null>;
const round = (n: number | null | undefined, digits = 4) => (n == null || !Number.isFinite(n) ? null : Math.round(n * 10 ** digits) / 10 ** digits);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const unix = (iso: string) => Math.floor(Date.parse(iso) / 1000);

// --- Daily OHLCV --------------------------------------------------------------------------

interface Chart {
	chart: {
		result: {
			meta: { gmtoffset: number };
			timestamp?: number[];
			indicators: { quote: { open: (number | null)[]; high: (number | null)[]; low: (number | null)[]; close: (number | null)[]; volume: (number | null)[] }[]; adjclose?: { adjclose: (number | null)[] }[] };
		}[];
	};
}

export async function daily(symbol: string, since: string) {
	const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${unix(since)}&period2=${Math.floor(Date.now() / 1000)}&interval=1d&events=split,div`;
	const res = (await getJson<Chart>(url, { headers: { "user-agent": "Mozilla/5.0" } })).chart.result[0]!;
	const q = res.indicators.quote[0]!;
	const adj = res.indicators.adjclose?.[0]?.adjclose;
	// Timestamps are the session open in UTC; shift by the exchange offset to get the trading date.
	return (res.timestamp ?? [])
		.map((t, i) => ({
			date: new Date((t + res.meta.gmtoffset) * 1000).toISOString().slice(0, 10),
			open: round(q.open[i]),
			high: round(q.high[i]),
			low: round(q.low[i]),
			close: round(q.close[i]),
			adj_close: round(adj?.[i]),
			volume: q.volume[i] ?? null,
		}))
		.filter((r) => r.close != null);
}

// One request per symbol, gently paced. A delisted or renamed symbol is skipped, not fatal.
async function collect(symbols: [symbol: string, name: string][], since: string, shape: (r: Awaited<ReturnType<typeof daily>>[number], symbol: string, name: string) => Row) {
	const rows: Row[] = [];
	let failed = 0;
	for (const [symbol, name] of symbols) {
		try {
			for (const r of await daily(symbol, since)) rows.push(shape(r, symbol, name));
		} catch {
			failed++;
		}
		await sleep(250);
	}
	if (failed > symbols.length / 2) throw new Error(`${failed}/${symbols.length} symbols failed`);
	return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.symbol ?? a.ticker).localeCompare(String(b.symbol ?? b.ticker)));
}

const stock = (r: Awaited<ReturnType<typeof daily>>[number], ticker: string) => ({ date: r.date, ticker, open: r.open, high: r.high, low: r.low, close: r.close, adj_close: r.adj_close, volume: r.volume });
const quote = (r: Awaited<ReturnType<typeof daily>>[number], symbol: string, name: string) => ({ date: r.date, symbol, name, open: r.open, high: r.high, low: r.low, close: r.close, volume: r.volume || null });

// ponytail: hand-kept list of the most traded IDX names (idx.co.id blocks scripted access). Extend as needed.
const IDX = "BBCA BBRI BMRI BBNI BRIS BBTN ARTO BNGA NISP PNBN MEGA BDMN BJBR BJTM AGRO TLKM ISAT EXCL TOWR MTEL TBIG ASII UNTR AUTO SMSM ICBP INDF MYOR UNVR KLBF SIDO GGRM HMSP CPIN JPFA MAIN ULTJ CMRY AMRT MIDI ACES MAPI MAPA ERAA LPPF RALS ADRO AADI PTBA ITMG HRUM INDY BUMI MEDC PGAS AKRA ELSA ENRG BYAN GEMS DOID TOBA ANTM INCO MDKA TINS NCKL MBMA BRMS PSAB AMMN SMGR INTP WIKA PTPP ADHI WSKT JSMR BSDE PWON CTRA SMRA ASRI LPKR DMAS EMTK BUKA GOTO SCMA MNCN BMTR TPIA BRPT INKP TKIM ESSA PGEO BREN CUAN HEAL MIKA SILO AALI LSIP SSMS DSNG TAPG SRTG PNLF MSIN BFIN ADMF SRIL WIFI DEWA RAJA";

export const idxStockPrices = () =>
	collect(
		IDX.split(" ").map((t) => [`${t}.JK`, t]),
		"2000-01-01",
		(r, _s, t) => stock(r, t),
	);

let sp500Cache: { at: number; rows: Row[] } | null = null;
async function sp500List(): Promise<Row[]> {
	if (sp500Cache && Date.now() - sp500Cache.at < 36e5) return sp500Cache.rows;
	const res = await fetch("https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv", { signal: AbortSignal.timeout(30_000) });
	if (!res.ok) throw new Error(`S&P 500 list: HTTP ${res.status}`);
	const [, ...lines] = (await res.text()).trim().split("\n");
	// Quoted fields can contain commas ("Saint Paul, Minnesota").
	const rows = lines.map((l) => {
		const f = [...l.matchAll(/("([^"]*)"|[^,]*)(,|$)/g)].map((m) => m[2] ?? m[1]!).slice(0, 8);
		return { ticker: f[0]!, name: f[1]!, sector: f[2]!, industry: f[3]!, headquarters: f[4]!, date_added: f[5] || null, cik: f[6] || null, founded: f[7] || null };
	});
	sp500Cache = { at: Date.now(), rows };
	return rows;
}

export const sp500Companies = sp500List;

export async function sp500StockPrices(): Promise<Row[]> {
	// Yahoo writes class shares with a dash: BRK.B -> BRK-B.
	const list = (await sp500List()).map((c) => [String(c.ticker).replace(".", "-"), String(c.ticker)] as [string, string]);
	return collect(list, "2015-01-01", (r, _s, t) => stock(r, t));
}

const INDICES: [string, string][] = [
	["^GSPC", "S&P 500"], ["^DJI", "Dow Jones Industrial Average"], ["^IXIC", "Nasdaq Composite"], ["^NDX", "Nasdaq 100"], ["^RUT", "Russell 2000"], ["^VIX", "CBOE Volatility Index"],
	["^GSPTSE", "S&P/TSX Composite"], ["^BVSP", "Bovespa"], ["^MXX", "IPC Mexico"],
	["^FTSE", "FTSE 100"], ["^GDAXI", "DAX"], ["^FCHI", "CAC 40"], ["^STOXX50E", "Euro Stoxx 50"], ["^AEX", "AEX"], ["^IBEX", "IBEX 35"],
	["^N225", "Nikkei 225"], ["^HSI", "Hang Seng"], ["000001.SS", "SSE Composite"], ["399001.SZ", "Shenzhen Component"], ["^KS11", "KOSPI"], ["^TWII", "Taiwan Weighted"],
	["^BSESN", "BSE Sensex"], ["^NSEI", "Nifty 50"], ["^AXJO", "S&P/ASX 200"], ["^NZ50", "NZX 50"],
	["^JKSE", "IDX Composite (IHSG)"], ["^JKLQ45", "LQ45"], ["^STI", "Straits Times"], ["^KLSE", "FTSE Bursa Malaysia KLCI"], ["^SET.BK", "SET Index"], ["PSEI.PS", "PSEi"],
];
export const globalIndices = () => collect(INDICES, "1990-01-01", quote);

const COMMODITIES: [string, string][] = [
	["GC=F", "Gold"], ["SI=F", "Silver"], ["PL=F", "Platinum"], ["PA=F", "Palladium"], ["HG=F", "Copper"],
	["CL=F", "WTI Crude Oil"], ["BZ=F", "Brent Crude Oil"], ["NG=F", "Natural Gas"], ["RB=F", "RBOB Gasoline"], ["HO=F", "Heating Oil"],
	["ZC=F", "Corn"], ["ZW=F", "Wheat"], ["ZS=F", "Soybeans"], ["KC=F", "Coffee"], ["SB=F", "Sugar"], ["CC=F", "Cocoa"], ["CT=F", "Cotton"], ["LE=F", "Live Cattle"],
];
export const commodityPrices = () => collect(COMMODITIES, "2000-01-01", quote);

const FX: [string, string][] = [
	["IDR=X", "USD/IDR"], ["EUR=X", "USD/EUR"], ["JPY=X", "USD/JPY"], ["GBP=X", "USD/GBP"], ["CNY=X", "USD/CNY"], ["HKD=X", "USD/HKD"], ["SGD=X", "USD/SGD"], ["MYR=X", "USD/MYR"],
	["THB=X", "USD/THB"], ["PHP=X", "USD/PHP"], ["VND=X", "USD/VND"], ["INR=X", "USD/INR"], ["KRW=X", "USD/KRW"], ["TWD=X", "USD/TWD"], ["AUD=X", "USD/AUD"], ["NZD=X", "USD/NZD"],
	["CAD=X", "USD/CAD"], ["CHF=X", "USD/CHF"], ["SAR=X", "USD/SAR"], ["AED=X", "USD/AED"], ["TRY=X", "USD/TRY"], ["BRL=X", "USD/BRL"], ["MXN=X", "USD/MXN"], ["ZAR=X", "USD/ZAR"],
];
export const fxRates = async () => (await collect(FX, "2000-01-01", quote)).map(({ volume: _, ...r }) => r);

const CRYPTO: [string, string][] = [
	["BTC-USD", "Bitcoin"], ["ETH-USD", "Ethereum"], ["BNB-USD", "BNB"], ["SOL-USD", "Solana"], ["XRP-USD", "XRP"], ["DOGE-USD", "Dogecoin"], ["ADA-USD", "Cardano"], ["TRX-USD", "TRON"],
	["AVAX-USD", "Avalanche"], ["LINK-USD", "Chainlink"], ["DOT-USD", "Polkadot"], ["LTC-USD", "Litecoin"], ["BCH-USD", "Bitcoin Cash"], ["XLM-USD", "Stellar"], ["UNI7083-USD", "Uniswap"],
	["ATOM-USD", "Cosmos"], ["XMR-USD", "Monero"], ["ETC-USD", "Ethereum Classic"], ["NEAR-USD", "NEAR"], ["HBAR-USD", "Hedera"], ["FIL-USD", "Filecoin"], ["AAVE-USD", "Aave"], ["ALGO-USD", "Algorand"],
	["SUI20947-USD", "Sui"], ["APT21794-USD", "Aptos"], ["ARB11841-USD", "Arbitrum"], ["OP-USD", "Optimism"], ["SHIB-USD", "Shiba Inu"], ["PEPE24478-USD", "Pepe"], ["ICP-USD", "Internet Computer"],
];
export const cryptoPrices = () => collect(CRYPTO, "2010-01-01", quote);

// --- Macro --------------------------------------------------------------------------------

// One series per request: asking for several at once can return a ZIP instead of CSV.
export async function fred(ids: Record<string, string>): Promise<Row[]> {
	const cols = Object.values(ids);
	const byDate = new Map<string, Row>();
	for (const [id, column] of Object.entries(ids)) {
		const res = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`, { signal: AbortSignal.timeout(60_000) });
		if (!res.ok) throw new Error(`FRED ${id}: HTTP ${res.status}`);
		const [, ...lines] = (await res.text()).trim().split("\n");
		for (const l of lines) {
			const [date, v] = l.trim().split(",");
			if (!date || !v || v === ".") continue;
			const row = byDate.get(date) ?? Object.fromEntries([["date", date], ...cols.map((c) => [c, null])]);
			row[column] = Number(v);
			byDate.set(date, row);
		}
	}
	return [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

export const usRatesDaily = () =>
	fred({ DFF: "fed_funds_pct", DGS3MO: "treasury_3m_pct", DGS2: "treasury_2y_pct", DGS5: "treasury_5y_pct", DGS10: "treasury_10y_pct", DGS30: "treasury_30y_pct", T10Y2Y: "spread_10y_2y_pct", T10YIE: "breakeven_10y_pct" });

export const usMacroMonthly = () =>
	fred({ CPIAUCSL: "cpi", CPILFESL: "core_cpi", PCEPI: "pce_price_index", UNRATE: "unemployment_pct", PAYEMS: "nonfarm_payrolls_k", M2SL: "m2_billions", INDPRO: "industrial_production", RSAFS: "retail_sales_m", HOUST: "housing_starts_k", UMCSENT: "consumer_sentiment" });

const WB: Record<string, string> = {
	"NY.GDP.MKTP.CD": "gdp_usd",
	"NY.GDP.MKTP.KD.ZG": "gdp_growth_pct",
	"NY.GDP.PCAP.CD": "gdp_per_capita_usd",
	"FP.CPI.TOTL.ZG": "inflation_pct",
	"SL.UEM.TOTL.ZS": "unemployment_pct",
	"SP.POP.TOTL": "population",
	"BN.CAB.XOKA.GD.ZS": "current_account_pct_gdp",
	"NE.EXP.GNFS.ZS": "exports_pct_gdp",
	"BX.KLT.DINV.WD.GD.ZS": "fdi_inflow_pct_gdp",
	"FR.INR.LEND": "lending_rate_pct",
};

export async function worldMacroAnnual(): Promise<Row[]> {
	const byKey = new Map<string, Row>();
	for (const [indicator, column] of Object.entries(WB)) {
		const [, points] = await getJson<[unknown, { country: { value: string }; countryiso3code: string; date: string; value: number | null }[] | null]>(
			`https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=30000`,
		);
		for (const p of points ?? []) {
			if (p.value == null || !p.countryiso3code) continue;
			const k = `${p.countryiso3code}|${p.date}`;
			const row = byKey.get(k) ?? Object.fromEntries([["country", p.country.value], ["iso3", p.countryiso3code], ["year", Number(p.date)], ...Object.values(WB).map((c) => [c, null])]);
			row[column] = round(p.value);
			byKey.set(k, row);
		}
	}
	return [...byKey.values()].sort((a, b) => String(a.iso3).localeCompare(String(b.iso3)) || Number(a.year) - Number(b.year));
}

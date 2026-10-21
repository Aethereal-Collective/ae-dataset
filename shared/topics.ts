// Copy for /topics/<topic> pages: the H1 and intro search engines read for "<topic> datasets" queries.
import type { Topic } from "./datasets";

export const TOPIC_PAGES: Record<Topic, { title: string; description: string; intro: string }> = {
	stocks: {
		title: "Stock Market Datasets",
		description: "Free daily stock price datasets for the Indonesia Stock Exchange (IDX) and the S&P 500, plus model-ready features. CSV and Parquet, updated daily.",
		intro: "Daily OHLCV for IDX and S&P 500 stocks, the S&P 500 constituent list, and IDX stocks with returns, volatility, RSI, beta to IHSG, and USD prices already computed.",
	},
	markets: {
		title: "Market Datasets: Indices, Commodities, FX, Crypto",
		description: "Free datasets for global stock indices including IHSG, commodity futures, US dollar exchange rates including IDR, and crypto prices. CSV and Parquet, updated daily.",
		intro: "31 stock indices, 18 commodities, 24 currencies against the dollar, 30 cryptocurrencies, and a cross-asset panel that puts them on one calendar.",
	},
	macro: {
		title: "Macroeconomic Datasets",
		description: "Free US interest rate, Treasury yield, CPI, unemployment, and money supply data, plus World Bank indicators for every country since 1960. CSV and Parquet.",
		intro: "US rates and yields daily, US macro indicators monthly, and GDP, inflation, unemployment, and trade for every country yearly.",
	},
	bitcoin: {
		title: "Bitcoin Datasets",
		description: "Free Bitcoin network data since 2009: price, hashrate, difficulty, transactions, fees, miner revenue, mining pools, and the Lightning Network. CSV and Parquet.",
		intro: "Every day of the Bitcoin network since the genesis block, every difficulty adjustment, mining pool share, and Lightning Network capacity.",
	},
	networks: {
		title: "Blockchain Network and Layer 2 Datasets",
		description: "Free datasets on Ethereum layer 2s: daily active addresses, transactions, fees, profit, TVL, and every scaling project with its stage and value secured. CSV and Parquet.",
		intro: "Daily fundamentals for Ethereum layer 2 networks and a snapshot of every scaling project, with gas and throughput data as history builds up.",
	},
	stablecoins: {
		title: "Stablecoin Datasets",
		description: "Free stablecoin datasets: total supply since 2017, every USD stablecoin, supply by chain, and daily net flows between chains. CSV and Parquet, updated daily.",
		intro: "Stablecoin market cap history, a snapshot of every USD stablecoin, supply on each chain, and daily inflows and outflows by chain.",
	},
	defi: {
		title: "DeFi Datasets",
		description: "Free DeFi datasets: protocol TVL, chain TVL history, yield pools with APY, lending markets, protocol fees, and a survival dataset of dead and rugged protocols. CSV and Parquet.",
		intro: "TVL by protocol and chain, yields and lending rates, protocol fees, and every protocol labeled active, dead, deprecated, or rugged.",
	},
	exchanges: {
		title: "Crypto Exchange Datasets",
		description: "Free crypto exchange datasets: DEX volume history, volume by DEX, and centralized exchange reserves and flows. CSV and Parquet, updated daily.",
		intro: "Daily DEX volume since 2014, volume per decentralized exchange, and on-chain reserves and net flows of centralized exchanges.",
	},
	security: {
		title: "Crypto Security Datasets: Hacks and Phishing",
		description: "Free crypto security datasets: every hack with inflation-adjusted losses and attack vectors, and over 160,000 labeled phishing domains with features. CSV and Parquet.",
		intro: "Every recorded crypto hack enriched with real losses, recovery rates, and attack vectors, and labeled phishing domains ready for training classifiers.",
	},
};

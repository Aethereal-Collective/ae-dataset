// Dataset registry: one entry per dataset. Pages, API and the refresh job all read from here.
// Collectors live in server/utils/collectors.ts under the same slug.

export type ColumnType = "string" | "number" | "date";
export interface Column {
	name: string;
	type: ColumnType;
	description: string;
}
export const TOPICS = { stablecoins: "Stablecoins", defi: "DeFi", exchanges: "Exchanges", security: "Security" } as const;
export type Topic = keyof typeof TOPICS;

export interface DatasetMeta {
	slug: string;
	title: string;
	summary: string;
	description: string;
	topic: Topic;
	/** Internal record of where the data comes from. Not shown on the site. */
	source: { name: string; url: string };
	license: string;
	schedule: string;
	/** replace: rebuild every run. append: add today's rows to the history. */
	mode: "replace" | "append";
	/** Columns that identify a row in append mode (today's re-run replaces, not duplicates). */
	key?: string[];
	columns: Column[];
}

export const DATASETS: DatasetMeta[] = [
	{
		slug: "stablecoin-supply-onchain",
		title: "Stablecoin Supply (On-chain)",
		summary: "Daily USDT and USDC total supply read directly from their contracts on five chains.",
		description:
			"Daily total supply of USDT and USDC on Ethereum, Base, Arbitrum, BNB Chain, and Polygon, read from the official token contracts and converted to whole tokens. History starts from the first day this dataset ran.",
		topic: "stablecoins",
		source: { name: "Public RPC nodes (computed by Aethereal)", url: "https://publicnode.com" },
		license: "CC BY 4.0. Free to use with attribution to Aethereal.",
		schedule: "Daily, 01:15 UTC",
		mode: "append",
		key: ["date", "chain", "token"],
		columns: [
			{ name: "date", type: "date", description: "Snapshot date (UTC)." },
			{ name: "chain", type: "string", description: "Blockchain: ethereum, base, arbitrum, bsc, polygon." },
			{ name: "token", type: "string", description: "USDT or USDC." },
			{ name: "symbol_onchain", type: "string", description: "symbol() as reported by the contract (e.g. USD₮0 on Arbitrum)." },
			{ name: "contract", type: "string", description: "Token contract address." },
			{ name: "total_supply", type: "number", description: "Total supply in whole tokens." },
		],
	},
	{
		slug: "chain-tvl-history",
		title: "Chain TVL History",
		summary: "Daily total value locked for the 25 largest chains, back to each chain's first day.",
		description:
			"Daily TVL in USD for the 25 chains with the highest TVL at refresh time. TVL counts assets deposited in DeFi protocols on each chain.",
		topic: "defi",
		source: { name: "DefiLlama", url: "https://defillama.com/chains" },
		license: "Free for research and education.",
		schedule: "Daily, 01:15 UTC",
		mode: "replace",
		columns: [
			{ name: "date", type: "date", description: "Day (UTC)." },
			{ name: "chain", type: "string", description: "Chain name." },
			{ name: "tvl_usd", type: "number", description: "Total value locked in USD." },
		],
	},
	{
		slug: "crypto-hacks",
		title: "Crypto Hacks",
		summary: "Every recorded crypto hack and exploit: date, protocol, technique, amount lost, chains.",
		description:
			"Recorded crypto hacks and exploits, from the earliest incidents to today, with the attack classification, technique, amount lost in USD, affected chains, and funds returned.",
		topic: "security",
		source: { name: "DefiLlama", url: "https://defillama.com/hacks" },
		license: "Free for research and education.",
		schedule: "Daily, 01:15 UTC",
		mode: "replace",
		columns: [
			{ name: "date", type: "date", description: "Date of the incident (UTC)." },
			{ name: "name", type: "string", description: "Protocol or project name." },
			{ name: "classification", type: "string", description: "Attack category (e.g. Key Compromise, Oracle Manipulation)." },
			{ name: "technique", type: "string", description: "Specific technique used." },
			{ name: "amount_usd", type: "number", description: "Amount lost in USD." },
			{ name: "returned_usd", type: "number", description: "Funds returned in USD, when known." },
			{ name: "chains", type: "string", description: "Affected chains, separated by '; '." },
			{ name: "bridge_hack", type: "string", description: "'yes' if a bridge was hacked." },
			{ name: "target_type", type: "string", description: "What was targeted (e.g. DeFi Protocol, CEX)." },
			{ name: "source", type: "string", description: "Link to the incident report." },
		],
	},
	{
		slug: "stablecoin-market-cap-history",
		title: "Stablecoin Market Cap History",
		summary: "Total circulating supply of all USD stablecoins, every day since 2017.",
		description: "Daily total circulating supply in USD across every tracked USD-pegged stablecoin and chain, from the first stablecoins to today.",
		topic: "stablecoins",
		source: { name: "DefiLlama", url: "https://defillama.com/stablecoins" },
		license: "Free for research and education.",
		schedule: "Daily, 01:15 UTC",
		mode: "replace",
		columns: [
			{ name: "date", type: "date", description: "Day (UTC)." },
			{ name: "circulating_usd", type: "number", description: "Total circulating USD stablecoins, in USD." },
		],
	},
	{
		slug: "stablecoin-market",
		title: "Stablecoins Snapshot",
		summary: "Every USD stablecoin with its peg mechanism, supply, and 1d, 7d, 30d change.",
		description: "One row per USD-pegged stablecoin: peg mechanism, current circulating supply, supply change over 1, 7 and 30 days, number of chains, and latest price.",
		topic: "stablecoins",
		source: { name: "DefiLlama", url: "https://defillama.com/stablecoins" },
		license: "Free for research and education.",
		schedule: "Daily, 01:15 UTC",
		mode: "replace",
		columns: [
			{ name: "name", type: "string", description: "Stablecoin name." },
			{ name: "symbol", type: "string", description: "Ticker." },
			{ name: "peg_mechanism", type: "string", description: "fiat-backed, crypto-backed, or algorithmic." },
			{ name: "circulating_usd", type: "number", description: "Circulating supply in USD." },
			{ name: "change_1d_pct", type: "number", description: "Supply change over 1 day, percent." },
			{ name: "change_7d_pct", type: "number", description: "Supply change over 7 days, percent." },
			{ name: "change_30d_pct", type: "number", description: "Supply change over 30 days, percent." },
			{ name: "chains", type: "number", description: "Number of chains it circulates on." },
			{ name: "price", type: "number", description: "Latest price in USD." },
		],
	},
	{
		slug: "defi-protocols",
		title: "DeFi Protocols",
		summary: "Thousands of DeFi protocols with category, chains, TVL, and daily and weekly change.",
		description: "One row per DeFi protocol with TVL above zero: category, chains it runs on, TVL in USD, TVL change over 1 and 7 days, market cap, and the date it was listed.",
		topic: "defi",
		source: { name: "DefiLlama", url: "https://defillama.com" },
		license: "Free for research and education.",
		schedule: "Daily, 01:15 UTC",
		mode: "replace",
		columns: [
			{ name: "name", type: "string", description: "Protocol name." },
			{ name: "category", type: "string", description: "Protocol type (Lending, Dexs, Liquid Staking, ...)." },
			{ name: "chains", type: "string", description: "Chains it runs on, separated by '; '." },
			{ name: "tvl_usd", type: "number", description: "Total value locked in USD." },
			{ name: "change_1d_pct", type: "number", description: "TVL change over 1 day, percent." },
			{ name: "change_7d_pct", type: "number", description: "TVL change over 7 days, percent." },
			{ name: "mcap_usd", type: "number", description: "Token market cap in USD, when it has a token." },
			{ name: "listed_date", type: "date", description: "Date the protocol was first tracked." },
		],
	},
	{
		slug: "yield-pools",
		title: "DeFi Yield Pools",
		summary: "APY, TVL, and risk flags for every tracked lending, staking, and liquidity pool.",
		description: "One row per yield pool: chain, project, asset, TVL, total APY split into base and reward, 30-day mean APY, and flags for stablecoin pools and impermanent loss risk.",
		topic: "defi",
		source: { name: "DefiLlama", url: "https://defillama.com/yields" },
		license: "Free for research and education.",
		schedule: "Daily, 01:15 UTC",
		mode: "replace",
		columns: [
			{ name: "pool_id", type: "string", description: "Stable pool identifier." },
			{ name: "chain", type: "string", description: "Chain." },
			{ name: "project", type: "string", description: "Protocol." },
			{ name: "symbol", type: "string", description: "Pool asset(s)." },
			{ name: "tvl_usd", type: "number", description: "Pool TVL in USD." },
			{ name: "apy", type: "number", description: "Total APY, percent." },
			{ name: "apy_base", type: "number", description: "APY from fees or interest, percent." },
			{ name: "apy_reward", type: "number", description: "APY from token rewards, percent." },
			{ name: "apy_mean_30d", type: "number", description: "Mean APY over the last 30 days, percent." },
			{ name: "stablecoin", type: "string", description: "'yes' if the pool holds only stablecoins." },
			{ name: "il_risk", type: "string", description: "'yes' if exposed to impermanent loss." },
			{ name: "exposure", type: "string", description: "single or multi asset." },
		],
	},
	{
		slug: "dex-volume-history",
		title: "DEX Volume History",
		summary: "Daily trading volume across all decentralized exchanges.",
		description: "Daily spot trading volume in USD summed across every tracked decentralized exchange and chain.",
		topic: "exchanges",
		source: { name: "DefiLlama", url: "https://defillama.com/dexs" },
		license: "Free for research and education.",
		schedule: "Daily, 01:15 UTC",
		mode: "replace",
		columns: [
			{ name: "date", type: "date", description: "Day (UTC)." },
			{ name: "volume_usd", type: "number", description: "DEX volume in USD." },
		],
	},
	{
		slug: "cex-reserves",
		title: "CEX Reserves",
		summary: "On-chain assets, net flows, and volume for centralized exchanges.",
		description: "One row per centralized exchange that publishes wallets: assets held on-chain excluding its own token, net inflows over 24 hours, 1 week and 1 month, spot volume, open interest, and derivatives volume.",
		topic: "exchanges",
		source: { name: "DefiLlama", url: "https://defillama.com/cexs" },
		license: "Free for research and education.",
		schedule: "Daily, 01:15 UTC",
		mode: "replace",
		columns: [
			{ name: "name", type: "string", description: "Exchange." },
			{ name: "assets_usd", type: "number", description: "On-chain assets in USD, excluding the exchange's own token." },
			{ name: "inflows_24h_usd", type: "number", description: "Net inflow over 24 hours in USD." },
			{ name: "inflows_1w_usd", type: "number", description: "Net inflow over 1 week in USD." },
			{ name: "inflows_1m_usd", type: "number", description: "Net inflow over 1 month in USD." },
			{ name: "spot_volume_usd", type: "number", description: "24h spot volume in USD." },
			{ name: "open_interest_usd", type: "number", description: "Derivatives open interest in USD." },
			{ name: "deriv_volume_usd", type: "number", description: "24h derivatives volume in USD." },
		],
	},
];

export const findDataset = (slug: string) => DATASETS.find((d) => d.slug === slug);

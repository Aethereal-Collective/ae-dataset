// Dataset registry: one entry per dataset. Pages, API and the refresh job all read from here.
// Collectors live in server/utils/collectors.ts under the same slug.

export type ColumnType = "string" | "number" | "date";
export interface Column {
	name: string;
	type: ColumnType;
	description: string;
}
export interface DatasetMeta {
	slug: string;
	title: string;
	summary: string;
	description: string;
	category: "crypto" | "blockchain";
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
			"Every day we call totalSupply() on the official USDT and USDC contracts on Ethereum, Base, Arbitrum, BNB Chain, and Polygon through public RPC nodes, and convert it to whole tokens using each contract's decimals(). History starts from the first day this dataset ran.",
		category: "blockchain",
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
			"Daily TVL in USD for the 25 chains with the highest TVL at refresh time, as reported by DefiLlama. TVL counts assets deposited in DeFi protocols on each chain.",
		category: "crypto",
		source: { name: "DefiLlama", url: "https://defillama.com/chains" },
		license: "Data by DefiLlama. Cite DefiLlama as the source.",
		schedule: "Daily, 01:15 UTC",
		mode: "replace",
		columns: [
			{ name: "date", type: "date", description: "Day (UTC)." },
			{ name: "chain", type: "string", description: "Chain name as used by DefiLlama." },
			{ name: "tvl_usd", type: "number", description: "Total value locked in USD." },
		],
	},
	{
		slug: "crypto-hacks",
		title: "Crypto Hacks",
		summary: "Every recorded crypto hack and exploit: date, protocol, technique, amount lost, chains.",
		description:
			"All hacks and exploits recorded by DefiLlama, from the earliest incidents to today, with the attack classification, technique, amount lost in USD, affected chains, and funds returned.",
		category: "crypto",
		source: { name: "DefiLlama", url: "https://defillama.com/hacks" },
		license: "Data by DefiLlama. Cite DefiLlama as the source.",
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
];

export const findDataset = (slug: string) => DATASETS.find((d) => d.slug === slug);

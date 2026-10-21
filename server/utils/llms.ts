// llms.txt and llms-full.txt: a plain-text map of the site for AI assistants and answer engines.
import { DATASETS, TOPICS, type DatasetMeta } from "../../shared/datasets";

const facts = (d: DatasetMeta) => {
	const s = readStats(d.slug);
	if (!s) return "being built";
	const range = s.firstDate ? `, ${s.firstDate} to ${s.lastDate}` : "";
	return `${s.rows.toLocaleString("en-US")} rows${range}, updated ${s.updatedAt.slice(0, 10)}`;
};

export function llmsTxt(site: string, full: boolean) {
	const lines = [
		"# Aethereal Data",
		"",
		"> Free financial datasets refreshed daily: stocks (Indonesia Stock Exchange and S&P 500), global indices, commodities, FX, crypto prices, US and world macro, Bitcoin, Ethereum layer 2s, stablecoins, DeFi, exchanges, crypto hacks, and phishing domains. Every dataset downloads as CSV or Parquet from a stable URL, and AI assistants can query all of them through an MCP server.",
		"",
		`Built by Aethereal (https://aethereal.top), an Indonesia-based organization working on AI, data science, blockchain, and fintech. Contact: aethereal.hq@gmail.com.`,
		"",
		"## Access",
		"",
		`- CSV: ${site}/files/<slug>.csv`,
		`- Parquet: ${site}/files/<slug>.parquet`,
		`- MCP server (Streamable HTTP, read-only, no auth): ${site}/mcp with tools list_datasets, describe_dataset, query_dataset, aggregate_dataset`,
		`- Python: pd.read_csv("${site}/files/<slug>.csv")`,
		"- Datasets marked enriched are built by Aethereal from several sources with computed columns.",
		"",
	];
	for (const [topic, label] of Object.entries(TOPICS)) {
		const items = DATASETS.filter((d) => d.topic === topic && isListed(d));
		if (!items.length) continue;
		lines.push(`## ${label}`, "", `Topic page: ${site}/topics/${topic}`, "");
		for (const d of items) {
			lines.push(`- [${d.title}](${site}/datasets/${d.slug})${d.enriched ? " (enriched)" : ""}: ${d.summary} ${facts(d)}. CSV: ${site}/files/${d.slug}.csv`);
			if (full) {
				lines.push(`  ${d.description}`, `  License: ${d.license} Schedule: ${d.schedule}.`, "  Columns:");
				for (const c of d.columns) lines.push(`  - ${c.name} (${c.type}): ${c.description}`);
				lines.push("");
			}
		}
		lines.push("");
	}
	if (!full) lines.push("## Optional", "", `- [Full catalog with every column](${site}/llms-full.txt)`, "");
	return lines.join("\n");
}

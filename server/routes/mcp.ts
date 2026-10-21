// Remote MCP server (Streamable HTTP, stateless JSON responses): lets AI assistants list, inspect, and
// query every dataset. Read-only, no auth. Add it with:
//   claude mcp add --transport http aethereal-data https://data.aethereal.top/mcp
import { existsSync } from "node:fs";
import { asyncBufferFromFile, parquetReadObjects } from "hyparquet";
import { DATASETS, TOPICS, findDataset, type DatasetMeta } from "../../shared/datasets";
import { MAX_ROWS, aggregate, query, type Row } from "../../shared/query";

const PROTOCOLS = ["2025-06-18", "2025-03-26", "2024-11-05"];

const FILTERS = {
	type: "array",
	description: 'Row filters, all must match. Example: [{"column":"ticker","op":"eq","value":"BBCA"},{"column":"date","op":"gte","value":"2025-01-01"}]. Dates are YYYY-MM-DD strings.',
	items: {
		type: "object",
		properties: {
			column: { type: "string" },
			op: { type: "string", enum: ["eq", "neq", "gt", "gte", "lt", "lte", "contains", "in"] },
			value: { description: "A string or number; an array for 'in'." },
		},
		required: ["column", "op", "value"],
	},
};
const SORT = { type: "object", properties: { column: { type: "string" }, desc: { type: "boolean" } }, required: ["column"] };
const LIMIT = { type: "number", description: `Max rows to return, 1 to ${MAX_ROWS}. Default 100.` };

const TOOLS = [
	{
		name: "list_datasets",
		description: "List the financial datasets: stocks (IDX, S&P 500), indices, commodities, FX, crypto, macro, Bitcoin, L2s, stablecoins, DeFi, exchanges, and security. Returns slug, title, summary, row count, and last update.",
		inputSchema: { type: "object", properties: { topic: { type: "string", enum: Object.keys(TOPICS), description: "Only this topic." } } },
	},
	{
		name: "describe_dataset",
		description: "Full description, every column with its type and meaning, row count, license, download URLs, and the latest rows of one dataset. Call before querying.",
		inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
	},
	{
		name: "query_dataset",
		description: "Return rows from a dataset with optional filters, sort, and column selection. For totals, averages, or anything over many rows, use aggregate_dataset instead.",
		inputSchema: {
			type: "object",
			properties: { slug: { type: "string" }, columns: { type: "array", items: { type: "string" }, description: "Columns to return. Default all." }, filters: FILTERS, sort: SORT, limit: LIMIT },
			required: ["slug"],
		},
	},
	{
		name: "aggregate_dataset",
		description: "Group rows and compute sum, avg, min, max, or count per group, e.g. yearly hack losses by attack vector or average daily return per ticker. Metric columns come back as <fn>_<column>.",
		inputSchema: {
			type: "object",
			properties: {
				slug: { type: "string" },
				filters: FILTERS,
				group_by: { type: "array", items: { type: "string" }, description: "Columns to group by. Empty for one overall row." },
				metrics: {
					type: "array",
					items: { type: "object", properties: { column: { type: "string" }, fn: { type: "string", enum: ["sum", "avg", "min", "max", "count"] } }, required: ["column", "fn"] },
				},
				sort: { ...SORT, description: "Sort by a group column or a metric like avg_close." },
				limit: LIMIT,
			},
			required: ["slug", "group_by", "metrics"],
		},
	},
];

const origin = () => useRuntimeConfig().public.siteUrl as string;

function dataset(slug: unknown): DatasetMeta {
	const meta = findDataset(String(slug ?? ""));
	if (!meta) throw new Error(`Unknown dataset "${slug}". Call list_datasets for valid slugs.`);
	if (!existsSync(filePath(meta.slug, "parquet"))) throw new Error(`Dataset "${meta.slug}" is still being built. Try again in a few minutes.`);
	return meta;
}

// ponytail: reads the needed columns from parquet on every call (a few seconds on the largest sets).
// Cache by updatedAt if query volume grows.
async function load(meta: DatasetMeta, wanted: (string | undefined)[]): Promise<Row[]> {
	const valid = new Set(meta.columns.map((c) => c.name));
	const cols = [...new Set(wanted.filter((c): c is string => !!c))];
	const bad = cols.filter((c) => !valid.has(c));
	if (bad.length) throw new Error(`Unknown column(s) ${bad.join(", ")}. Columns of ${meta.slug}: ${[...valid].join(", ")}.`);
	const file = await asyncBufferFromFile(filePath(meta.slug, "parquet"));
	return (await parquetReadObjects({ file, columns: cols.length ? cols : undefined })) as Row[];
}

type Args = Record<string, any>;

async function call(name: string, a: Args): Promise<unknown> {
	switch (name) {
		case "list_datasets":
			return DATASETS.filter((d) => isListed(d) && (!a.topic || d.topic === a.topic)).map((d) => {
				const s = readStats(d.slug);
				return { slug: d.slug, title: d.title, topic: d.topic, summary: d.summary, enriched: !!d.enriched, rows: s?.rows ?? null, updated: s?.updatedAt ?? null };
			});
		case "describe_dataset": {
			const d = dataset(a.slug);
			const s = readStats(d.slug);
			return {
				slug: d.slug,
				title: d.title,
				description: d.description,
				columns: d.columns,
				rows: s?.rows ?? null,
				updated: s?.updatedAt ?? null,
				schedule: d.schedule,
				license: d.license,
				csv: `${origin()}/files/${d.slug}.csv`,
				parquet: `${origin()}/files/${d.slug}.parquet`,
				latest_rows: readPreview(d.slug).slice(0, 5),
			};
		}
		case "query_dataset": {
			const d = dataset(a.slug);
			const filters = a.filters ?? [];
			const cols = a.columns?.length ? [...a.columns, ...filters.map((f: Args) => f.column), a.sort?.column] : [];
			return query(await load(d, cols), { columns: a.columns, filters, sort: a.sort, limit: a.limit });
		}
		case "aggregate_dataset": {
			const d = dataset(a.slug);
			const filters = a.filters ?? [];
			const metrics = a.metrics ?? [];
			if (!metrics.length) throw new Error("metrics must list at least one {column, fn}.");
			const rows = await load(d, [...(a.group_by ?? []), ...metrics.map((m: Args) => m.column), ...filters.map((f: Args) => f.column)]);
			return aggregate(rows, { filters, group_by: a.group_by ?? [], metrics, sort: a.sort, limit: a.limit });
		}
	}
	throw new Error(`Unknown tool "${name}".`);
}

interface RpcRequest {
	jsonrpc: "2.0";
	id?: string | number | null;
	method: string;
	params?: Args;
}

async function handle(req: RpcRequest) {
	const ok = (result: unknown) => ({ jsonrpc: "2.0", id: req.id, result });
	switch (req.method) {
		case "initialize": {
			const asked = req.params?.protocolVersion;
			return ok({
				protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
				capabilities: { tools: {} },
				serverInfo: { name: "aethereal-data", version: "1.0.0" },
				instructions: "Financial datasets refreshed daily. Start with list_datasets, then describe_dataset for columns, then query_dataset or aggregate_dataset. Prefer aggregate_dataset for questions over many rows.",
			});
		}
		case "ping":
			return ok({});
		case "tools/list":
			return ok({ tools: TOOLS });
		case "tools/call":
			try {
				const result = await call(req.params?.name, req.params?.arguments ?? {});
				return ok({ content: [{ type: "text", text: JSON.stringify(result) }] });
			} catch (e) {
				// Tool errors go back to the model as results so it can correct the call.
				return ok({ content: [{ type: "text", text: (e as Error).message }], isError: true });
			}
		default:
			return { jsonrpc: "2.0", id: req.id ?? null, error: { code: -32601, message: `Method not found: ${req.method}` } };
	}
}

export default defineEventHandler(async (event) => {
	setResponseHeaders(event, { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type, mcp-protocol-version, mcp-session-id", "access-control-allow-methods": "POST, OPTIONS" });
	if (event.method === "OPTIONS") return null;
	if (event.method !== "POST") {
		setResponseStatus(event, 405);
		return "This is an MCP endpoint. POST JSON-RPC to it, or add it to your AI client: claude mcp add --transport http aethereal-data " + origin() + "/mcp";
	}
	const body = await readBody<RpcRequest | RpcRequest[]>(event);
	const batch = Array.isArray(body) ? body : [body];
	// Notifications (no id) get no response body.
	const replies = (await Promise.all(batch.map((r) => (r.id === undefined ? null : handle(r))))).filter(Boolean);
	if (!replies.length) {
		setResponseStatus(event, 202);
		return null;
	}
	return Array.isArray(body) ? replies : replies[0];
});

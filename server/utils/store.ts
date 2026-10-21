// Datasets live on disk: .csv, .parquet, .meta.json (stats + catalog insight), .preview.json (latest rows),
// and for append datasets .json (the accumulated history). Price datasets run to millions of rows,
// so nothing on the request path reads the full rows.
// In Docker, DATA_DIR sits on a mounted volume so history survives redeploys.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parquetWriteBuffer } from "hyparquet-writer";
import { toCsv } from "../../shared/csv";
import type { DatasetMeta } from "../../shared/datasets";
import { summarize, type Summary } from "./summaries";

type Row = Record<string, string | number | null>;
export interface DatasetStats {
	rows: number;
	updatedAt: string;
	csvBytes: number;
	parquetBytes: number;
	insight: Summary | null;
	/** Distinct dates covered, for datasets with a date column. */
	days?: number;
	/** First and last date (or year) covered. */
	firstDate?: string;
	lastDate?: string;
}

const PREVIEW_ROWS = 20;

const coverage = (rows: Row[], key: string | null) => {
	if (!key) return {};
	let first: string | undefined;
	let last: string | undefined;
	for (const r of rows) {
		const v = r[key] == null ? undefined : String(r[key]);
		if (!v) continue;
		if (!first || v < first) first = v;
		if (!last || v > last) last = v;
	}
	return { firstDate: first, lastDate: last };
};

export const dataDir = () => resolve(process.env.DATA_DIR || ".data/datasets");
const path = (slug: string, ext: string) => join(dataDir(), `${slug}.${ext}`);

export const filePath = (slug: string, format: "csv" | "parquet") => path(slug, format);

const readRows = (slug: string) => readJson<Row[]>(path(slug, "json"), []);

const readJson = <T>(f: string, fallback: T): T => (existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : fallback);

export const readStats = (slug: string) => readJson<DatasetStats | null>(path(slug, "meta.json"), null);
// Datasets we collect ourselves start empty; keep them out of listings until a month of history exists.
const MIN_DAYS = 30;
export const isListed = (meta: DatasetMeta) => meta.mode !== "append" || (readStats(meta.slug)?.days ?? 0) >= MIN_DAYS;

export const readPreview = (slug: string) => readJson<Row[]>(path(slug, "preview.json"), []);

export function saveDataset(meta: DatasetMeta, fresh: Row[]): DatasetStats {
	mkdirSync(dataDir(), { recursive: true });
	let rows = fresh;
	if (meta.mode === "append") {
		// Re-running the same day replaces that day's rows instead of duplicating them.
		const key = (r: Row) => (meta.key ?? ["date"]).map((k) => r[k]).join("|");
		const incoming = new Set(fresh.map(key));
		rows = [...readRows(meta.slug).filter((r) => !incoming.has(key(r))), ...fresh];
	}
	const names = meta.columns.map((c) => c.name);
	if (meta.mode === "append") writeFileSync(path(meta.slug, "json"), JSON.stringify(rows));
	// Newest first when the dataset has dates, otherwise the collector's order (largest first).
	const hasDate = names.includes("date");
	const preview = hasDate ? [...rows].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, PREVIEW_ROWS) : rows.slice(0, PREVIEW_ROWS);
	writeFileSync(path(meta.slug, "preview.json"), JSON.stringify(preview));
	writeFileSync(path(meta.slug, "csv"), toCsv(names, rows));
	const parquet = parquetWriteBuffer({
		columnData: meta.columns.map((c) => ({
			name: c.name,
			data: rows.map((r) => r[c.name] ?? null),
			type: c.type === "number" ? "DOUBLE" : "STRING",
		})),
	});
	writeFileSync(path(meta.slug, "parquet"), Buffer.from(parquet));
	const stats: DatasetStats = {
		rows: rows.length,
		updatedAt: new Date().toISOString(),
		csvBytes: statSync(path(meta.slug, "csv")).size,
		parquetBytes: statSync(path(meta.slug, "parquet")).size,
		insight: summarize(meta.slug, rows),
		days: hasDate ? new Set(rows.map((r) => r.date)).size : undefined,
		...coverage(rows, hasDate ? "date" : names.includes("year") ? "year" : null),
	};
	writeFileSync(path(meta.slug, "meta.json"), JSON.stringify(stats));
	return stats;
}

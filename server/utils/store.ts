// Datasets live on disk: <slug>.json (rows, source of truth), .csv, .parquet, and .meta.json.
// In Docker, DATA_DIR sits on a mounted volume so history survives redeploys.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parquetWriteBuffer } from "hyparquet-writer";
import { toCsv } from "../../shared/csv";
import type { DatasetMeta } from "../../shared/datasets";

type Row = Record<string, string | number | null>;
export interface DatasetStats {
	rows: number;
	updatedAt: string;
	csvBytes: number;
	parquetBytes: number;
}

export const dataDir = () => resolve(process.env.DATA_DIR || ".data/datasets");
const path = (slug: string, ext: string) => join(dataDir(), `${slug}.${ext}`);

export const filePath = (slug: string, format: "csv" | "parquet") => path(slug, format);

export function readRows(slug: string): Row[] {
	const f = path(slug, "json");
	return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : [];
}

export function readStats(slug: string): DatasetStats | null {
	const f = path(slug, "meta.json");
	return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
}

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
	writeFileSync(path(meta.slug, "json"), JSON.stringify(rows));
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
	};
	writeFileSync(path(meta.slug, "meta.json"), JSON.stringify(stats));
	return stats;
}

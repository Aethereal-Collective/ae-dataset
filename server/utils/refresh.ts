import { DATASETS } from "../../shared/datasets";
import { COLLECTORS } from "./collectors";
import { readStats, saveDataset } from "./store";

let running: Promise<Record<string, string>> | null = null;

// Refresh every dataset (or only those never built). One failing source doesn't stop the others.
export function refreshDatasets(onlyMissing = false) {
	running ??= (async () => {
		const result: Record<string, string> = {};
		for (const meta of DATASETS) {
			if (onlyMissing && readStats(meta.slug)) continue;
			try {
				const rows = await COLLECTORS[meta.slug]!();
				const unknown = rows[0] && Object.keys(rows[0]).filter((k) => !meta.columns.some((c) => c.name === k));
				if (unknown?.length) throw new Error(`columns not in registry: ${unknown.join(", ")}`);
				const stats = saveDataset(meta, rows);
				result[meta.slug] = `ok, ${stats.rows} rows`;
			} catch (e) {
				result[meta.slug] = `failed: ${(e as Error).message}`;
				console.error(`[datasets] ${meta.slug}:`, e);
			}
		}
		console.log("[datasets] refresh", result);
		return result;
	})().finally(() => (running = null));
	return running;
}

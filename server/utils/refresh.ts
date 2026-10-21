import { spawn } from "node:child_process";
import { DATASETS } from "../../shared/datasets";
import { COLLECTORS } from "./collectors";
import { pingIndexNow } from "./indexnow";
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
		await pingIndexNow(useRuntimeConfig().public.siteUrl);
		return result;
	})().finally(() => (running = null));
	return running;
}

let child: Promise<string> | null = null;

// Run refreshDatasets in a separate Node process (same bundle, REFRESH_ONLY set) and wait for it.
export function refreshInChild(onlyMissing: boolean) {
	child ??= new Promise<string>((resolve) => {
		const p = spawn(process.execPath, [process.argv[1]!], {
			env: { ...process.env, REFRESH_ONLY: onlyMissing ? "missing" : "all", PORT: "0", NITRO_PORT: "0", HOST: "127.0.0.1", NITRO_HOST: "127.0.0.1" },
			stdio: "inherit",
		});
		p.on("exit", (code) => resolve(`refresh process exited with ${code}`));
		p.on("error", (e) => resolve(`refresh process failed: ${e.message}`));
	}).finally(() => (child = null));
	return child;
}

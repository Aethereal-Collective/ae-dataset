import { createReadStream, existsSync } from "node:fs";
import { findDataset } from "../../../shared/datasets";

const TYPES = { csv: "text/csv; charset=utf-8", parquet: "application/vnd.apache.parquet" } as const;

// /files/<slug>.csv or /files/<slug>.parquet. The slug must be a registered dataset, so no path tricks.
export default defineEventHandler((event) => {
	const match = (getRouterParam(event, "file") ?? "").match(/^([a-z0-9-]+)\.(csv|parquet)$/);
	const meta = match && findDataset(match[1]!);
	if (!meta) throw createError({ statusCode: 404, statusMessage: "File not found" });
	const format = match[2] as keyof typeof TYPES;
	const file = filePath(meta.slug, format);
	if (!existsSync(file)) throw createError({ statusCode: 404, statusMessage: "Dataset not built yet" });
	setResponseHeaders(event, {
		"content-type": TYPES[format],
		"content-disposition": `attachment; filename="${meta.slug}.${format}"`,
		"cache-control": "public, max-age=3600",
		"access-control-allow-origin": "*",
	});
	return sendStream(event, createReadStream(file));
});

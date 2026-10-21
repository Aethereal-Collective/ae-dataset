import { findDataset } from "../../../shared/datasets";

const PREVIEW_ROWS = 20;

export default defineEventHandler((event) => {
	const meta = findDataset(getRouterParam(event, "slug") ?? "");
	if (!meta) throw createError({ statusCode: 404, statusMessage: "Dataset not found" });
	const rows = readRows(meta.slug);
	// Newest rows first so the preview shows current data.
	const preview = [...rows].sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? ""))).slice(0, PREVIEW_ROWS);
	return { ...meta, stats: readStats(meta.slug), preview };
});

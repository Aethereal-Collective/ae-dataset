import { findDataset } from "../../../shared/datasets";

export default defineEventHandler((event) => {
	const meta = findDataset(getRouterParam(event, "slug") ?? "");
	if (!meta) throw createError({ statusCode: 404, statusMessage: "Dataset not found" });
	return { ...meta, stats: readStats(meta.slug), preview: readPreview(meta.slug), listed: isListed(meta) };
});

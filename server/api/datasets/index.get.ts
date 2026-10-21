import { DATASETS } from "../../../shared/datasets";

export default defineEventHandler(() =>
	DATASETS.map((d) => {
		const stats = readStats(d.slug);
		return { ...d, stats, insight: summarize(d.slug, stats?.updatedAt) };
	}),
);

import { DATASETS } from "../../../shared/datasets";

export default defineEventHandler(() =>
	DATASETS.map((d) => {
		const stats = readStats(d.slug);
		return { ...d, stats, insight: stats?.insight ?? null };
	}),
);

import { DATASETS } from "../../../shared/datasets";

export default defineEventHandler(() =>
	DATASETS.filter(isListed).map((d) => {
		const stats = readStats(d.slug);
		return { ...d, stats, insight: stats?.insight ?? null };
	}),
);

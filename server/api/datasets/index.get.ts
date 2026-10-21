import { DATASETS } from "../../../shared/datasets";

export default defineEventHandler(() => DATASETS.map((d) => ({ ...d, stats: readStats(d.slug) })));

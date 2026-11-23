import { DATASETS, TOPICS } from "../../shared/datasets";

export default defineEventHandler((event) => {
	const site = useRuntimeConfig().public.siteUrl;
	const urls = [
		{ loc: site, lastmod: undefined as string | undefined },
		{ loc: `${site}/id/data-saham-idx`, lastmod: undefined as string | undefined },
		{ loc: `${site}/id/data-kurs-usd-idr`, lastmod: undefined as string | undefined },
		{ loc: `${site}/id/data-crypto-csv`, lastmod: undefined as string | undefined },
		...Object.keys(TOPICS).map((t) => ({ loc: `${site}/topics/${t}`, lastmod: undefined as string | undefined })),
		...DATASETS.filter(isListed).map((d) => ({ loc: `${site}/datasets/${d.slug}`, lastmod: readStats(d.slug)?.updatedAt.slice(0, 10) })),
	];
	setResponseHeader(event, "content-type", "application/xml; charset=utf-8");
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<changefreq>daily</changefreq></url>`).join("\n")}
</urlset>`;
});

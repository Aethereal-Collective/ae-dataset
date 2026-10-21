export default defineEventHandler((event) => {
	setResponseHeader(event, "content-type", "text/plain; charset=utf-8");
	return `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${useRuntimeConfig().public.siteUrl}/sitemap.xml\n`;
});

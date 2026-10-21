// AI crawlers are welcomed by name: being read and cited by answer engines is the point.
// A named group replaces the * group for that bot, so each repeats the same rules.
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "Bingbot", "CCBot"];

export default defineEventHandler((event) => {
	const site = useRuntimeConfig().public.siteUrl;
	setResponseHeader(event, "content-type", "text/plain; charset=utf-8");
	return [...["*", ...AI_BOTS].map((ua) => `User-agent: ${ua}\nAllow: /\nDisallow: /api/\n`), `Sitemap: ${site}/sitemap.xml`, `# AI-readable summary: ${site}/llms.txt`, ""].join("\n");
});

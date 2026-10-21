import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
	compatibilityDate: "2026-10-01",
	devtools: { enabled: false },
	modules: ["@nuxt/icon", "@nuxt/fonts"],
	css: ["~/assets/css/main.css"],
	vite: { plugins: [tailwindcss()] },

	app: {
		head: {
			htmlAttrs: { lang: "en" },
			link: [{ rel: "icon", href: "/favicon.ico" }],
		},
	},

	// Public base URL used in code snippets. Override with NUXT_PUBLIC_SITE_URL.
	runtimeConfig: { public: { siteUrl: "https://data.aethereal.top" } },

	nitro: {
		experimental: { tasks: true },
		// Rebuild datasets daily at 01:15 UTC.
		scheduledTasks: { "15 1 * * *": ["datasets:refresh"] },
	},
});

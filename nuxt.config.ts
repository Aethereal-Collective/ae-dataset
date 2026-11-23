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
	runtimeConfig: { public: { siteUrl: "https://dataset.aethereal.top" } },

	routeRules: {
		"/**": {
			headers: {
				"X-Content-Type-Options": "nosniff",
				"Referrer-Policy": "strict-origin-when-cross-origin",
				"X-Frame-Options": "DENY",
				"Content-Security-Policy": "frame-ancestors 'none'",
				"Cross-Origin-Opener-Policy": "same-origin-allow-popups",
				"Permissions-Policy": "camera=(), geolocation=(), microphone=(), focus-without-user-activation=()",
			},
		},
	},

	nitro: {
		experimental: { tasks: true },
		// Rebuild datasets daily at 01:15 UTC.
		scheduledTasks: { "15 1 * * *": ["datasets:refresh"] },
	},
});

// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
	site: "https://ashbroadway.com",

	// Match the URL shape WordPress serves today, so the migration needs no
	// redirects: /, /portfolio/, /portfolio/<slug>/, /testimonials/
	trailingSlash: "always",
	build: { format: "directory" },

	// Every page is prerendered at build time. The adapter exists only so the
	// two OAuth routes that sign editors into the CMS can run on the server —
	// they opt out of prerendering individually. Railway serves the result with
	// `npm start`.
	output: "static",
	adapter: node({ mode: "standalone" }),

	integrations: [sitemap()],
});

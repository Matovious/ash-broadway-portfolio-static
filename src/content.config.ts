import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Every case study on the WordPress site followed the same rhythm — brief,
 * scope, process, outcome — built out of repeated ACF blocks. `sections` keeps
 * that shape editable rather than hard-coding four fields, so a case study can
 * grow a fifth section without a code change.
 */
const caseStudies = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "src/content/case-studies" }),
	schema: z.object({
		title: z.string(),
		/** Manual sequence on the Work page, lower first. */
		order: z.number().default(99),
		date: z.coerce.date(),
		logo: z.string().optional(),
		logoAlt: z.string().optional(),
		draft: z.boolean().default(false),
		/**
		 * Standalone images shown after the sections. On the WordPress site
		 * these were plain Gutenberg image blocks sitting outside the ACF
		 * blocks entirely.
		 */
		gallery: z
			.array(
				z.object({
					image: z.string(),
					caption: z.string().default(""),
					alt: z.string().default(""),
				}),
			)
			.default([]),
		sections: z
			.array(
				z.object({
					heading: z.string(),
					body: z.string(),
					image: z.string().optional(),
					imageAlt: z.string().optional(),
					imageLink: z.string().optional(),
				}),
			)
			.default([]),
	}),
});

const testimonials = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "src/content/testimonials" }),
	schema: z.object({
		name: z.string(),
		role: z.string().default(""),
		company: z.string().default(""),
		quote: z.string(),
		order: z.number().default(99),
	}),
});

const pages = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "src/content/pages" }),
	schema: z.object({
		title: z.string(),
		heroImage: z.string().optional(),
		heroCaption: z.string().default(""),
		/** Sits inside the image frame, beneath the caption. */
		heroIntro: z.string().default(""),
	}),
});

export const collections = { caseStudies, testimonials, pages };

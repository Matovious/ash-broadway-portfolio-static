/**
 * Minimal GitHub OAuth client for Sveltia CMS.
 *
 * Sveltia (like Decap before it) expects an OAuth helper at some `base_url`
 * exposing `/auth` and `/callback`. Netlify provides one; Railway does not, but
 * since we already run a Node process to serve the site we host it ourselves
 * rather than taking on a separate Cloudflare Worker.
 *
 * Protocol per the reference implementation at sveltia/sveltia-cms-auth.
 */

export const PROVIDER = "github";
export const CSRF_COOKIE = "csrf-token";

/** GitHub needs `repo` to commit content and `user` to show who is signed in. */
export const SCOPE = "repo,user";

/** Escape for safe embedding inside an inline <script>. */
const serialize = (value: unknown) => JSON.stringify(value ?? null).replaceAll("<", "\\u003c");

export const getEnv = (key: string) => process.env[key] ?? "";

/**
 * The popup can't trust the `site_id` it was given — the caller supplies it —
 * but the browser sets a message event's origin, so that is what we check the
 * token against before handing it over.
 */
const allowedHostPatterns = () =>
	(getEnv("ALLOWED_DOMAINS") || "ashbroadway.com,localhost")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean)
		.map((s) => `^${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replaceAll("\\*", ".+")}$`);

interface HandshakeArgs {
	token?: string;
	error?: string;
	errorCode?: string;
}

/**
 * The page the popup lands on. It waits for the CMS window to announce itself,
 * then posts the token back to that window and closes the loop.
 */
export const handshakeResponse = ({ token, error, errorCode }: HandshakeArgs): Response => {
	const state = error ? "error" : "success";
	const content = error ? { provider: PROVIDER, error, errorCode } : { provider: PROVIDER, token };

	const html = `<!doctype html><html><body><script>
	(() => {
		const trustedPatterns = ${serialize(allowedHostPatterns())};
		const hasToken = ${serialize(!!token)};

		const isTrusted = (origin) => {
			try {
				const { hostname } = new URL(origin);
				return trustedPatterns.some((pattern) => new RegExp(pattern).test(hostname));
			} catch {
				return false;
			}
		};

		window.addEventListener('message', ({ data, origin }) => {
			if (data !== 'authorizing:${PROVIDER}') return;
			if (hasToken && trustedPatterns.length && !isTrusted(origin)) return;

			window.opener?.postMessage(
				'authorization:${PROVIDER}:${state}:${serialize(content)}',
				origin
			);
		});

		window.opener?.postMessage('authorizing:${PROVIDER}', '*');
	})();
	</script></body></html>`;

	return new Response(html, {
		headers: {
			"Content-Type": "text/html;charset=UTF-8",
			"Set-Cookie": `${CSRF_COOKIE}=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax; Secure`,
		},
	});
};

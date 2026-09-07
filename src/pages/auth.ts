import type { APIRoute } from "astro";
import { CSRF_COOKIE, PROVIDER, SCOPE, getEnv, handshakeResponse } from "../lib/oauth";

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
	const provider = url.searchParams.get("provider") ?? PROVIDER;

	if (provider !== PROVIDER) {
		return handshakeResponse({
			error: `Unsupported provider: ${provider}`,
			errorCode: "UNSUPPORTED_BACKEND",
		});
	}

	const clientId = getEnv("GITHUB_CLIENT_ID");

	if (!clientId || !getEnv("GITHUB_CLIENT_SECRET")) {
		return handshakeResponse({
			error: "OAuth app client ID or secret is not configured.",
			errorCode: "MISCONFIGURED_CLIENT",
		});
	}

	const csrfToken = crypto.randomUUID().replaceAll("-", "");
	const params = new URLSearchParams({ client_id: clientId, scope: SCOPE, state: csrfToken });

	return new Response("", {
		status: 302,
		headers: {
			Location: `https://github.com/login/oauth/authorize?${params}`,
			// Ten minutes is long enough to sign in; SameSite=Lax so the cookie
			// survives the redirect back from GitHub.
			"Set-Cookie":
				`${CSRF_COOKIE}=${PROVIDER}_${csrfToken}; ` +
				`HttpOnly; Path=/; Max-Age=600; SameSite=Lax; Secure`,
		},
	});
};

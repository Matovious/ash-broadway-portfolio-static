import type { APIRoute } from "astro";
import { CSRF_COOKIE, PROVIDER, getEnv, handshakeResponse } from "../lib/oauth";

export const prerender = false;

export const GET: APIRoute = async ({ url, request }) => {
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");

	const cookie = request.headers.get("cookie") ?? "";
	const stored = cookie.match(new RegExp(`${CSRF_COOKIE}=([^;]+)`))?.[1] ?? "";
	const [provider, csrfToken] = stored.split("_");

	if (provider !== PROVIDER) {
		return handshakeResponse({
			error: "Failed to verify the request. Please try again later.",
			errorCode: "CSRF_VERIFICATION_FAILED",
		});
	}

	if (!code || !state) {
		return handshakeResponse({
			error: "Failed to receive an authorization code. Please try again later.",
			errorCode: "AUTH_CODE_REQUEST_FAILED",
		});
	}

	if (!csrfToken || state !== csrfToken) {
		return handshakeResponse({
			error: "Potential CSRF attack detected. Authentication flow aborted.",
			errorCode: "CSRF_VERIFICATION_FAILED",
		});
	}

	let response: Response;

	try {
		response = await fetch("https://github.com/login/oauth/access_token", {
			method: "POST",
			headers: { Accept: "application/json", "Content-Type": "application/json" },
			body: JSON.stringify({
				code,
				client_id: getEnv("GITHUB_CLIENT_ID"),
				client_secret: getEnv("GITHUB_CLIENT_SECRET"),
			}),
		});
	} catch {
		return handshakeResponse({
			error: "Failed to request an access token. Please try again later.",
			errorCode: "TOKEN_REQUEST_FAILED",
		});
	}

	try {
		const { access_token: token, error } = (await response.json()) as {
			access_token?: string;
			error?: string;
		};
		return handshakeResponse({ token, error });
	} catch {
		return handshakeResponse({
			error: "Server responded with malformed data. Please try again later.",
			errorCode: "MALFORMED_RESPONSE",
		});
	}
};

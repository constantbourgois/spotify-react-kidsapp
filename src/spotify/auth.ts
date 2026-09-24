import { codeChallenge, randomString } from "./pkce";

export const CLIENT_ID: string | undefined = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
export const LOGOUT_EVENT = "kidsapp:logout";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const TOKENS_KEY = "kidsapp.tokens";
const VERIFIER_KEY = "kidsapp.pkce.verifier";
const STATE_KEY = "kidsapp.pkce.state";
const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

export type Tokens = { accessToken: string; refreshToken: string; expiresAt: number };

export class LoggedOutError extends Error {
  constructor() {
    super("Not logged in to Spotify");
  }
}

function redirectUri(): string {
  return import.meta.env.VITE_REDIRECT_URI || `${window.location.origin}/`;
}

export function loadTokens(): Tokens | null {
  const raw = localStorage.getItem(TOKENS_KEY);
  return raw ? (JSON.parse(raw) as Tokens) : null;
}

function saveTokens(tokens: Tokens): void {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export function logout(): void {
  localStorage.removeItem(TOKENS_KEY);
  window.dispatchEvent(new Event(LOGOUT_EVENT));
}

export async function startLogin(): Promise<void> {
  const verifier = randomString(64);
  const state = randomString(16);
  localStorage.setItem(VERIFIER_KEY, verifier);
  localStorage.setItem(STATE_KEY, state);
  const params = new URLSearchParams({
    client_id: CLIENT_ID ?? "",
    response_type: "code",
    redirect_uri: redirectUri(),
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: await codeChallenge(verifier),
    state,
  });
  window.location.assign(`https://accounts.spotify.com/authorize?${params}`);
}

export async function completeLoginFromUrl(): Promise<void> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (!code && !error) return;

  window.history.replaceState(null, "", "/");
  const verifier = localStorage.getItem(VERIFIER_KEY);
  const expectedState = localStorage.getItem(STATE_KEY);
  localStorage.removeItem(VERIFIER_KEY);
  localStorage.removeItem(STATE_KEY);

  if (error) {
    throw new Error(error === "access_denied" ? "Connexion annulée." : `Erreur Spotify : ${error}`);
  }
  if (!code || !verifier || url.searchParams.get("state") !== expectedState) {
    throw new Error("La connexion a échoué, réessaie.");
  }
  saveTokens(
    await requestTokens({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      code_verifier: verifier,
    }),
  );
}

async function requestTokens(params: Record<string, string>, previousRefreshToken?: string): Promise<Tokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID ?? "", ...params }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (body.error === "invalid_grant") throw new LoggedOutError();
    throw new Error(`Spotify token request failed (${res.status})`);
  }
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token ?? previousRefreshToken,
    expiresAt: Date.now() + body.expires_in * 1000,
  };
}

let refreshing: Promise<string> | null = null;

export function getAccessToken(forceRefresh = false): Promise<string> {
  const tokens = loadTokens();
  if (!tokens) return Promise.reject(new LoggedOutError());
  if (!forceRefresh && tokens.expiresAt - 60_000 > Date.now()) return Promise.resolve(tokens.accessToken);
  refreshing ??= refresh(tokens).finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function refresh(tokens: Tokens): Promise<string> {
  try {
    const next = await requestTokens(
      { grant_type: "refresh_token", refresh_token: tokens.refreshToken },
      tokens.refreshToken,
    );
    saveTokens(next);
    return next.accessToken;
  } catch (e) {
    // Only a revoked grant logs the parent out; network errors keep the session.
    if (e instanceof LoggedOutError) {
      // Another tab may have already rotated the refresh token.
      const latest = loadTokens();
      if (latest && latest.refreshToken !== tokens.refreshToken) return latest.accessToken;
      logout();
    }
    throw e;
  }
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAccessToken, LoggedOutError, loadTokens } from "./auth";
import { codeChallenge } from "./pkce";

const TOKENS_KEY = "kidsapp.tokens";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  vi.stubGlobal("localStorage", memoryStorage());
  vi.stubGlobal("window", new EventTarget());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("codeChallenge", () => {
  it("matches the RFC 7636 test vector", async () => {
    expect(await codeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });
});

describe("getAccessToken", () => {
  it("rejects when never logged in", async () => {
    await expect(getAccessToken()).rejects.toBeInstanceOf(LoggedOutError);
  });

  it("returns the stored token while it is still valid", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    localStorage.setItem(TOKENS_KEY, JSON.stringify({ accessToken: "a", refreshToken: "r", expiresAt: Date.now() + 3600_000 }));

    expect(await getAccessToken()).toBe("a");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes once for concurrent callers and keeps the refresh token when none is returned", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { access_token: "new", expires_in: 3600 }));
    vi.stubGlobal("fetch", fetchMock);
    localStorage.setItem(TOKENS_KEY, JSON.stringify({ accessToken: "old", refreshToken: "r1", expiresAt: 0 }));

    const [a, b] = await Promise.all([getAccessToken(), getAccessToken()]);

    expect([a, b]).toEqual(["new", "new"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(loadTokens()?.refreshToken).toBe("r1");
  });

  it("stores a rotated refresh token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { access_token: "new", refresh_token: "r2", expires_in: 3600 })),
    );
    localStorage.setItem(TOKENS_KEY, JSON.stringify({ accessToken: "old", refreshToken: "r1", expiresAt: 0 }));

    await getAccessToken();

    expect(loadTokens()?.refreshToken).toBe("r2");
  });

  it("logs out when Spotify revokes the grant", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(400, { error: "invalid_grant" })));
    localStorage.setItem(TOKENS_KEY, JSON.stringify({ accessToken: "old", refreshToken: "r1", expiresAt: 0 }));
    const onLogout = vi.fn();
    window.addEventListener("kidsapp:logout", onLogout);

    await expect(getAccessToken()).rejects.toBeInstanceOf(LoggedOutError);

    expect(loadTokens()).toBeNull();
    expect(onLogout).toHaveBeenCalled();
  });

  it("stays logged in when the network fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    localStorage.setItem(TOKENS_KEY, JSON.stringify({ accessToken: "old", refreshToken: "r1", expiresAt: 0 }));

    await expect(getAccessToken()).rejects.toThrow("offline");

    expect(loadTokens()?.refreshToken).toBe("r1");
  });
});

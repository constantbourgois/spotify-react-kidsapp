import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "./api";
import { getAccessToken, LoggedOutError } from "./auth";
import type { NowPlaying } from "./api";

export const BROWSER_TARGET = "browser";

let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  sdkPromise ??= new Promise<void>((resolve, reject) => {
    if (window.Spotify) return resolve();
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("Spotify SDK failed to load"));
    };
    document.body.appendChild(script);
  });
  return sdkPromise;
}

function describeError(e: unknown): string | null {
  if (e instanceof LoggedOutError) return null;
  if (e instanceof api.ApiError) {
    if (e.status === 404) return "L'appareil n'est pas disponible. Demande à un parent de l'allumer.";
    if (e.status === 403) return "Spotify Premium est nécessaire pour écouter.";
  }
  return "Oups, ça n'a pas marché. Réessaie !";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function usePlayback(target: string) {
  const isBrowser = target === BROWSER_TARGET;
  const [deviceId, setDeviceId] = useState<string | null>(isBrowser ? null : target);
  const [now, setNow] = useState<NowPlaying | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<Spotify.Player | null>(null);

  useEffect(() => {
    setNow(null);
    setError(null);
    if (!isBrowser) {
      setDeviceId(target);
      return;
    }
    setDeviceId(null);
    let cancelled = false;
    let player: Spotify.Player | null = null;

    loadSdk()
      .then(() => {
        if (cancelled) return;
        player = new window.Spotify.Player({
          name: "Ma musique",
          volume: 0.8,
          getOAuthToken: (cb) => {
            getAccessToken().then(cb, () => {});
          },
        });
        player.addListener("ready", ({ device_id }) => setDeviceId(device_id));
        player.addListener("not_ready", () => setDeviceId(null));
        player.addListener("player_state_changed", (state) => {
          if (!state) return setNow(null);
          const track = state.track_window.current_track;
          setNow({
            uri: track.linked_from?.uri ?? track.uri,
            name: track.name,
            subtitle: track.artists.map((a) => a.name).join(", "),
            imageUrl: track.album.images[0]?.url,
            paused: state.paused,
            positionMs: state.position,
            durationMs: state.duration,
            at: Date.now(),
          });
        });
        player.addListener("account_error", () =>
          setError("Un compte Spotify Premium est nécessaire pour écouter ici."),
        );
        player.addListener("initialization_error", () =>
          setError("Ce navigateur ne peut pas lire la musique. Demande à un parent de choisir un autre appareil."),
        );
        player.addListener("playback_error", () => setError("Cette chanson ne veut pas démarrer. Essaie une autre !"));
        player.connect();
        playerRef.current = player;
      })
      .catch(() => setError("Impossible de charger le lecteur Spotify."));

    return () => {
      cancelled = true;
      player?.disconnect();
      playerRef.current = null;
    };
  }, [target, isBrowser]);

  const refreshRemoteState = useCallback(() => {
    if (isBrowser) return;
    api.getPlaybackState().then(setNow, () => {});
  }, [isBrowser]);

  useEffect(() => {
    if (isBrowser) return;
    refreshRemoteState();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refreshRemoteState();
    }, 4000);
    return () => clearInterval(id);
  }, [isBrowser, refreshRemoteState]);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setError(null);
      try {
        await action();
      } catch (e) {
        setError(describeError(e));
      }
      setTimeout(refreshRemoteState, 700);
    },
    [refreshRemoteState],
  );

  const playSongs = useCallback(
    (uris: string[], startIndex = 0) => {
      // Must run synchronously inside the tap, or mobile browsers block autoplay.
      playerRef.current?.activateElement();
      if (!deviceId) {
        setError(isBrowser ? "Le lecteur se prépare, réessaie dans un instant." : "Aucun appareil choisi.");
        return;
      }
      return run(async () => {
        try {
          await api.playSongs(deviceId, uris, startIndex);
        } catch (e) {
          // A freshly created browser device can take a moment to be known by the API.
          if (!(isBrowser && e instanceof api.ApiError && e.status === 404)) throw e;
          await sleep(1000);
          await api.playSongs(deviceId, uris, startIndex);
        }
      });
    },
    [deviceId, isBrowser, run],
  );

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (player) return run(() => player.togglePlay());
    if (!deviceId) return;
    setNow((n) => n && { ...n, paused: !n.paused, at: Date.now() });
    return run(() => (now?.paused === false ? api.pause(deviceId) : api.resume(deviceId)));
  }, [deviceId, now?.paused, run]);

  const next = useCallback(() => {
    const player = playerRef.current;
    if (player) return run(() => player.nextTrack());
    if (deviceId) return run(() => api.skipNext(deviceId));
  }, [deviceId, run]);

  const previous = useCallback(() => {
    const player = playerRef.current;
    if (player) return run(() => player.previousTrack());
    if (deviceId) return run(() => api.skipPrevious(deviceId));
  }, [deviceId, run]);

  return { ready: deviceId !== null, now, error, playSongs, togglePlay, next, previous };
}

export type Playback = ReturnType<typeof usePlayback>;

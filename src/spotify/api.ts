import { getAccessToken } from "./auth";

const BASE = "https://api.spotify.com/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export type Song = { uri: string; name: string; subtitle: string; imageUrl?: string };
export type PlaylistSummary = { id: string; name: string; imageUrl?: string };
export type Device = { id: string; name: string; type: string; isActive: boolean };
export type NowPlaying = Song & { paused: boolean; positionMs: number; durationMs: number; at: number };

type Image = { url: string };
type RawItem = {
  uri: string;
  name: string;
  duration_ms?: number;
  artists?: { name: string }[];
  album?: { images?: Image[] };
  images?: Image[];
  show?: { name: string };
};
type RawEntry = { is_local?: boolean; item?: RawItem | null; track?: RawItem | null };
type Page<T> = { items: T[]; next: string | null };

async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const token = await getAccessToken(retried);
  const res = await fetch(path.startsWith("http") ? path : BASE + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (res.status === 401 && !retried) return request<T>(path, init, true);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error?.message ?? `Spotify error ${res.status}`);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function getAll<T>(path: string): Promise<T[]> {
  const all: T[] = [];
  let next: string | null = path;
  while (next) {
    const page: Page<T> = await request<Page<T>>(next);
    all.push(...page.items);
    next = page.next;
  }
  return all;
}

export function toSong(item: RawItem): Song {
  return {
    uri: item.uri,
    name: item.name,
    subtitle: item.artists?.map((a) => a.name).join(", ") ?? item.show?.name ?? "",
    imageUrl: (item.album?.images ?? item.images)?.[0]?.url,
  };
}

export function getMe() {
  return request<{ display_name: string | null; product?: string }>("/me");
}

export async function getMyPlaylists(): Promise<PlaylistSummary[]> {
  const items = await getAll<{ id: string; name: string; images?: Image[] | null } | null>("/me/playlists?limit=50");
  return items.flatMap((p) => (p ? [{ id: p.id, name: p.name, imageUrl: p.images?.[0]?.url }] : []));
}

export async function getPlaylistSongs(playlistId: string): Promise<Song[]> {
  let entries: RawEntry[];
  try {
    entries = await getAll<RawEntry>(`/playlists/${playlistId}/items?limit=50`);
  } catch (e) {
    // Older API versions only expose the /tracks path.
    if (!(e instanceof ApiError && e.status === 404)) throw e;
    entries = await getAll<RawEntry>(`/playlists/${playlistId}/tracks?limit=50`);
  }
  return playableSongs(entries);
}

export function playableSongs(entries: RawEntry[]): Song[] {
  const seen = new Set<string>();
  const songs: Song[] = [];
  for (const entry of entries) {
    const item = entry.item ?? entry.track;
    if (!item?.uri || entry.is_local || seen.has(item.uri)) continue;
    seen.add(item.uri);
    songs.push(toSong(item));
  }
  return songs;
}

export async function getDevices(): Promise<Device[]> {
  const { devices } = await request<{
    devices: { id: string | null; name: string; type: string; is_active: boolean; is_restricted: boolean }[];
  }>("/me/player/devices");
  return devices.flatMap((d) =>
    d.id && !d.is_restricted ? [{ id: d.id, name: d.name, type: d.type, isActive: d.is_active }] : [],
  );
}

export async function getPlaybackState(): Promise<NowPlaying | null> {
  const state = await request<
    { is_playing: boolean; progress_ms: number | null; item: RawItem | null } | undefined
  >("/me/player?additional_types=episode");
  if (!state?.item) return null;
  return {
    ...toSong(state.item),
    paused: !state.is_playing,
    positionMs: state.progress_ms ?? 0,
    durationMs: state.item.duration_ms ?? 0,
    at: Date.now(),
  };
}

const onDevice = (path: string, deviceId: string) => `${path}?device_id=${encodeURIComponent(deviceId)}`;

export function playSongs(deviceId: string, uris: string[], startIndex = 0) {
  return request<void>(onDevice("/me/player/play", deviceId), {
    method: "PUT",
    body: JSON.stringify({ uris, offset: { position: startIndex } }),
  });
}

export const resume = (deviceId: string) => request<void>(onDevice("/me/player/play", deviceId), { method: "PUT" });
export const pause = (deviceId: string) => request<void>(onDevice("/me/player/pause", deviceId), { method: "PUT" });
export const skipNext = (deviceId: string) => request<void>(onDevice("/me/player/next", deviceId), { method: "POST" });
export const skipPrevious = (deviceId: string) =>
  request<void>(onDevice("/me/player/previous", deviceId), { method: "POST" });

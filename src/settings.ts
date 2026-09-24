import { useCallback, useState } from "react";
import type { PlaylistSummary } from "./spotify/api";
import { BROWSER_TARGET } from "./spotify/usePlayback";

export type Settings = {
  playlist: PlaylistSummary | null;
  target: string;
  targetName: string;
  pin: string | null;
};

const KEY = "kidsapp.settings";
const DEFAULTS: Settings = { playlist: null, target: BROWSER_TARGET, targetName: "Ce navigateur", pin: null };

function load(): Settings {
  const raw = localStorage.getItem(KEY);
  return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const [settings, setSettings] = useState(load);
  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  return [settings, update];
}

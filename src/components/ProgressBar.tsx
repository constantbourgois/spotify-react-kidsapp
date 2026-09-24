import { useEffect, useState } from "react";
import type { NowPlaying } from "../spotify/api";

export function ProgressBar({ now }: { now: NowPlaying }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (now.paused) return;
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [now.paused]);

  const position = now.paused ? now.positionMs : now.positionMs + (Date.now() - now.at);
  const ratio = now.durationMs ? Math.min(1, position / now.durationMs) : 0;

  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)}>
      <div className="progress__fill" style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}

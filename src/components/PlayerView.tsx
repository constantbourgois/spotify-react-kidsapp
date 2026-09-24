import type { Song } from "../spotify/api";
import type { Playback } from "../spotify/usePlayback";
import { Cover } from "./Cover";
import { LeftIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon } from "./icons";
import { ProgressBar } from "./ProgressBar";

type Props = { queue: Song[]; playback: Playback; onBack: () => void };

export function PlayerView({ queue, playback, onBack }: Props) {
  const { now } = playback;
  const current = (now && queue.find((s) => s.uri === now.uri)) ?? now ?? queue[0];
  const paused = now?.paused ?? true;

  return (
    <div className="player-screen">
      <button className="back-btn" onClick={onBack}>
        <LeftIcon size={32} />
        <span>Mes chansons</span>
      </button>

      <div className="player-main">
        <Cover url={current?.imageUrl} className={`player-cover${paused ? "" : " player-cover--spinning"}`} />
        <div className="player-info">
          <h2 className="player-title">{current?.name}</h2>
          <p className="player-artist">{current?.subtitle}</p>
          {now && <ProgressBar now={now} />}
          <div className="controls">
            <button className="round-btn round-btn--big" onClick={playback.previous} aria-label="Chanson précédente">
              <PrevIcon size={48} />
            </button>
            <button className="round-btn round-btn--huge" onClick={playback.togglePlay} aria-label={paused ? "Lecture" : "Pause"}>
              {paused ? <PlayIcon size={64} /> : <PauseIcon size={64} />}
            </button>
            <button className="round-btn round-btn--big" onClick={playback.next} aria-label="Chanson suivante">
              <NextIcon size={48} />
            </button>
          </div>
        </div>
      </div>

      <div className="queue">
        {queue.map((song, i) => (
          <button
            key={song.uri}
            className={`queue__item${song.uri === now?.uri ? " queue__item--current" : ""}`}
            onClick={() =>
              playback.playSongs(
                queue.map((s) => s.uri),
                i,
              )
            }
            aria-label={song.name}
          >
            <Cover url={song.imageUrl} />
          </button>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import type { Song } from "../spotify/api";
import type { Playback } from "../spotify/usePlayback";
import { Cover } from "./Cover";
import { NextIcon, PauseIcon, PlayIcon, PrevIcon } from "./icons";
import { ProgressBar } from "./ProgressBar";

type Props = {
  songs: Song[];
  picked: Song | null;
  playback: Playback;
  onPick: (song: Song) => void;
};

export function PlayerView({ songs, picked, playback, onPick }: Props) {
  const { now } = playback;
  const current = (now && songs.find((s) => s.uri === now.uri)) ?? now ?? picked;
  const paused = now?.paused ?? false;
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [current?.uri]);

  return (
    <div className="player-screen">
      <div className="player-main">
        <Cover url={current?.imageUrl} className={`player-cover${paused ? "" : " player-cover--spinning"}`} />
        <div className="player-info">
          <h2 className="player-title">{current?.name}</h2>
          <p className="player-artist">{current?.subtitle}</p>
          {now && <ProgressBar now={now} />}
          <div className="controls">
            <button className="round-btn round-btn--big" onClick={playback.previous} aria-label="Chanson précédente">
              <PrevIcon size={44} />
            </button>
            <button
              className="round-btn round-btn--huge"
              onClick={playback.togglePlay}
              aria-label={paused ? "Lecture" : "Pause"}
            >
              {paused ? <PlayIcon size={60} /> : <PauseIcon size={60} />}
            </button>
            <button className="round-btn round-btn--big" onClick={playback.next} aria-label="Chanson suivante">
              <NextIcon size={44} />
            </button>
          </div>
        </div>
      </div>

      <div className="queue">
        {songs.map((song) => {
          const isCurrent = song.uri === current?.uri;
          return (
            <button
              key={song.uri}
              ref={isCurrent ? currentRef : undefined}
              className={`queue__item${isCurrent ? " queue__item--current" : ""}`}
              onClick={() => onPick(song)}
              aria-label={`Écouter ${song.name}`}
            >
              <Cover url={song.imageUrl} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

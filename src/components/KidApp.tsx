import { useEffect, useState } from "react";
import type { PlaylistSummary, Song } from "../spotify/api";
import { getPlaylistSongs } from "../spotify/api";
import { LoggedOutError } from "../spotify/auth";
import { usePlayback } from "../spotify/usePlayback";
import { Cover } from "./Cover";
import { LeftIcon, LockIcon } from "./icons";
import { PlayerView } from "./PlayerView";
import { PAGE_SIZE, SongGrid } from "./SongGrid";

type Props = { playlist: PlaylistSummary; target: string; onParent: () => void };

export function KidApp({ playlist, target, onParent }: Props) {
  const [songs, setSongs] = useState<Song[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState<Song | null>(null);
  const [view, setView] = useState<"grid" | "player">("grid");
  const playback = usePlayback(target);

  useEffect(() => {
    let cancelled = false;
    setSongs(null);
    setLoadError(false);
    setPage(0);
    setView("grid");
    getPlaylistSongs(playlist.id).then(
      (s) => !cancelled && setSongs(s),
      (e) => !cancelled && !(e instanceof LoggedOutError) && setLoadError(true),
    );
    return () => {
      cancelled = true;
    };
  }, [playlist.id]);

  const pick = (song: Song) => {
    setPicked(song);
    setView("player");
    playback.play(`spotify:playlist:${playlist.id}`, song.uri);
  };

  const backToGrid = () => {
    const index = songs?.findIndex((s) => s.uri === playback.now?.uri) ?? -1;
    if (index >= 0) setPage(Math.floor(index / PAGE_SIZE));
    setView("grid");
  };

  const playing = playback.now && !playback.now.paused ? playback.now : null;

  return (
    <div className="kid-app">
      <header className="kid-header">
        {view === "grid" ? (
          <h1>Choisis ta chanson !</h1>
        ) : (
          <button className="back-btn" onClick={backToGrid}>
            <LeftIcon size={28} />
            <span>Mes chansons</span>
          </button>
        )}
        {view === "grid" && playing && (
          <button className="now-chip" onClick={() => setView("player")}>
            <Cover url={playing.imageUrl} />
            <span>En cours</span>
          </button>
        )}
        <button className="parent-btn" onClick={onParent} aria-label="Espace parent">
          <LockIcon size={22} />
        </button>
      </header>

      {playback.error && <div className="toast">{playback.error}</div>}

      {loadError ? (
        <div className="message">
          <p>Impossible de charger les chansons.</p>
          <button className="primary-btn" onClick={() => location.reload()}>
            Réessayer
          </button>
        </div>
      ) : !songs ? (
        <div className="message">
          <div className="spinner" />
        </div>
      ) : songs.length === 0 ? (
        <div className="message">
          <p>Cette playlist est vide. Demande à un parent d'y ajouter des chansons !</p>
        </div>
      ) : view === "player" ? (
        <PlayerView songs={songs} picked={picked} playback={playback} onPick={pick} />
      ) : (
        <SongGrid songs={songs} page={page} currentUri={playback.now?.uri} onPageChange={setPage} onPick={pick} />
      )}
    </div>
  );
}

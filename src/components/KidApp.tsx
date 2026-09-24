import { useEffect, useState } from "react";
import type { PlaylistSummary, Song } from "../spotify/api";
import { getPlaylistSongs } from "../spotify/api";
import { LoggedOutError } from "../spotify/auth";
import { usePlayback } from "../spotify/usePlayback";
import { Cover } from "./Cover";
import { LockIcon } from "./icons";
import { PlayerView } from "./PlayerView";
import { SongGrid } from "./SongGrid";

type Props = { playlist: PlaylistSummary; target: string; onParent: () => void };

export function KidApp({ playlist, target, onParent }: Props) {
  const [songs, setSongs] = useState<Song[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [queue, setQueue] = useState<Song[]>([]);
  const [view, setView] = useState<"grid" | "player">("grid");
  const playback = usePlayback(target);

  useEffect(() => {
    let cancelled = false;
    setSongs(null);
    setLoadError(false);
    setSelected([]);
    setPage(0);
    getPlaylistSongs(playlist.id).then(
      (s) => !cancelled && setSongs(s),
      (e) => !cancelled && !(e instanceof LoggedOutError) && setLoadError(true),
    );
    return () => {
      cancelled = true;
    };
  }, [playlist.id]);

  const toggle = (uri: string) =>
    setSelected((sel) => (sel.includes(uri) ? sel.filter((u) => u !== uri) : [...sel, uri]));

  const play = () => {
    const bySong = new Map(songs?.map((s) => [s.uri, s]));
    const picked = selected.flatMap((uri) => bySong.get(uri) ?? []);
    if (!picked.length) return;
    setQueue(picked);
    setView("player");
    playback.playSongs(picked.map((s) => s.uri));
  };

  const playing = playback.now && !playback.now.paused ? playback.now : null;

  return (
    <div className="kid-app">
      <header className="kid-header">
        <h1>{view === "grid" ? "Choisis tes chansons !" : "J'écoute"}</h1>
        {view === "grid" && playing && queue.length > 0 && (
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

      {view === "player" ? (
        <PlayerView queue={queue} playback={playback} onBack={() => setView("grid")} />
      ) : loadError ? (
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
      ) : (
        <SongGrid
          songs={songs}
          selected={selected}
          page={page}
          onPageChange={setPage}
          onToggle={toggle}
          onClear={() => setSelected([])}
          onPlay={play}
        />
      )}
    </div>
  );
}

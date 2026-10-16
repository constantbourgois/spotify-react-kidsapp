import { useRef } from "react";
import type { Song } from "../spotify/api";
import { Cover } from "./Cover";
import { LeftIcon, RightIcon } from "./icons";

export const PAGE_SIZE = 6;

type Props = {
  songs: Song[];
  page: number;
  currentUri?: string;
  onPageChange: (page: number) => void;
  onPick: (song: Song) => void;
};

export function SongGrid({ songs, page, currentUri, onPageChange, onPick }: Props) {
  const pageCount = Math.max(1, Math.ceil(songs.length / PAGE_SIZE));
  const visible = songs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const touchStartX = useRef<number | null>(null);

  const goTo = (p: number) => onPageChange(Math.min(pageCount - 1, Math.max(0, p)));

  return (
    <div className="grid-screen">
      <div
        className="song-grid"
        onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(dx) > 60) goTo(page + (dx < 0 ? 1 : -1));
        }}
      >
        {visible.map((song) => {
          const playing = song.uri === currentUri;
          return (
            <button
              key={song.uri}
              className={`tile${playing ? " tile--playing" : ""}`}
              onClick={() => onPick(song)}
              aria-label={`Écouter ${song.name}`}
            >
              <Cover url={song.imageUrl} />
              {playing && (
                <span className="eq" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              )}
              <span className="tile__caption">
                <span className="tile__name">{song.name}</span>
                <span className="tile__artist">{song.subtitle}</span>
              </span>
            </button>
          );
        })}
      </div>

      {pageCount > 1 && (
        <div className="grid-footer">
          <button className="round-btn" onClick={() => goTo(page - 1)} disabled={page === 0} aria-label="Page précédente">
            <LeftIcon size={40} />
          </button>

          <div className="pager" aria-label={`Page ${page + 1} sur ${pageCount}`}>
            {pageCount <= 10 ? (
              Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  className={`pager__dot${i === page ? " pager__dot--active" : ""}`}
                  onClick={() => goTo(i)}
                  aria-label={`Page ${i + 1}`}
                />
              ))
            ) : (
              <span className="pager__text">
                {page + 1} / {pageCount}
              </span>
            )}
          </div>

          <button
            className="round-btn"
            onClick={() => goTo(page + 1)}
            disabled={page >= pageCount - 1}
            aria-label="Page suivante"
          >
            <RightIcon size={40} />
          </button>
        </div>
      )}
    </div>
  );
}

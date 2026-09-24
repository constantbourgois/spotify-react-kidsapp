import { useRef } from "react";
import type { Song } from "../spotify/api";
import { Cover } from "./Cover";
import { CheckIcon, CloseIcon, LeftIcon, PlayIcon, RightIcon } from "./icons";

export const PAGE_SIZE = 6;

type Props = {
  songs: Song[];
  selected: string[];
  page: number;
  onPageChange: (page: number) => void;
  onToggle: (uri: string) => void;
  onClear: () => void;
  onPlay: () => void;
};

export function SongGrid({ songs, selected, page, onPageChange, onToggle, onClear, onPlay }: Props) {
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
          const order = selected.indexOf(song.uri);
          const isSelected = order !== -1;
          return (
            <button
              key={song.uri}
              className={`tile${isSelected ? " tile--selected" : ""}`}
              aria-pressed={isSelected}
              onClick={() => onToggle(song.uri)}
            >
              <Cover url={song.imageUrl} />
              <span className="tile__name">{song.name}</span>
              <span className="tile__artist">{song.subtitle}</span>
              {isSelected && (
                <span className="tile__badge" aria-hidden="true">
                  {order + 1}
                </span>
              )}
              {isSelected && (
                <span className="tile__check" aria-hidden="true">
                  <CheckIcon size={28} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid-footer">
        <button className="round-btn" onClick={() => goTo(page - 1)} disabled={page === 0} aria-label="Page précédente">
          <LeftIcon size={40} />
        </button>

        <div className="pager" aria-label={`Page ${page + 1} sur ${pageCount}`}>
          {pageCount <= 12 ? (
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

      <div className={`play-bar${selected.length ? " play-bar--visible" : ""}`}>
        <button className="clear-btn" onClick={onClear} aria-label="Tout désélectionner">
          <CloseIcon size={28} />
        </button>
        <button className="big-play" onClick={onPlay} disabled={!selected.length}>
          <PlayIcon size={40} />
          <span>
            Écouter {selected.length} chanson{selected.length > 1 ? "s" : ""}
          </span>
        </button>
      </div>
    </div>
  );
}

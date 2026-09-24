import { MusicIcon } from "./icons";

export function Cover({ url, className = "" }: { url?: string; className?: string }) {
  return url ? (
    <img className={`cover ${className}`} src={url} alt="" draggable={false} />
  ) : (
    <div className={`cover cover--empty ${className}`}>
      <MusicIcon size={48} />
    </div>
  );
}

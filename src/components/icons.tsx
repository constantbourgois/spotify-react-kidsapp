type Props = { size?: number };

const svg = (path: string) =>
  function Icon({ size = 32 }: Props) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={path} />
      </svg>
    );
  };

export const PlayIcon = svg("M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z");
export const PauseIcon = svg("M7 5h3.5v14H7zM13.5 5H17v14h-3.5z");
export const NextIcon = svg("M5 5.5v13a1 1 0 0 0 1.55.83L15 13.7V18h2.5V6H15v4.3L6.55 4.67A1 1 0 0 0 5 5.5z");
export const PrevIcon = svg("M19 5.5v13a1 1 0 0 1-1.55.83L9 13.7V18H6.5V6H9v4.3l8.45-5.63A1 1 0 0 1 19 5.5z");
export const LeftIcon = svg("M15.5 4.5 8 12l7.5 7.5 1.8-1.8L11.6 12l5.7-5.7z");
export const RightIcon = svg("M8.5 4.5 16 12l-7.5 7.5-1.8-1.8L12.4 12 6.7 6.3z");
export const CheckIcon = svg("M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7z");
export const CloseIcon = svg("M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7l-1.4-1.4L9.2 12 2.9 5.7l1.4-1.4 6.3 6.3 6.3-6.3z");
export const MusicIcon = svg("M12 3v10.55A4 4 0 1 0 14 17V7h4V3z");
export const LockIcon = svg(
  "M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3z",
);

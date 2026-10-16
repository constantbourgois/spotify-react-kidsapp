// Brand mark: a sun-yellow record with a bubblegum music note and a sparkle.
export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#ffd23f" />
      <circle cx="32" cy="32" r="23" fill="none" stroke="#f0a500" strokeWidth="2" opacity="0.45" />
      <path d="M27 18.5 45 14v24.5a6.5 6.5 0 1 1-4-6V22l-10 2.5V43a6.5 6.5 0 1 1-4-6z" fill="#ff5c9a" />
      <path d="M50 6l1.6 3.9L55.5 11.5l-3.9 1.6L50 17l-1.6-3.9-3.9-1.6 3.9-1.6z" fill="#fff" />
    </svg>
  );
}

// Shown wherever a product has no photo yet, so empty slots look
// intentional (a soft brand-colored icon) instead of a flat blank box.
export function DessertPlaceholder({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3c-2.2 0-4 1.8-4 4 0 .7.2 1.4.5 2H7a5 5 0 0 0-5 5c0 .6.5 1 1 1h18c.6 0 1-.4 1-1a5 5 0 0 0-5-5h-1.5c.3-.6.5-1.3.5-2 0-2.2-1.8-4-4-4Z"
        fill="currentColor"
        opacity="0.35"
      />
      <path
        d="M4 16.5 5.2 20a2 2 0 0 0 1.9 1.4h9.8a2 2 0 0 0 1.9-1.4l1.2-3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}

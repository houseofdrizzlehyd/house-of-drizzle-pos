// The QR-ordering pages are designed for a phone screen, so they stay capped
// at a mobile-width column even when opened on a desktop browser. The admin
// dashboard (outside this route group) is not affected by this constraint.
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <div className="max-w-md mx-auto min-h-screen bg-cream">{children}</div>;
}

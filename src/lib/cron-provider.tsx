'use client';

// This file should not be used in your React app.
// If you need scheduled jobs, run them on the server only.

export function CronProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
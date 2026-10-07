import type { ReactNode } from "react";

// Technical micro-typography: 10–11px grotesk, uppercase, generous tracking.
export function SmallLabel({ children, className = "", fade = true }: { children: ReactNode; className?: string; fade?: boolean }) {
  return (
    <div data-fade={fade ? "" : undefined} className={`label ${className}`} style={fade ? { opacity: 0 } : undefined}>
      {children}
    </div>
  );
}

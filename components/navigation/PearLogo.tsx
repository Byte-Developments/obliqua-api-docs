// Thin monoline pear mark. Inherits colour from currentColor so it follows the UI theme.
export function PearLogo({ size = 22, strokeWidth = 1.5, className = "" }: { size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size * 1.25}
      viewBox="0 0 32 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16.6 10.2c-2.9 0-4.6 2.2-5 5.1-.4 2.7-1.6 4.1-3.4 6.1-1.9 2.1-3 4.6-3 7.6 0 5.8 4.9 9.4 11 9.4s11.2-3.6 11.2-9.6c0-3.1-1.2-5.4-3.1-7.5-1.8-2-2.8-3.4-3.2-6.1-.4-2.8-1.7-5-4.5-5Z" />
      <path d="M16.4 10.2c.1-2.6.8-4.8 2.6-6.6" />
      <path d="M17.9 6.4c1.8-1.9 4.6-2.4 7.3-1.6-1.2 2.5-3.9 3.8-7.3 1.6Z" />
    </svg>
  );
}

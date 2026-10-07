import type { ReactNode } from "react";
import { Line } from "./SceneCopy";

// Magazine headline: refined serif, tight leading, negative tracking. Each array item is a line.
export function EditorialHeadline({
  lines,
  size = "xl",
  className = "",
  as: Tag = "h2",
}: {
  lines: ReactNode[];
  size?: "xl" | "lg" | "md" | "sm";
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
}) {
  const sizes = {
    xl: "text-[clamp(52px,6.5vw,118px)] leading-[0.92] tracking-[-0.045em]",
    lg: "text-[clamp(40px,4.6vw,84px)] leading-[0.94] tracking-[-0.04em]",
    md: "text-[clamp(30px,2.9vw,52px)] leading-[0.98] tracking-[-0.03em]",
    sm: "text-[clamp(22px,1.8vw,32px)] leading-[1.02] tracking-[-0.02em]",
  } as const;
  return (
    <Tag className={`font-serif font-normal ${sizes[size]} ${className}`}>
      {lines.map((l, i) => (
        <Line key={i}>{l}</Line>
      ))}
    </Tag>
  );
}

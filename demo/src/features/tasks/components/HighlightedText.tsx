"use client";

import { escapeRegex } from "../lib/filterUtils";

interface HighlightedTextProps {
  text: string;
  highlight: string;
  className?: string;
}

/**
 * Display text with search matches highlighted.
 * Uses React fragments - NOT dangerouslySetInnerHTML.
 */
export function HighlightedText({
  text,
  highlight,
  className,
}: HighlightedTextProps) {
  if (!highlight.trim()) {
    return <span className={className}>{text}</span>;
  }

  const escaped = escapeRegex(highlight);
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

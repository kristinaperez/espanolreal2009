"use client";

import { useEffect, useMemo, useState } from "react";

const COLORS = ["#ff5a3c", "#ffc53d", "#16a34a", "#2563eb", "#a855f7", "#f43f5e"];

/** Tiny dependency-free confetti burst. */
export function Confetti({ active, pieces = 42 }: { active: boolean; pieces?: number }) {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (!active) return;
    const start = window.setTimeout(() => setVisible(true), 0);
    const timer = window.setTimeout(() => setVisible(false), 2200);
    return () => { window.clearTimeout(start); window.clearTimeout(timer); };
  }, [active]);

  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, index) => ({
        id: index,
        left: ((Math.sin((index + 1) * 127.1) + 1) / 2) * 100,
        dx: (((Math.sin((index + 1) * 127.1) + 1) / 2) - 0.5) * 220,
        delay: ((Math.sin((index + 1) * 127.1) + 1) / 2) * 0.35,
        duration: 1.1 + ((Math.sin((index + 1) * 127.1) + 1) / 2) * 0.9,
        color: COLORS[index % COLORS.length],
        size: 6 + ((Math.sin((index + 1) * 127.1) + 1) / 2) * 8,
      })),
    [pieces],
  );

  if (!visible) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {items.map((item) => (
        <span
          key={item.id}
          className="confetti-piece"
          style={{
            left: `${item.left}%`,
            width: item.size,
            height: item.size * 1.4,
            background: item.color,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            ["--dx" as string]: `${item.dx}px`,
          }}
        />
      ))}
    </div>
  );
}

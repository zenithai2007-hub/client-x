"use client";

import { useMemo } from "react";

/* Deterministic pseudo-QR: renders a realistic-looking QR-style matrix from a
   payload string. Purely visual (mock pairing) — not a scannable code. */

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 25;

function inFinder(r: number, c: number): boolean {
  const inSquare = (r0: number, c0: number) =>
    r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
  return inSquare(0, 0) || inSquare(0, N - 7) || inSquare(N - 7, 0);
}

function finderCell(r: number, c: number): boolean {
  // local coords within the 7x7 finder
  const lr = r >= N - 7 ? r - (N - 7) : r;
  const lc = c >= N - 7 ? c - (N - 7) : c;
  const edge = lr === 0 || lr === 6 || lc === 0 || lc === 6;
  const core = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
  return edge || core;
}

export function MockQR({ payload, size = 200 }: { payload: string; size?: number }) {
  const cells = useMemo(() => {
    const rand = mulberry32(hashSeed(payload));
    const grid: boolean[] = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (inFinder(r, c)) grid.push(finderCell(r, c));
        else grid.push(rand() > 0.52);
      }
    }
    return grid;
  }, [payload]);

  const quiet = 2;
  const total = N + quiet * 2;
  const unit = size / total;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${total} ${total}`}
      className="rounded-xl bg-white"
      role="img"
      aria-label="Mock pairing code"
    >
      {cells.map((on, i) => {
        if (!on) return null;
        const r = Math.floor(i / N);
        const c = i % N;
        return (
          <rect
            key={i}
            x={c + quiet}
            y={r + quiet}
            width={1}
            height={1}
            fill="#0F172A"
          />
        );
      })}
    </svg>
  );
}

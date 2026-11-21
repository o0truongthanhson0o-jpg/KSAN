interface QrCodePreviewProps {
  value: string;
  size?: number;
  label?: string;
}

/**
 * Deterministic SVG QR Demo renderer (no external CDN dependency).
 * Visualizes a structured 21x21 QR matrix with standard corner finder patterns.
 */
export function QrCodePreview({ value, size = 148, label }: QrCodePreviewProps) {
  const grid = 21;
  const cells: boolean[][] = Array.from({ length: grid }, () => Array(grid).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, grid - 7);
  drawFinder(grid - 7, 0);

  // Deterministic hash stream from value
  let seed = 2166136261;
  for (let i = 0; i < value.length; i++) {
    seed ^= value.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }

  const inFinder = (r: number, c: number) =>
    (r < 8 && c < 8) || (r < 8 && c >= grid - 8) || (r >= grid - 8 && c < 8);

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      if (inFinder(r, c)) continue;
      if (r === 6 || c === 6) {
        cells[r][c] = (r + c) % 2 === 0;
        continue;
      }
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      cells[r][c] = (seed & 1) === 1;
    }
  }

  return (
    <div className="inline-flex flex-col items-center gap-1.5 bg-white p-2.5 rounded-md border border-slate-300">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${grid} ${grid}`}
        role="img"
        aria-label={label ?? `Mã QR demo ${value}`}
        shapeRendering="crispEdges"
      >
        <rect width={grid} height={grid} fill="#ffffff" />
        {cells.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#09111f" />
            ) : null
          )
        )}
      </svg>
      <span className="font-mono text-[10px] font-semibold text-slate-900 tracking-tight">
        {value}
      </span>
    </div>
  );
}

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function PaginationBar({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, safePage * pageSize);

  const pageNumbers: number[] = [];
  const maxVisible = 5;
  let startP = Math.max(1, safePage - Math.floor(maxVisible / 2));
  const endP = Math.min(totalPages, startP + maxVisible - 1);
  if (endP - startP + 1 < maxVisible) {
    startP = Math.max(1, endP - maxVisible + 1);
  }
  for (let p = startP; p <= endP; p++) {
    pageNumbers.push(p);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
      <div className="flex items-center gap-3 tabular-nums">
        <span>
          Hiển thị <strong className="text-slate-200 font-medium">{startItem}–{endItem}</strong> trên tổng{' '}
          <strong className="text-slate-200 font-medium">{totalItems}</strong> bản ghi
        </span>
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5">
            <span>Số dòng:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-[#0b1322] border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {[8, 10, 15, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1 tabular-nums">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Trang trước"
          className="inline-flex items-center justify-center w-8 h-8 rounded border border-slate-800 bg-[#0b1322] text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageNumbers.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onPageChange(num)}
            className={`inline-flex items-center justify-center min-w-8 h-8 px-2 rounded border text-xs font-medium transition-colors ${
              num === safePage
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-slate-800 bg-[#0b1322] text-slate-300 hover:bg-slate-800'
            }`}
          >
            {num}
          </button>
        ))}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Trang sau"
          className="inline-flex items-center justify-center w-8 h-8 rounded border border-slate-800 bg-[#0b1322] text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

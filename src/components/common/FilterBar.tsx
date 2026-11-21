import { Download, RotateCcw, Search } from 'lucide-react';
import {
  GlobalFilterState,
  IncidentCategory,
  IncidentRecordType,
  IncidentSeverity,
  IncidentStatus,
  SecurityEvent,
  SecurityZone,
  TimeRangePreset,
} from '../../types/security';
import { SEVERITY_ORDER, STATUS_ORDER, getDateWindow } from '../../utils/analyticsEngine';

interface FilterBarProps {
  filters: GlobalFilterState;
  onChange: (patch: Partial<GlobalFilterState>) => void;
  onReset: () => void;
  onExportCsv: () => void;
  events: SecurityEvent[];
  zones: SecurityZone[];
  categories: IncidentCategory[];
  showRecordTypeFilter?: boolean;
  showSearch?: boolean;
}

export function FilterBar({
  filters,
  onChange,
  onReset,
  onExportCsv,
  events,
  zones,
  categories,
  showRecordTypeFilter = true,
  showSearch = true,
}: FilterBarProps) {
  const win = getDateWindow(filters);

  const timePresets: Array<{ id: TimeRangePreset; label: string }> = [
    { id: 'today', label: 'Hôm nay' },
    { id: '7d', label: '7 ngày' },
    { id: '30d', label: '30 ngày' },
    { id: 'custom', label: 'Tùy chọn' },
  ];

  const hasActiveFilter =
    filters.eventId !== 'ALL' ||
    filters.zoneId !== 'ALL' ||
    filters.categoryId !== 'ALL' ||
    filters.severity !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.recordType !== 'ALL' ||
    filters.searchQuery.trim() !== '' ||
    filters.timeRange !== '7d';

  return (
    <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Time preset segmented control */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-0.5 bg-[#09111f] border border-slate-800 rounded-md">
            {timePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange({ timeRange: preset.id })}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  filters.timeRange === preset.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {filters.timeRange === 'custom' ? (
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={filters.customStartDate}
                onChange={(e) => onChange({ customStartDate: e.target.value })}
                aria-label="Từ ngày"
                className="bg-[#09111f] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-500">đến</span>
              <input
                type="date"
                value={filters.customEndDate}
                onChange={(e) => onChange({ customEndDate: e.target.value })}
                aria-label="Đến ngày"
                className="bg-[#09111f] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-mono tabular-nums px-1">
              Kỳ: {win.startDate.split('-').reverse().join('/')} – {win.endDate.split('-').reverse().join('/')}
              {' · '}
              So sánh kỳ trước: {win.prevStartDate.split('-').reverse().join('/')} – {win.prevEndDate.split('-').reverse().join('/')}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {hasActiveFilter && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#09111f] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Dropdown filters & search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
        {showSearch && (
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onChange({ searchQuery: e.target.value })}
              placeholder="Tìm mã hồ sơ, tiêu đề, nội dung, người báo..."
              className="w-full bg-[#09111f] border border-slate-700/90 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        <select
          value={filters.zoneId}
          onChange={(e) => onChange({ zoneId: e.target.value })}
          aria-label="Lọc theo khu vực"
          className="bg-[#09111f] border border-slate-700/90 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">Tất cả khu vực ({zones.length})</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.code} — {z.name}
            </option>
          ))}
        </select>

        <select
          value={filters.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
          aria-label="Lọc theo nhóm vụ việc"
          className="bg-[#09111f] border border-slate-700/90 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">Tất cả nhóm ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={filters.severity}
          onChange={(e) => onChange({ severity: e.target.value as 'ALL' | IncidentSeverity })}
          aria-label="Lọc theo mức độ"
          className="bg-[#09111f] border border-slate-700/90 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">Mọi mức độ nghiêm trọng</option>
          {SEVERITY_ORDER.map((s) => (
            <option key={s} value={s}>
              Mức độ: {s}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <select
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value as 'ALL' | IncidentStatus })}
            aria-label="Lọc theo trạng thái"
            className="w-full bg-[#09111f] border border-slate-700/90 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Mọi trạng thái</option>
            {STATUS_ORDER.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {showRecordTypeFilter && (
            <select
              value={filters.recordType}
              onChange={(e) => onChange({ recordType: e.target.value as 'ALL' | IncidentRecordType })}
              aria-label="Phân loại Vụ việc / Sự cố"
              className="bg-[#09111f] border border-slate-700/90 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Loại: Tất cả</option>
              <option value="Vụ việc">Vụ việc</option>
              <option value="Sự cố">Sự cố</option>
            </select>
          )}
        </div>
      </div>

      {/* Event indicator if filtered */}
      {filters.eventId !== 'ALL' && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-xs text-slate-400">
          <span>
            Đang lọc sự kiện:{' '}
            <strong className="text-blue-300">
              {events.find((e) => e.id === filters.eventId)?.name ?? filters.eventId}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => onChange({ eventId: 'ALL' })}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Xem toàn bộ sự kiện
          </button>
        </div>
      )}
    </div>
  );
}

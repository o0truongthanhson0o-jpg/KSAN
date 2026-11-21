import {
  Activity,
  BarChart3,
  Clock,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AnalyticsGranularity,
  Attendee,
  ComputedMetrics,
  GlobalFilterState,
  IncidentCategory,
  SecurityAlert,
  SecurityEvent,
  SecurityIncident,
  SecurityZone,
} from '../../types/security';
import {
  SEVERITY_COLORS,
  buildCategoryBreakdown,
  buildPeriodComparisonBySeverity,
  buildTimeSeriesData,
  buildZoneBreakdown,
  computePeriodDelta,
  filterIncidents,
  formatDeltaLabel,
  getDateWindow,
  getResolutionMinutes,
  isIncidentOnTime,
  isResolvedStatus,
  matchesNonDateFilters,
} from '../../utils/analyticsEngine';
import { exportRowsToCsv } from '../../utils/csvExport';
import { FilterBar } from '../common/FilterBar';
import { PaginationBar } from '../common/PaginationBar';
import { DrilldownPayload } from '../modals/KpiDrilldownDrawer';

interface AnalyticsModuleProps {
  events: SecurityEvent[];
  zones: SecurityZone[];
  categories: IncidentCategory[];
  incidents: SecurityIncident[];
  alerts: SecurityAlert[];
  attendees: Attendee[];
  metrics: ComputedMetrics;
  filters: GlobalFilterState;
  onChangeFilter: (patch: Partial<GlobalFilterState>) => void;
  onResetFilters: () => void;
  onOpenDrilldown: (payload: DrilldownPayload) => void;
}

const TOOLTIP_STYLE = {
  backgroundColor: '#0b1322',
  border: '1px solid #334155',
  borderRadius: '6px',
  fontSize: '12px',
  color: '#f1f5f9',
};

export function AnalyticsModule({
  events,
  zones,
  categories,
  incidents,
  alerts,
  metrics,
  filters,
  onChangeFilter,
  onResetFilters,
  onOpenDrilldown,
}: AnalyticsModuleProps) {
  const [granularity, setGranularity] = useState<AnalyticsGranularity>('day');
  const [compareDimension, setCompareDimension] = useState<'severity' | 'category' | 'zone'>(
    'severity'
  );
  const [catPage, setCatPage] = useState(1);
  const catPageSize = 5;

  const win = useMemo(() => getDateWindow(filters), [filters]);

  const filteredIncidents = useMemo(
    () => filterIncidents(incidents, filters),
    [incidents, filters]
  );

  const previousIncidents = useMemo(
    () =>
      filterIncidents(incidents, filters, {
        startDate: win.prevStartDate,
        endDate: win.prevEndDate,
      }),
    [incidents, filters, win.prevStartDate, win.prevEndDate]
  );

  const timeSeries = useMemo(
    () => buildTimeSeriesData(incidents, filters, granularity),
    [incidents, filters, granularity]
  );

  const periodCompSeverity = useMemo(
    () => buildPeriodComparisonBySeverity(incidents, filters),
    [incidents, filters]
  );

  const categoryBreakdown = useMemo(
    () => buildCategoryBreakdown(incidents, categories, filters),
    [incidents, categories, filters]
  );

  const zoneBreakdown = useMemo(
    () => buildZoneBreakdown(incidents, zones, filters),
    [incidents, zones, filters]
  );

  const comparisonChartData = useMemo(() => {
    if (compareDimension === 'severity') {
      return periodCompSeverity.map((s) => ({
        key: s.severity,
        label: s.severity,
        current: s.current,
        previous: s.previous,
        deltaText: s.deltaText,
      }));
    }
    if (compareDimension === 'category') {
      return categoryBreakdown.slice(0, 6).map((c) => ({
        key: c.categoryId,
        label: c.shortName,
        current: c.count,
        previous: c.previousCount,
        deltaText: c.deltaText,
      }));
    }
    return zoneBreakdown.map((z) => ({
      key: z.zoneId,
      label: z.code,
      current: z.count,
      previous: z.previousCount,
      deltaText: z.deltaText,
    }));
  }, [compareDimension, periodCompSeverity, categoryBreakdown, zoneBreakdown]);

  const categoryMatrix = useMemo(() => {
    return categoryBreakdown.map((row) => {
      const catIncidents = filteredIncidents.filter((i) => i.categoryId === row.categoryId);
      const resolved = catIncidents.filter((i) => isResolvedStatus(i.status));
      let onTime = 0;
      let evalCount = 0;
      let totalMins = 0;
      let minsCount = 0;

      for (const inc of resolved) {
        const mins = getResolutionMinutes(inc);
        if (mins !== null) {
          totalMins += mins;
          minsCount++;
        }
        const ok = isIncidentOnTime(inc);
        if (ok !== null) {
          evalCount++;
          if (ok) onTime++;
        }
      }

      return {
        ...row,
        resolvedCount: resolved.length,
        hasSlaEval: evalCount > 0,
        seriousRate:
          row.count > 0 ? Number(((row.seriousCount / row.count) * 100).toFixed(1)) : 0,
        onTimeRate: evalCount > 0 ? Number(((onTime / evalCount) * 100).toFixed(1)) : 0,
        avgMinutes: minsCount > 0 ? Math.round(totalMins / minsCount) : 0,
      };
    });
  }, [categoryBreakdown, filteredIncidents]);

  const catTotalPages = Math.max(1, Math.ceil(categoryMatrix.length / catPageSize));
  const safeCatPage = Math.min(catPage, catTotalPages);
  const pagedCategories = categoryMatrix.slice(
    (safeCatPage - 1) * catPageSize,
    safeCatPage * catPageSize
  );

  const periodDelta = computePeriodDelta(
    metrics.totalIncidents,
    metrics.previousTotalIncidents
  );

  const handleExportAnalyticsCsv = () => {
    exportRowsToCsv(
      'phan_tich_thong_ke_an_ninh.csv',
      [
        'Nhóm vụ việc',
        'Kỳ hiện tại',
        'Kỳ trước',
        'Tăng/Giảm',
        'Số vụ nghiêm trọng/khẩn cấp',
        'Tỷ lệ nghiêm trọng (%)',
        'Đã xử lý',
        'Tỷ lệ đúng hạn SLA (%)',
        'Thời gian xử lý TB (phút)',
      ],
      categoryMatrix.map((c) => [
        c.name,
        c.count,
        c.previousCount,
        c.deltaText,
        c.seriousCount,
        c.seriousRate,
        c.resolvedCount,
        c.hasSlaEval ? c.onTimeRate : 'Chưa đánh giá',
        c.avgMinutes,
      ])
    );
  };

  const openTimeBucketDrilldown = (idx: number) => {
    const point = timeSeries[idx];
    if (!point) return;
    const bucketIncidents = incidents.filter((inc) => {
      const d = inc.reportedAt.slice(0, 10);
      return (
        d >= point.startDate &&
        d <= point.endDate &&
        matchesNonDateFilters(inc, filters)
      );
    });
    onOpenDrilldown({
      title: `Hồ sơ vụ việc kỳ ${point.label}`,
      subtitle: `Từ ${point.startDate.split('-').reverse().join('/')} đến ${point.endDate.split('-').reverse().join('/')} · Biến động: ${point.deltaText}`,
      kind: 'incidents',
      incidents: bucketIncidents,
      applyFilterLabel: 'Lọc theo khoảng thời gian này',
      onApplyFilter: () =>
        onChangeFilter({
          timeRange: 'custom',
          customStartDate: point.startDate,
          customEndDate: point.endDate,
        }),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
            Phân tích thống kê & Xu hướng vụ việc
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Biểu đồ tăng giảm theo ngày/tuần/tháng, so sánh kỳ trước và bấm vào từng biểu đồ để xem danh sách hồ sơ ·{' '}
            <span className="text-blue-300 font-medium">Dữ liệu minh họa</span>
          </p>
        </div>

        {/* Granularity Selector: Ngày / Tuần / Tháng */}
        <div className="inline-flex items-center p-0.5 bg-[#101a2d] border border-slate-800 rounded-md">
          {(
            [
              { id: 'day', label: 'Theo ngày' },
              { id: 'week', label: 'Theo tuần' },
              { id: 'month', label: 'Theo tháng' },
            ] as Array<{ id: AnalyticsGranularity; label: string }>
          ).map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGranularity(g.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                granularity === g.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shared Filters */}
      <FilterBar
        filters={filters}
        onChange={(patch) => {
          setCatPage(1);
          onChangeFilter(patch);
        }}
        onReset={() => {
          setCatPage(1);
          onResetFilters();
        }}
        onExportCsv={handleExportAnalyticsCsv}
        events={events}
        zones={zones}
        categories={categories}
      />

      {/* 6 Automated Analytical KPIs — Clickable to inspect underlying records */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Tăng/giảm tuyệt đối & Phần trăm */}
        <button
          type="button"
          onClick={() =>
            onOpenDrilldown({
              title: 'Biến động số vụ so với kỳ trước',
              subtitle: `Kỳ này: ${metrics.totalIncidents} vụ · Kỳ trước: ${metrics.previousTotalIncidents} vụ (${periodDelta.displayFull})`,
              kind: 'incidents',
              incidents: filteredIncidents,
            })
          }
          className="text-left bg-[#101a2d] hover:bg-[#142139] border border-slate-800/90 hover:border-blue-500/50 rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Biến động số vụ so với kỳ trước</span>
            {periodDelta.deltaAbsolute >= 0 ? (
              <TrendingUp className="w-4 h-4 text-red-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span
              className={`text-2xl font-semibold font-mono tabular-nums ${
                periodDelta.isNewEmergence
                  ? 'text-amber-400'
                  : periodDelta.deltaAbsolute > 0
                  ? 'text-red-400'
                  : periodDelta.deltaAbsolute < 0
                  ? 'text-emerald-400'
                  : 'text-slate-100'
              }`}
            >
              {periodDelta.previous === 0
                ? periodDelta.displayFull
                : `${periodDelta.deltaAbsolute > 0 ? '+' : ''}${periodDelta.deltaAbsolute} vụ`}
            </span>
            {periodDelta.previous > 0 && (
              <span
                className={`text-sm font-mono tabular-nums font-medium ${
                  periodDelta.deltaAbsolute > 0
                    ? 'text-red-400'
                    : periodDelta.deltaAbsolute < 0
                    ? 'text-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                ({periodDelta.displayPercent})
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-slate-400 font-mono tabular-nums">
            Kỳ này: {metrics.totalIncidents} · Kỳ trước: {metrics.previousTotalIncidents} · Bấm xem hồ sơ →
          </p>
        </button>

        {/* Tần suất trên 1.000 lượt người tham dự */}
        <button
          type="button"
          onClick={() =>
            onOpenDrilldown({
              title: 'Hồ sơ tính tần suất trên 1.000 lượt tham dự',
              subtitle: `${metrics.totalIncidents} vụ / ${metrics.attendeesInScope.toLocaleString('vi-VN')} lượt người = ${metrics.incidentRatePer1000} vụ/1.000 lượt`,
              kind: 'incidents',
              incidents: filteredIncidents,
            })
          }
          className="text-left bg-[#101a2d] hover:bg-[#142139] border border-slate-800/90 hover:border-blue-500/50 rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tần suất vụ việc / 1.000 lượt tham dự</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-blue-400">
              {metrics.incidentRatePer1000}
            </span>
            <span className="text-xs text-slate-400">vụ / 1.000 lượt</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400 font-mono tabular-nums">
            Quy mô tham dự: {metrics.attendeesInScope.toLocaleString('vi-VN')} lượt · Bấm xem chi tiết →
          </p>
        </button>

        {/* Tỷ lệ vụ việc nghiêm trọng */}
        <button
          type="button"
          onClick={() =>
            onOpenDrilldown({
              title: 'Danh sách vụ việc Nghiêm trọng & Khẩn cấp',
              subtitle: `Chiếm ${metrics.seriousRate}% tổng số vụ trong kỳ`,
              kind: 'incidents',
              incidents: filteredIncidents.filter(
                (i) => i.severity === 'Nghiêm trọng' || i.severity === 'Khẩn cấp'
              ),
            })
          }
          className="text-left bg-[#101a2d] hover:bg-[#142139] border border-slate-800/90 hover:border-orange-500/50 rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tỷ lệ vụ việc Nghiêm trọng & Khẩn cấp</span>
            <ShieldAlert className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-orange-400">
              {metrics.seriousRate}%
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              ({metrics.seriousTotalCount}/{metrics.totalIncidents} hồ sơ)
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400 font-mono tabular-nums">
            Nghiêm trọng: {metrics.criticalCount} · Khẩn cấp: {metrics.emergencyCount} →
          </p>
        </button>

        {/* Tỷ lệ xử lý đúng hạn */}
        <button
          type="button"
          onClick={() =>
            onOpenDrilldown({
              title: 'Hồ sơ đánh giá tỷ lệ xử lý đúng hạn SLA',
              subtitle: `Đúng hạn ${metrics.onTimeCount}/${metrics.evaluatedSlaCount} hồ sơ đã xử lý`,
              kind: 'incidents',
              incidents: filteredIncidents.filter((i) => isResolvedStatus(i.status)),
            })
          }
          className="text-left bg-[#101a2d] hover:bg-[#142139] border border-slate-800/90 hover:border-emerald-500/50 rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tỷ lệ xử lý đúng hạn SLA</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-emerald-400">
              {metrics.evaluatedSlaCount > 0 ? `${metrics.onTimeRate}%` : '—'}
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {metrics.evaluatedSlaCount > 0
                ? `(${metrics.onTimeCount}/${metrics.evaluatedSlaCount} hồ sơ đạt chuẩn)`
                : '(Chưa có hồ sơ đóng)'}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Bấm xem danh sách hồ sơ đã nghiệm thu →
          </p>
        </button>

        {/* Thời gian xử lý trung bình */}
        <button
          type="button"
          onClick={() =>
            onOpenDrilldown({
              title: 'Hồ sơ đo thời gian xử lý trung bình',
              subtitle: `Thời gian xử lý trung bình: ${metrics.avgResolutionMinutes} phút`,
              kind: 'incidents',
              incidents: filteredIncidents.filter((i) => isResolvedStatus(i.status)),
            })
          }
          className="text-left bg-[#101a2d] hover:bg-[#142139] border border-slate-800/90 hover:border-sky-500/50 rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Thời gian xử lý trung bình</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-slate-100">
              {metrics.avgResolutionMinutes} phút
            </span>
            {metrics.avgResolutionMinutes >= 60 && (
              <span className="text-xs text-slate-400 font-mono">
                ({(metrics.avgResolutionMinutes / 60).toFixed(1)} giờ)
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Từ thời điểm tiếp nhận tới khi hoàn tất hiện trường →
          </p>
        </button>

        {/* Chuyển hóa cảnh báo -> vụ việc */}
        <button
          type="button"
          onClick={() =>
            onOpenDrilldown({
              title: 'Cảnh báo chưa xác minh trong kỳ',
              subtitle: `Tổng ${metrics.totalAlertsInScope} cảnh báo · ${metrics.unverifiedAlertsCount} chờ xác minh · ${metrics.falseAlertsCount} báo động giả`,
              kind: 'alerts',
              alerts: alerts.filter((a) => {
                const d = a.detectedAt.slice(0, 10);
                return (
                  d >= win.startDate &&
                  d <= win.endDate &&
                  (filters.eventId === 'ALL' || a.eventId === filters.eventId) &&
                  (filters.zoneId === 'ALL' || a.zoneId === filters.zoneId) &&
                  a.status === 'Chưa xác minh'
                );
              }),
            })
          }
          className="text-left bg-[#101a2d] hover:bg-[#142139] border border-slate-800/90 hover:border-amber-500/50 rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Chuyển hóa Cảnh báo thành Vụ việc</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-slate-100">
              {metrics.totalAlertsInScope} → {metrics.totalIncidents}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400 font-mono tabular-nums">
            Chưa xác minh: {metrics.unverifiedAlertsCount} · Báo động giả: {metrics.falseAlertsCount} →
          </p>
        </button>
      </section>

      {/* Row 1 Charts: Day/Week/Month Trend + Period Comparison */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Tăng giảm số vụ việc theo Ngày / Tuần / Tháng */}
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Biến động tăng giảm số vụ việc (
                {granularity === 'day' ? 'Theo ngày' : granularity === 'week' ? 'Theo tuần' : 'Theo tháng'}
                )
              </h2>
              <p className="text-xs text-slate-400">
                Xu hướng tổng: {formatDeltaLabel(metrics)} · Bấm vào mốc thời gian để xem danh sách vụ việc
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-500 shrink-0" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={timeSeries}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                onClick={(state) => {
                  const idx =
                    typeof state?.activeTooltipIndex === 'number' ? state.activeTooltipIndex : -1;
                  if (idx >= 0) openTimeBucketDrilldown(idx);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(label, payload) => {
                    const pt = payload?.[0]?.payload as { deltaText?: string } | undefined;
                    return pt?.deltaText ? `${label} — Biến động: ${pt.deltaText}` : String(label);
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="current"
                  name="Kỳ hiện tại"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                />
                <Line
                  type="monotone"
                  dataKey="previous"
                  name="Kỳ trước"
                  stroke="#94A3B8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="serious"
                  name="Nghiêm trọng & Khẩn cấp"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Period-over-period delta strip (explicitly shows Phát sinh mới when previous === 0) */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex flex-wrap gap-2">
            {timeSeries.map((pt, idx) => (
              <button
                key={pt.dateKey}
                type="button"
                onClick={() => openTimeBucketDrilldown(idx)}
                className="px-2 py-1 rounded bg-[#09111f] border border-slate-800 hover:border-blue-500/50 text-[11px] font-mono tabular-nums text-slate-300 transition-colors"
              >
                <span className="text-slate-400">{pt.label}:</span>{' '}
                <strong className="text-slate-100">{pt.current}</strong>{' '}
                <span
                  className={
                    pt.deltaText === 'Phát sinh mới'
                      ? 'text-amber-400'
                      : pt.deltaAbsolute > 0
                      ? 'text-red-400'
                      : pt.deltaAbsolute < 0
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }
                >
                  ({pt.deltaText})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Chart 2: So sánh kỳ hiện tại với kỳ trước */}
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                So sánh kỳ hiện tại với kỳ trước
              </h2>
              <p className="text-xs text-slate-400">
                Kỳ này ({win.startDate.slice(5)}..{win.endDate.slice(5)}) vs Kỳ trước ({win.prevStartDate.slice(5)}..{win.prevEndDate.slice(5)})
              </p>
            </div>
            <div className="inline-flex items-center p-0.5 bg-[#09111f] border border-slate-800 rounded text-[11px]">
              {(
                [
                  { id: 'severity', label: 'Mức độ' },
                  { id: 'category', label: 'Loại vụ việc' },
                  { id: 'zone', label: 'Khu vực' },
                ] as const
              ).map((dim) => (
                <button
                  key={dim.id}
                  type="button"
                  onClick={() => setCompareDimension(dim.id)}
                  className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                    compareDimension === dim.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {dim.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonChartData}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                onClick={(state) => {
                  const idx =
                    typeof state?.activeTooltipIndex === 'number' ? state.activeTooltipIndex : -1;
                  const clicked = idx >= 0 ? comparisonChartData[idx] : undefined;
                  if (!clicked) return;

                  if (compareDimension === 'severity') {
                    const sev = clicked.key as GlobalFilterState['severity'];
                    onOpenDrilldown({
                      title: `So sánh mức độ "${clicked.label}"`,
                      subtitle: `Kỳ này: ${clicked.current} vụ · Kỳ trước: ${clicked.previous} vụ (${clicked.deltaText})`,
                      kind: 'incidents',
                      incidents: filteredIncidents.filter((i) => i.severity === sev),
                      applyFilterLabel: 'Lọc theo mức độ này',
                      onApplyFilter: () => onChangeFilter({ severity: sev }),
                    });
                  } else if (compareDimension === 'category') {
                    const cat = categories.find((c) => c.id === clicked.key);
                    onOpenDrilldown({
                      title: `So sánh nhóm "${cat?.name ?? clicked.label}"`,
                      subtitle: `Kỳ này: ${clicked.current} vụ · Kỳ trước: ${clicked.previous} vụ (${clicked.deltaText})`,
                      kind: 'incidents',
                      incidents: filteredIncidents.filter((i) => i.categoryId === clicked.key),
                      applyFilterLabel: 'Lọc theo nhóm này',
                      onApplyFilter: () => onChangeFilter({ categoryId: clicked.key }),
                    });
                  } else {
                    const z = zones.find((zn) => zn.id === clicked.key);
                    onOpenDrilldown({
                      title: `So sánh khu vực "${z?.name ?? clicked.label}"`,
                      subtitle: `Kỳ này: ${clicked.current} vụ · Kỳ trước: ${clicked.previous} vụ (${clicked.deltaText})`,
                      kind: 'incidents',
                      incidents: filteredIncidents.filter((i) => i.zoneId === clicked.key),
                      applyFilterLabel: 'Lọc theo khu vực này',
                      onApplyFilter: () => onChangeFilter({ zoneId: clicked.key }),
                    });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelFormatter={(label, payload) => {
                    const pt = payload?.[0]?.payload as { deltaText?: string } | undefined;
                    return pt?.deltaText ? `${label} — ${pt.deltaText}` : String(label);
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="current" name="Kỳ hiện tại" fill="#3B82F6" radius={[4, 4, 0, 0]} cursor="pointer" />
                <Bar dataKey="previous" name="Kỳ trước" fill="#475569" radius={[4, 4, 0, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="mt-3 pt-2.5 border-t border-slate-800/70 text-[11px] text-slate-400">
            Kỳ trước có {previousIncidents.length} hồ sơ · Bấm vào cột bất kỳ để mở danh sách vụ việc tương ứng.
          </p>
        </div>
      </section>

      {/* Row 2 Charts: Phân tích theo Loại vụ việc, Mức độ nghiêm trọng, Khu vực */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 3: Phân tích theo loại vụ việc */}
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Phân tích theo loại vụ việc
            </h2>
            <p className="text-xs text-slate-400">
              Bấm vào thanh nhóm để xem danh sách hồ sơ
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryBreakdown}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
                onClick={(state) => {
                  const idx =
                    typeof state?.activeTooltipIndex === 'number' ? state.activeTooltipIndex : -1;
                  const clicked = idx >= 0 ? categoryBreakdown[idx] : undefined;
                  if (clicked) {
                    onOpenDrilldown({
                      title: `Nhóm vụ việc: ${clicked.name}`,
                      subtitle: `${clicked.count} hồ sơ trong kỳ (${clicked.deltaText})`,
                      kind: 'incidents',
                      incidents: filteredIncidents.filter(
                        (i) => i.categoryId === clicked.categoryId
                      ),
                      applyFilterLabel: 'Lọc theo nhóm này',
                      onApplyFilter: () =>
                        onChangeFilter({ categoryId: clicked.categoryId }),
                    });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" allowDecimals={false} stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  width={120}
                  interval={0}
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" name="Số vụ" fill="#3B82F6" radius={[0, 4, 4, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Phân tích theo mức độ nghiêm trọng */}
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Phân tích theo mức độ nghiêm trọng
            </h2>
            <p className="text-xs text-slate-400">
              Bấm vào cột mức độ để xem danh sách hồ sơ
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={periodCompSeverity}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                onClick={(state) => {
                  const idx =
                    typeof state?.activeTooltipIndex === 'number' ? state.activeTooltipIndex : -1;
                  const clicked = idx >= 0 ? periodCompSeverity[idx] : undefined;
                  if (clicked) {
                    onOpenDrilldown({
                      title: `Hồ sơ mức độ "${clicked.severity}"`,
                      subtitle: `Kỳ này: ${clicked.current} vụ · Biến động: ${clicked.deltaText}`,
                      kind: 'incidents',
                      incidents: filteredIncidents.filter((i) => i.severity === clicked.severity),
                      applyFilterLabel: 'Lọc theo mức độ này',
                      onApplyFilter: () => onChangeFilter({ severity: clicked.severity }),
                    });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="severity" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="current" name="Số vụ" radius={[4, 4, 0, 0]} cursor="pointer">
                  {periodCompSeverity.map((entry) => (
                    <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Phân tích theo khu vực & tần suất / 1.000 người */}
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Phân tích theo khu vực (/ 1.000 người)
            </h2>
            <p className="text-xs text-slate-400">
              Bấm vào khu vực để xem danh sách hồ sơ
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={zoneBreakdown}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                onClick={(state) => {
                  const idx =
                    typeof state?.activeTooltipIndex === 'number' ? state.activeTooltipIndex : -1;
                  const clicked = idx >= 0 ? zoneBreakdown[idx] : undefined;
                  if (clicked) {
                    onOpenDrilldown({
                      title: `Khu vực: ${clicked.name}`,
                      subtitle: `${clicked.count} hồ sơ · Mật độ ${clicked.ratePer1000}/1.000 người (${clicked.deltaText})`,
                      kind: 'incidents',
                      incidents: filteredIncidents.filter((i) => i.zoneId === clicked.zoneId),
                      applyFilterLabel: 'Lọc theo khu vực này',
                      onApplyFilter: () => onChangeFilter({ zoneId: clicked.zoneId }),
                    });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="code" stroke="#64748b" interval={0} tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="count" name="Số vụ" fill="#3B82F6" radius={[4, 4, 0, 0]} cursor="pointer" />
                <Bar dataKey="ratePer1000" name="/ 1.000 người" fill="#06B6D4" radius={[4, 4, 0, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Detailed Category Analytical Table */}
      <section className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Bảng tổng hợp chỉ số phân tích theo 10 nhóm vụ việc
            </h2>
            <p className="text-xs text-slate-400">
              Bấm vào dòng để xem danh sách hồ sơ của nhóm vụ việc tương ứng
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 pr-3 font-medium">Nhóm vụ việc</th>
                <th className="py-2.5 px-3 font-medium text-right">Kỳ này</th>
                <th className="py-2.5 px-3 font-medium text-right">Kỳ trước</th>
                <th className="py-2.5 px-3 font-medium text-right">Tăng / Giảm</th>
                <th className="py-2.5 px-3 font-medium text-right">Nghiêm trọng / KC</th>
                <th className="py-2.5 px-3 font-medium text-right">Đúng hạn SLA</th>
                <th className="py-2.5 pl-3 font-medium text-right">Xử lý TB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 tabular-nums">
              {pagedCategories.map((c) => {
                const active = filters.categoryId === c.categoryId;
                return (
                  <tr
                    key={c.categoryId}
                    onClick={() =>
                      onOpenDrilldown({
                        title: `Nhóm vụ việc: ${c.name}`,
                        subtitle: `Kỳ này: ${c.count} vụ · Kỳ trước: ${c.previousCount} vụ (${c.deltaText})`,
                        kind: 'incidents',
                        incidents: filteredIncidents.filter((i) => i.categoryId === c.categoryId),
                        applyFilterLabel: active ? 'Bỏ lọc nhóm này' : 'Lọc theo nhóm này',
                        onApplyFilter: () =>
                          onChangeFilter({ categoryId: active ? 'ALL' : c.categoryId }),
                      })
                    }
                    className={`cursor-pointer transition-colors ${
                      active ? 'bg-blue-600/15' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 pr-3 font-medium text-slate-100">{c.name}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-100">
                      {c.count}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {c.previousCount}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono ${
                        c.deltaText === 'Phát sinh mới'
                          ? 'text-amber-400'
                          : c.count > c.previousCount
                          ? 'text-red-400'
                          : c.count < c.previousCount
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {c.deltaText}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-orange-400">
                      {c.seriousCount} ({c.seriousRate}%)
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                      {c.hasSlaEval ? `${c.onTimeRate}%` : '—'}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-mono text-slate-300">
                      {c.hasSlaEval ? `${c.avgMinutes} phút` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={safeCatPage}
          pageSize={catPageSize}
          totalItems={categoryMatrix.length}
          onPageChange={setCatPage}
        />
      </section>
    </div>
  );
}

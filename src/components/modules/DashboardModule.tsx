import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Flame,
  Minus,
  Plus,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
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
  IncidentSeverity,
  IncidentStatus,
  SecurityAlert,
  SecurityEvent,
  SecurityIncident,
  SecurityZone,
} from '../../types/security';
import {
  SEVERITY_COLORS,
  buildCategoryBreakdown,
  buildHandlingPipelineData,
  buildPeriodComparisonBySeverity,
  buildTimeSeriesData,
  buildZoneBreakdown,
  filterAlerts,
  filterIncidents,
  formatDateTimeVi,
  formatDeltaLabel,
  isResolvedStatus,
  matchesNonDateFilters,
} from '../../utils/analyticsEngine';
import { exportRowsToCsv } from '../../utils/csvExport';
import { FilterBar } from '../common/FilterBar';
import { PaginationBar } from '../common/PaginationBar';
import {
  AlertStatusText,
  IncidentStatusText,
  RecordTypeText,
  SeverityText,
} from '../common/SemanticLabel';
import { DrilldownPayload } from '../modals/KpiDrilldownDrawer';

interface DashboardModuleProps {
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
  onOpenIncidentModal: (inc: SecurityIncident | null) => void;
  onVerifyAlertToIncident: (alert: SecurityAlert) => void;
  onMarkAlertFalse: (alertId: string) => void;
  onNavigateModule: (moduleId: 'incidents' | 'forces') => void;
}

const PIE_PALETTE = [
  '#3B82F6',
  '#06B6D4',
  '#F59E0B',
  '#EF4444',
  '#F97316',
  '#10B981',
  '#8B5CF6',
  '#EC4899',
  '#6366F1',
  '#64748B',
];

const TOOLTIP_STYLE = {
  backgroundColor: '#0b1322',
  border: '1px solid #334155',
  borderRadius: '6px',
  fontSize: '12px',
  color: '#f1f5f9',
};

export function DashboardModule({
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
  onOpenIncidentModal,
  onVerifyAlertToIncident,
  onMarkAlertFalse,
  onNavigateModule,
}: DashboardModuleProps) {
  const [trendGranularity, setTrendGranularity] = useState<AnalyticsGranularity>('day');
  const [incPage, setIncPage] = useState(1);
  const [alertPage, setAlertPage] = useState(1);
  const pageSize = 6;

  const filteredIncidents = useMemo(
    () => filterIncidents(incidents, filters),
    [incidents, filters]
  );

  const filteredAlerts = useMemo(
    () => filterAlerts(alerts, filters, true),
    [alerts, filters]
  );

  const unverifiedAlerts = useMemo(
    () => filteredAlerts.filter((a) => a.status === 'Chưa xác minh'),
    [filteredAlerts]
  );

  const timeSeries = useMemo(
    () => buildTimeSeriesData(incidents, filters, trendGranularity),
    [incidents, filters, trendGranularity]
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

  const handlingPipeline = useMemo(
    () => buildHandlingPipelineData(incidents, filters),
    [incidents, filters]
  );

  const top5Zones = zoneBreakdown.slice(0, 5);

  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id;
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  const incTotalPages = Math.max(1, Math.ceil(filteredIncidents.length / pageSize));
  const safeIncPage = Math.min(incPage, incTotalPages);
  const alertTotalPages = Math.max(1, Math.ceil(unverifiedAlerts.length / pageSize));
  const safeAlertPage = Math.min(alertPage, alertTotalPages);

  const pagedIncidents = filteredIncidents.slice(
    (safeIncPage - 1) * pageSize,
    safeIncPage * pageSize
  );
  const pagedAlerts = unverifiedAlerts.slice(
    (safeAlertPage - 1) * pageSize,
    safeAlertPage * pageSize
  );

  const handleExportDashboardCsv = () => {
    exportRowsToCsv(
      'bao_cao_tong_quan_an_ninh.csv',
      ['Mã hồ sơ', 'Phân loại', 'Tiêu đề', 'Sự kiện', 'Khu vực', 'Nhóm vụ việc', 'Mức độ', 'Trạng thái', 'Số cảnh báo gộp', 'Thời gian tiếp nhận'],
      filteredIncidents.map((i) => [
        i.code,
        i.recordType,
        i.title,
        events.find((e) => e.id === i.eventId)?.name ?? i.eventId,
        zoneName(i.zoneId),
        catName(i.categoryId),
        i.severity,
        i.status,
        i.linkedAlertIds.length,
        formatDateTimeVi(i.reportedAt),
      ])
    );
  };

  return (
    <div className="space-y-5">
      {/* Header & Demo Data Notice */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
            Tổng quan tình hình an ninh
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Giám sát hợp nhất cảnh báo thiết bị, hồ sơ vụ việc đã xác minh và tiến độ xử lý ·{' '}
            <span className="text-blue-300 font-medium">Dữ liệu minh họa phục vụ điều hành</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenIncidentModal(null)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Lập hồ sơ vụ việc</span>
        </button>
      </div>

      {/* Global Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={(patch) => {
          setIncPage(1);
          setAlertPage(1);
          onChangeFilter(patch);
        }}
        onReset={() => {
          setIncPage(1);
          setAlertPage(1);
          onResetFilters();
        }}
        onExportCsv={handleExportDashboardCsv}
        events={events}
        zones={zones}
        categories={categories}
      />

      {/* 8 Required KPI Cards — Single-elevation flat cards with interactive drilldown */}
      <section aria-label="Chỉ số điều hành trọng yếu" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Tổng số vụ việc */}
        <button
          type="button"
          onClick={() =>
            onOpenDrilldown({
              title: 'Tổng số vụ việc trong kỳ',
              subtitle: `Bao gồm ${metrics.vuViecCount} Vụ việc và ${metrics.suCoCount} Sự cố đã lập hồ sơ (không tính trùng cảnh báo gộp)`,
              kind: 'incidents',
              incidents: filteredIncidents,
            })
          }
          className="text-left bg-[#101a2d] hover:bg-[#142139] border border-slate-800/90 hover:border-blue-500/50 rounded-lg p-4 transition-colors group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tổng số vụ việc</span>
            <ShieldAlert className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold font-mono tabular-nums text-slate-100">
              {metrics.totalIncidents}
            </span>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              {metrics.vuViecCount} vụ · {metrics.suCoCount} sự cố
            </span>
          </div>
          <p className="mt-2 text-[11px] text-blue-400 group-hover:underline">Xem danh sách hồ sơ →</p>
        </button>

        {/* 2. Tăng/giảm so với kỳ trước */}
        <button
          type="button"
          onClick={() =>
            onOpenDrilldown({
              title: 'So sánh vụ việc với kỳ trước',
              subtitle: `Kỳ hiện tại: ${metrics.totalIncidents} vụ · Kỳ trước: ${metrics.previousTotalIncidents} vụ`,
              kind: 'incidents',
              incidents: filteredIncidents,
            })
          }
          className="text-left bg-[#101a2d] hover:bg-[#142139] border border-slate-800/90 hover:border-blue-500/50 rounded-lg p-4 transition-colors group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>So với kỳ trước</span>
            {metrics.deltaAbsolute > 0 ? (
              <ArrowUpRight className="w-4 h-4 text-red-400" />
            ) : metrics.deltaAbsolute < 0 ? (
              <ArrowDownRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <Minus className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span
              className={`text-xl font-semibold font-mono tabular-nums ${
                metrics.previousTotalIncidents === 0 && metrics.totalIncidents > 0
                  ? 'text-amber-400'
                  : metrics.deltaAbsolute > 0
                  ? 'text-red-400'
                  : metrics.deltaAbsolute < 0
                  ? 'text-emerald-400'
                  : 'text-slate-200'
              }`}
            >
              {metrics.previousTotalIncidents === 0
                ? metrics.totalIncidents > 0
                  ? 'Phát sinh mới'
                  : '0'
                : `${metrics.deltaAbsolute > 0 ? '+' : ''}${metrics.deltaAbsolute} (${metrics.deltaAbsolute > 0 ? '+' : ''}${metrics.deltaPercent}%)`}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 font-mono tabular-nums">
            Kỳ trước: {metrics.previousTotalIncidents} vụ việc
          </p>
        </button>

        {/* 3. Số vụ nghiêm trọng */}
        <button
          type="button"
          onClick={() =>
            onOpenDrilldown({
              title: 'Hồ sơ mức độ Nghiêm trọng',
              subtitle: 'Danh sách các vụ việc và sự cố ở mức Nghiêm trọng',
              kind: 'incidents',
              incidents: filteredIncidents.filter((i) => i.severity === 'Nghiêm trọng'),
            })
          }
          className="text-left bg-[#101a2d] hover:bg-[#142139] border border-slate-800/90 hover:border-orange-500/50 rounded-lg p-4 transition-colors group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Số vụ nghiêm trọng</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold font-mono tabular-nums text-orange-400">
              {metrics.criticalCount}
            </span>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              {metrics.totalIncidents > 0
                ? `${((metrics.criticalCount / metrics.totalIncidents) * 100).toFixed(1)}%`
                : '0%'}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-orange-300/90 group-hover:underline">Lọc chi tiết mức Nghiêm trọng →</p>
        </button>

        {/* 4. Số vụ khẩn cấp */}
        <button
          type="button"
          onClick={() =>
            onOpenDrilldown({
              title: 'Hồ sơ mức độ Khẩn cấp',
              subtitle: 'Các sự cố đòi hỏi kích hoạt quy trình ứng phó tức thời',
              kind: 'incidents',
              incidents: filteredIncidents.filter((i) => i.severity === 'Khẩn cấp'),
            })
          }
          className="text-left bg-[#101a2d] hover:bg-[#142139] border border-slate-800/90 hover:border-red-500/50 rounded-lg p-4 transition-colors group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Số vụ khẩn cấp</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold font-mono tabular-nums text-red-400">
              {metrics.emergencyCount}
            </span>
            <span className="text-[11px] text-red-300/80">Ưu tiên mức 1</span>
          </div>
          <p className="mt-2 text-[11px] text-red-400/90 group-hover:underline">Kiểm tra hồ sơ Khẩn cấp →</p>
        </button>

        {/* 5. Số vụ đã xử lý */}
        <button
          type="button"
          onClick={() =>
            onOpenDrilldown({
              title: 'Vụ việc đã hoàn tất (Đã đóng)',
              subtitle: 'Các hồ sơ đã nghiệm thu và đóng hoàn toàn trong hệ thống',
              kind: 'incidents',
              incidents: filteredIncidents.filter((i) => isResolvedStatus(i.status)),
            })
          }
          className="text-left bg-[#101a2d] hover:bg-[#142139] border border-slate-800/90 hover:border-emerald-500/50 rounded-lg p-4 transition-colors group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Số vụ đã xử lý</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold font-mono tabular-nums text-emerald-400">
              {metrics.resolvedCount}
            </span>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              {metrics.totalIncidents > 0
                ? `${((metrics.resolvedCount / metrics.totalIncidents) * 100).toFixed(1)}%`
                : '0%'}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-emerald-400/90 group-hover:underline">Xem hồ sơ đã đóng →</p>
        </button>

        {/* 6. Số vụ đang xử lý */}
        <button
          type="button"
          onClick={() =>
            onOpenDrilldown({
              title: 'Vụ việc đang mở & điều phối',
              subtitle: 'Bao gồm Mới tiếp nhận, Đang xác minh, Đã phân công, Đang xử lý và Chờ xác nhận',
              kind: 'incidents',
              incidents: filteredIncidents.filter((i) => !isResolvedStatus(i.status)),
            })
          }
          className="text-left bg-[#101a2d] hover:bg-[#142139] border border-slate-800/90 hover:border-blue-500/50 rounded-lg p-4 transition-colors group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Số vụ đang xử lý</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold font-mono tabular-nums text-blue-400">
              {metrics.inProgressCount}
            </span>
            <span className="text-[11px] text-slate-400">Đang điều phối</span>
          </div>
          <p className="mt-2 text-[11px] text-blue-400 group-hover:underline">Theo dõi tiến độ xử lý →</p>
        </button>

        {/* 7. Cảnh báo chưa xác minh */}
        <button
          type="button"
          onClick={() =>
            onOpenDrilldown({
              title: 'Cảnh báo chưa xác minh',
              subtitle: 'Tín hiệu bất thường từ cảm biến / camera / tuần tra chưa lập hồ sơ vụ việc',
              kind: 'alerts',
              alerts: unverifiedAlerts,
            })
          }
          className="text-left bg-[#101a2d] hover:bg-[#142139] border border-slate-800/90 hover:border-amber-500/50 rounded-lg p-4 transition-colors group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cảnh báo chưa xác minh</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold font-mono tabular-nums text-amber-400">
              {metrics.unverifiedAlertsCount}
            </span>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              / {metrics.totalAlertsInScope} cảnh báo
            </span>
          </div>
          <p className="mt-2 text-[11px] text-amber-300/90 group-hover:underline">Xử lý hàng đợi cảnh báo →</p>
        </button>

        {/* 8. Tỷ lệ xử lý đúng hạn */}
        <button
          type="button"
          onClick={() =>
            onOpenDrilldown({
              title: 'Hồ sơ đánh giá SLA xử lý đúng hạn',
              subtitle: `Đúng hạn: ${metrics.onTimeCount}/${metrics.evaluatedSlaCount} hồ sơ đã đóng · Trung bình ${metrics.avgResolutionMinutes} phút`,
              kind: 'incidents',
              incidents: filteredIncidents.filter((i) => isResolvedStatus(i.status)),
            })
          }
          className="text-left bg-[#101a2d] hover:bg-[#142139] border border-slate-800/90 hover:border-emerald-500/50 rounded-lg p-4 transition-colors group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tỷ lệ xử lý đúng hạn</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold font-mono tabular-nums text-slate-100">
              {metrics.evaluatedSlaCount > 0 ? `${metrics.onTimeRate}%` : '—'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              {metrics.evaluatedSlaCount > 0 ? `TB ${metrics.avgResolutionMinutes} phút` : 'Chưa có SLA'}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 font-mono tabular-nums">
            {metrics.evaluatedSlaCount > 0
              ? `Đạt SLA: ${metrics.onTimeCount}/${metrics.evaluatedSlaCount} hồ sơ`
              : 'Chưa có hồ sơ đóng trong kỳ'}
          </p>
        </button>
      </section>

      {/* Active cross-filter hint */}
      {(filters.zoneId !== 'ALL' ||
        filters.categoryId !== 'ALL' ||
        filters.severity !== 'ALL' ||
        filters.status !== 'ALL') && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-blue-950/40 border border-blue-800/60 rounded-md text-xs text-blue-200">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Bộ lọc đang áp dụng:</span>
            {filters.zoneId !== 'ALL' && (
              <span className="font-medium text-white">Khu vực: {zoneName(filters.zoneId)}</span>
            )}
            {filters.categoryId !== 'ALL' && (
              <span className="font-medium text-white">· Nhóm: {catName(filters.categoryId)}</span>
            )}
            {filters.severity !== 'ALL' && (
              <span className="font-medium text-white">· Mức độ: {filters.severity}</span>
            )}
            {filters.status !== 'ALL' && (
              <span className="font-medium text-white">· Trạng thái: {filters.status}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className="text-blue-300 hover:text-white underline shrink-0"
          >
            Xóa lọc nhanh
          </button>
        </div>
      )}

      {/* 6 Required Interactive Charts (3 rows x 2 cols on desktop) */}
      <section aria-label="Biểu đồ phân tích trực quan" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Biểu đồ đường số vụ việc tăng giảm theo ngày/tuần/tháng */}
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Xu hướng tăng giảm vụ việc (
                {trendGranularity === 'day' ? 'Ngày' : trendGranularity === 'week' ? 'Tuần' : 'Tháng'}
                )
              </h2>
              <p className="text-xs text-slate-400">
                Biến động: {formatDeltaLabel(metrics)} · Bấm vào điểm dữ liệu để xem vụ việc
              </p>
            </div>
            <div className="inline-flex items-center p-0.5 bg-[#09111f] border border-slate-800 rounded text-[11px]">
              {(
                [
                  { id: 'day', label: 'Ngày' },
                  { id: 'week', label: 'Tuần' },
                  { id: 'month', label: 'Tháng' },
                ] as Array<{ id: AnalyticsGranularity; label: string }>
              ).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setTrendGranularity(g.id)}
                  className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                    trendGranularity === g.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timeSeries}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                onClick={(state) => {
                  const idx =
                    typeof state?.activeTooltipIndex === 'number' ? state.activeTooltipIndex : -1;
                  const pt = idx >= 0 ? timeSeries[idx] : undefined;
                  if (!pt) return;
                  const bucketIncidents = incidents.filter((inc) => {
                    const d = inc.reportedAt.slice(0, 10);
                    return d >= pt.startDate && d <= pt.endDate && matchesNonDateFilters(inc, filters);
                  });
                  onOpenDrilldown({
                    title: `Vụ việc phát sinh kỳ ${pt.label}`,
                    subtitle: `Biến động: ${pt.deltaText}`,
                    kind: 'incidents',
                    incidents: bucketIncidents,
                    applyFilterLabel: 'Lọc theo kỳ này',
                    onApplyFilter: () =>
                      onChangeFilter({
                        timeRange: 'custom',
                        customStartDate: pt.startDate,
                        customEndDate: pt.endDate,
                      }),
                  });
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
                <Line
                  type="monotone"
                  dataKey="current"
                  name="Kỳ hiện tại"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#3B82F6', cursor: 'pointer' }}
                  activeDot={{ r: 6, cursor: 'pointer' }}
                />
                <Line
                  type="monotone"
                  dataKey="previous"
                  name="Kỳ trước"
                  stroke="#64748B"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Biểu đồ cột so sánh kỳ hiện tại và kỳ trước */}
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                So sánh kỳ hiện tại và kỳ trước theo mức độ
              </h2>
              <p className="text-xs text-slate-400">
                Bấm vào cột mức độ để xem danh sách vụ việc tương ứng
              </p>
            </div>
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
                    const sev = clicked.severity as IncidentSeverity;
                    onOpenDrilldown({
                      title: `Hồ sơ mức độ "${sev}"`,
                      subtitle: `Kỳ này: ${clicked.current} vụ · Kỳ trước: ${clicked.previous} vụ (${clicked.deltaText})`,
                      kind: 'incidents',
                      incidents: filteredIncidents.filter((i) => i.severity === sev),
                      applyFilterLabel: filters.severity === sev ? 'Bỏ lọc mức độ' : 'Lọc theo mức độ này',
                      onApplyFilter: () =>
                        onChangeFilter({
                          severity: filters.severity === sev ? 'ALL' : sev,
                        }),
                    });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="severity" stroke="#64748b" tick={{ fontSize: 11 }} />
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
        </div>

        {/* Chart 3: Biểu đồ cơ cấu vụ việc theo nhóm */}
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Cơ cấu vụ việc theo 10 nhóm nghiệp vụ
              </h2>
              <p className="text-xs text-slate-400">
                Bấm vào biểu đồ để xem danh sách hồ sơ hoặc chọn nhóm bên cạnh để lọc
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
            <div className="sm:col-span-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown.filter((c) => c.count > 0)}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={78}
                    paddingAngle={2}
                    onClick={(_entry, index) => {
                      const nonEmpty = categoryBreakdown.filter((c) => c.count > 0);
                      const clicked = nonEmpty[index];
                      if (clicked?.categoryId) {
                        onOpenDrilldown({
                          title: `Nhóm vụ việc: ${clicked.name}`,
                          subtitle: `${clicked.count} hồ sơ trong kỳ (${clicked.deltaText})`,
                          kind: 'incidents',
                          incidents: filteredIncidents.filter(
                            (i) => i.categoryId === clicked.categoryId
                          ),
                          applyFilterLabel:
                            filters.categoryId === clicked.categoryId
                              ? 'Bỏ lọc nhóm này'
                              : 'Lọc theo nhóm này',
                          onApplyFilter: () =>
                            onChangeFilter({
                              categoryId:
                                filters.categoryId === clicked.categoryId ? 'ALL' : clicked.categoryId,
                            }),
                        });
                      }
                    }}
                  >
                    {categoryBreakdown
                      .filter((c) => c.count > 0)
                      .map((entry, idx) => (
                        <Cell
                          key={entry.categoryId}
                          fill={PIE_PALETTE[idx % PIE_PALETTE.length]}
                          cursor="pointer"
                          opacity={
                            filters.categoryId === 'ALL' || filters.categoryId === entry.categoryId
                              ? 1
                              : 0.35
                          }
                        />
                      ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="sm:col-span-3 space-y-1 max-h-56 overflow-y-auto pr-1">
              {categoryBreakdown.map((cat, idx) => {
                const isSelected = filters.categoryId === cat.categoryId;
                return (
                  <button
                    key={cat.categoryId}
                    type="button"
                    onClick={() =>
                      onChangeFilter({
                        categoryId: isSelected ? 'ALL' : cat.categoryId,
                      })
                    }
                    className={`w-full flex items-center justify-between gap-2 px-2 py-1 rounded text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-200 border border-blue-500/40'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: PIE_PALETTE[idx % PIE_PALETTE.length] }}
                      />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="font-mono tabular-nums text-slate-200 font-medium shrink-0">
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 4: Biểu đồ số vụ theo mức độ nghiêm trọng */}
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Phân bổ vụ việc theo mức độ nghiêm trọng
              </h2>
              <p className="text-xs text-slate-400">
                Bấm vào cột mức độ để xem danh sách vụ việc tương ứng
              </p>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={periodCompSeverity}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                onClick={(state) => {
                  const idx =
                    typeof state?.activeTooltipIndex === 'number' ? state.activeTooltipIndex : -1;
                  const clicked = idx >= 0 ? periodCompSeverity[idx] : undefined;
                  if (clicked) {
                    const sev = clicked.severity as IncidentSeverity;
                    onOpenDrilldown({
                      title: `Hồ sơ mức độ "${sev}"`,
                      subtitle: `${clicked.current} hồ sơ trong kỳ (${clicked.deltaText})`,
                      kind: 'incidents',
                      incidents: filteredIncidents.filter((i) => i.severity === sev),
                      applyFilterLabel: filters.severity === sev ? 'Bỏ lọc mức độ' : 'Lọc theo mức độ này',
                      onApplyFilter: () =>
                        onChangeFilter({
                          severity: filters.severity === sev ? 'ALL' : sev,
                        }),
                    });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="severity" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="current" name="Số vụ việc" radius={[4, 4, 0, 0]} cursor="pointer">
                  {periodCompSeverity.map((entry) => (
                    <Cell
                      key={entry.severity}
                      fill={SEVERITY_COLORS[entry.severity]}
                      opacity={
                        filters.severity === 'ALL' || filters.severity === entry.severity ? 1 : 0.35
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Biểu đồ số vụ theo khu vực */}
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Số vụ việc theo khu vực bảo vệ
              </h2>
              <p className="text-xs text-slate-400">
                Bấm vào khu vực để xem danh sách hồ sơ tại điểm nóng
              </p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={zoneBreakdown}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 10, bottom: 0 }}
                onClick={(state) => {
                  const idx =
                    typeof state?.activeTooltipIndex === 'number' ? state.activeTooltipIndex : -1;
                  const clicked =
                    (idx >= 0 ? zoneBreakdown[idx] : undefined) ??
                    zoneBreakdown.find((z) => z.shortName === String(state?.activeLabel ?? ''));
                  if (clicked?.zoneId) {
                    onOpenDrilldown({
                      title: `Khu vực: ${clicked.name}`,
                      subtitle: `${clicked.count} hồ sơ · ${clicked.seriousCount} Nghiêm trọng/Khẩn cấp (${clicked.deltaText})`,
                      kind: 'incidents',
                      incidents: filteredIncidents.filter((i) => i.zoneId === clicked.zoneId),
                      applyFilterLabel:
                        filters.zoneId === clicked.zoneId ? 'Bỏ lọc khu vực' : 'Lọc theo khu vực này',
                      onApplyFilter: () =>
                        onChangeFilter({
                          zoneId: filters.zoneId === clicked.zoneId ? 'ALL' : clicked.zoneId,
                        }),
                    });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" allowDecimals={false} stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  width={150}
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="count" name="Tổng vụ việc" fill="#3B82F6" radius={[0, 4, 4, 0]} cursor="pointer" />
                <Bar dataKey="seriousCount" name="Nghiêm trọng & Khẩn cấp" fill="#EF4444" radius={[0, 4, 4, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Biểu đồ tình hình tiếp nhận và xử lý vụ việc */}
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Tình hình tiếp nhận và xử lý vụ việc
              </h2>
              <p className="text-xs text-slate-400">
                Bấm vào cột trạng thái để xem danh sách hồ sơ tương ứng
              </p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={handlingPipeline}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                onClick={(state) => {
                  const idx =
                    typeof state?.activeTooltipIndex === 'number' ? state.activeTooltipIndex : -1;
                  const clicked = idx >= 0 ? handlingPipeline[idx] : undefined;
                  if (clicked) {
                    const st = clicked.status as IncidentStatus;
                    onOpenDrilldown({
                      title: `Hồ sơ trạng thái "${st}"`,
                      subtitle: `Trong hạn SLA: ${clicked.onTime} · Quá hạn: ${clicked.overdue}`,
                      kind: 'incidents',
                      incidents: filteredIncidents.filter((i) => i.status === st),
                      applyFilterLabel:
                        filters.status === st ? 'Bỏ lọc trạng thái' : 'Lọc theo trạng thái này',
                      onApplyFilter: () =>
                        onChangeFilter({
                          status: filters.status === st ? 'ALL' : st,
                        }),
                    });
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="status"
                  stroke="#64748b"
                  interval={0}
                  tick={{ fontSize: 10 }}
                />
                <YAxis allowDecimals={false} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="onTime" stackId="a" name="Trong hạn SLA" fill="#22C55E" cursor="pointer" />
                <Bar dataKey="overdue" stackId="a" name="Quá hạn SLA" fill="#EF4444" radius={[4, 4, 0, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Top 5 khu vực phát sinh nhiều vụ việc */}
      <section className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Top 5 khu vực phát sinh nhiều vụ việc nhất
            </h2>
            <p className="text-xs text-slate-400">
              Bấm vào một dòng khu vực để lọc nhanh toàn bộ bảng điều hành
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Dữ liệu minh họa</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 pr-3 font-medium">Hạng</th>
                <th className="py-2.5 px-3 font-medium">Mã</th>
                <th className="py-2.5 px-3 font-medium">Tên khu vực</th>
                <th className="py-2.5 px-3 font-medium text-right">Quân số hiện diện</th>
                <th className="py-2.5 px-3 font-medium text-right">Tổng vụ việc</th>
                <th className="py-2.5 px-3 font-medium text-right">Nghiêm trọng / Khẩn cấp</th>
                <th className="py-2.5 px-3 font-medium text-right">Đã xử lý</th>
                <th className="py-2.5 pl-3 font-medium text-right">Tần suất / 1.000 người</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 tabular-nums">
              {top5Zones.map((z, idx) => {
                const active = filters.zoneId === z.zoneId;
                return (
                  <tr
                    key={z.zoneId}
                    onClick={() =>
                      onChangeFilter({ zoneId: active ? 'ALL' : z.zoneId })
                    }
                    className={`cursor-pointer transition-colors ${
                      active ? 'bg-blue-600/15' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 pr-3 font-mono text-slate-300">0{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono text-blue-300">{z.code}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-100">{z.name}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {z.occupancy.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-100">
                      {z.count}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-red-400 font-medium">
                      {z.seriousCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                      {z.resolvedCount}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-mono text-slate-200">
                      {z.ratePer1000}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom Operational Split: Latest Incidents + Alerts Queue */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Danh sách các vụ việc mới nhất */}
        <div className="xl:col-span-7 bg-[#101a2d] border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Danh sách vụ việc mới nhất ({filteredIncidents.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Hồ sơ đã được xác minh · Bấm vào dòng để xem chi tiết hoặc cập nhật trạng thái
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateModule('incidents')}
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                <span>Mở toàn bộ hồ sơ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 pr-2 font-medium">Mã hồ sơ</th>
                    <th className="py-2 px-2 font-medium">Nội dung vụ việc</th>
                    <th className="py-2 px-2 font-medium">Khu vực</th>
                    <th className="py-2 px-2 font-medium">Mức độ</th>
                    <th className="py-2 pl-2 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {pagedIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Không có vụ việc nào phù hợp với bộ lọc đang chọn.
                      </td>
                    </tr>
                  ) : (
                    pagedIncidents.map((inc) => (
                      <tr
                        key={inc.id}
                        onClick={() => onOpenIncidentModal(inc)}
                        className="cursor-pointer hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 pr-2 align-top">
                          <div className="font-mono font-semibold text-blue-300 whitespace-nowrap">
                            {inc.code}
                          </div>
                          <div className="mt-1">
                            <RecordTypeText type={inc.recordType} />
                          </div>
                        </td>
                        <td className="py-2.5 px-2 align-top max-w-xs">
                          <p className="font-medium text-slate-100 line-clamp-1">{inc.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono tabular-nums">
                            {formatDateTimeVi(inc.reportedAt)} · {inc.linkedAlertIds.length} cảnh báo gộp
                          </p>
                        </td>
                        <td className="py-2.5 px-2 align-top text-slate-300">
                          {zoneName(inc.zoneId)}
                        </td>
                        <td className="py-2.5 px-2 align-top">
                          <SeverityText severity={inc.severity} />
                        </td>
                        <td className="py-2.5 pl-2 align-top">
                          <IncidentStatusText status={inc.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationBar
            currentPage={safeIncPage}
            pageSize={pageSize}
            totalItems={filteredIncidents.length}
            onPageChange={setIncPage}
          />
        </div>

        {/* Cảnh báo cần xử lý */}
        <div className="xl:col-span-5 bg-[#101a2d] border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Cảnh báo cần xác minh ({unverifiedAlerts.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Chưa tính vào số lượng vụ việc cho tới khi trực ban xác minh
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateModule('forces')}
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                <span>Trung tâm cảnh báo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/70">
              {pagedAlerts.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Không còn cảnh báo chưa xác minh trong phạm vi lọc hiện tại.
                </div>
              ) : (
                pagedAlerts.map((alt) => (
                  <div key={alt.id} className="py-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-semibold text-amber-300 shrink-0">
                          {alt.code}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400 truncate">
                          {alt.source} ({alt.deviceId})
                        </span>
                      </div>
                      <SeverityText severity={alt.severity} />
                    </div>
                    <p className="text-xs font-medium text-slate-100">{alt.title}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                        {zoneName(alt.zoneId)} · {formatDateTimeVi(alt.detectedAt)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onVerifyAlertToIncident(alt)}
                          className="px-2 py-1 text-[11px] font-medium bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                        >
                          Lập vụ việc
                        </button>
                        <button
                          type="button"
                          onClick={() => onMarkAlertFalse(alt.id)}
                          className="px-2 py-1 text-[11px] font-medium bg-[#09111f] text-slate-300 border border-slate-700 rounded hover:bg-slate-800 transition-colors"
                        >
                          Báo động giả
                        </button>
                      </div>
                    </div>
                    <div className="hidden">
                      <AlertStatusText status={alt.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <PaginationBar
            currentPage={safeAlertPage}
            pageSize={pageSize}
            totalItems={unverifiedAlerts.length}
            onPageChange={setAlertPage}
          />
        </div>
      </section>
    </div>
  );
}

import { ArrowRight, Edit3, Eye, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  GlobalFilterState,
  IncidentCategory,
  IncidentStatus,
  SecurityEvent,
  SecurityIncident,
  SecurityStaff,
  SecurityZone,
} from '../../types/security';
import {
  STATUS_ORDER,
  filterIncidents,
  formatDateTimeVi,
  getResolutionMinutes,
  isIncidentOnTime,
} from '../../utils/analyticsEngine';
import { exportRowsToCsv } from '../../utils/csvExport';
import { FilterBar } from '../common/FilterBar';
import { PaginationBar } from '../common/PaginationBar';
import {
  IncidentStatusText,
  RecordTypeText,
  SeverityText,
} from '../common/SemanticLabel';

interface IncidentsModuleProps {
  events: SecurityEvent[];
  zones: SecurityZone[];
  categories: IncidentCategory[];
  incidents: SecurityIncident[];
  staff: SecurityStaff[];
  filters: GlobalFilterState;
  onChangeFilter: (patch: Partial<GlobalFilterState>) => void;
  onResetFilters: () => void;
  onOpenDetailModal: (inc: SecurityIncident) => void;
  onOpenEditModal: (inc: SecurityIncident | null) => void;
  onQuickStatusChange: (incidentId: string, status: IncidentStatus) => void;
}

export function IncidentsModule({
  events,
  zones,
  categories,
  incidents,
  staff,
  filters,
  onChangeFilter,
  onResetFilters,
  onOpenDetailModal,
  onOpenEditModal,
  onQuickStatusChange,
}: IncidentsModuleProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Base list without status filter to count workflow pipeline badges accurately
  const incidentsIgnoringStatus = useMemo(
    () => filterIncidents(incidents, { ...filters, status: 'ALL' }),
    [incidents, filters]
  );

  const filtered = useMemo(
    () => filterIncidents(incidents, filters),
    [incidents, filters]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id;
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const staffName = (id: string) => staff.find((s) => s.id === id)?.fullName ?? id;

  const handleExport = () => {
    exportRowsToCsv(
      'danh_sach_vu_viec_an_ninh.csv',
      [
        'Mã hồ sơ',
        'Loại',
        'Tiêu đề',
        'Khu vực',
        'Nhóm vụ việc',
        'Mức độ',
        'Trạng thái Workflow',
        'Thời gian phát hiện',
        'Nguồn thông tin',
        'Người tiếp nhận',
        'Người phụ trách',
        'Số bằng chứng',
        'Số cảnh báo gộp',
        'Kết quả xử lý',
      ],
      filtered.map((i) => [
        i.code,
        i.recordType,
        i.title,
        zoneName(i.zoneId),
        catName(i.categoryId),
        i.severity,
        i.status,
        formatDateTimeVi(i.detectedAt),
        i.source,
        i.receiverName,
        staffName(i.assignedStaffId),
        i.evidences.length,
        i.linkedAlertIds.length,
        i.resolutionNotes ?? '',
      ])
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
            Quản lý vụ việc & Sự cố an ninh
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Quy trình nghiệp vụ 6 bước (Mới tiếp nhận → Đang xác minh → Đã phân công → Đang xử lý → Chờ xác nhận → Đã đóng) ·{' '}
            <span className="text-blue-300 font-medium">Dữ liệu minh họa · Đồng bộ Dashboard</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenEditModal(null)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo hồ sơ vụ việc mới</span>
        </button>
      </div>

      {/* Interactive 6-Step Workflow Pipeline Bar */}
      <section aria-label="Tiến trình xử lý vụ việc 6 bước" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {STATUS_ORDER.map((stage, idx) => {
          const count = incidentsIgnoringStatus.filter((i) => i.status === stage).length;
          const active = filters.status === stage;
          return (
            <button
              key={stage}
              type="button"
              onClick={() => {
                setPage(1);
                onChangeFilter({ status: active ? 'ALL' : stage });
              }}
              className={`text-left p-3 rounded-lg border transition-colors ${
                active
                  ? 'bg-blue-600/20 border-blue-500 text-slate-100'
                  : 'bg-[#101a2d] border-slate-800/90 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Bước 0{idx + 1}</span>
                {idx < STATUS_ORDER.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600" />}
              </div>
              <div className="text-xs font-medium mt-1 truncate">{stage}</div>
              <div className="text-lg font-semibold font-mono tabular-nums text-slate-100 mt-1">
                {count}
              </div>
            </button>
          );
        })}
      </section>

      <FilterBar
        filters={filters}
        onChange={(p) => {
          setPage(1);
          onChangeFilter(p);
        }}
        onReset={() => {
          setPage(1);
          onResetFilters();
        }}
        onExportCsv={handleExport}
        events={events}
        zones={zones}
        categories={categories}
      />

      <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4 space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 pr-3 font-medium">Mã & Phân loại</th>
                <th className="py-2.5 px-3 font-medium">Tiêu đề & Nguồn tin</th>
                <th className="py-2.5 px-3 font-medium">Khu vực & Phát hiện</th>
                <th className="py-2.5 px-3 font-medium">Mức độ</th>
                <th className="py-2.5 px-3 font-medium">Trạng thái Workflow</th>
                <th className="py-2.5 px-3 font-medium">Tiếp nhận / Phụ trách</th>
                <th className="py-2.5 px-3 font-medium text-right">Bằng chứng</th>
                <th className="py-2.5 pl-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Không tìm thấy hồ sơ vụ việc nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                paged.map((inc) => {
                  const resMin = getResolutionMinutes(inc);
                  const onTime = isIncidentOnTime(inc);
                  const idx = STATUS_ORDER.indexOf(inc.status);
                  const nextStage =
                    idx >= 0 && idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;

                  return (
                    <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 pr-3 align-top">
                        <button
                          type="button"
                          onClick={() => onOpenDetailModal(inc)}
                          className="font-mono font-semibold text-blue-300 hover:underline whitespace-nowrap"
                        >
                          {inc.code}
                        </button>
                        <div className="mt-1">
                          <RecordTypeText type={inc.recordType} />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 align-top max-w-xs">
                        <button
                          type="button"
                          onClick={() => onOpenDetailModal(inc)}
                          className="text-left font-medium text-slate-100 hover:text-blue-300 transition-colors line-clamp-1"
                        >
                          {inc.title}
                        </button>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {catName(inc.categoryId)} · Nguồn: {inc.source}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <div className="text-slate-200">{zoneName(inc.zoneId)}</div>
                        <div className="text-[11px] font-mono tabular-nums text-slate-400 mt-0.5">
                          {formatDateTimeVi(inc.detectedAt)}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <SeverityText severity={inc.severity} />
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <div className="space-y-1">
                          <IncidentStatusText status={inc.status} />
                          <div className="flex items-center gap-1">
                            <select
                              aria-label={`Đổi trạng thái ${inc.code}`}
                              value={inc.status}
                              onChange={(e) =>
                                onQuickStatusChange(inc.id, e.target.value as IncidentStatus)
                              }
                              className="bg-[#09111f] border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500"
                            >
                              {STATUS_ORDER.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                            {nextStage && (
                              <button
                                type="button"
                                title={`Chuyển nhanh sang ${nextStage}`}
                                onClick={() => onQuickStatusChange(inc.id, nextStage)}
                                className="p-1 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/40"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <div className="text-slate-300 text-[11px]">TN: {inc.receiverName}</div>
                        <div className="text-slate-100 font-medium mt-0.5">
                          PT: {staffName(inc.assignedStaffId)}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 align-top text-right font-mono tabular-nums">
                        <div className="text-slate-200">{inc.evidences.length} file</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {resMin !== null ? (
                            <span className={onTime ? 'text-emerald-400' : 'text-red-400'}>
                              {resMin}p / {inc.slaMinutes}p
                            </span>
                          ) : (
                            <span>{inc.linkedAlertIds.length} cảnh báo</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 pl-3 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenDetailModal(inc)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600/15 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Chi tiết</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenEditModal(inc)}
                            aria-label={`Sửa hồ sơ ${inc.code}`}
                            className="p-1.5 rounded bg-[#09111f] text-slate-300 border border-slate-700 hover:bg-slate-800"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={safePage}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}

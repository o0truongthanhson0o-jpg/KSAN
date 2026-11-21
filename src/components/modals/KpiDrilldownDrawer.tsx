import { Download, ExternalLink, Filter, X } from 'lucide-react';
import {
  IncidentCategory,
  SecurityAlert,
  SecurityIncident,
  SecurityZone,
} from '../../types/security';
import { formatDateTimeVi } from '../../utils/analyticsEngine';
import { exportRowsToCsv } from '../../utils/csvExport';
import {
  AlertStatusText,
  IncidentStatusText,
  RecordTypeText,
  SeverityText,
} from '../common/SemanticLabel';

export interface DrilldownPayload {
  title: string;
  subtitle: string;
  kind: 'incidents' | 'alerts';
  incidents?: SecurityIncident[];
  alerts?: SecurityAlert[];
  applyFilterLabel?: string;
  onApplyFilter?: () => void;
}

interface KpiDrilldownDrawerProps {
  payload: DrilldownPayload | null;
  zones: SecurityZone[];
  categories: IncidentCategory[];
  onClose: () => void;
  onSelectIncident: (inc: SecurityIncident) => void;
  onVerifyAlertToNewIncident?: (alert: SecurityAlert) => void;
}

export function KpiDrilldownDrawer({
  payload,
  zones,
  categories,
  onClose,
  onSelectIncident,
  onVerifyAlertToNewIncident,
}: KpiDrilldownDrawerProps) {
  if (!payload) return null;

  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id;
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  const handleExport = () => {
    if (payload.kind === 'incidents' && payload.incidents) {
      exportRowsToCsv(
        'chi_tiet_vu_viec_phan_tich.csv',
        ['Mã hồ sơ', 'Loại', 'Tiêu đề', 'Khu vực', 'Nhóm', 'Mức độ', 'Trạng thái', 'Thời gian'],
        payload.incidents.map((i) => [
          i.code,
          i.recordType,
          i.title,
          zoneName(i.zoneId),
          catName(i.categoryId),
          i.severity,
          i.status,
          formatDateTimeVi(i.reportedAt),
        ])
      );
    } else if (payload.kind === 'alerts' && payload.alerts) {
      exportRowsToCsv(
        'chi_tiet_canh_bao_phan_tich.csv',
        ['Mã cảnh báo', 'Nguồn', 'Thiết bị', 'Tiêu đề', 'Khu vực', 'Mức độ', 'Trạng thái', 'Thời gian'],
        payload.alerts.map((a) => [
          a.code,
          a.source,
          a.deviceId,
          a.title,
          zoneName(a.zoneId),
          a.severity,
          a.status,
          formatDateTimeVi(a.detectedAt),
        ])
      );
    }
  };

  const count =
    payload.kind === 'incidents' ? payload.incidents?.length ?? 0 : payload.alerts?.length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl bg-[#0d1627] border-l border-slate-800 h-full flex flex-col shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-800">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-100">{payload.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {payload.subtitle} · <span className="font-mono tabular-nums text-blue-300">{count} bản ghi</span> · Dữ liệu minh họa
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {payload.onApplyFilter && (
              <button
                type="button"
                onClick={() => {
                  payload.onApplyFilter?.();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-500 whitespace-nowrap"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{payload.applyFilterLabel ?? 'Áp dụng bộ lọc'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 rounded-md hover:bg-slate-700 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng bảng chi tiết"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-800/80">
          {count === 0 && (
            <div className="py-12 text-center text-sm text-slate-400">
              Không có bản ghi nào thuộc điều kiện lọc hiện tại.
            </div>
          )}

          {payload.kind === 'incidents' &&
            payload.incidents?.map((inc) => (
              <div
                key={inc.id}
                className="py-3 flex items-start justify-between gap-4 hover:bg-slate-800/30 px-2 rounded transition-colors"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-blue-300">{inc.code}</span>
                    <RecordTypeText type={inc.recordType} />
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 font-mono tabular-nums">{formatDateTimeVi(inc.reportedAt)}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-100">{inc.title}</p>
                  <p className="text-xs text-slate-400">
                    {zoneName(inc.zoneId)} · {catName(inc.categoryId)} · {inc.linkedAlertIds.length} cảnh báo liên kết
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <SeverityText severity={inc.severity} />
                  <IncidentStatusText status={inc.status} />
                  <button
                    type="button"
                    onClick={() => onSelectIncident(inc)}
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    <span>Chi tiết</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

          {payload.kind === 'alerts' &&
            payload.alerts?.map((alt) => (
              <div
                key={alt.id}
                className="py-3 flex items-start justify-between gap-4 hover:bg-slate-800/30 px-2 rounded transition-colors"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-amber-300">{alt.code}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400">{alt.source} ({alt.deviceId})</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 font-mono tabular-nums">{formatDateTimeVi(alt.detectedAt)}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-100">{alt.title}</p>
                  <p className="text-xs text-slate-400">{zoneName(alt.zoneId)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <SeverityText severity={alt.severity} />
                  <AlertStatusText status={alt.status} />
                  {alt.status === 'Chưa xác minh' && onVerifyAlertToNewIncident && (
                    <button
                      type="button"
                      onClick={() => onVerifyAlertToNewIncident(alt)}
                      className="px-2.5 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-500"
                    >
                      Xác minh & Lập hồ sơ
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

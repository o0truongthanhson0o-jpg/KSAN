import { Link2, Radio, Route, ShieldAlert, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  AlertStatus,
  PatrolRoute,
  SecurityAlert,
  SecurityIncident,
  SecurityStaff,
  SecurityZone,
  StaffStatus,
} from '../../types/security';
import { formatDateTimeVi } from '../../utils/analyticsEngine';
import { PaginationBar } from '../common/PaginationBar';
import { AlertStatusText, SeverityText } from '../common/SemanticLabel';

interface ForcesAlertsModuleProps {
  staff: SecurityStaff[];
  patrolRoutes: PatrolRoute[];
  alerts: SecurityAlert[];
  incidents: SecurityIncident[];
  zones: SecurityZone[];
  selectedEventId: string;
  onUpdateStaffAssignment: (staffId: string, zoneId: string, status: StaffStatus) => void;
  onVerifyAlertToIncident: (alert: SecurityAlert) => void;
  onLinkAlertToExistingIncident: (alertId: string, incidentId: string) => void;
  onMarkAlertFalse: (alertId: string) => void;
  onOpenIncidentModal: (inc: SecurityIncident) => void;
}

export function ForcesAlertsModule({
  staff,
  patrolRoutes,
  alerts,
  incidents,
  zones,
  selectedEventId,
  onUpdateStaffAssignment,
  onVerifyAlertToIncident,
  onLinkAlertToExistingIncident,
  onMarkAlertFalse,
  onOpenIncidentModal,
}: ForcesAlertsModuleProps) {
  const [activeTab, setActiveTab] = useState<'alerts' | 'forces' | 'patrol'>('alerts');
  const [alertStatusFilter, setAlertStatusFilter] = useState<'ALL' | AlertStatus>('Chưa xác minh');
  const [alertSearch, setAlertSearch] = useState('');
  const [alertPage, setAlertPage] = useState(1);

  const [staffUnitFilter, setStaffUnitFilter] = useState('ALL');
  const [staffPage, setStaffPage] = useState(1);

  const [linkingAlertId, setLinkingAlertId] = useState<string | null>(null);
  const [selectedExistingIncId, setSelectedExistingIncId] = useState<string>(incidents[0]?.id ?? '');

  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id;
  const staffName = (id: string) => staff.find((s) => s.id === id)?.fullName ?? id;

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (selectedEventId !== 'ALL' && a.eventId !== selectedEventId) return false;
      if (alertStatusFilter !== 'ALL' && a.status !== alertStatusFilter) return false;
      if (alertSearch.trim()) {
        const q = alertSearch.trim().toLowerCase();
        return (
          a.code.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.deviceId.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [alerts, selectedEventId, alertStatusFilter, alertSearch]);

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      if (staffUnitFilter !== 'ALL' && s.unit !== staffUnitFilter) return false;
      return true;
    });
  }, [staff, staffUnitFilter]);

  const pageSize = 10;
  const alertTotalPages = Math.max(1, Math.ceil(filteredAlerts.length / pageSize));
  const safeAlertPage = Math.min(alertPage, alertTotalPages);
  const staffTotalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const safeStaffPage = Math.min(staffPage, staffTotalPages);
  const pagedAlerts = filteredAlerts.slice(
    (safeAlertPage - 1) * pageSize,
    safeAlertPage * pageSize
  );
  const pagedStaff = filteredStaff.slice(
    (safeStaffPage - 1) * pageSize,
    safeStaffPage * pageSize
  );

  const unverifiedTotal = alerts.filter(
    (a) => (selectedEventId === 'ALL' || a.eventId === selectedEventId) && a.status === 'Chưa xác minh'
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
            Điều hành lực lượng, Tuần tra & Trung tâm cảnh báo
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Xác minh cảnh báo cảm biến (gộp nhiều cảnh báo vào 1 hồ sơ vụ việc) và điều phối quân số hiện trường ·{' '}
            <span className="text-blue-300 font-medium">Dữ liệu minh họa</span>
          </p>
        </div>

        {/* Tab selector */}
        <div className="inline-flex items-center p-0.5 bg-[#101a2d] border border-slate-800 rounded-md">
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'alerts' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Cảnh báo ({unverifiedTotal} chờ)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('forces')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'forces' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Lực lượng ({staff.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('patrol')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'patrol' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>Tuyến tuần tra ({patrolRoutes.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ALERT VERIFICATION CENTER */}
      {activeTab === 'alerts' && (
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              type="text"
              value={alertSearch}
              onChange={(e) => {
                setAlertSearch(e.target.value);
                setAlertPage(1);
              }}
              placeholder="Tìm mã cảnh báo, mã thiết bị, nội dung..."
              className="flex-1 min-w-[240px] max-w-md bg-[#09111f] border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
            <div className="inline-flex items-center p-0.5 bg-[#09111f] border border-slate-800 rounded-md">
              {(['Chưa xác minh', 'Đã xác minh', 'Báo động giả', 'ALL'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setAlertStatusFilter(st);
                    setAlertPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    alertStatusFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'Tất cả' : st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 pr-3 font-medium">Mã & Thiết bị</th>
                  <th className="py-2.5 px-3 font-medium">Nội dung tín hiệu cảnh báo</th>
                  <th className="py-2.5 px-3 font-medium">Khu vực</th>
                  <th className="py-2.5 px-3 font-medium">Mức độ</th>
                  <th className="py-2.5 px-3 font-medium">Trạng thái</th>
                  <th className="py-2.5 pl-3 font-medium text-right">Xử lý nghiệp vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {pagedAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Không có cảnh báo nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  pagedAlerts.map((alt) => {
                  const linkedInc = alt.linkedIncidentId
                    ? incidents.find((i) => i.id === alt.linkedIncidentId)
                    : undefined;

                  return (
                    <tr key={alt.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 pr-3 align-top font-mono">
                        <div className="font-semibold text-amber-300">{alt.code}</div>
                        <div className="text-[11px] text-slate-400">{alt.deviceId}</div>
                      </td>
                      <td className="py-2.5 px-3 align-top max-w-md">
                        <div className="font-medium text-slate-100">{alt.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {alt.source} · {formatDateTimeVi(alt.detectedAt)}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 align-top text-slate-300">
                        {zoneName(alt.zoneId)}
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <SeverityText severity={alt.severity} />
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <AlertStatusText status={alt.status} />
                        {linkedInc && (
                          <button
                            type="button"
                            onClick={() => onOpenIncidentModal(linkedInc)}
                            className="block mt-1 text-[11px] font-mono text-blue-400 hover:underline"
                          >
                            Hồ sơ: {linkedInc.code}
                          </button>
                        )}
                      </td>
                      <td className="py-2.5 pl-3 align-top text-right">
                        {alt.status === 'Chưa xác minh' ? (
                          <div className="inline-flex flex-wrap justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onVerifyAlertToIncident(alt)}
                              className="px-2.5 py-1 text-[11px] font-medium bg-blue-600 text-white rounded hover:bg-blue-500 whitespace-nowrap"
                            >
                              Lập vụ việc mới
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const nextOpen = linkingAlertId === alt.id ? null : alt.id;
                                setLinkingAlertId(nextOpen);
                                if (nextOpen) {
                                  const sameEventInc =
                                    incidents.find((i) => i.eventId === alt.eventId && i.status !== 'Đã đóng') ??
                                    incidents.find((i) => i.eventId === alt.eventId) ??
                                    incidents[0];
                                  if (sameEventInc) {
                                    setSelectedExistingIncId(sameEventInc.id);
                                  }
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700 rounded hover:bg-slate-700 whitespace-nowrap"
                            >
                              <Link2 className="w-3 h-3" />
                              <span>Gộp hồ sơ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onMarkAlertFalse(alt.id)}
                              className="px-2 py-1 text-[11px] font-medium bg-[#09111f] text-slate-300 border border-slate-700 rounded hover:bg-slate-800 whitespace-nowrap"
                            >
                              Báo động giả
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            {alt.verifiedBy ?? 'Đã xử lý'}
                          </span>
                        )}

                        {linkingAlertId === alt.id && (
                          <div className="mt-2 flex items-center justify-end gap-1.5">
                            <select
                              value={selectedExistingIncId}
                              onChange={(e) => setSelectedExistingIncId(e.target.value)}
                              className="max-w-[220px] bg-[#09111f] border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200"
                            >
                              {[
                                ...incidents.filter((i) => i.eventId === alt.eventId),
                                ...incidents.filter((i) => i.eventId !== alt.eventId),
                              ]
                                .slice(0, 25)
                                .map((inc) => (
                                  <option key={inc.id} value={inc.id}>
                                    {inc.code} — {inc.title.slice(0, 28)}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedExistingIncId) {
                                  onLinkAlertToExistingIncident(alt.id, selectedExistingIncId);
                                  setLinkingAlertId(null);
                                }
                              }}
                              className="px-2 py-1 text-[11px] bg-emerald-600 text-white rounded hover:bg-emerald-500"
                            >
                              Xác nhận gộp
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            currentPage={safeAlertPage}
            pageSize={pageSize}
            totalItems={filteredAlerts.length}
            onPageChange={setAlertPage}
          />
        </div>
      )}

      {/* TAB 2: SECURITY FORCES DISPATCH */}
      {activeTab === 'forces' && (
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Danh sách lực lượng trực chiến & Điều phối vị trí ({filteredStaff.length} cán bộ)
            </h2>
            <select
              value={staffUnitFilter}
              onChange={(e) => {
                setStaffUnitFilter(e.target.value);
                setStaffPage(1);
              }}
              className="bg-[#09111f] border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">Tất cả các tổ đội</option>
              <option value="Phản ứng nhanh">Phản ứng nhanh</option>
              <option value="Kiểm soát cổng">Kiểm soát cổng</option>
              <option value="Giám sát CCTV">Giám sát CCTV</option>
              <option value="Bảo vệ VIP">Bảo vệ VIP</option>
              <option value="Tuần tra khu vực">Tuần tra khu vực</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 pr-3 font-medium">Mã / Kênh bộ đàm</th>
                  <th className="py-2.5 px-3 font-medium">Họ tên & Cấp bậc</th>
                  <th className="py-2.5 px-3 font-medium">Đơn vị / Ca trực</th>
                  <th className="py-2.5 px-3 font-medium">Khu vực phân công</th>
                  <th className="py-2.5 pl-3 font-medium">Trạng thái điều hành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {pagedStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      Không có cán bộ nào thuộc đơn vị đang chọn.
                    </td>
                  </tr>
                ) : (
                  pagedStaff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 pr-3 font-mono">
                      <div className="text-blue-300 font-semibold">{s.code}</div>
                      <div className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Radio className="w-3 h-3" />
                        <span>{s.radioChannel}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-100">{s.fullName}</div>
                      <div className="text-[11px] text-slate-400">
                        {s.rank} · {s.phone}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-slate-200">{s.unit}</div>
                      <div className="text-[11px] text-slate-400">{s.shift}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={s.assignedZoneId}
                        onChange={(e) => onUpdateStaffAssignment(s.id, e.target.value, s.status)}
                        className="bg-[#09111f] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                      >
                        {zones.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.code} — {z.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 pl-3">
                      <select
                        value={s.status}
                        onChange={(e) =>
                          onUpdateStaffAssignment(s.id, s.assignedZoneId, e.target.value as StaffStatus)
                        }
                        className={`bg-[#09111f] border rounded px-2 py-1 text-xs font-medium ${
                          s.status === 'Ứng phó sự cố'
                            ? 'border-red-500/50 text-red-300'
                            : s.status === 'Đang tuần tra'
                            ? 'border-blue-500/50 text-blue-300'
                            : s.status === 'Đang trực'
                            ? 'border-emerald-500/50 text-emerald-300'
                            : 'border-slate-700 text-slate-400'
                        }`}
                      >
                        <option value="Đang trực">Đang trực</option>
                        <option value="Đang tuần tra">Đang tuần tra</option>
                        <option value="Ứng phó sự cố">Ứng phó sự cố</option>
                        <option value="Nghỉ ca">Nghỉ ca</option>
                      </select>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            currentPage={safeStaffPage}
            pageSize={pageSize}
            totalItems={filteredStaff.length}
            onPageChange={setStaffPage}
          />
        </div>
      )}

      {/* TAB 3: PATROL ROUTES */}
      {activeTab === 'patrol' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patrolRoutes.map((rt) => (
            <div
              key={rt.id}
              className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs text-blue-300 font-semibold">{rt.code}</span>
                  <h3 className="text-sm font-semibold text-slate-100 mt-0.5">{rt.name}</h3>
                </div>
                <span
                  className={`text-xs font-medium ${
                    rt.status === 'Đúng lịch'
                      ? 'text-emerald-400'
                      : rt.status === 'Chậm checkpoint'
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {rt.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <p>
                  Khu vực đi qua:{' '}
                  <span className="text-slate-200">
                    {rt.zoneIds.map((zid) => zoneName(zid)).join(' → ')}
                  </span>
                </p>
                <p>
                  Phụ trách tuần tra: <span className="text-slate-200">{staffName(rt.assignedStaffId)}</span>
                </p>
                <p className="font-mono tabular-nums">
                  Chu kỳ: {rt.intervalMinutes} phút · Checkpoint cuối: {formatDateTimeVi(rt.lastCheckpointAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

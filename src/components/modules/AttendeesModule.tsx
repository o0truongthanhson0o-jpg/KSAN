import { Download, Plus, QrCode, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Attendee,
  AttendeeCheckInStatus,
  AttendeeRole,
  SecurityEvent,
  SecurityZone,
} from '../../types/security';
import { formatDateTimeVi } from '../../utils/analyticsEngine';
import { exportRowsToCsv } from '../../utils/csvExport';
import { PaginationBar } from '../common/PaginationBar';
import {
  ATTENDEE_ROLES,
  QrPassModal,
  RegistrationFormModal,
} from '../modals/RegistrationModal';

interface AttendeesModuleProps {
  attendees: Attendee[];
  events: SecurityEvent[];
  zones: SecurityZone[];
  selectedEventId: string;
  onUpdateAttendeeStatus: (attendeeId: string, status: AttendeeCheckInStatus) => void;
  onCreateRegistration: (attendee: Attendee) => void;
  onApproveRegistration: (attendeeId: string) => void;
  onRejectRegistration: (attendeeId: string) => void;
  onIssueQr: (attendeeId: string) => void;
  onRevokeQr: (attendeeId: string) => void;
}

export function AttendeesModule({
  attendees,
  events,
  zones,
  selectedEventId,
  onUpdateAttendeeStatus,
  onCreateRegistration,
  onApproveRegistration,
  onRejectRegistration,
  onIssueQr,
  onRevokeQr,
}: AttendeesModuleProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | AttendeeRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AttendeeCheckInStatus>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailAttendeeId, setDetailAttendeeId] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const filtered = useMemo(() => {
    return attendees.filter((a) => {
      if (selectedEventId !== 'ALL' && a.eventId !== selectedEventId) return false;
      if (roleFilter !== 'ALL' && a.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && a.checkInStatus !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          a.code.toLowerCase().includes(q) ||
          a.fullName.toLowerCase().includes(q) ||
          a.organization.toLowerCase().includes(q) ||
          a.badgeNumber.toLowerCase().includes(q) ||
          (a.vehiclePlate ?? '').toLowerCase().includes(q) ||
          (a.qrCode ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [attendees, selectedEventId, roleFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const eventName = (id: string) => events.find((e) => e.id === id)?.code ?? id;
  const zoneName = (id?: string) =>
    id ? zones.find((z) => z.id === id)?.name ?? id : 'Chưa ghi nhận';

  const handleExport = () => {
    exportRowsToCsv(
      'danh_sach_doi_tuong_va_phuong_tien.csv',
      [
        'Mã hồ sơ',
        'Số thẻ',
        'Họ tên / Biển số',
        'Đơn vị',
        'Nhóm đối tượng',
        'Sự kiện',
        'Trạng thái duyệt',
        'Mã QR Demo',
        'Trạng thái QR',
        'Hiện diện',
        'Khu vực gần nhất',
      ],
      filtered.map((a) => [
        a.code,
        a.badgeNumber,
        a.fullName,
        a.organization,
        a.role,
        eventName(a.eventId),
        a.registrationStatus,
        a.qrCode ?? 'Chưa cấp',
        a.qrStatus,
        a.checkInStatus,
        zoneName(a.lastSeenZoneId),
      ])
    );
  };

  const checkedInCount = filtered.filter((a) => a.checkInStatus === 'Đã check-in').length;
  const vehiclesAndContractors = filtered.filter(
    (a) => a.role === 'Phương tiện' || a.role === 'Nhà thầu'
  ).length;
  const flaggedCount = filtered.filter((a) => a.checkInStatus === 'Cần kiểm tra').length;

  const detailAttendee = detailAttendeeId
    ? attendees.find((a) => a.id === detailAttendeeId) ?? null
    : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
            Quản lý đối tượng tham dự & Phương tiện
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Khách, Đại biểu, VIP, Nhân viên, Báo chí, Nhà thầu và Phương tiện ({filtered.length} hồ sơ) ·{' '}
            <span className="text-blue-300 font-medium">Dữ liệu mô phỏng</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRegisterModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Đăng ký đối tượng / xe</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-[#101a2d] border border-slate-700 rounded-md hover:bg-slate-800 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-3.5">
          <span className="text-slate-400">Tổng hồ sơ trong phạm vi</span>
          <p className="text-xl font-semibold font-mono tabular-nums text-slate-100 mt-1">
            {filtered.length}
          </p>
        </div>
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-3.5">
          <span className="text-slate-400">Đã check-in hiện diện</span>
          <p className="text-xl font-semibold font-mono tabular-nums text-emerald-400 mt-1">
            {checkedInCount}
          </p>
        </div>
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-3.5">
          <span className="text-slate-400">Nhà thầu & Phương tiện</span>
          <p className="text-xl font-semibold font-mono tabular-nums text-blue-400 mt-1">
            {vehiclesAndContractors}
          </p>
        </div>
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-3.5">
          <span className="text-slate-400">Cảnh báo cần kiểm tra</span>
          <p className="text-xl font-semibold font-mono tabular-nums text-amber-400 mt-1">
            {flaggedCount}
          </p>
        </div>
      </div>

      {/* Filter & Table */}
      <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm mã hồ sơ, số thẻ, họ tên, biển số xe, mã QR..."
              className="w-full bg-[#09111f] border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as 'ALL' | AttendeeRole);
              setPage(1);
            }}
            className="bg-[#09111f] border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Mọi nhóm (7 phân loại)</option>
            {ATTENDEE_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'ALL' | AttendeeCheckInStatus);
              setPage(1);
            }}
            className="bg-[#09111f] border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Mọi trạng thái hiện diện</option>
            <option value="Đã check-in">Đã check-in</option>
            <option value="Chưa đến">Chưa đến</option>
            <option value="Đã rời khỏi">Đã rời khỏi</option>
            <option value="Cần kiểm tra">Cần kiểm tra</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 pr-3 font-medium">Mã / Số thẻ</th>
                <th className="py-2.5 px-3 font-medium">Họ tên / Biển số xe</th>
                <th className="py-2.5 px-3 font-medium">Đơn vị</th>
                <th className="py-2.5 px-3 font-medium">Phân nhóm</th>
                <th className="py-2.5 px-3 font-medium">Duyệt & QR Demo</th>
                <th className="py-2.5 px-3 font-medium">Hiện diện</th>
                <th className="py-2.5 pl-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Không tìm thấy đối tượng hoặc phương tiện nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                paged.map((att) => (
                <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 pr-3 font-mono tabular-nums">
                    <div className="text-blue-300 font-semibold">{att.code}</div>
                    <div className="text-[11px] text-slate-400">{att.badgeNumber}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-100">{att.fullName}</div>
                    {att.vehicleType && (
                      <div className="text-[11px] text-slate-400">{att.vehicleType}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{att.organization}</td>
                  <td className="py-2.5 px-3 text-slate-200">{att.role}</td>
                  <td className="py-2.5 px-3">
                    <div
                      className={`font-medium ${
                        att.registrationStatus === 'Đã phê duyệt'
                          ? 'text-emerald-400'
                          : att.registrationStatus === 'Chờ phê duyệt'
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {att.registrationStatus}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      QR: {att.qrStatus}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-medium ${
                        att.checkInStatus === 'Đã check-in'
                          ? 'text-emerald-400'
                          : att.checkInStatus === 'Cần kiểm tra'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {att.checkInStatus}
                    </span>
                    {att.lastCheckInAt && (
                      <div className="text-[11px] font-mono text-slate-500">
                        {formatDateTimeVi(att.lastCheckInAt)}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 pl-3 text-right whitespace-nowrap space-x-2">
                    <button
                      type="button"
                      onClick={() => setDetailAttendeeId(att.id)}
                      className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Thẻ & QR</span>
                    </button>
                    {att.checkInStatus !== 'Cần kiểm tra' && (
                      <button
                        type="button"
                        onClick={() => onUpdateAttendeeStatus(att.id, 'Cần kiểm tra')}
                        className="text-[11px] text-amber-400 hover:underline"
                      >
                        Đánh dấu kiểm tra
                      </button>
                    )}
                  </td>
                </tr>
              ))
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

      {showRegisterModal && (
        <RegistrationFormModal
          events={events}
          zones={zones}
          defaultEventId={selectedEventId}
          existingCount={attendees.length}
          onClose={() => setShowRegisterModal(false)}
          onCreateRegistration={onCreateRegistration}
        />
      )}

      {detailAttendee && (
        <QrPassModal
          attendee={detailAttendee}
          events={events}
          zones={zones}
          onClose={() => setDetailAttendeeId(null)}
          onApprove={onApproveRegistration}
          onReject={onRejectRegistration}
          onIssueQr={onIssueQr}
          onRevokeQr={onRevokeQr}
        />
      )}
    </div>
  );
}

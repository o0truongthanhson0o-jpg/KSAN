import { CheckCircle2, QrCode, Shield, X, XCircle } from 'lucide-react';
import { useState } from 'react';
import { DEMO_REFERENCE_DATE } from '../../data/demoSeed';
import {
  Attendee,
  AttendeeRole,
  SecurityEvent,
  SecurityZone,
} from '../../types/security';
import { formatDateTimeVi } from '../../utils/analyticsEngine';
import { QrCodePreview } from '../common/QrCodePreview';

export const ATTENDEE_ROLES: AttendeeRole[] = [
  'Khách',
  'Đại biểu',
  'VIP',
  'Nhân viên',
  'Báo chí',
  'Nhà thầu',
  'Phương tiện',
];

const DEFAULT_ZONES_BY_ROLE: Record<AttendeeRole, string[]> = {
  Khách: ['ZON-02', 'ZON-04', 'ZON-05'],
  'Đại biểu': ['ZON-01', 'ZON-02', 'ZON-04', 'ZON-05'],
  VIP: ['ZON-01', 'ZON-02', 'ZON-03', 'ZON-04', 'ZON-05'],
  'Nhân viên': ['ZON-01', 'ZON-02', 'ZON-04', 'ZON-05', 'ZON-06'],
  'Báo chí': ['ZON-01', 'ZON-02', 'ZON-04'],
  'Nhà thầu': ['ZON-02', 'ZON-05', 'ZON-06'],
  'Phương tiện': ['ZON-05', 'ZON-06'],
};

interface RegistrationFormModalProps {
  events: SecurityEvent[];
  zones: SecurityZone[];
  defaultEventId?: string;
  existingCount: number;
  onClose: () => void;
  onCreateRegistration: (attendee: Attendee) => void;
}

export function RegistrationFormModal({
  events,
  zones,
  defaultEventId,
  existingCount,
  onClose,
  onCreateRegistration,
}: RegistrationFormModalProps) {
  const [role, setRole] = useState<AttendeeRole>('Khách');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [identityLast4, setIdentityLast4] = useState('4589');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('Xe tải hậu cần');
  const [eventId, setEventId] = useState(
    defaultEventId && defaultEventId !== 'ALL' ? defaultEventId : events[0]?.id ?? 'EVT-01'
  );
  const [validFromInput, setValidFromInput] = useState(`${DEMO_REFERENCE_DATE}T07:00`);
  const [validUntilInput, setValidUntilInput] = useState('2026-11-23T22:00');
  const [allowedZoneIds, setAllowedZoneIds] = useState<string[]>(DEFAULT_ZONES_BY_ROLE['Khách']);
  const [singleUseQr, setSingleUseQr] = useState<boolean>(true);
  const [autoApproveAndIssueQr, setAutoApproveAndIssueQr] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleChange = (nextRole: AttendeeRole) => {
    setRole(nextRole);
    setAllowedZoneIds(DEFAULT_ZONES_BY_ROLE[nextRole]);
    setSingleUseQr(nextRole === 'Khách' || nextRole === 'Nhà thầu');
  };

  const toggleZone = (zid: string) => {
    setAllowedZoneIds((prev) =>
      prev.includes(zid) ? prev.filter((id) => id !== zid) : [...prev, zid]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg(
        role === 'Phương tiện'
          ? 'Vui lòng nhập họ tên tài xế hoặc người phụ trách phương tiện.'
          : 'Vui lòng nhập họ tên đối tượng đăng ký.'
      );
      return;
    }
    if (role === 'Phương tiện' && !vehiclePlate.trim()) {
      setErrorMsg('Vui lòng nhập biển kiểm soát phương tiện.');
      return;
    }
    if (allowedZoneIds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 01 khu vực được phép ra vào.');
      return;
    }

    const num = existingCount + 1;
    const id = `ATT-${String(num).padStart(3, '0')}`;
    const isVehicle = role === 'Phương tiện';
    const plate = vehiclePlate.trim().toUpperCase();
    const displayName = isVehicle ? `${plate} (${fullName.trim()})` : fullName.trim();
    const nowStr = `${DEMO_REFERENCE_DATE}T18:40:00`;
    const qrCode = autoApproveAndIssueQr
      ? `SCC-QR-${eventId.replace('-', '')}-${String(num).padStart(3, '0')}`
      : undefined;

    const newRecord: Attendee = {
      id,
      code: isVehicle ? `PT-${String(num).padStart(3, '0')}` : `TD-${String(num).padStart(3, '0')}`,
      fullName: displayName,
      organization: organization.trim() || 'Đơn vị đăng ký trực tiếp',
      role,
      eventId,
      badgeNumber: `BG-${eventId.slice(-2)}-${1000 + num}`,
      identityLast4: identityLast4.trim() || '0000',
      phone: phone.trim() || undefined,
      vehiclePlate: isVehicle ? plate : undefined,
      vehicleType: isVehicle ? vehicleType : undefined,
      allowedZoneIds,
      registrationStatus: autoApproveAndIssueQr ? 'Đã phê duyệt' : 'Chờ phê duyệt',
      approvedBy: autoApproveAndIssueQr ? 'Trung tá Lê Quang Minh' : undefined,
      approvedAt: autoApproveAndIssueQr ? nowStr : undefined,
      qrCode,
      qrStatus: autoApproveAndIssueQr ? 'Hiệu lực' : 'Chưa cấp',
      qrIssuedAt: autoApproveAndIssueQr ? nowStr : undefined,
      validFrom: validFromInput.length === 16 ? `${validFromInput}:00` : `${DEMO_REFERENCE_DATE}T07:00:00`,
      validUntil: validUntilInput.length === 16 ? `${validUntilInput}:00` : '2026-11-23T22:00:00',
      singleUseQr,
      qrUsageCount: 0,
      checkInStatus: 'Chưa đến',
    };

    onCreateRegistration(newRecord);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Đăng ký đối tượng & phương tiện mới"
    >
      <div className="w-full max-w-3xl bg-[#0e1729] border border-slate-700 rounded-xl shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-slate-100">
              Đăng ký hồ sơ Ra / Vào & Phân quyền khu vực
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng biểu mẫu đăng ký"
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/40 text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Role selector */}
          <div className="space-y-1.5">
            <label className="block text-slate-400">Phân loại đối tượng / phương tiện *</label>
            <div className="flex flex-wrap gap-1.5">
              {ATTENDEE_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r)}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                    role === r
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-[#09111f] border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {role === 'Phương tiện' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded bg-[#09111f] border border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1">Biển kiểm soát *</label>
                <input
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="VD: 29A-688.12"
                  className="w-full bg-[#101a2d] border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Loại phương tiện</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full bg-[#101a2d] border border-slate-700 rounded px-3 py-2 text-slate-100"
                >
                  <option value="Xe công vụ VIP">Xe công vụ VIP</option>
                  <option value="Xe đưa đón đại biểu">Xe đưa đón đại biểu</option>
                  <option value="Xe tải hậu cần">Xe tải hậu cần</option>
                  <option value="Xe kỹ thuật phát thanh">Xe kỹ thuật phát thanh</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">
                {role === 'Phương tiện' ? 'Họ tên tài xế / phụ trách *' : 'Họ và tên *'}
              </label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Trần Minh Khôi"
                className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Đơn vị / Tổ chức / Cơ quan</label>
              <input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="VD: Đài Truyền hình Việt Nam / Nhà thầu Ánh Sáng"
                className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Sự kiện tham dự</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.code} — {ev.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Số điện thoại liên hệ</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0904-xxx-xxx"
                className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">4 số cuối CCCD / Hộ chiếu</label>
              <input
                maxLength={4}
                value={identityLast4}
                onChange={(e) => setIdentityLast4(e.target.value)}
                className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Thời hạn hiệu lực từ</label>
              <input
                type="datetime-local"
                value={validFromInput}
                onChange={(e) => setValidFromInput(e.target.value)}
                className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Thời hạn hiệu lực đến</label>
              <input
                type="datetime-local"
                value={validUntilInput}
                onChange={(e) => setValidUntilInput(e.target.value)}
                className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* Allowed Zones */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">
                Phân quyền khu vực được phép ra / vào ({allowedZoneIds.length}/{zones.length})
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {zones.map((z) => {
                const checked = allowedZoneIds.includes(z.id);
                return (
                  <label
                    key={z.id}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                      checked
                        ? 'bg-blue-600/15 border-blue-500/60 text-slate-100'
                        : 'bg-[#09111f] border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleZone(z.id)}
                      className="accent-blue-500"
                    />
                    <span className="truncate">
                      <strong className="font-mono text-blue-300">{z.code}</strong> · {z.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* QR & Approval Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 p-2.5 rounded bg-[#09111f] border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={singleUseQr}
                onChange={(e) => setSingleUseQr(e.target.checked)}
                className="accent-blue-500"
              />
              <span className="text-slate-200">
                Giới hạn QR dùng 1 lần (tự vô hiệu sau lượt vào đầu)
              </span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded bg-[#09111f] border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={autoApproveAndIssueQr}
                onChange={(e) => setAutoApproveAndIssueQr(e.target.checked)}
                className="accent-emerald-500"
              />
              <span className="text-emerald-300 font-medium">
                Phê duyệt & Cấp mã QR demo ngay
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 font-medium"
            >
              {autoApproveAndIssueQr ? 'Đăng ký & Cấp QR demo' : 'Gửi hồ sơ chờ phê duyệt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface QrPassModalProps {
  attendee: Attendee;
  events: SecurityEvent[];
  zones: SecurityZone[];
  onClose: () => void;
  onApprove: (attendeeId: string) => void;
  onReject: (attendeeId: string) => void;
  onIssueQr: (attendeeId: string) => void;
  onRevokeQr: (attendeeId: string) => void;
  onSendToScanner?: (qrCode: string, attendee: Attendee) => void;
}

export function QrPassModal({
  attendee,
  events,
  zones,
  onClose,
  onApprove,
  onReject,
  onIssueQr,
  onRevokeQr,
  onSendToScanner,
}: QrPassModalProps) {
  const ev = events.find((e) => e.id === attendee.eventId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Thẻ kiểm soát & QR Demo ${attendee.code}`}
    >
      <div className="w-full max-w-xl bg-[#0e1729] border border-slate-700 rounded-xl shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-semibold text-slate-100">{attendee.fullName}</h3>
              <p className="text-xs font-mono text-slate-400">
                {attendee.code} · {attendee.role} · Thẻ {attendee.badgeNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng thẻ QR"
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start bg-[#09111f] border border-slate-800 rounded-lg p-4">
            <div className="shrink-0">
              {attendee.qrCode ? (
                <QrCodePreview value={attendee.qrCode} size={136} />
              ) : (
                <div className="w-36 h-40 rounded-md border border-dashed border-slate-700 flex flex-col items-center justify-center text-center p-3 text-slate-500">
                  <QrCode className="w-8 h-8 mb-1.5 text-slate-600" />
                  <span>Chưa cấp mã QR demo</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 w-full">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-400">Trạng thái đăng ký:</span>
                <span
                  className={`font-semibold ${
                    attendee.registrationStatus === 'Đã phê duyệt'
                      ? 'text-emerald-400'
                      : attendee.registrationStatus === 'Chờ phê duyệt'
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {attendee.registrationStatus}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-400">Trạng thái QR Demo:</span>
                <span
                  className={`font-mono font-semibold ${
                    attendee.qrStatus === 'Hiệu lực'
                      ? 'text-emerald-400'
                      : attendee.qrStatus === 'Đã sử dụng'
                      ? 'text-amber-400'
                      : attendee.qrStatus === 'Chưa cấp'
                      ? 'text-slate-400'
                      : 'text-red-400'
                  }`}
                >
                  {attendee.qrStatus} ({attendee.qrUsageCount} lượt quét)
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-400">Cơ chế QR:</span>
                <span className="text-slate-200">
                  {attendee.singleUseQr ? 'Dùng 1 lần (1 lượt vào)' : 'Nhiều lần trong thời hạn'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Sự kiện: </span>
                <span className="text-slate-200">{ev ? `${ev.code} — ${ev.name}` : attendee.eventId}</span>
              </div>
              <div>
                <span className="text-slate-400">Đơn vị: </span>
                <span className="text-slate-200">{attendee.organization}</span>
              </div>
              {attendee.vehiclePlate && (
                <div>
                  <span className="text-slate-400">Phương tiện: </span>
                  <span className="font-mono text-blue-300">
                    {attendee.vehiclePlate} ({attendee.vehicleType})
                  </span>
                </div>
              )}
              <div className="font-mono tabular-nums text-[11px] text-slate-400 pt-1">
                Hiệu lực: {formatDateTimeVi(attendee.validFrom)} → {formatDateTimeVi(attendee.validUntil)}
              </div>
            </div>
          </div>

          <div className="bg-[#09111f] border border-slate-800 rounded-md p-3">
            <div className="text-slate-400 mb-1">Khu vực được phép ra / vào:</div>
            <div className="text-slate-200 leading-relaxed">
              {attendee.allowedZoneIds
                .map((zid) => {
                  const z = zones.find((item) => item.id === zid);
                  return z ? `${z.code} (${z.name})` : zid;
                })
                .join(' · ')}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <div className="flex flex-wrap gap-2">
              {attendee.registrationStatus === 'Chờ phê duyệt' && (
                <>
                  <button
                    type="button"
                    onClick={() => onApprove(attendee.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500 font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Phê duyệt & Cấp QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(attendee.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Từ chối</span>
                  </button>
                </>
              )}

              {attendee.registrationStatus === 'Đã phê duyệt' &&
                (attendee.qrStatus === 'Chưa cấp' ||
                  attendee.qrStatus === 'Thu hồi' ||
                  attendee.qrStatus === 'Đã sử dụng' ||
                  attendee.qrStatus === 'Hết hạn') && (
                  <button
                    type="button"
                    onClick={() => onIssueQr(attendee.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 font-medium"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Cấp lại QR Demo mới</span>
                  </button>
                )}

              {attendee.qrStatus === 'Hiệu lực' && (
                <button
                  type="button"
                  onClick={() => onRevokeQr(attendee.id)}
                  className="px-3 py-1.5 rounded border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                >
                  Thu hồi QR
                </button>
              )}
            </div>

            {attendee.qrCode && onSendToScanner && (
              <button
                type="button"
                onClick={() => {
                  onSendToScanner(attendee.qrCode!, attendee);
                  onClose();
                }}
                className="px-3 py-1.5 rounded bg-slate-800 text-blue-300 border border-blue-500/40 hover:bg-slate-700 font-medium"
              >
                Đưa mã QR vào trạm kiểm soát
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

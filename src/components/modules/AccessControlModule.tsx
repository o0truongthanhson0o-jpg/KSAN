import {
  AlertTriangle,
  CheckCircle2,
  DoorOpen,
  Download,
  Plus,
  QrCode,
  ScanLine,
  Search,
  ShieldAlert,
  UserCheck,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { DEMO_REFERENCE_DATE } from '../../data/demoSeed';
import {
  AccessLog,
  AccessResult,
  AccessScenarioTag,
  Attendee,
  AttendeeRole,
  QrTokenStatus,
  RegistrationStatus,
  SecurityEvent,
  SecurityZone,
  ZoneMapPoint,
} from '../../types/security';
import { formatDateTimeVi } from '../../utils/analyticsEngine';
import { exportRowsToCsv } from '../../utils/csvExport';
import { PaginationBar } from '../common/PaginationBar';
import {
  ATTENDEE_ROLES,
  QrPassModal,
  RegistrationFormModal,
} from '../modals/RegistrationModal';

export interface GateVerificationResult {
  timestamp: string;
  qrCodeUsed: string;
  gateName: string;
  zoneId: string;
  direction: 'Vào' | 'Ra';
  result: AccessResult;
  scenarioTag: AccessScenarioTag;
  reason: string;
  matchedAttendee?: Attendee;
  checks: {
    connectionOk: boolean;
    qrValid: boolean;
    registrationApproved: boolean;
    withinValidityWindow: boolean;
    zoneAuthorized: boolean;
  };
}

interface AccessControlModuleProps {
  accessLogs: AccessLog[];
  attendees: Attendee[];
  events: SecurityEvent[];
  zones: SecurityZone[];
  mapPoints: ZoneMapPoint[];
  selectedEventId: string;
  onCreateRegistration: (attendee: Attendee) => void;
  onApproveRegistration: (attendeeId: string) => void;
  onRejectRegistration: (attendeeId: string) => void;
  onToggleLockRegistration: (attendeeId: string, status: RegistrationStatus) => void;
  onIssueQr: (attendeeId: string) => void;
  onRevokeQr: (attendeeId: string) => void;
  onVerifyQrScan: (params: {
    qrCode: string;
    zoneId: string;
    gateName: string;
    direction: 'Vào' | 'Ra';
    simulateOffline: boolean;
  }) => GateVerificationResult;
}

export function AccessControlModule({
  accessLogs,
  attendees,
  events,
  zones,
  mapPoints,
  selectedEventId,
  onCreateRegistration,
  onApproveRegistration,
  onRejectRegistration,
  onToggleLockRegistration,
  onIssueQr,
  onRevokeQr,
  onVerifyQrScan,
}: AccessControlModuleProps) {
  const [activeTab, setActiveTab] = useState<'verify' | 'registrations' | 'logs'>('verify');

  // Scanner state
  const scopedAttendees = useMemo(
    () => attendees.filter((a) => selectedEventId === 'ALL' || a.eventId === selectedEventId),
    [attendees, selectedEventId]
  );

  const firstValidAttendee =
    scopedAttendees.find(
      (a) => a.registrationStatus === 'Đã phê duyệt' && a.qrStatus === 'Hiệu lực' && a.qrCode
    ) ?? scopedAttendees[0];

  const [scanZoneId, setScanZoneId] = useState(zones[1]?.id ?? 'ZON-02');
  const [scanGateName, setScanGateName] = useState('Cổng X-Ray Chính A1');
  const [scanDirection, setScanDirection] = useState<'Vào' | 'Ra'>('Vào');
  const [qrInput, setQrInput] = useState(firstValidAttendee?.qrCode ?? 'SCC-QR-EVT01-001');
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [lastVerification, setLastVerification] = useState<GateVerificationResult | null>(null);

  // Registration list filters
  const [regSearch, setRegSearch] = useState('');
  const [regRoleFilter, setRegRoleFilter] = useState<'ALL' | AttendeeRole>('ALL');
  const [regStatusFilter, setRegStatusFilter] = useState<'ALL' | RegistrationStatus>('ALL');
  const [regQrFilter, setRegQrFilter] = useState<'ALL' | QrTokenStatus>('ALL');
  const [regPage, setRegPage] = useState(1);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [qrModalAttendeeId, setQrModalAttendeeId] = useState<string | null>(null);

  // Access logs filters
  const [logSearch, setLogSearch] = useState('');
  const [resultFilter, setResultFilter] = useState<'ALL' | AccessResult>('ALL');
  const [scenarioFilter, setScenarioFilter] = useState<'ALL' | AccessScenarioTag>('ALL');
  const [logPage, setLogPage] = useState(1);
  const [logPageSize, setLogPageSize] = useState(10);

  const zonePointsForScan = mapPoints.filter(
    (p) =>
      p.zoneId === scanZoneId &&
      (p.type === 'Cổng kiểm soát' || p.type === 'Lối vào' || p.type === 'Lối ra')
  );

  const handleZoneChange = (newZid: string) => {
    setScanZoneId(newZid);
    const pts = mapPoints.filter(
      (p) =>
        p.zoneId === newZid &&
        (p.type === 'Cổng kiểm soát' || p.type === 'Lối vào' || p.type === 'Lối ra')
    );
    const z = zones.find((item) => item.id === newZid);
    setScanGateName(pts[0]?.name ?? `Cổng kiểm soát ${z?.code ?? newZid}`);
  };

  const executeVerification = (
    qr: string,
    zoneIdOverride?: string,
    offlineOverride?: boolean,
    directionOverride?: 'Vào' | 'Ra'
  ) => {
    const zId = zoneIdOverride ?? scanZoneId;
    const isOff = offlineOverride ?? simulateOffline;
    const dir = directionOverride ?? scanDirection;
    const zPts = mapPoints.filter((p) => p.zoneId === zId);
    const gate =
      zoneIdOverride && zPts[0]
        ? zPts[0].name
        : scanGateName || `Cổng ${zones.find((z) => z.id === zId)?.code ?? zId}`;

    const res = onVerifyQrScan({
      qrCode: qr.trim(),
      zoneId: zId,
      gateName: gate,
      direction: dir,
      simulateOffline: isOff,
    });
    setLastVerification(res);
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeVerification(qrInput);
  };

  // Quick scenario helpers
  const triggerScenario = (
    scenario: 'valid' | 'invalid_qr' | 'used_qr' | 'wrong_zone' | 'expired' | 'offline'
  ) => {
    if (scenario === 'valid') {
      const target =
        scopedAttendees.find(
          (a) =>
            a.registrationStatus === 'Đã phê duyệt' &&
            a.qrStatus === 'Hiệu lực' &&
            a.qrCode &&
            a.validUntil >= `${DEMO_REFERENCE_DATE}T18:00:00`
        ) ?? firstValidAttendee;
      const targetZone = target?.allowedZoneIds[0] ?? 'ZON-02';
      const code = target?.qrCode ?? 'SCC-QR-EVT01-001';
      setSimulateOffline(false);
      handleZoneChange(targetZone);
      setQrInput(code);
      executeVerification(code, targetZone, false, 'Vào');
      return;
    }

    if (scenario === 'invalid_qr') {
      const fakeCode = 'SCC-QR-FAKE-9999';
      setSimulateOffline(false);
      setQrInput(fakeCode);
      executeVerification(fakeCode, scanZoneId, false, 'Vào');
      return;
    }

    if (scenario === 'used_qr') {
      const usedAtt =
        scopedAttendees.find((a) => a.qrStatus === 'Đã sử dụng' && a.qrCode) ??
        attendees.find((a) => a.qrStatus === 'Đã sử dụng' && a.qrCode);
      const code = usedAtt?.qrCode ?? 'SCC-QR-EVT01-006';
      const targetZone = usedAtt?.allowedZoneIds[0] ?? 'ZON-02';
      setSimulateOffline(false);
      handleZoneChange(targetZone);
      setQrInput(code);
      executeVerification(code, targetZone, false, 'Vào');
      return;
    }

    if (scenario === 'wrong_zone') {
      // Pick a non-VIP attendee with active QR and scan at VIP zone ZON-03
      const guestAtt =
        scopedAttendees.find(
          (a) =>
            a.registrationStatus === 'Đã phê duyệt' &&
            a.qrStatus === 'Hiệu lực' &&
            a.qrCode &&
            !a.allowedZoneIds.includes('ZON-03')
        ) ?? firstValidAttendee;
      const code = guestAtt?.qrCode ?? 'SCC-QR-EVT01-001';
      setSimulateOffline(false);
      handleZoneChange('ZON-03');
      setQrInput(code);
      executeVerification(code, 'ZON-03', false, 'Vào');
      return;
    }

    if (scenario === 'expired') {
      const expAtt =
        scopedAttendees.find(
          (a) => (a.qrStatus === 'Hết hạn' || a.registrationStatus !== 'Đã phê duyệt') && a.qrCode
        ) ?? attendees.find((a) => a.qrStatus === 'Hết hạn' && a.qrCode);
      const code = expAtt?.qrCode ?? 'SCC-QR-EVT01-011';
      const targetZone = expAtt?.allowedZoneIds[0] ?? 'ZON-02';
      setSimulateOffline(false);
      handleZoneChange(targetZone);
      setQrInput(code);
      executeVerification(code, targetZone, false, 'Vào');
      return;
    }

    if (scenario === 'offline') {
      setSimulateOffline(true);
      executeVerification(qrInput || 'SCC-QR-EVT01-001', scanZoneId, true, scanDirection);
    }
  };

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return scopedAttendees.filter((a) => {
      if (regRoleFilter !== 'ALL' && a.role !== regRoleFilter) return false;
      if (regStatusFilter !== 'ALL' && a.registrationStatus !== regStatusFilter) return false;
      if (regQrFilter !== 'ALL' && a.qrStatus !== regQrFilter) return false;
      if (regSearch.trim()) {
        const q = regSearch.trim().toLowerCase();
        return (
          a.fullName.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          a.organization.toLowerCase().includes(q) ||
          (a.qrCode ?? '').toLowerCase().includes(q) ||
          (a.vehiclePlate ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [scopedAttendees, regRoleFilter, regStatusFilter, regQrFilter, regSearch]);

  const regPageSize = 10;
  const regTotalPages = Math.max(1, Math.ceil(filteredRegistrations.length / regPageSize));
  const regSafePage = Math.min(regPage, regTotalPages);
  const pagedRegistrations = filteredRegistrations.slice(
    (regSafePage - 1) * regPageSize,
    regSafePage * regPageSize
  );

  // Filtered access logs
  const filteredLogs = useMemo(() => {
    return accessLogs.filter((log) => {
      if (selectedEventId !== 'ALL' && log.eventId !== selectedEventId) return false;
      if (resultFilter !== 'ALL' && log.result !== resultFilter) return false;
      if (scenarioFilter !== 'ALL' && log.scenarioTag !== scenarioFilter) return false;
      if (logSearch.trim()) {
        const q = logSearch.trim().toLowerCase();
        return (
          log.attendeeName.toLowerCase().includes(q) ||
          log.gateName.toLowerCase().includes(q) ||
          (log.qrCodeUsed ?? '').toLowerCase().includes(q) ||
          log.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [accessLogs, selectedEventId, resultFilter, scenarioFilter, logSearch]);

  const logTotalPages = Math.max(1, Math.ceil(filteredLogs.length / logPageSize));
  const logSafePage = Math.min(logPage, logTotalPages);
  const pagedLogs = filteredLogs.slice(
    (logSafePage - 1) * logPageSize,
    logSafePage * logPageSize
  );

  // Metrics
  const scopedLogs = accessLogs.filter(
    (l) => selectedEventId === 'ALL' || l.eventId === selectedEventId
  );
  const validCount = scopedLogs.filter((l) => l.result === 'Hợp lệ').length;
  const rejectedOrAlertCount = scopedLogs.filter(
    (l) => l.result === 'Từ chối' || l.result === 'Cảnh báo'
  ).length;
  const offlineCount = scopedLogs.filter((l) => l.result === 'Mất kết nối').length;
  const pendingRegCount = scopedAttendees.filter(
    (a) => a.registrationStatus === 'Chờ phê duyệt'
  ).length;

  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id;

  const qrModalAttendee = qrModalAttendeeId
    ? attendees.find((a) => a.id === qrModalAttendeeId) ?? null
    : null;

  const handleExportLogs = () => {
    exportRowsToCsv(
      'nhat_ky_kiem_soat_ra_vao.csv',
      [
        'Thời gian',
        'Mã QR',
        'Đối tượng / Phương tiện',
        'Phân nhóm',
        'Khu vực',
        'Cổng kiểm soát',
        'Chiều',
        'Kết quả',
        'Tình huống',
        'Lý do / Diễn giải',
      ],
      filteredLogs.map((l) => [
        formatDateTimeVi(l.timestamp),
        l.qrCodeUsed ?? '',
        l.attendeeName,
        l.attendeeRole,
        zoneName(l.zoneId),
        l.gateName,
        l.direction,
        l.result,
        l.scenarioTag ?? l.result,
        l.reason ?? '',
      ])
    );
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Primary CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
            Đăng ký & Kiểm soát ra vào cổng an ninh
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Đăng ký, phê duyệt, cấp QR demo, xác thực quyền khu vực, thời hạn & mô phỏng sự cố đầu đọc ·{' '}
            <span className="text-blue-300 font-medium">
              Dữ liệu mô phỏng (chưa tích hợp thiết bị thực tế)
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRegisterModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Đăng ký mới & Cấp QR</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-3.5">
          <span className="text-slate-400">Tổng lượt kiểm soát (Vào/Ra)</span>
          <p className="text-xl font-semibold font-mono tabular-nums text-slate-100 mt-1">
            {scopedLogs.length}
          </p>
          <span className="text-[11px] text-emerald-400 font-mono tabular-nums">
            Hợp lệ: {validCount} lượt
          </span>
        </div>
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-3.5">
          <span className="text-slate-400">Từ chối & Sai phân quyền</span>
          <p className="text-xl font-semibold font-mono tabular-nums text-amber-400 mt-1">
            {rejectedOrAlertCount}
          </p>
          <span className="text-[11px] text-slate-400">QR lỗi, dùng lại hoặc sai khu vực</span>
        </div>
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-3.5">
          <span className="text-slate-400">Sự cố mất kết nối đầu đọc</span>
          <p className="text-xl font-semibold font-mono tabular-nums text-red-400 mt-1">
            {offlineCount}
          </p>
          <span className="text-[11px] text-slate-400">Ghi nhận lỗi đồng bộ thiết bị</span>
        </div>
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-3.5">
          <span className="text-slate-400">Hồ sơ chờ phê duyệt</span>
          <p className="text-xl font-semibold font-mono tabular-nums text-blue-400 mt-1">
            {pendingRegCount}
          </p>
          <span className="text-[11px] text-slate-400">
            Tổng {scopedAttendees.length} đối tượng & phương tiện
          </span>
        </div>
      </div>

      {/* Main Module Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#101a2d] border border-slate-800/90 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('verify')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'verify'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <ScanLine className="w-3.5 h-3.5" />
          <span>Trạm xác thực QR & Kiểm soát Ra/Vào</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('registrations')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'registrations'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Phê duyệt đăng ký & Cấp QR Demo ({pendingRegCount} chờ)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <DoorOpen className="w-3.5 h-3.5" />
          <span>Nhật ký lượt Vào / Ra ({scopedLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: TRẠM XÁC THỰC QR & KIỂM SOÁT RA VÀO */}
      {activeTab === 'verify' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          {/* Left: Scanner Console */}
          <div className="xl:col-span-7 bg-[#101a2d] border border-slate-800/90 rounded-lg p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-slate-100">
                  Giả lập đầu đọc QR tại cổng kiểm soát
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSimulateOffline((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  simulateOffline
                    ? 'bg-red-500/15 border-red-500/50 text-red-300'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                }`}
              >
                {simulateOffline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Đang mô phỏng: Mất kết nối</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5" />
                    <span>Kết nối đầu đọc: Trực tuyến</span>
                  </>
                )}
              </button>
            </div>

            <form onSubmit={handleScanSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Khu vực kiểm soát</label>
                  <select
                    value={scanZoneId}
                    onChange={(e) => handleZoneChange(e.target.value)}
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.code} — {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Cổng / Lối kiểm soát</label>
                  <select
                    value={scanGateName}
                    onChange={(e) => setScanGateName(e.target.value)}
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100"
                  >
                    {zonePointsForScan.length > 0 ? (
                      zonePointsForScan.map((pt) => (
                        <option key={pt.id} value={pt.name}>
                          {pt.code} — {pt.name}
                        </option>
                      ))
                    ) : (
                      <option value={`Cổng kiểm soát ${scanZoneId}`}>
                        Cổng kiểm soát {scanZoneId}
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Chiều lưu thông</label>
                  <select
                    value={scanDirection}
                    onChange={(e) => setScanDirection(e.target.value as 'Vào' | 'Ra')}
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100"
                  >
                    <option value="Vào">Lượt VÀO (Check-in)</option>
                    <option value="Ra">Lượt RA (Check-out)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                <div className="md:col-span-5">
                  <label className="block text-slate-400 mb-1">Chọn nhanh hồ sơ có QR demo</label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setQrInput(e.target.value);
                    }}
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-200"
                  >
                    <option value="">-- Chọn từ danh sách đã cấp QR --</option>
                    {scopedAttendees
                      .filter((a) => a.qrCode)
                      .slice(0, 40)
                      .map((a) => (
                        <option key={a.id} value={a.qrCode}>
                          {a.qrCode} · {a.fullName} ({a.role} - {a.qrStatus})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="md:col-span-5">
                  <label className="block text-slate-400 mb-1">Mã QR quét tại đầu đọc *</label>
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="VD: SCC-QR-EVT01-001"
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded transition-colors whitespace-nowrap"
                  >
                    <ScanLine className="w-3.5 h-3.5" />
                    <span>Xác thực</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Test Scenarios */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="text-xs font-medium text-slate-300">
                Kiểm thử nhanh các tình huống nghiệp vụ kiểm soát ra vào:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => triggerScenario('valid')}
                  className="p-2 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-left transition-colors"
                >
                  <div className="font-semibold">1. Quét QR hợp lệ</div>
                  <div className="text-[11px] text-emerald-400/80">Đúng khu vực & thời hạn</div>
                </button>
                <button
                  type="button"
                  onClick={() => triggerScenario('invalid_qr')}
                  className="p-2 rounded border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-left transition-colors"
                >
                  <div className="font-semibold">2. QR không hợp lệ</div>
                  <div className="text-[11px] text-red-400/80">Mã giả / không tồn tại</div>
                </button>
                <button
                  type="button"
                  onClick={() => triggerScenario('used_qr')}
                  className="p-2 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-left transition-colors"
                >
                  <div className="font-semibold">3. QR đã sử dụng</div>
                  <div className="text-[11px] text-amber-400/80">Quét lại vé 1 lần</div>
                </button>
                <button
                  type="button"
                  onClick={() => triggerScenario('wrong_zone')}
                  className="p-2 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-left transition-colors"
                >
                  <div className="font-semibold">4. Sai khu vực</div>
                  <div className="text-[11px] text-amber-400/80">Vượt quyền vào khu VIP</div>
                </button>
                <button
                  type="button"
                  onClick={() => triggerScenario('expired')}
                  className="p-2 rounded border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-left transition-colors"
                >
                  <div className="font-semibold">5. Hết hạn / Chưa duyệt</div>
                  <div className="text-[11px] text-red-400/80">Quá hạn hoặc bị khóa</div>
                </button>
                <button
                  type="button"
                  onClick={() => triggerScenario('offline')}
                  className="p-2 rounded border border-slate-600 bg-slate-800/70 text-slate-200 hover:bg-slate-700 text-left transition-colors"
                >
                  <div className="font-semibold">6. Mất kết nối</div>
                  <div className="text-[11px] text-slate-400">Gián đoạn máy chủ cổng</div>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Multi-layer Verification Result Panel */}
          <div className="xl:col-span-5 bg-[#101a2d] border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between space-y-3">
            {lastVerification ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                  <span className="text-sm font-semibold text-slate-100">
                    Kết quả xác thực đầu đọc
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {formatDateTimeVi(lastVerification.timestamp)}
                  </span>
                </div>

                {/* Overall decision banner */}
                <div
                  className={`p-3 rounded-md border space-y-1 ${
                    lastVerification.result === 'Hợp lệ'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : lastVerification.result === 'Cảnh báo'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : lastVerification.result === 'Mất kết nối'
                      ? 'bg-slate-800 border-slate-600 text-slate-200'
                      : 'bg-red-500/10 border-red-500/40 text-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-semibold text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      {lastVerification.result === 'Hợp lệ' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : lastVerification.result === 'Cảnh báo' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : lastVerification.result === 'Mất kết nối' ? (
                        <WifiOff className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span>
                        {lastVerification.result.toUpperCase()} — {lastVerification.scenarioTag}
                      </span>
                    </span>
                    <span className="font-mono text-xs">{lastVerification.direction}</span>
                  </div>
                  <p className="text-xs opacity-95">{lastVerification.reason}</p>
                </div>

                {/* 5-step verification checklist */}
                <div className="bg-[#09111f] border border-slate-800 rounded-md p-3 space-y-2">
                  <div className="font-medium text-slate-300 mb-1">
                    Kiểm tra điều kiện an ninh:
                  </div>
                  {[
                    {
                      label: '1. Kết nối thiết bị đầu đọc & máy chủ',
                      ok: lastVerification.checks.connectionOk,
                      okText: 'Trực tuyến',
                      failText: 'Mất kết nối',
                    },
                    {
                      label: '2. Tính hợp lệ & trạng thái sử dụng QR',
                      ok: lastVerification.checks.qrValid,
                      okText: 'Hợp lệ',
                      failText: 'Không hợp lệ / Đã dùng / Thu hồi',
                    },
                    {
                      label: '3. Trạng thái phê duyệt hồ sơ đăng ký',
                      ok: lastVerification.checks.registrationApproved,
                      okText: 'Đã phê duyệt',
                      failText: 'Chưa duyệt / Tạm khóa',
                    },
                    {
                      label: '4. Thời hạn hiệu lực thẻ / mã QR',
                      ok: lastVerification.checks.withinValidityWindow,
                      okText: 'Còn hiệu lực',
                      failText: 'Đã hết hạn / Chưa tới giờ',
                    },
                    {
                      label: '5. Phân quyền khu vực kiểm soát',
                      ok: lastVerification.checks.zoneAuthorized,
                      okText: 'Đúng khu vực cấp phép',
                      failText: 'Sai khu vực',
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">{item.label}</span>
                      <span
                        className={`font-medium ${
                          !lastVerification.checks.connectionOk &&
                          item.label.startsWith('1.') === false
                            ? 'text-slate-500'
                            : item.ok
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {!lastVerification.checks.connectionOk && !item.label.startsWith('1.')
                          ? 'Chưa kiểm tra'
                          : item.ok
                          ? item.okText
                          : item.failText}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Matched subject info */}
                {lastVerification.matchedAttendee && (
                  <div className="bg-[#09111f] border border-slate-800 rounded-md p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-100">
                        {lastVerification.matchedAttendee.fullName}
                      </span>
                      <span className="font-mono text-blue-300">
                        {lastVerification.matchedAttendee.role}
                      </span>
                    </div>
                    <div className="text-slate-400">
                      {lastVerification.matchedAttendee.organization} · Mã{' '}
                      <span className="font-mono text-slate-300">
                        {lastVerification.matchedAttendee.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Hiệu lực:{' '}
                      {formatDateTimeVi(lastVerification.matchedAttendee.validFrom)} →{' '}
                      {formatDateTimeVi(lastVerification.matchedAttendee.validUntil)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2 text-xs text-slate-400">
                <ShieldAlert className="w-8 h-8 text-blue-400/70" />
                <div className="text-sm font-medium text-slate-200">
                  Sẵn sàng tiếp nhận lệnh xác thực
                </div>
                <p className="max-w-xs leading-relaxed">
                  Nhập mã QR hoặc bấm một trong 6 tình huống kiểm thử nhanh bên trái để kiểm tra quy trình xác thực cổng và ghi nhận nhật ký Ra / Vào.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ĐĂNG KÝ, PHÊ DUYỆT & CẤP QR DEMO */}
      {activeTab === 'registrations' && (
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={regSearch}
                onChange={(e) => {
                  setRegSearch(e.target.value);
                  setRegPage(1);
                }}
                placeholder="Tìm mã hồ sơ, họ tên, biển số xe, mã QR..."
                className="w-full bg-[#09111f] border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={regRoleFilter}
              onChange={(e) => {
                setRegRoleFilter(e.target.value as 'ALL' | AttendeeRole);
                setRegPage(1);
              }}
              className="bg-[#09111f] border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">Mọi nhóm (7 loại)</option>
              {ATTENDEE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              value={regStatusFilter}
              onChange={(e) => {
                setRegStatusFilter(e.target.value as 'ALL' | RegistrationStatus);
                setRegPage(1);
              }}
              className="bg-[#09111f] border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">Mọi trạng thái duyệt</option>
              <option value="Chờ phê duyệt">Chờ phê duyệt</option>
              <option value="Đã phê duyệt">Đã phê duyệt</option>
              <option value="Từ chối">Từ chối</option>
              <option value="Tạm khóa">Tạm khóa</option>
            </select>

            <select
              value={regQrFilter}
              onChange={(e) => {
                setRegQrFilter(e.target.value as 'ALL' | QrTokenStatus);
                setRegPage(1);
              }}
              className="bg-[#09111f] border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">Mọi trạng thái QR</option>
              <option value="Hiệu lực">Hiệu lực</option>
              <option value="Chưa cấp">Chưa cấp</option>
              <option value="Đã sử dụng">Đã sử dụng</option>
              <option value="Hết hạn">Hết hạn</option>
              <option value="Thu hồi">Thu hồi</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 pr-3 font-medium">Mã & Đối tượng / Phương tiện</th>
                  <th className="py-2.5 px-3 font-medium">Phân nhóm</th>
                  <th className="py-2.5 px-3 font-medium">Thời hạn hiệu lực</th>
                  <th className="py-2.5 px-3 font-medium">Khu vực cấp phép</th>
                  <th className="py-2.5 px-3 font-medium">Trạng thái đăng ký</th>
                  <th className="py-2.5 px-3 font-medium">Mã QR Demo</th>
                  <th className="py-2.5 pl-3 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {pagedRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Không có hồ sơ đăng ký nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  pagedRegistrations.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 pr-3 align-top">
                      <div className="font-medium text-slate-100">{att.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {att.code} · {att.organization}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 align-top text-slate-200">{att.role}</td>
                    <td className="py-2.5 px-3 align-top font-mono tabular-nums text-[11px] text-slate-300">
                      <div>Từ: {formatDateTimeVi(att.validFrom)}</div>
                      <div>Đến: {formatDateTimeVi(att.validUntil)}</div>
                    </td>
                    <td className="py-2.5 px-3 align-top text-slate-300 max-w-[180px]">
                      <span className="font-mono text-[11px]">
                        {att.allowedZoneIds
                          .map((zid) => zones.find((z) => z.id === zid)?.code ?? zid)
                          .join(', ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 align-top">
                      <span
                        className={`font-medium ${
                          att.registrationStatus === 'Đã phê duyệt'
                            ? 'text-emerald-400'
                            : att.registrationStatus === 'Chờ phê duyệt'
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {att.registrationStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 align-top font-mono">
                      <div className="text-blue-300 text-[11px]">{att.qrCode ?? 'Chưa cấp'}</div>
                      <div
                        className={`text-[11px] ${
                          att.qrStatus === 'Hiệu lực'
                            ? 'text-emerald-400'
                            : att.qrStatus === 'Đã sử dụng'
                            ? 'text-amber-400'
                            : att.qrStatus === 'Chưa cấp'
                            ? 'text-slate-500'
                            : 'text-red-400'
                        }`}
                      >
                        {att.qrStatus}
                      </div>
                    </td>
                    <td className="py-2.5 pl-3 align-top text-right whitespace-nowrap space-x-1.5">
                      {att.registrationStatus === 'Chờ phê duyệt' && (
                        <button
                          type="button"
                          onClick={() => onApproveRegistration(att.id)}
                          className="px-2 py-1 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30"
                        >
                          Duyệt & Cấp QR
                        </button>
                      )}
                      {att.registrationStatus === 'Đã phê duyệt' && (
                        <button
                          type="button"
                          onClick={() =>
                            onToggleLockRegistration(att.id, 'Tạm khóa')
                          }
                          className="px-2 py-1 rounded bg-[#09111f] text-slate-300 border border-slate-700 hover:bg-slate-800"
                        >
                          Khóa
                        </button>
                      )}
                      {att.registrationStatus === 'Tạm khóa' && (
                        <button
                          type="button"
                          onClick={() =>
                            onToggleLockRegistration(att.id, 'Đã phê duyệt')
                          }
                          className="px-2 py-1 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/40"
                        >
                          Mở khóa
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setQrModalAttendeeId(att.id)}
                        className="px-2 py-1 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30"
                      >
                        Thẻ QR
                      </button>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            currentPage={regSafePage}
            pageSize={regPageSize}
            totalItems={filteredRegistrations.length}
            onPageChange={setRegPage}
          />
        </div>
      )}

      {/* TAB 3: NHẬT KÝ LƯỢT VÀO / RA */}
      {activeTab === 'logs' && (
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => {
                  setLogSearch(e.target.value);
                  setLogPage(1);
                }}
                placeholder="Tìm tên, biển số, mã QR, cổng..."
                className="w-full bg-[#09111f] border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={resultFilter}
                onChange={(e) => {
                  setResultFilter(e.target.value as 'ALL' | AccessResult);
                  setLogPage(1);
                }}
                className="bg-[#09111f] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="ALL">Mọi kết quả</option>
                <option value="Hợp lệ">Hợp lệ</option>
                <option value="Cảnh báo">Cảnh báo</option>
                <option value="Từ chối">Từ chối</option>
                <option value="Mất kết nối">Mất kết nối</option>
              </select>

              <select
                value={scenarioFilter}
                onChange={(e) => {
                  setScenarioFilter(e.target.value as 'ALL' | AccessScenarioTag);
                  setLogPage(1);
                }}
                className="bg-[#09111f] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="ALL">Mọi tình huống</option>
                <option value="Hợp lệ">Hợp lệ</option>
                <option value="QR không hợp lệ">QR không hợp lệ</option>
                <option value="QR đã sử dụng">QR đã sử dụng</option>
                <option value="Sai khu vực">Sai khu vực</option>
                <option value="Hết hạn hiệu lực">Hết hạn hiệu lực</option>
                <option value="Chưa phê duyệt / Bị khóa">Chưa phê duyệt / Bị khóa</option>
                <option value="Mất kết nối">Mất kết nối</option>
              </select>

              <button
                type="button"
                onClick={handleExportLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#09111f] border border-slate-700 rounded hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 pr-3 font-medium">Thời gian</th>
                  <th className="py-2.5 px-3 font-medium">Đối tượng / Mã QR</th>
                  <th className="py-2.5 px-3 font-medium">Khu vực / Cổng</th>
                  <th className="py-2.5 px-3 font-medium">Chiều</th>
                  <th className="py-2.5 px-3 font-medium">Kết quả & Tình huống</th>
                  <th className="py-2.5 pl-3 font-medium">Diễn giải kiểm soát</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {pagedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Không có lượt kiểm soát vào/ra nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  pagedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 pr-3 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                      {formatDateTimeVi(log.timestamp)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-100">{log.attendeeName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {log.attendeeRole} · {log.qrCodeUsed ?? 'Thẻ từ'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-slate-200">{zoneName(log.zoneId)}</div>
                      <div className="text-[11px] text-slate-400">{log.gateName}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{log.direction}</td>
                    <td className="py-2.5 px-3">
                      <div
                        className={`font-medium ${
                          log.result === 'Hợp lệ'
                            ? 'text-emerald-400'
                            : log.result === 'Cảnh báo'
                            ? 'text-amber-400'
                            : log.result === 'Mất kết nối'
                            ? 'text-slate-300'
                            : 'text-red-400'
                        }`}
                      >
                        {log.result}
                      </div>
                      {log.scenarioTag && log.scenarioTag !== log.result && (
                        <div className="text-[11px] text-slate-400">{log.scenarioTag}</div>
                      )}
                    </td>
                    <td className="py-2.5 pl-3 text-slate-300">{log.reason}</td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            currentPage={logSafePage}
            pageSize={logPageSize}
            totalItems={filteredLogs.length}
            onPageChange={setLogPage}
            onPageSizeChange={(sz) => {
              setLogPageSize(sz);
              setLogPage(1);
            }}
          />
        </div>
      )}

      {/* Registration Modal */}
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

      {/* QR Pass Modal */}
      {qrModalAttendee && (
        <QrPassModal
          attendee={qrModalAttendee}
          events={events}
          zones={zones}
          onClose={() => setQrModalAttendeeId(null)}
          onApprove={onApproveRegistration}
          onReject={onRejectRegistration}
          onIssueQr={onIssueQr}
          onRevokeQr={onRevokeQr}
          onSendToScanner={(qr, att) => {
            setQrInput(qr);
            handleZoneChange(att.allowedZoneIds[0] ?? 'ZON-02');
            setSimulateOffline(false);
            setActiveTab('verify');
          }}
        />
      )}
    </div>
  );
}

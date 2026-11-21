import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardList,
  Edit3,
  FileText,
  History,
  Link2,
  Plus,
  Shield,
  UserCheck,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  EvidenceType,
  IncidentCategory,
  IncidentStatus,
  SecurityAlert,
  SecurityEvent,
  SecurityIncident,
  SecurityStaff,
  SecurityZone,
} from '../../types/security';
import {
  STATUS_ORDER,
  formatDateTimeVi,
  getResolutionMinutes,
  isIncidentOnTime,
} from '../../utils/analyticsEngine';
import {
  AlertStatusText,
  IncidentStatusText,
  RecordTypeText,
  SeverityText,
} from '../common/SemanticLabel';

interface IncidentDetailModalProps {
  incident: SecurityIncident;
  events: SecurityEvent[];
  zones: SecurityZone[];
  categories: IncidentCategory[];
  staff: SecurityStaff[];
  alerts: SecurityAlert[];
  onClose: () => void;
  onEdit: (incident: SecurityIncident) => void;
  onTransitionWorkflow: (incidentId: string, nextStatus: IncidentStatus, note?: string) => void;
  onReassignStaff: (incidentId: string, staffId: string) => void;
  onReassignScope: (incidentId: string, eventId: string, zoneId: string) => void;
  onAddProgress: (incidentId: string, note: string) => void;
  onUpdateResult: (incidentId: string, resolutionNotes: string) => void;
  onAddEvidence: (
    incidentId: string,
    evidence: { type: EvidenceType; title: string; referenceCode: string; description: string }
  ) => void;
  onLinkAlert: (alertId: string, incidentId: string) => void;
}

const EVIDENCE_TYPES: EvidenceType[] = [
  'Ảnh Camera',
  'Video trích xuất',
  'Biên bản hiện trường',
  'Log thiết bị',
  'Hình ảnh hiện vật',
];

export function IncidentDetailModal({
  incident,
  events,
  zones,
  categories,
  staff,
  alerts,
  onClose,
  onEdit,
  onTransitionWorkflow,
  onReassignStaff,
  onReassignScope,
  onAddProgress,
  onUpdateResult,
  onAddEvidence,
  onLinkAlert,
}: IncidentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'progress' | 'evidence' | 'audit'>('progress');
  const [transitionNote, setTransitionNote] = useState('');
  const [progressNote, setProgressNote] = useState('');
  const [resultText, setResultText] = useState(incident.resolutionNotes ?? '');

  // Evidence inline form
  const [evdType, setEvdType] = useState<EvidenceType>('Ảnh Camera');
  const [evdTitle, setEvdTitle] = useState('');
  const [evdRef, setEvdRef] = useState('');
  const [evdDesc, setEvdDesc] = useState('');

  // Link alert selector
  const [alertToLink, setAlertToLink] = useState('');

  const catName = categories.find((c) => c.id === incident.categoryId)?.name ?? incident.categoryId;
  const assignedStaff = staff.find((s) => s.id === incident.assignedStaffId);

  const currentStageIdx = STATUS_ORDER.indexOf(incident.status);
  const nextStage: IncidentStatus | null =
    currentStageIdx >= 0 && currentStageIdx < STATUS_ORDER.length - 1
      ? STATUS_ORDER[currentStageIdx + 1]
      : null;

  const linkedAlerts = alerts.filter(
    (a) => a.linkedIncidentId === incident.id || incident.linkedAlertIds.includes(a.id)
  );
  const availableAlerts = alerts.filter((a) => a.status === 'Chưa xác minh');

  const resMinutes = getResolutionMinutes(incident);
  const onTime = isIncidentOnTime(incident);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết hồ sơ ${incident.code}`}
    >
      <div className="w-full max-w-5xl bg-[#0e1729] border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="font-mono font-semibold text-blue-300 text-sm">{incident.code}</span>
              <RecordTypeText type={incident.recordType} />
              <SeverityText severity={incident.severity} />
              <IncidentStatusText status={incident.status} />
            </div>
            <h2 className="text-base font-semibold text-slate-100">{incident.title}</h2>
            <p className="text-xs text-slate-400 font-mono tabular-nums">
              Phát hiện: {formatDateTimeVi(incident.detectedAt)} · Tiếp nhận:{' '}
              {formatDateTimeVi(incident.reportedAt)} · SLA: {incident.slaMinutes} phút
              {resMinutes !== null && (
                <>
                  {' '}
                  · Hoàn tất: {resMinutes} phút (
                  <span className={onTime ? 'text-emerald-400' : 'text-red-400'}>
                    {onTime ? 'Đúng hạn' : 'Quá hạn SLA'}
                  </span>
                  )
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(incident)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 rounded-md hover:bg-slate-700"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh sửa hồ sơ</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng chi tiết"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Interactive 6-Step Workflow Stepper */}
          <div className="bg-[#09111f] border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-200">
                Quy trình xử lý vụ việc (6 bước)
              </span>
              {nextStage && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={transitionNote}
                    onChange={(e) => setTransitionNote(e.target.value)}
                    placeholder={`Ghi chú chuyển bước sang "${nextStage}"...`}
                    className="w-64 bg-[#101a2d] border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onTransitionWorkflow(incident.id, nextStage, transitionNote.trim() || undefined);
                      setTransitionNote('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors whitespace-nowrap"
                  >
                    <span>Chuyển sang: {nextStage}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {STATUS_ORDER.map((step, idx) => {
                const isCurrent = idx === currentStageIdx;
                const isDone = idx < currentStageIdx;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => {
                      if (step !== incident.status) {
                        onTransitionWorkflow(
                          incident.id,
                          step,
                          transitionNote.trim() || undefined
                        );
                        setTransitionNote('');
                      }
                    }}
                    className={`text-left px-2.5 py-2 rounded-md border text-xs transition-colors ${
                      isCurrent
                        ? 'bg-blue-600/20 border-blue-500 text-blue-100 font-semibold'
                        : isDone
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-[#101a2d] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                      <span>Bước 0{idx + 1}</span>
                      {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <div className="truncate">{step}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Structured Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-[#09111f] border border-slate-800 rounded-lg p-4">
            <div>
              <span className="text-slate-400">Gắn sự kiện</span>
              <select
                value={incident.eventId}
                onChange={(e) => onReassignScope(incident.id, e.target.value, incident.zoneId)}
                aria-label="Gắn vụ việc vào sự kiện"
                className="mt-1 w-full bg-[#101a2d] border border-slate-700 rounded px-2 py-1 text-xs text-slate-100"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.code} — {ev.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-slate-400">Gắn khu vực phát sinh</span>
              <select
                value={incident.zoneId}
                onChange={(e) => onReassignScope(incident.id, incident.eventId, e.target.value)}
                aria-label="Gắn vụ việc vào khu vực"
                className="mt-1 w-full bg-[#101a2d] border border-slate-700 rounded px-2 py-1 text-xs text-slate-100"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.code} — {z.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-slate-400">Nhóm phân loại</span>
              <p className="text-slate-100 font-medium mt-0.5">{catName}</p>
            </div>
            <div>
              <span className="text-slate-400">Nguồn thông tin</span>
              <p className="text-slate-100 font-medium mt-0.5">{incident.source}</p>
            </div>
            <div>
              <span className="text-slate-400">Người tiếp nhận</span>
              <p className="text-slate-100 font-medium mt-0.5">{incident.receiverName}</p>
            </div>
            <div>
              <span className="text-slate-400">Người phụ trách (đổi nhanh)</span>
              <select
                value={incident.assignedStaffId}
                onChange={(e) => onReassignStaff(incident.id, e.target.value)}
                aria-label="Đổi cán bộ phụ trách"
                className="mt-1 w-full bg-[#101a2d] border border-slate-700 rounded px-2 py-1 text-xs text-slate-100"
              >
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.fullName} ({s.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <span className="text-slate-400">Nội dung mô tả ban đầu</span>
              <p className="text-slate-200 mt-0.5 leading-relaxed">{incident.description}</p>
            </div>
          </div>

          {/* Detail Tabs */}
          <div className="border-b border-slate-800 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('progress')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'progress'
                  ? 'border-blue-500 text-blue-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Diễn biến xử lý & Kết quả ({incident.progressUpdates.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('evidence')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'evidence'
                  ? 'border-blue-500 text-blue-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>
                Bằng chứng ({incident.evidences.length}) & Cảnh báo ({linkedAlerts.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Nhật ký thao tác ({incident.auditLogs.length})</span>
            </button>
          </div>

          {/* TAB 1: Diễn biến xử lý & Kết quả */}
          {activeTab === 'progress' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 space-y-3">
                <h3 className="text-xs font-semibold text-slate-200">
                  Dòng thời gian diễn biến xử lý
                </h3>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {incident.progressUpdates.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-md bg-[#09111f] border border-slate-800 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-blue-300">{entry.stage}</span>
                        <span className="font-mono tabular-nums text-[11px] text-slate-400">
                          {formatDateTimeVi(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-slate-200">{entry.note}</p>
                      <p className="text-[11px] text-slate-400">Thực hiện: {entry.actor}</p>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!progressNote.trim()) return;
                    onAddProgress(incident.id, progressNote.trim());
                    setProgressNote('');
                  }}
                  className="flex gap-2 pt-1"
                >
                  <input
                    type="text"
                    value={progressNote}
                    onChange={(e) => setProgressNote(e.target.value)}
                    placeholder={`Ghi nhận diễn biến mới (${assignedStaff?.fullName ?? 'Cán bộ xử lý'})...`}
                    className="flex-1 bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ghi diễn biến</span>
                  </button>
                </form>
              </div>

              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-xs font-semibold text-slate-200">
                  Kết quả xử lý & Nghiệm thu hiện trường
                </h3>
                <div className="bg-[#09111f] border border-slate-800 rounded-lg p-3.5 space-y-3">
                  <textarea
                    rows={5}
                    value={resultText}
                    onChange={(e) => setResultText(e.target.value)}
                    placeholder="Nhập kết luận cuối cùng, biện pháp khắc phục, bàn giao hiện trường..."
                    className="w-full bg-[#101a2d] border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      Phụ trách: {assignedStaff?.fullName ?? incident.assignedStaffId}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateResult(incident.id, resultText.trim())}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition-colors"
                    >
                      Lưu kết quả xử lý
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Bằng chứng & Cảnh báo liên kết */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              {/* Evidences */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-slate-200">
                  Danh sách bằng chứng ({incident.evidences.length})
                </h3>
                {incident.evidences.length === 0 ? (
                  <p className="text-xs text-slate-400">Chưa có bằng chứng đính kèm.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {incident.evidences.map((evd) => (
                      <div
                        key={evd.id}
                        className="p-3 bg-[#09111f] border border-slate-800 rounded-md text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 font-mono text-blue-300">
                            <FileText className="w-3.5 h-3.5" />
                            {evd.referenceCode}
                          </span>
                          <span className="text-[11px] text-slate-400">{evd.type}</span>
                        </div>
                        <p className="font-medium text-slate-100">{evd.title}</p>
                        <p className="text-slate-400">{evd.description}</p>
                        <p className="text-[11px] font-mono text-slate-500">
                          {formatDateTimeVi(evd.capturedAt)} · {evd.addedBy}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add evidence inline */}
                <div className="bg-[#09111f] border border-slate-800 rounded-md p-3 space-y-2">
                  <div className="text-xs font-medium text-slate-300">Bổ sung bằng chứng mới</div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <select
                      value={evdType}
                      onChange={(e) => setEvdType(e.target.value as EvidenceType)}
                      className="md:col-span-3 bg-[#101a2d] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100"
                    >
                      {EVIDENCE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={evdTitle}
                      onChange={(e) => setEvdTitle(e.target.value)}
                      placeholder="Tên tài liệu / ảnh / biên bản *"
                      className="md:col-span-4 bg-[#101a2d] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100"
                    />
                    <input
                      type="text"
                      value={evdRef}
                      onChange={(e) => setEvdRef(e.target.value)}
                      placeholder="Mã file / camera"
                      className="md:col-span-2 bg-[#101a2d] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                    />
                    <input
                      type="text"
                      value={evdDesc}
                      onChange={(e) => setEvdDesc(e.target.value)}
                      placeholder="Ghi chú ngắn"
                      className="md:col-span-3 bg-[#101a2d] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!evdTitle.trim()) return;
                        onAddEvidence(incident.id, {
                          type: evdType,
                          title: evdTitle.trim(),
                          referenceCode: evdRef.trim() || `EVD-${incident.evidences.length + 1}`,
                          description: evdDesc.trim() || 'Tài liệu bổ sung trong quá trình điều tra xử lý.',
                        });
                        setEvdTitle('');
                        setEvdRef('');
                        setEvdDesc('');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-500"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm bằng chứng</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Linked alerts */}
              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-slate-200">
                    Cảnh báo hợp nhất vào hồ sơ ({linkedAlerts.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Nhiều cảnh báo gộp vào 1 hồ sơ vẫn chỉ tính là 01 vụ việc trên Dashboard.
                  </span>
                </div>

                {linkedAlerts.length > 0 && (
                  <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-md bg-[#09111f]">
                    {linkedAlerts.map((alt) => (
                      <div key={alt.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                        <div className="min-w-0">
                          <span className="font-mono text-amber-300">{alt.code}</span>
                          <span className="text-slate-500 mx-1.5">·</span>
                          <span className="text-slate-400">
                            {alt.source} ({alt.deviceId})
                          </span>
                          <p className="text-slate-200 truncate mt-0.5">{alt.title}</p>
                        </div>
                        <AlertStatusText status={alt.status} />
                      </div>
                    ))}
                  </div>
                )}

                {availableAlerts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      value={alertToLink}
                      onChange={(e) => setAlertToLink(e.target.value)}
                      className="flex-1 bg-[#09111f] border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="">Chọn cảnh báo chưa xác minh để gộp thêm vào hồ sơ...</option>
                      {availableAlerts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} — {a.title} ({a.deviceId})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!alertToLink}
                      onClick={() => {
                        if (alertToLink) {
                          onLinkAlert(alertToLink, incident.id);
                          setAlertToLink('');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 rounded-md hover:bg-slate-700 disabled:opacity-40"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Gộp cảnh báo</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Nhật ký thao tác (Audit Log) */}
          {activeTab === 'audit' && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold text-slate-200">
                Nhật ký thao tác hệ thống ({incident.auditLogs.length} bản ghi)
              </h3>
              <div className="overflow-x-auto border border-slate-800 rounded-md bg-[#09111f]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 px-3 font-medium">Thời gian</th>
                      <th className="py-2 px-3 font-medium">Người thực hiện</th>
                      <th className="py-2 px-3 font-medium">Hành động</th>
                      <th className="py-2 px-3 font-medium">Chi tiết thay đổi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {incident.auditLogs
                      .slice()
                      .reverse()
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                            {formatDateTimeVi(log.timestamp)}
                          </td>
                          <td className="py-2 px-3 text-slate-200 whitespace-nowrap">{log.actor}</td>
                          <td className="py-2 px-3 font-medium text-blue-300 whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="py-2 px-3 text-slate-300">{log.detail}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

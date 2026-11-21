import { FilePlus2, Save, Shield, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { DEMO_REFERENCE_DATE } from '../../data/demoSeed';
import {
  EvidenceType,
  IncidentCategory,
  IncidentEvidence,
  IncidentRecordType,
  IncidentSeverity,
  IncidentStatus,
  SecurityEvent,
  SecurityIncident,
  SecurityStaff,
  SecurityZone,
} from '../../types/security';
import {
  SEVERITY_ORDER,
  STATUS_ORDER,
  formatDateTimeVi,
  getResolutionMinutes,
  isIncidentOnTime,
  isResolvedStatus,
} from '../../utils/analyticsEngine';

interface IncidentModalProps {
  incident: SecurityIncident | null; // null = create mode
  events: SecurityEvent[];
  zones: SecurityZone[];
  categories: IncidentCategory[];
  staff: SecurityStaff[];
  defaultEventId?: string;
  defaultZoneId?: string;
  onClose: () => void;
  onSave: (incident: SecurityIncident, isNew: boolean) => void;
}

const SOURCE_OPTIONS = [
  'Camera AI',
  'Cổng kiểm soát từ',
  'Tổ tuần tra',
  'Đường dây nóng An ninh',
  'Cảm biến PCCC',
  'Máy soi X-Ray',
  'Giám sát mạng',
  'Ban tổ chức',
  'Khách tham dự',
];

const EVIDENCE_TYPES: EvidenceType[] = [
  'Ảnh Camera',
  'Video trích xuất',
  'Biên bản hiện trường',
  'Log thiết bị',
  'Hình ảnh hiện vật',
];

export function IncidentModal({
  incident,
  events,
  zones,
  categories,
  staff,
  defaultEventId,
  defaultZoneId,
  onClose,
  onSave,
}: IncidentModalProps) {
  const isNew = incident === null;
  const nowIso = `${DEMO_REFERENCE_DATE}T18:15:00`;
  const defaultLocalInput = (iso?: string) => (iso ? iso.slice(0, 16) : `${DEMO_REFERENCE_DATE}T18:10`);

  const [title, setTitle] = useState(incident?.title ?? '');
  const [description, setDescription] = useState(incident?.description ?? '');
  const [recordType, setRecordType] = useState<IncidentRecordType>(incident?.recordType ?? 'Vụ việc');
  const [eventId, setEventId] = useState(
    incident?.eventId ?? (defaultEventId && defaultEventId !== 'ALL' ? defaultEventId : events[0]?.id ?? 'EVT-01')
  );
  const [zoneId, setZoneId] = useState(incident?.zoneId ?? defaultZoneId ?? zones[0]?.id ?? 'ZON-01');
  const [categoryId, setCategoryId] = useState(incident?.categoryId ?? categories[0]?.id ?? 'CAT-01');
  const [severity, setSeverity] = useState<IncidentSeverity>(incident?.severity ?? 'Trung bình');
  const [status, setStatus] = useState<IncidentStatus>(incident?.status ?? 'Mới tiếp nhận');
  const [detectedAtInput, setDetectedAtInput] = useState(defaultLocalInput(incident?.detectedAt));
  const [source, setSource] = useState(incident?.source ?? SOURCE_OPTIONS[0]);
  const [receiverName, setReceiverName] = useState(incident?.receiverName ?? 'Trung tá Lê Quang Minh');
  const [assignedStaffId, setAssignedStaffId] = useState(incident?.assignedStaffId ?? staff[0]?.id ?? 'STF-01');
  const [resolutionNotes, setResolutionNotes] = useState(incident?.resolutionNotes ?? '');
  const [evidences, setEvidences] = useState<IncidentEvidence[]>(incident?.evidences ?? []);

  // New evidence inline builder
  const [evdType, setEvdType] = useState<EvidenceType>('Ảnh Camera');
  const [evdTitle, setEvdTitle] = useState('');
  const [evdRef, setEvdRef] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedCat = categories.find((c) => c.id === categoryId);
  const slaMinutes = incident?.slaMinutes ?? selectedCat?.defaultSlaMinutes ?? 15;

  const handleAddEvidence = () => {
    if (!evdTitle.trim()) return;
    const item: IncidentEvidence = {
      id: `EVD-${Date.now().toString().slice(-6)}`,
      type: evdType,
      title: evdTitle.trim(),
      referenceCode: evdRef.trim() || `FILE-${String(evidences.length + 1).padStart(2, '0')}`,
      description: 'Tài liệu bằng chứng đính kèm từ biểu mẫu hồ sơ.',
      capturedAt: nowIso,
      addedBy: receiverName.trim() || 'Trung tá Lê Quang Minh',
    };
    setEvidences((prev) => [...prev, item]);
    setEvdTitle('');
    setEvdRef('');
  };

  const handleRemoveEvidence = (id: string) => {
    setEvidences((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề hồ sơ vụ việc.');
      return;
    }

    const detectedIso = detectedAtInput.length === 16 ? `${detectedAtInput}:00` : nowIso;
    const wasResolved = incident ? isResolvedStatus(incident.status) : false;
    const nowResolved = isResolvedStatus(status);
    let resolvedAt = incident?.resolvedAt;
    if (!wasResolved && nowResolved) {
      resolvedAt = nowIso;
    } else if (!nowResolved) {
      resolvedAt = undefined;
    }

    const id = incident?.id ?? `INC-2026-${String(Date.now()).slice(-5)}`;
    const actor = receiverName.trim() || 'Trung tá Lê Quang Minh';
    const assignedStaff = staff.find((s) => s.id === assignedStaffId);

    const nextProgress = [...(incident?.progressUpdates ?? [])];
    const nextAudit = [...(incident?.auditLogs ?? [])];

    if (isNew) {
      nextProgress.push({
        id: `PRG-${Date.now()}`,
        timestamp: nowIso,
        actor,
        stage: status,
        note: `Khởi tạo hồ sơ từ nguồn ${source}. Phân công phụ trách: ${assignedStaff?.fullName ?? assignedStaffId}.`,
      });
      nextAudit.push({
        id: `AUD-${Date.now()}`,
        timestamp: nowIso,
        actor,
        action: 'Tạo hồ sơ vụ việc mới',
        detail: `${id} · Mức độ ${severity} · Trạng thái ${status}`,
      });
    } else {
      const changes: string[] = [];
      if (incident.status !== status) {
        changes.push(`Trạng thái: ${incident.status} → ${status}`);
        nextProgress.push({
          id: `PRG-${Date.now()}`,
          timestamp: nowIso,
          actor,
          stage: status,
          note: resolutionNotes.trim() || `Cập nhật trạng thái hồ sơ sang "${status}".`,
        });
      }
      if (incident.severity !== severity) changes.push(`Mức độ: ${incident.severity} → ${severity}`);
      if (incident.zoneId !== zoneId) changes.push(`Thay đổi khu vực`);
      if (incident.assignedStaffId !== assignedStaffId) {
        changes.push(`Phụ trách: ${assignedStaff?.fullName ?? assignedStaffId}`);
      }
      if (evidences.length !== incident.evidences.length) {
        changes.push(`Cập nhật bằng chứng (${evidences.length} mục)`);
      }

      nextAudit.push({
        id: `AUD-${Date.now()}`,
        timestamp: nowIso,
        actor,
        action: 'Chỉnh sửa hồ sơ vụ việc',
        detail: changes.length > 0 ? changes.join(' · ') : 'Cập nhật nội dung chi tiết và kết quả xử lý.',
      });
    }

    const saved: SecurityIncident = {
      id,
      code: incident?.code ?? id,
      title: title.trim(),
      description: description.trim() || 'Hồ sơ được lập từ trung tâm điều hành an ninh.',
      recordType,
      eventId,
      zoneId,
      categoryId,
      severity,
      status,
      detectedAt: detectedIso,
      reportedAt: incident?.reportedAt ?? nowIso,
      resolvedAt,
      slaMinutes,
      source,
      receiverName: actor,
      assignedStaffId,
      reporterName: incident?.reporterName ?? source,
      linkedAlertIds: incident?.linkedAlertIds ?? [],
      evidences,
      progressUpdates: nextProgress,
      auditLogs: nextAudit,
      resolutionNotes: resolutionNotes.trim() || undefined,
    };

    onSave(saved, isNew);
    onClose();
  };

  const resMinutes = incident ? getResolutionMinutes(incident) : null;
  const onTime = incident ? isIncidentOnTime(incident) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={isNew ? 'Tạo hồ sơ vụ việc mới' : `Chỉnh sửa hồ sơ ${incident.code}`}
    >
      <div className="w-full max-w-4xl bg-[#0e1729] border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {isNew ? 'Lập hồ sơ Vụ việc / Sự cố an ninh mới' : `Chỉnh sửa hồ sơ ${incident.code}`}
              </h2>
              {!isNew && (
                <p className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                  Tiếp nhận: {formatDateTimeVi(incident.reportedAt)} · SLA: {slaMinutes} phút
                  {resMinutes !== null && (
                    <> · Thời gian xử lý: {resMinutes} phút ({onTime ? 'Đúng hạn' : 'Quá hạn SLA'})</>
                  )}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng biểu mẫu"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/40 text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Row 1: Classification, Severity, Workflow Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Phân loại hồ sơ</label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value as IncidentRecordType)}
                className="w-full bg-[#09111f] border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="Vụ việc">Vụ việc (Đã xác minh)</option>
                <option value="Sự cố">Sự cố (Ứng phó chuyên biệt)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Mức độ nghiêm trọng</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full bg-[#09111f] border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {SEVERITY_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Trạng thái Workflow</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IncidentStatus)}
                className="w-full bg-[#09111f] border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {STATUS_ORDER.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tiêu đề vụ việc / sự cố *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Phát hiện hành lý bỏ quên gần Cổng kiểm soát A1"
              className="w-full bg-[#09111f] border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Row 2: Event, Zone, Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Sự kiện</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full bg-[#09111f] border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.code} — {ev.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Khu vực phát sinh *</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full bg-[#09111f] border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {(() => {
                  const selectedEv = events.find((ev) => ev.id === eventId);
                  return zones.map((z) => {
                    const inEv = selectedEv ? selectedEv.zoneIds.includes(z.id) : true;
                    return (
                      <option key={z.id} value={z.id}>
                        {z.code} — {z.name} {inEv ? '' : '(Ngoài sự kiện)'}
                      </option>
                    );
                  });
                })()}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nhóm loại vụ việc</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#09111f] border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Thời gian phát hiện, Nguồn thông tin, Người tiếp nhận, Người phụ trách */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Thời gian phát hiện</label>
              <input
                type="datetime-local"
                value={detectedAtInput}
                onChange={(e) => setDetectedAtInput(e.target.value)}
                className="w-full bg-[#09111f] border border-slate-700 rounded-md px-2.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nguồn thông tin</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-[#09111f] border border-slate-700 rounded-md px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {SOURCE_OPTIONS.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Người tiếp nhận</label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Cán bộ trực ban tiếp nhận"
                className="w-full bg-[#09111f] border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Người phụ trách</label>
              <select
                value={assignedStaffId}
                onChange={(e) => setAssignedStaffId(e.target.value)}
                className="w-full bg-[#09111f] border border-slate-700 rounded-md px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.fullName} ({s.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nội dung & Diễn biến ban đầu</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi nhận chi tiết hiện trường, đối tượng liên quan, biện pháp ứng phó ban đầu..."
              className="w-full bg-[#09111f] border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Evidence Attachment Builder */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Bằng chứng hiện trường ({evidences.length})
              </span>
            </div>

            {evidences.length > 0 && (
              <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-md bg-[#09111f]">
                {evidences.map((evd) => (
                  <div key={evd.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <span className="font-mono text-blue-300">{evd.referenceCode}</span>
                      <span className="text-slate-500 mx-1.5">·</span>
                      <span className="text-slate-400">{evd.type}</span>
                      <span className="text-slate-500 mx-1.5">·</span>
                      <span className="text-slate-100 font-medium">{evd.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidence(evd.id)}
                      aria-label={`Xóa bằng chứng ${evd.title}`}
                      className="p-1 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <select
                value={evdType}
                onChange={(e) => setEvdType(e.target.value as EvidenceType)}
                className="md:col-span-3 bg-[#09111f] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
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
                placeholder="Tên bằng chứng (vd: Ảnh camera cổng A1)"
                className="md:col-span-5 bg-[#09111f] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100"
              />
              <input
                type="text"
                value={evdRef}
                onChange={(e) => setEvdRef(e.target.value)}
                placeholder="Mã tham chiếu (vd: CAM-02-05)"
                className="md:col-span-2 bg-[#09111f] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono"
              />
              <button
                type="button"
                onClick={handleAddEvidence}
                className="md:col-span-2 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 rounded hover:bg-slate-700"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>Đính kèm</span>
              </button>
            </div>
          </div>

          {/* Resolution Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Kết quả & Biên bản xử lý</label>
            <textarea
              rows={2}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Ghi nhận kết quả xử lý, nghiệm thu hiện trường (bắt buộc khi đóng hồ sơ)..."
              className="w-full bg-[#09111f] border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-[#09111f] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isNew ? 'Lưu & Lập hồ sơ' : 'Cập nhật hồ sơ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

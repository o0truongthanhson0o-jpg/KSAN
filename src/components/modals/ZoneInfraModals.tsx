import { MapPin, Save, Shield, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import {
  MapPointStatus,
  MapPointType,
  SecurityEvent,
  SecurityZone,
  ZoneMapPoint,
  ZoneType,
} from '../../types/security';

const ZONE_TYPES: ZoneType[] = [
  'Sân khấu',
  'Cổng kiểm soát',
  'VIP',
  'Triển lãm',
  'Bãi đỗ xe',
  'Kỹ thuật',
];

const PROTECTION_LEVELS: SecurityZone['protectionLevel'][] = [
  'Tuyệt mật',
  'Rất cao',
  'Cao',
  'Trung bình',
];

const UNITS = [
  'Phản ứng nhanh',
  'Kiểm soát cổng',
  'Bảo vệ VIP',
  'Giám sát CCTV',
  'Tuần tra khu vực',
];

export const MAP_POINT_TYPES: MapPointType[] = [
  'Cổng kiểm soát',
  'Lối vào',
  'Lối ra',
  'Vùng hạn chế',
  'Điểm tập kết',
];

export const MAP_POINT_STATUSES: MapPointStatus[] = [
  'Hoạt động',
  'Hạn chế',
  'Khóa khẩn cấp',
];

interface ZoneFormModalProps {
  zone: SecurityZone | null;
  events: SecurityEvent[];
  existingZonesCount: number;
  defaultEventId?: string;
  onClose: () => void;
  onSave: (zone: SecurityZone, attachedEventIds: string[], isNew: boolean) => void;
}

export function ZoneFormModal({
  zone,
  events,
  existingZonesCount,
  defaultEventId,
  onClose,
  onSave,
}: ZoneFormModalProps) {
  const isNew = zone === null;

  const initialAttachedEvents = zone
    ? events.filter((e) => e.zoneIds.includes(zone.id)).map((e) => e.id)
    : defaultEventId && defaultEventId !== 'ALL'
    ? [defaultEventId]
    : events.map((e) => e.id);

  const [code, setCode] = useState(
    zone?.code ?? `KV-MOI-${String(existingZonesCount + 1).padStart(2, '0')}`
  );
  const [name, setName] = useState(zone?.name ?? '');
  const [type, setType] = useState<ZoneType>(zone?.type ?? 'Triển lãm');
  const [protectionLevel, setProtectionLevel] = useState<SecurityZone['protectionLevel']>(
    zone?.protectionLevel ?? 'Cao'
  );
  const [isRestricted, setIsRestricted] = useState<boolean>(zone?.isRestricted ?? false);
  const [capacity, setCapacity] = useState<number>(zone?.capacity ?? 1200);
  const [currentOccupancy, setCurrentOccupancy] = useState<number>(zone?.currentOccupancy ?? 0);
  const [cameraCount, setCameraCount] = useState<number>(zone?.cameraCount ?? 8);
  const [gateCount, setGateCount] = useState<number>(zone?.gateCount ?? 2);
  const [assignedUnit, setAssignedUnit] = useState<string>(zone?.assignedUnit ?? UNITS[0]);
  const [assemblyPoint, setAssemblyPoint] = useState<string>(
    zone?.assemblyPoint ?? 'Điểm tập kết Quảng trường Nam (TK-02)'
  );
  const [description, setDescription] = useState<string>(zone?.description ?? '');
  const [attachedEventIds, setAttachedEventIds] = useState<string[]>(initialAttachedEvents);

  // Default placement for new zones in an unoccupied slot or adjustable
  const [rectX, setRectX] = useState<number>(zone?.mapRect.x ?? 310);
  const [rectY, setRectY] = useState<number>(zone?.mapRect.y ?? 145);
  const [rectW, setRectW] = useState<number>(zone?.mapRect.w ?? 200);
  const [rectH, setRectH] = useState<number>(zone?.mapRect.h ?? 130);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleEvent = (evId: string) => {
    setAttachedEventIds((prev) =>
      prev.includes(evId) ? prev.filter((id) => id !== evId) : [...prev, evId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Mã và Tên khu vực.');
      return;
    }

    const id = zone?.id ?? `ZON-${String(existingZonesCount + 1).padStart(2, '0')}`;
    const saved: SecurityZone = {
      id,
      code: code.trim(),
      name: name.trim(),
      type,
      capacity: Math.max(50, Number(capacity) || 500),
      currentOccupancy: Math.max(0, Number(currentOccupancy) || 0),
      protectionLevel,
      isRestricted,
      cameraCount: Math.max(0, Number(cameraCount) || 0),
      gateCount: Math.max(0, Number(gateCount) || 0),
      assignedUnit,
      assemblyPoint: assemblyPoint.trim() || undefined,
      description: description.trim() || undefined,
      mapRect: {
        x: Math.max(30, Math.min(760, Number(rectX) || 100)),
        y: Math.max(25, Math.min(350, Number(rectY) || 100)),
        w: Math.max(120, Math.min(400, Number(rectW) || 180)),
        h: Math.max(90, Math.min(260, Number(rectH) || 130)),
      },
    };

    onSave(saved, attachedEventIds, isNew);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={isNew ? 'Phân chia khu vực an ninh mới' : `Chỉnh sửa khu vực ${zone.code}`}
    >
      <div className="w-full max-w-3xl bg-[#0e1729] border border-slate-700 rounded-xl shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-slate-100">
              {isNew ? 'Phân chia khu vực an ninh mới' : `Chỉnh sửa khu vực ${zone.code}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng biểu mẫu khu vực"
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Mã khu vực *</label>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">Tên khu vực *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Khu Báo chí & Trung tâm Truyền hình"
                className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Loại khu vực</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ZoneType)}
                className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100"
              >
                {ZONE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Sức chứa tối đa</label>
              <input
                type="number"
                min={50}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Hiện diện hiện tại</label>
              <input
                type="number"
                min={0}
                value={currentOccupancy}
                onChange={(e) => setCurrentOccupancy(Number(e.target.value))}
                className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Cấp độ bảo vệ</label>
              <select
                value={protectionLevel}
                onChange={(e) =>
                  setProtectionLevel(e.target.value as SecurityZone['protectionLevel'])
                }
                className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100"
              >
                {PROTECTION_LEVELS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Đơn vị phụ trách</label>
              <select
                value={assignedUnit}
                onChange={(e) => setAssignedUnit(e.target.value)}
                className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-slate-400 mb-1">Số mắt Camera</label>
              <input
                type="number"
                min={0}
                value={cameraCount}
                onChange={(e) => setCameraCount(Number(e.target.value))}
                className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Số cổng dự kiến</label>
              <input
                type="number"
                min={0}
                value={gateCount}
                onChange={(e) => setGateCount(Number(e.target.value))}
                className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <label className="flex items-center gap-2 p-2.5 rounded bg-[#09111f] border border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isRestricted}
                onChange={(e) => setIsRestricted(e.target.checked)}
                className="accent-red-500"
              />
              <span className="text-slate-200 font-medium">Đánh dấu là Vùng hạn chế đặc biệt</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Điểm tập kết sơ tán chính</label>
              <input
                value={assemblyPoint}
                onChange={(e) => setAssemblyPoint(e.target.value)}
                placeholder="VD: Điểm tập kết Quảng trường Nam (TK-02)"
                className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Mô tả phạm vi khu vực</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giới hạn vật lý, yêu cầu kiểm tra thẻ, tuyến tuần tra..."
                className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          {/* Floor plan rect coordinates */}
          <div className="p-3 bg-[#09111f] border border-slate-800 rounded-md space-y-2">
            <div className="font-medium text-slate-300">
              Vị trí khung khu vực trên sơ đồ mặt bằng (khung 840×420)
            </div>
            <div className="grid grid-cols-4 gap-2.5 font-mono">
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Tọa độ X</label>
                <input
                  type="number"
                  value={rectX}
                  onChange={(e) => setRectX(Number(e.target.value))}
                  className="w-full bg-[#101a2d] border border-slate-700 rounded px-2 py-1 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Tọa độ Y</label>
                <input
                  type="number"
                  value={rectY}
                  onChange={(e) => setRectY(Number(e.target.value))}
                  className="w-full bg-[#101a2d] border border-slate-700 rounded px-2 py-1 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Rộng (W)</label>
                <input
                  type="number"
                  value={rectW}
                  onChange={(e) => setRectW(Number(e.target.value))}
                  className="w-full bg-[#101a2d] border border-slate-700 rounded px-2 py-1 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Cao (H)</label>
                <input
                  type="number"
                  value={rectH}
                  onChange={(e) => setRectH(Number(e.target.value))}
                  className="w-full bg-[#101a2d] border border-slate-700 rounded px-2 py-1 text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Attached events */}
          <div className="space-y-2">
            <div className="font-medium text-slate-300">
              Áp dụng khu vực này cho các sự kiện ({attachedEventIds.length}/{events.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {events.map((ev) => {
                const checked = attachedEventIds.includes(ev.id);
                return (
                  <label
                    key={ev.id}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                      checked
                        ? 'bg-blue-600/15 border-blue-500/60 text-slate-100'
                        : 'bg-[#09111f] border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEvent(ev.id)}
                      className="accent-blue-500"
                    />
                    <span className="truncate">
                      <strong className="font-mono text-blue-300">{ev.code}</strong> · {ev.name}
                    </span>
                  </label>
                );
              })}
            </div>
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 font-medium"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isNew ? 'Lưu khu vực mới' : 'Cập nhật khu vực'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface MapPointFormModalProps {
  point: ZoneMapPoint | null;
  zones: SecurityZone[];
  defaultZoneId: string;
  existingPointsCount: number;
  onClose: () => void;
  onSave: (point: ZoneMapPoint, isNew: boolean) => void;
  onDelete?: (pointId: string) => void;
}

const PREFIX_BY_TYPE: Record<MapPointType, string> = {
  'Cổng kiểm soát': 'C',
  'Lối vào': 'LV',
  'Lối ra': 'LR',
  'Vùng hạn chế': 'HC',
  'Điểm tập kết': 'TK',
};

export function MapPointFormModal({
  point,
  zones,
  defaultZoneId,
  existingPointsCount,
  onClose,
  onSave,
  onDelete,
}: MapPointFormModalProps) {
  const isNew = point === null;
  const initialZoneId = point?.zoneId ?? defaultZoneId;
  const initialZone = zones.find((z) => z.id === initialZoneId) ?? zones[0];

  const [type, setType] = useState<MapPointType>(point?.type ?? 'Cổng kiểm soát');
  const [zoneId, setZoneId] = useState<string>(initialZoneId);
  const [code, setCode] = useState<string>(
    point?.code ?? `${PREFIX_BY_TYPE['Cổng kiểm soát']}-${String(existingPointsCount + 1).padStart(2, '0')}`
  );
  const [name, setName] = useState<string>(point?.name ?? '');
  const [status, setStatus] = useState<MapPointStatus>(point?.status ?? 'Hoạt động');
  const [x, setX] = useState<number>(
    point?.x ?? Math.round((initialZone?.mapRect.x ?? 200) + (initialZone?.mapRect.w ?? 160) / 2)
  );
  const [y, setY] = useState<number>(
    point?.y ?? Math.round((initialZone?.mapRect.y ?? 150) + (initialZone?.mapRect.h ?? 120) / 2)
  );
  const [note, setNote] = useState<string>(point?.note ?? '');

  const handleZoneChange = (newZoneId: string) => {
    setZoneId(newZoneId);
    if (isNew) {
      const z = zones.find((item) => item.id === newZoneId);
      if (z) {
        setX(Math.round(z.mapRect.x + z.mapRect.w / 2));
        setY(Math.round(z.mapRect.y + z.mapRect.h - 24));
      }
    }
  };

  const handleTypeChange = (nextType: MapPointType) => {
    setType(nextType);
    if (isNew) {
      setCode(`${PREFIX_BY_TYPE[nextType]}-${String(existingPointsCount + 1).padStart(2, '0')}`);
      if (nextType === 'Vùng hạn chế') setStatus('Hạn chế');
      else setStatus('Hoạt động');
    }
  };

  const handleMiniMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 840;
    const relY = ((e.clientY - rect.top) / rect.height) * 420;
    setX(Math.round(Math.max(30, Math.min(810, relX))));
    setY(Math.round(Math.max(25, Math.min(395, relY))));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const saved: ZoneMapPoint = {
      id: point?.id ?? `PT-${String(Date.now()).slice(-5)}`,
      code: code.trim(),
      name: name.trim(),
      type,
      zoneId,
      status,
      x,
      y,
      note: note.trim() || undefined,
    };

    onSave(saved, isNew);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={isNew ? 'Khai báo cổng / điểm an ninh mới' : `Chỉnh sửa điểm ${point.code}`}
    >
      <div className="w-full max-w-2xl bg-[#0e1729] border border-slate-700 rounded-xl shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-slate-100">
              {isNew
                ? 'Khai báo Cổng / Lối vào / Lối ra / Vùng hạn chế / Điểm tập kết'
                : `Cập nhật điểm kiểm soát ${point.code}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng biểu mẫu điểm"
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Loại hạ tầng *</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as MapPointType)}
                className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100"
              >
                {MAP_POINT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Thuộc khu vực *</label>
              <select
                value={zoneId}
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
              <label className="block text-slate-400 mb-1">Trạng thái vận hành</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MapPointStatus)}
                className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100"
              >
                {MAP_POINT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Mã ký hiệu *</label>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: C-A2, LV-04, TK-04"
                className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">Tên điểm / Cổng / Vùng *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Cổng kiểm soát Bắc B1, Điểm tập kết Bãi cỏ Đông..."
                className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Ghi chú nghiệp vụ & Phương án kiểm soát</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Số làn cửa từ, thiết bị soi chiếu, yêu cầu phân luồng hoặc sức chứa tập kết..."
              className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100"
            />
          </div>

          {/* Interactive Coordinate Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-300">
                Chọn tọa độ trên sơ đồ mặt bằng (bấm trực tiếp lên sơ đồ)
              </span>
              <span className="font-mono text-blue-300 tabular-nums">
                X: {x} · Y: {y}
              </span>
            </div>

            <div className="bg-[#080f1c] border border-slate-800 rounded-md p-2">
              <svg
                viewBox="0 0 840 420"
                onClick={handleMiniMapClick}
                className="w-full h-44 cursor-crosshair"
                role="img"
                aria-label="Chọn tọa độ điểm trên sơ đồ mặt bằng"
              >
                <rect width="840" height="420" fill="#080f1c" />
                <rect
                  x="28"
                  y="18"
                  width="784"
                  height="384"
                  rx="6"
                  fill="none"
                  stroke="#1e293b"
                  strokeDasharray="6 4"
                />
                {zones.map((z) => {
                  const selected = z.id === zoneId;
                  return (
                    <g key={z.id}>
                      <rect
                        x={z.mapRect.x}
                        y={z.mapRect.y}
                        width={z.mapRect.w}
                        height={z.mapRect.h}
                        rx="4"
                        fill={selected ? '#172846' : '#0f192d'}
                        stroke={selected ? '#3b82f6' : '#334155'}
                        strokeWidth={selected ? 2 : 1}
                      />
                      <text
                        x={z.mapRect.x + 8}
                        y={z.mapRect.y + 18}
                        fill="#94a3b8"
                        fontSize="12"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {z.code}
                      </text>
                    </g>
                  );
                })}
                {/* Crosshair target */}
                <circle cx={x} cy={y} r="14" fill="#3b82f6" fillOpacity="0.25" stroke="#60a5fa" strokeWidth="2" />
                <circle cx={x} cy={y} r="5" fill="#f8fafc" />
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
            <div>
              {!isNew && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(point.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa điểm</span>
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 font-medium"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isNew ? 'Lưu điểm kiểm soát' : 'Cập nhật điểm'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

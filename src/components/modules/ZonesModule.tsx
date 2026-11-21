import {
  AlertTriangle,
  Camera,
  DoorClosed,
  Edit3,
  Layers,
  Map,
  MapPin,
  Plus,
  Shield,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import {
  MapPointStatus,
  MapPointType,
  SecurityAlert,
  SecurityEvent,
  SecurityIncident,
  SecurityStaff,
  SecurityZone,
  ZoneMapPoint,
} from '../../types/security';
import { isResolvedStatus } from '../../utils/analyticsEngine';
import { PaginationBar } from '../common/PaginationBar';
import {
  MAP_POINT_STATUSES,
  MAP_POINT_TYPES,
  MapPointFormModal,
  ZoneFormModal,
} from '../modals/ZoneInfraModals';

interface ZonesModuleProps {
  events: SecurityEvent[];
  zones: SecurityZone[];
  mapPoints: ZoneMapPoint[];
  incidents: SecurityIncident[];
  alerts: SecurityAlert[];
  staff: SecurityStaff[];
  selectedEventId: string;
  onSelectEventScope: (eventId: string) => void;
  onFilterZoneInIncidents: (zoneId: string) => void;
  onCreateIncidentInZone: (zoneId: string) => void;
  onSaveZone: (zone: SecurityZone, attachedEventIds: string[], isNew: boolean) => void;
  onSaveMapPoint: (point: ZoneMapPoint, isNew: boolean) => void;
  onUpdateMapPointStatus: (pointId: string, status: MapPointStatus) => void;
  onDeleteMapPoint: (pointId: string) => void;
}

const POINT_COLOR: Record<MapPointType, string> = {
  'Cổng kiểm soát': '#3B82F6',
  'Lối vào': '#10B981',
  'Lối ra': '#06B6D4',
  'Vùng hạn chế': '#EF4444',
  'Điểm tập kết': '#F59E0B',
};

const POINT_SHORT: Record<MapPointType, string> = {
  'Cổng kiểm soát': 'Cổng',
  'Lối vào': 'Vào',
  'Lối ra': 'Ra',
  'Vùng hạn chế': 'Hạn chế',
  'Điểm tập kết': 'Tập kết',
};

export function ZonesModule({
  events,
  zones,
  mapPoints,
  incidents,
  alerts,
  staff,
  selectedEventId,
  onSelectEventScope,
  onFilterZoneInIncidents,
  onCreateIncidentInZone,
  onSaveZone,
  onSaveMapPoint,
  onUpdateMapPointStatus,
  onDeleteMapPoint,
}: ZonesModuleProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id ?? 'ZON-01');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [layerFilter, setLayerFilter] = useState<'ALL' | MapPointType>('ALL');

  const [lowerTab, setLowerTab] = useState<'zones' | 'points'>('zones');
  const [search, setSearch] = useState('');
  const [pointTypeFilter, setPointTypeFilter] = useState<'ALL' | MapPointType>('ALL');
  const [page, setPage] = useState(1);

  // Modals state
  const [zoneModalTarget, setZoneModalTarget] = useState<{
    open: boolean;
    zone: SecurityZone | null;
  }>({ open: false, zone: null });

  const [pointModalTarget, setPointModalTarget] = useState<{
    open: boolean;
    point: ZoneMapPoint | null;
  }>({ open: false, point: null });

  const activeEvent =
    selectedEventId !== 'ALL' ? events.find((e) => e.id === selectedEventId) ?? null : null;

  const scopedIncidents = incidents.filter(
    (i) => selectedEventId === 'ALL' || i.eventId === selectedEventId
  );
  const scopedAlerts = alerts.filter(
    (a) => selectedEventId === 'ALL' || a.eventId === selectedEventId
  );

  const selectedZone = zones.find((z) => z.id === selectedZoneId) ?? zones[0];

  const zoneStats = (zoneId: string) => {
    const zIncs = scopedIncidents.filter((i) => i.zoneId === zoneId);
    const activeIncs = zIncs.filter((i) => !isResolvedStatus(i.status));
    const seriousOpenIncs = activeIncs.filter(
      (i) => i.severity === 'Nghiêm trọng' || i.severity === 'Khẩn cấp'
    );
    const unverifiedAlerts = scopedAlerts.filter(
      (a) => a.zoneId === zoneId && a.status === 'Chưa xác minh'
    );
    const assignedStaff = staff.filter((s) => s.assignedZoneId === zoneId && s.status !== 'Nghỉ ca');
    const zPoints = mapPoints.filter((p) => p.zoneId === zoneId);

    let alertState: {
      label: string;
      level: 'normal' | 'warning' | 'critical';
    } = { label: 'Bình thường', level: 'normal' };

    if (seriousOpenIncs.length > 0 || unverifiedAlerts.length >= 3) {
      alertState = {
        label: `Báo động cao (${unverifiedAlerts.length} CB / ${seriousOpenIncs.length} NK)`,
        level: 'critical',
      };
    } else if (unverifiedAlerts.length > 0 || activeIncs.length > 0) {
      alertState = {
        label: `Có cảnh báo (${unverifiedAlerts.length} chờ)`,
        level: 'warning',
      };
    }

    return {
      totalIncs: zIncs.length,
      activeIncs: activeIncs.length,
      seriousOpenIncs: seriousOpenIncs.length,
      unverifiedAlerts: unverifiedAlerts.length,
      staffCount: assignedStaff.length,
      pointsCount: zPoints.length,
      alertState,
    };
  };

  const visibleMapPoints = mapPoints.filter(
    (p) => layerFilter === 'ALL' || p.type === layerFilter
  );

  const filteredZones = zones.filter((z) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      z.name.toLowerCase().includes(q) ||
      z.code.toLowerCase().includes(q) ||
      z.type.toLowerCase().includes(q)
    );
  });

  const filteredPoints = mapPoints.filter((p) => {
    if (pointTypeFilter !== 'ALL' && p.type !== pointTypeFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.note ?? '').toLowerCase().includes(q)
    );
  });

  const pageSize = 6;
  const activeListLength = lowerTab === 'zones' ? filteredZones.length : filteredPoints.length;
  const totalPages = Math.max(1, Math.ceil(activeListLength / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedZones = filteredZones.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pagedPoints = filteredPoints.slice((safePage - 1) * pageSize, safePage * pageSize);

  const selectedZonePoints = selectedZone
    ? mapPoints.filter((p) => p.zoneId === selectedZone.id)
    : [];
  const selectedZoneIncidents = selectedZone
    ? scopedIncidents.filter((i) => i.zoneId === selectedZone.id).slice(0, 4)
    : [];

  return (
    <div className="space-y-5">
      {/* Page Title & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
            Quản lý khu vực & Sơ đồ mặt bằng an ninh
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Phân chia khu vực, khai báo cổng, lối vào/ra, vùng hạn chế, điểm tập kết và giám sát sự cố trực quan ·{' '}
            <span className="text-blue-300 font-medium">Dữ liệu minh họa</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPointModalTarget({ open: true, point: null })}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-100 bg-[#101a2d] border border-slate-700 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>Khai báo Cổng / Lối / Tập kết</span>
          </button>

          <button
            type="button"
            onClick={() => setZoneModalTarget({ open: true, zone: null })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Phân chia khu vực mới</span>
          </button>
        </div>
      </div>

      {/* Event Context Bar */}
      <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <Layers className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-slate-400">Phạm vi sự kiện trên sơ đồ:</span>
          <select
            value={selectedEventId}
            onChange={(e) => onSelectEventScope(e.target.value)}
            aria-label="Chọn phạm vi sự kiện trên sơ đồ khu vực"
            className="bg-[#09111f] border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tất cả sự kiện ({zones.length} khu vực)</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.code} — {ev.name} ({ev.zoneIds.length} khu vực)
              </option>
            ))}
          </select>
        </div>

        {activeEvent && (
          <div className="flex flex-wrap items-center gap-3 text-slate-300 font-mono tabular-nums">
            <span>Địa điểm: {activeEvent.venue}</span>
            <span aria-hidden="true">·</span>
            <span>
              Sức chứa: <strong className="text-slate-100">{activeEvent.totalCapacity.toLocaleString('vi-VN')}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Khu vực áp dụng: <strong className="text-blue-300">{activeEvent.zoneIds.length}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Interactive Tactical Floor Plan + Selected Zone Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        {/* Left: SVG Floor Plan */}
        <div className="xl:col-span-8 bg-[#101a2d] border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-100">
                Sơ đồ mặt bằng minh họa & Hạ tầng kiểm soát
              </h2>
            </div>

            {/* Layer Toggle Buttons */}
            <div className="flex flex-wrap items-center gap-1 bg-[#09111f] p-1 rounded-md border border-slate-800">
              <button
                type="button"
                onClick={() => setLayerFilter('ALL')}
                className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                  layerFilter === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tất cả ({mapPoints.length})
              </button>
              {MAP_POINT_TYPES.map((t) => {
                const count = mapPoints.filter((p) => p.type === t).length;
                const active = layerFilter === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLayerFilter(active ? 'ALL' : t)}
                    className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                      active ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {POINT_SHORT[t]} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#080f1c] border border-slate-800 rounded-lg p-2.5 overflow-x-auto">
            <svg
              viewBox="0 0 840 420"
              className="w-full h-auto min-w-[640px]"
              role="img"
              aria-label="Sơ đồ mặt bằng khu vực an ninh, cổng kiểm soát, lối vào ra, vùng hạn chế và điểm tập kết"
            >
              <defs>
                <pattern id="socBlueprintGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#132036" strokeWidth="1" />
                </pattern>
                <pattern
                  id="restrictedHatch"
                  width="10"
                  height="10"
                  patternTransform="rotate(45 0 0)"
                  patternUnits="userSpaceOnUse"
                >
                  <line x1="0" y1="0" x2="0" y2="10" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.16" />
                </pattern>
              </defs>

              <rect width="840" height="420" fill="url(#socBlueprintGrid)" />

              {/* Outer security perimeter */}
              <rect
                x="28"
                y="18"
                width="784"
                height="384"
                rx="8"
                fill="none"
                stroke="#334155"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <text x="42" y="32" fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace">
                VÀNH ĐAI BẢO VỆ NGOÀI · HƯỚNG TÂY (LỐI VÀO CHÍNH) ◄───► HƯỚNG ĐÔNG (VIP & HẬU CẦN)
              </text>

              {/* Connecting tactical corridors */}
              <line x1="250" y1="122" x2="280" y2="122" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.4" />
              <line x1="560" y1="122" x2="590" y2="122" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.4" />
              <line x1="420" y1="205" x2="420" y2="235" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.4" />
              <line x1="265" y1="312" x2="295" y2="312" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.4" />
              <line x1="560" y1="312" x2="590" y2="312" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.4" />

              {/* Security Zone Blocks */}
              {zones.map((z) => {
                const st = zoneStats(z.id);
                const isSelected = selectedZone?.id === z.id;
                const inEventScope = !activeEvent || activeEvent.zoneIds.includes(z.id);
                const occupancyPct = Math.min(
                  100,
                  Math.round((z.currentOccupancy / Math.max(1, z.capacity)) * 100)
                );

                const strokeColor = !inEventScope
                  ? '#1e293b'
                  : isSelected
                  ? '#3B82F6'
                  : st.alertState.level === 'critical'
                  ? '#EF4444'
                  : st.alertState.level === 'warning'
                  ? '#F59E0B'
                  : '#334155';

                const fillColor = isSelected ? '#152542' : '#0e182b';
                const barFill =
                  occupancyPct > 85 ? '#EF4444' : occupancyPct > 70 ? '#F59E0B' : '#3B82F6';
                const barWidth = Math.max(4, Math.round(((z.mapRect.w - 24) * occupancyPct) / 100));

                return (
                  <g
                    key={z.id}
                    onClick={() => {
                      setSelectedZoneId(z.id);
                      setSelectedPointId(null);
                    }}
                    className="cursor-pointer"
                    opacity={inEventScope ? 1 : 0.4}
                  >
                    <rect
                      x={z.mapRect.x}
                      y={z.mapRect.y}
                      width={z.mapRect.w}
                      height={z.mapRect.h}
                      rx="6"
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    {z.isRestricted && (
                      <rect
                        x={z.mapRect.x}
                        y={z.mapRect.y}
                        width={z.mapRect.w}
                        height={z.mapRect.h}
                        rx="6"
                        fill="url(#restrictedHatch)"
                      />
                    )}

                    {/* Zone code + Protection + Restricted label */}
                    <text
                      x={z.mapRect.x + 12}
                      y={z.mapRect.y + 20}
                      fill={z.isRestricted ? '#fca5a5' : '#93c5fd'}
                      fontSize="10.5"
                      fontWeight="600"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {z.code} · {z.protectionLevel}
                      {z.isRestricted ? ' · HẠN CHẾ' : ''}
                    </text>

                    {/* Zone Name */}
                    <text
                      x={z.mapRect.x + 12}
                      y={z.mapRect.y + 39}
                      fill="#f1f5f9"
                      fontSize="12"
                      fontWeight="600"
                    >
                      {z.name.length > 26 ? `${z.name.slice(0, 25)}…` : z.name}
                    </text>

                    {/* Capacity Bar */}
                    <text
                      x={z.mapRect.x + 12}
                      y={z.mapRect.y + 60}
                      fill="#94a3b8"
                      fontSize="10.5"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      Sức chứa: {z.currentOccupancy.toLocaleString('vi-VN')}/{z.capacity.toLocaleString('vi-VN')} ({occupancyPct}%)
                    </text>
                    <rect
                      x={z.mapRect.x + 12}
                      y={z.mapRect.y + 66}
                      width={z.mapRect.w - 24}
                      height="5"
                      rx="2"
                      fill="#09111f"
                    />
                    <rect
                      x={z.mapRect.x + 12}
                      y={z.mapRect.y + 66}
                      width={barWidth}
                      height="5"
                      rx="2"
                      fill={barFill}
                    />

                    {/* Incident Count */}
                    <text
                      x={z.mapRect.x + 12}
                      y={z.mapRect.y + 89}
                      fill={st.activeIncs > 0 ? '#fca5a5' : '#cbd5e1'}
                      fontSize="10.5"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      Vụ việc: {st.activeIncs} mở / {st.totalIncs} tổng
                    </text>

                    {/* Alert Status */}
                    <text
                      x={z.mapRect.x + 12}
                      y={z.mapRect.y + 107}
                      fill={
                        st.alertState.level === 'critical'
                          ? '#f87171'
                          : st.alertState.level === 'warning'
                          ? '#fbbf24'
                          : '#34d399'
                      }
                      fontSize="10.5"
                      fontWeight="600"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {st.alertState.label}
                    </text>
                  </g>
                );
              })}

              {/* Infrastructure Map Points (Cổng, Lối vào, Lối ra, Vùng hạn chế, Điểm tập kết) */}
              {visibleMapPoints.map((pt) => {
                const isPtSelected = selectedPointId === pt.id;
                const baseColor = POINT_COLOR[pt.type];
                const borderCol =
                  pt.status === 'Khóa khẩn cấp'
                    ? '#EF4444'
                    : isPtSelected
                    ? '#F8FAFC'
                    : '#09111f';

                return (
                  <g
                    key={pt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedZoneId(pt.zoneId);
                      setSelectedPointId(pt.id);
                    }}
                    className="cursor-pointer"
                  >
                    {isPtSelected && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="14"
                        fill={baseColor}
                        fillOpacity="0.25"
                        stroke="#93c5fd"
                        strokeWidth="1.5"
                      />
                    )}
                    {pt.type === 'Cổng kiểm soát' && (
                      <rect
                        x={pt.x - 7}
                        y={pt.y - 7}
                        width="14"
                        height="14"
                        rx="2"
                        fill={baseColor}
                        stroke={borderCol}
                        strokeWidth="2"
                      />
                    )}
                    {pt.type === 'Lối vào' && (
                      <polygon
                        points={`${pt.x - 8},${pt.y - 7} ${pt.x + 8},${pt.y} ${pt.x - 8},${pt.y + 7}`}
                        fill={baseColor}
                        stroke={borderCol}
                        strokeWidth="1.5"
                      />
                    )}
                    {pt.type === 'Lối ra' && (
                      <polygon
                        points={`${pt.x},${pt.y - 8} ${pt.x + 8},${pt.y} ${pt.x},${pt.y + 8} ${pt.x - 8},${pt.y}`}
                        fill={baseColor}
                        stroke={borderCol}
                        strokeWidth="1.5"
                      />
                    )}
                    {pt.type === 'Vùng hạn chế' && (
                      <polygon
                        points={`${pt.x},${pt.y - 8} ${pt.x + 8},${pt.y + 6} ${pt.x - 8},${pt.y + 6}`}
                        fill={baseColor}
                        stroke={borderCol}
                        strokeWidth="1.5"
                      />
                    )}
                    {pt.type === 'Điểm tập kết' && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="8"
                        fill={baseColor}
                        stroke={borderCol}
                        strokeWidth="2"
                      />
                    )}

                    {/* Label chip */}
                    <rect
                      x={pt.x - 20}
                      y={pt.y + 10}
                      width="40"
                      height="13"
                      rx="2"
                      fill="#09111f"
                      fillOpacity="0.88"
                    />
                    <text
                      x={pt.x}
                      y={pt.y + 19.5}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="9"
                      fontWeight="600"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {pt.code}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Floor Plan Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 pt-1">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 inline-block bg-blue-500 rounded-[2px]" />
                Cổng kiểm soát
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 inline-block bg-emerald-500" />
                Lối vào
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 inline-block bg-cyan-500 rotate-45" />
                Lối ra / Thoát hiểm
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 inline-block bg-red-500" />
                Vùng hạn chế
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 inline-block bg-amber-500 rounded-full" />
                Điểm tập kết
              </span>
            </div>
            <span>Bấm chọn khu vực hoặc ký hiệu điểm trên sơ đồ để xem chi tiết</span>
          </div>
        </div>

        {/* Right: Selected Zone Inspector */}
        {selectedZone && (
          <div className="xl:col-span-4 bg-[#101a2d] border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between space-y-4">
            {(() => {
              const st = zoneStats(selectedZone.id);
              const pct = Math.round(
                (selectedZone.currentOccupancy / Math.max(1, selectedZone.capacity)) * 100
              );

              return (
                <>
                  <div className="space-y-3.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                          <span className="text-blue-300 font-semibold">{selectedZone.code}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-300">{selectedZone.type}</span>
                          {selectedZone.isRestricted && (
                            <>
                              <span className="text-slate-500">·</span>
                              <span className="text-red-400 font-semibold">Vùng hạn chế</span>
                            </>
                          )}
                        </div>
                        <h2 className="text-base font-semibold text-slate-100 mt-1">
                          {selectedZone.name}
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={() => setZoneModalTarget({ open: true, zone: selectedZone })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-[#09111f] text-slate-300 border border-slate-700 rounded hover:bg-slate-800 shrink-0"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>
                    </div>

                    {/* Alert Status Banner */}
                    <div
                      className={`p-2.5 rounded-md border text-xs flex items-center justify-between gap-2 ${
                        st.alertState.level === 'critical'
                          ? 'bg-red-500/10 border-red-500/40 text-red-300'
                          : st.alertState.level === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                          : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Tình trạng cảnh báo: {st.alertState.label}
                      </span>
                      <span className="font-mono text-[11px]">{selectedZone.protectionLevel}</span>
                    </div>

                    {/* Capacity Progress */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Hiện diện / Sức chứa khu vực</span>
                        <span className="font-mono tabular-nums text-slate-200">
                          {selectedZone.currentOccupancy.toLocaleString('vi-VN')} /{' '}
                          {selectedZone.capacity.toLocaleString('vi-VN')} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#09111f] rounded overflow-hidden">
                        <div
                          className={`h-full ${
                            pct > 85 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>

                    {/* 4 Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-[#09111f] border border-slate-800 rounded">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                          <span>Số vụ việc (Mở / Tổng)</span>
                        </div>
                        <p className="text-base font-mono font-semibold text-slate-100 mt-1 tabular-nums">
                          {st.activeIncs} / {st.totalIncs}
                        </p>
                      </div>
                      <div className="p-2.5 bg-[#09111f] border border-slate-800 rounded">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <DoorClosed className="w-3.5 h-3.5 text-blue-400" />
                          <span>Điểm kiểm soát khai báo</span>
                        </div>
                        <p className="text-base font-mono font-semibold text-slate-100 mt-1 tabular-nums">
                          {selectedZonePoints.length} điểm
                        </p>
                      </div>
                      <div className="p-2.5 bg-[#09111f] border border-slate-800 rounded">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Camera className="w-3.5 h-3.5 text-blue-400" />
                          <span>Camera / Cổng</span>
                        </div>
                        <p className="text-base font-mono font-semibold text-slate-100 mt-1 tabular-nums">
                          {selectedZone.cameraCount} / {selectedZone.gateCount}
                        </p>
                      </div>
                      <div className="p-2.5 bg-[#09111f] border border-slate-800 rounded">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Quân số đang trực</span>
                        </div>
                        <p className="text-base font-mono font-semibold text-slate-100 mt-1 tabular-nums">
                          {st.staffCount} cán bộ
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <div>
                        Đơn vị chủ trì:{' '}
                        <strong className="text-slate-200">{selectedZone.assignedUnit}</strong>
                      </div>
                      {selectedZone.assemblyPoint && (
                        <div>
                          Điểm tập kết sơ tán:{' '}
                          <strong className="text-amber-300">{selectedZone.assemblyPoint}</strong>
                        </div>
                      )}
                    </div>

                    {/* Declared Map Points inside this Zone */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">
                          Cổng, Lối ra vào & Điểm tập kết ({selectedZonePoints.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setPointModalTarget({ open: true, point: null })}
                          className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                        >
                          + Thêm điểm
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {selectedZonePoints.length === 0 ? (
                          <p className="text-[11px] text-slate-500">
                            Chưa khai báo cổng/điểm kiểm soát tại khu vực này.
                          </p>
                        ) : (
                          selectedZonePoints.map((pt) => (
                            <div
                              key={pt.id}
                              onClick={() => setSelectedPointId(pt.id)}
                              className={`p-2 rounded border text-xs flex items-center justify-between gap-2 cursor-pointer ${
                                selectedPointId === pt.id
                                  ? 'bg-blue-600/15 border-blue-500/60'
                                  : 'bg-[#09111f] border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-semibold text-blue-300">
                                    {pt.code}
                                  </span>
                                  <span className="text-[11px] text-slate-400">· {pt.type}</span>
                                </div>
                                <div className="text-slate-200 truncate mt-0.5">{pt.name}</div>
                              </div>

                              <select
                                aria-label={`Trạng thái ${pt.name}`}
                                value={pt.status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  onUpdateMapPointStatus(pt.id, e.target.value as MapPointStatus)
                                }
                                className={`bg-[#101a2d] border border-slate-700 rounded px-1.5 py-0.5 text-[11px] ${
                                  pt.status === 'Khóa khẩn cấp'
                                    ? 'text-red-400'
                                    : pt.status === 'Hạn chế'
                                    ? 'text-amber-300'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {MAP_POINT_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Recent zone incidents preview */}
                    {selectedZoneIncidents.length > 0 && (
                      <div className="pt-2 border-t border-slate-800 space-y-1.5">
                        <span className="text-xs font-semibold text-slate-200">
                          Vụ việc gắn với khu vực ({st.totalIncs})
                        </span>
                        <div className="space-y-1">
                          {selectedZoneIncidents.slice(0, 2).map((inc) => (
                            <div
                              key={inc.id}
                              className="text-[11px] text-slate-300 flex items-center justify-between gap-2 bg-[#09111f] px-2.5 py-1.5 rounded border border-slate-800/80"
                            >
                              <span className="truncate">
                                <strong className="font-mono text-blue-300">{inc.code}</strong> ·{' '}
                                {inc.title}
                              </span>
                              <span className="shrink-0 text-slate-400">{inc.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Primary Actions for Zone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => onCreateIncidentInZone(selectedZone.id)}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Lập vụ việc tại khu vực</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onFilterZoneInIncidents(selectedZone.id)}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#09111f] hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                    >
                      <span>Xem hồ sơ vụ việc</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Lower Management Registry: Tabbed Zones List vs Map Points List */}
      <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-[#09111f] p-1 rounded-md border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setLowerTab('zones');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                lowerTab === 'zones'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Danh mục khu vực ({zones.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setLowerTab('points');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                lowerTab === 'points'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cổng, Lối vào/ra, Vùng hạn chế & Điểm tập kết ({mapPoints.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {lowerTab === 'points' && (
              <select
                value={pointTypeFilter}
                onChange={(e) => {
                  setPointTypeFilter(e.target.value as 'ALL' | MapPointType);
                  setPage(1);
                }}
                className="bg-[#09111f] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="ALL">Mọi loại điểm</option>
                {MAP_POINT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={
                lowerTab === 'zones'
                  ? 'Tìm theo mã, tên hoặc loại khu vực...'
                  : 'Tìm theo mã, tên cổng, lối vào/ra, điểm tập kết...'
              }
              className="w-full sm:w-64 bg-[#09111f] border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {lowerTab === 'zones' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-3 font-medium">Mã khu vực</th>
                  <th className="py-2 px-3 font-medium">Tên & Phân loại</th>
                  <th className="py-2 px-3 font-medium">Cấp độ bảo vệ</th>
                  <th className="py-2 px-3 font-medium text-right">Hiện diện / Sức chứa</th>
                  <th className="py-2 px-3 font-medium text-right">Điểm kiểm soát</th>
                  <th className="py-2 px-3 font-medium text-right">Vụ việc</th>
                  <th className="py-2 px-3 font-medium">Tình trạng cảnh báo</th>
                  <th className="py-2 pl-3 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 tabular-nums">
                {pagedZones.map((z) => {
                  const st = zoneStats(z.id);
                  return (
                    <tr
                      key={z.id}
                      onClick={() => setSelectedZoneId(z.id)}
                      className={`cursor-pointer transition-colors ${
                        selectedZone?.id === z.id ? 'bg-blue-600/15' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 pr-3 font-mono text-blue-300">{z.code}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-100">{z.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {z.type} {z.isRestricted ? '· Vùng hạn chế' : ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{z.protectionLevel}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                        {z.currentOccupancy.toLocaleString('vi-VN')} /{' '}
                        {z.capacity.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {st.pointsCount} điểm
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-100">
                        {st.activeIncs} / {st.totalIncs}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-medium ${
                            st.alertState.level === 'critical'
                              ? 'text-red-400'
                              : st.alertState.level === 'warning'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {st.alertState.label}
                        </span>
                      </td>
                      <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoneModalTarget({ open: true, zone: z });
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#09111f] text-slate-300 border border-slate-700 hover:bg-slate-800 mr-1.5"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateIncidentInZone(z.id);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30"
                        >
                          <span>+ Vụ việc</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-3 font-medium">Mã điểm</th>
                  <th className="py-2 px-3 font-medium">Tên cổng / lối / điểm tập kết</th>
                  <th className="py-2 px-3 font-medium">Phân loại</th>
                  <th className="py-2 px-3 font-medium">Thuộc khu vực</th>
                  <th className="py-2 px-3 font-medium text-right">Tọa độ (X, Y)</th>
                  <th className="py-2 px-3 font-medium">Trạng thái</th>
                  <th className="py-2 pl-3 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 tabular-nums">
                {pagedPoints.map((pt) => {
                  const z = zones.find((item) => item.id === pt.zoneId);
                  return (
                    <tr
                      key={pt.id}
                      onClick={() => {
                        setSelectedZoneId(pt.zoneId);
                        setSelectedPointId(pt.id);
                      }}
                      className={`cursor-pointer transition-colors ${
                        selectedPointId === pt.id ? 'bg-blue-600/15' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 pr-3 font-mono text-blue-300">{pt.code}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-100">{pt.name}</div>
                        {pt.note && <div className="text-[11px] text-slate-400">{pt.note}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{pt.type}</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {z ? `${z.code} — ${z.name}` : pt.zoneId}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        ({pt.x}, {pt.y})
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={pt.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            onUpdateMapPointStatus(pt.id, e.target.value as MapPointStatus)
                          }
                          className={`bg-[#09111f] border border-slate-700 rounded px-2 py-1 text-[11px] ${
                            pt.status === 'Khóa khẩn cấp'
                              ? 'text-red-400'
                              : pt.status === 'Hạn chế'
                              ? 'text-amber-300'
                              : 'text-emerald-400'
                          }`}
                        >
                          {MAP_POINT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPointModalTarget({ open: true, point: pt });
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#09111f] text-slate-300 border border-slate-700 hover:bg-slate-800"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Sửa</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <PaginationBar
          currentPage={safePage}
          pageSize={pageSize}
          totalItems={activeListLength}
          onPageChange={setPage}
        />
      </div>

      {/* Zone Create / Edit Modal */}
      {zoneModalTarget.open && (
        <ZoneFormModal
          zone={zoneModalTarget.zone}
          events={events}
          existingZonesCount={zones.length}
          defaultEventId={selectedEventId}
          onClose={() => setZoneModalTarget({ open: false, zone: null })}
          onSave={onSaveZone}
        />
      )}

      {/* MapPoint Create / Edit Modal */}
      {pointModalTarget.open && (
        <MapPointFormModal
          point={pointModalTarget.point}
          zones={zones}
          defaultZoneId={selectedZone?.id ?? zones[0]?.id ?? 'ZON-01'}
          existingPointsCount={mapPoints.length}
          onClose={() => setPointModalTarget({ open: false, point: null })}
          onSave={onSaveMapPoint}
          onDelete={onDeleteMapPoint}
        />
      )}
    </div>
  );
}

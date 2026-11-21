import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Layers,
  Map as MapIcon,
  MapPin,
  Plus,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  Attendee,
  SecurityAlert,
  SecurityEvent,
  SecurityIncident,
  SecurityZone,
  ZoneMapPoint,
} from '../../types/security';
import { PaginationBar } from '../common/PaginationBar';

interface EventsModuleProps {
  events: SecurityEvent[];
  zones: SecurityZone[];
  mapPoints: ZoneMapPoint[];
  incidents: SecurityIncident[];
  alerts: SecurityAlert[];
  attendees: Attendee[];
  selectedEventId: string;
  onSelectEventScope: (eventId: string) => void;
  onAddEvent: (ev: SecurityEvent) => void;
  onUpdateEvent: (ev: SecurityEvent) => void;
  onOpenZoneMapForEvent: (eventId: string) => void;
}

const SCALE_OPTIONS: SecurityEvent['scale'][] = [
  'Quốc tế',
  'Cấp Quốc gia',
  'Cấp Thành phố',
  'Nội bộ / Doanh nghiệp',
];

const STATUS_OPTIONS: SecurityEvent['status'][] = [
  'Chuẩn bị triển khai',
  'Đang diễn ra',
  'Đã kết thúc',
];

export function EventsModule({
  events,
  zones,
  mapPoints,
  incidents,
  alerts,
  attendees,
  selectedEventId,
  onSelectEventScope,
  onAddEvent,
  onUpdateEvent,
  onOpenZoneMapForEvent,
}: EventsModuleProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SecurityEvent | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('2026-11-21');
  const [endDate, setEndDate] = useState('2026-11-23');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');
  const [scale, setScale] = useState<SecurityEvent['scale']>('Cấp Quốc gia');
  const [status, setStatus] = useState<SecurityEvent['status']>('Chuẩn bị triển khai');
  const [totalCapacity, setTotalCapacity] = useState(12000);
  const [expectedAttendees, setExpectedAttendees] = useState(8000);
  const [securityLevel, setSecurityLevel] = useState<SecurityEvent['securityLevel']>('Cao');
  const [commander, setCommander] = useState('Thượng tá Nguyễn Văn Hùng');
  const [description, setDescription] = useState('');
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>(
    zones.slice(0, 4).map((z) => z.id)
  );
  const [formError, setFormError] = useState('');

  const openCreateModal = () => {
    setEditingEvent(null);
    setCode(`SK-2026-${String(events.length + 1).padStart(2, '0')}`);
    setName('');
    setVenue('');
    setStartDate('2026-11-21');
    setEndDate('2026-11-23');
    setStartTime('08:00');
    setEndTime('22:00');
    setScale('Cấp Quốc gia');
    setStatus('Chuẩn bị triển khai');
    setTotalCapacity(12000);
    setExpectedAttendees(8000);
    setSecurityLevel('Cao');
    setCommander('Thượng tá Nguyễn Văn Hùng');
    setDescription('');
    setSelectedZoneIds(zones.slice(0, 4).map((z) => z.id));
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (ev: SecurityEvent) => {
    setEditingEvent(ev);
    setCode(ev.code);
    setName(ev.name);
    setVenue(ev.venue);
    setStartDate(ev.startDate);
    setEndDate(ev.endDate);
    setStartTime(ev.startTime);
    setEndTime(ev.endTime);
    setScale(ev.scale);
    setStatus(ev.status);
    setTotalCapacity(ev.totalCapacity);
    setExpectedAttendees(ev.expectedAttendees);
    setSecurityLevel(ev.securityLevel);
    setCommander(ev.commander);
    setDescription(ev.description);
    setSelectedZoneIds([...ev.zoneIds]);
    setFormError('');
    setModalOpen(true);
  };

  const toggleZoneSelection = (zoneId: string) => {
    setSelectedZoneIds((prev) =>
      prev.includes(zoneId) ? prev.filter((id) => id !== zoneId) : [...prev, zoneId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !venue.trim()) {
      setFormError('Vui lòng nhập đầy đủ Tên sự kiện và Địa điểm tổ chức.');
      return;
    }
    if (selectedZoneIds.length === 0) {
      setFormError('Vui lòng phân chia ít nhất 01 khu vực an ninh cho sự kiện.');
      return;
    }

    const payload: SecurityEvent = {
      id: editingEvent ? editingEvent.id : `EVT-${String(events.length + 1).padStart(2, '0')}`,
      code: code.trim() || `SK-2026-${String(events.length + 1).padStart(2, '0')}`,
      name: name.trim(),
      venue: venue.trim(),
      startDate,
      endDate,
      startTime,
      endTime,
      status,
      scale,
      totalCapacity: Math.max(100, Number(totalCapacity) || 5000),
      expectedAttendees: Math.max(50, Number(expectedAttendees) || 2000),
      registeredAttendees: editingEvent
        ? editingEvent.registeredAttendees
        : Math.round((Number(expectedAttendees) || 2000) * 0.78),
      securityLevel,
      commander: commander.trim() || 'Ban Chỉ huy Trung tâm',
      zoneIds: selectedZoneIds,
      description:
        description.trim() ||
        'Sự kiện được thiết lập phương án bảo vệ an ninh và phân vùng kiểm soát tập trung.',
    };

    if (editingEvent) {
      onUpdateEvent(payload);
    } else {
      onAddEvent(payload);
    }
    setModalOpen(false);
  };

  const filtered = events.filter((ev) => {
    if (statusFilter !== 'ALL' && ev.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        ev.name.toLowerCase().includes(q) ||
        ev.code.toLowerCase().includes(q) ||
        ev.venue.toLowerCase().includes(q) ||
        ev.scale.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const selectedZonesTotalCapacity = zones
    .filter((z) => selectedZoneIds.includes(z.id))
    .reduce((sum, z) => sum + z.capacity, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">
            Quản lý sự kiện & Phân vùng bảo vệ
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Khai báo thời gian, địa điểm, quy mô, sức chứa và phân chia khu vực triển khai an ninh ·{' '}
            <span className="text-blue-300 font-medium">Dữ liệu minh họa</span>
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo sự kiện mới</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-3.5 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Tìm theo mã, tên sự kiện, địa điểm, quy mô..."
          className="flex-1 min-w-[240px] bg-[#09111f] border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="bg-[#09111f] border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">Mọi trạng thái sự kiện</option>
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Event Cards Grid */}
      {paged.length === 0 ? (
        <div className="bg-[#101a2d] border border-slate-800/90 rounded-lg p-10 text-center space-y-3">
          <p className="text-sm text-slate-300">Không tìm thấy sự kiện nào phù hợp điều kiện lọc.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo sự kiện mới</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {paged.map((ev) => {
            const evIncidents = incidents.filter((i) => i.eventId === ev.id);
            const evUnverifiedAlerts = alerts.filter(
              (a) => a.eventId === ev.id && a.status === 'Chưa xác minh'
            );
            const evAttendeesCount = attendees.filter((a) => a.eventId === ev.id).length;
            const evZones = zones.filter((z) => ev.zoneIds.includes(z.id));
            const evZoneCap = evZones.reduce((s, z) => s + z.capacity, 0);
            const evPointsCount = mapPoints.filter((p) => ev.zoneIds.includes(p.zoneId)).length;
            const isActiveScope = selectedEventId === ev.id;

            return (
              <div
                key={ev.id}
                className={`bg-[#101a2d] border rounded-lg p-4 flex flex-col justify-between gap-4 transition-colors ${
                  isActiveScope ? 'border-blue-500' : 'border-slate-800/90'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                        <span className="text-blue-300 font-semibold">{ev.code}</span>
                        <span aria-hidden="true">·</span>
                        <span>Quy mô: {ev.scale}</span>
                        <span aria-hidden="true">·</span>
                        <span>Bảo vệ: {ev.securityLevel}</span>
                      </div>
                      <h2 className="text-base font-semibold text-slate-100 mt-1">{ev.name}</h2>
                    </div>

                    <span
                      className={`text-xs font-medium whitespace-nowrap ${
                        ev.status === 'Đang diễn ra'
                          ? 'text-emerald-400'
                          : ev.status === 'Chuẩn bị triển khai'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{ev.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{ev.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        {ev.startDate.split('-').reverse().join('/')} –{' '}
                        {ev.endDate.split('-').reverse().join('/')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        Khung giờ: {ev.startTime} – {ev.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">Chỉ huy: {ev.commander}</span>
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono tabular-nums">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        Sức chứa địa điểm:{' '}
                        <strong className="text-slate-200">
                          {ev.totalCapacity.toLocaleString('vi-VN')}
                        </strong>
                      </span>
                      <span>
                        Dự kiến / Đăng ký:{' '}
                        <strong className="text-slate-200">
                          {ev.expectedAttendees.toLocaleString('vi-VN')}
                        </strong>{' '}
                        / {ev.registeredAttendees.toLocaleString('vi-VN')} ({evAttendeesCount} hồ sơ)
                      </span>
                    </div>
                  </div>

                  {/* Assigned zones overview */}
                  <div className="pt-2 border-t border-slate-800/70 text-xs space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        Phân chia {evZones.length} khu vực ({evPointsCount} cổng / điểm kiểm soát · Tổng sức chứa vùng:{' '}
                        <span className="font-mono tabular-nums text-slate-200">
                          {evZoneCap.toLocaleString('vi-VN')}
                        </span>
                        )
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {evZones.map((z) => `${z.code} (${z.name})`).join(' · ')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-4 font-mono tabular-nums">
                    <span className="text-slate-300">
                      Vụ việc: <strong className="text-blue-400">{evIncidents.length}</strong>
                    </span>
                    <span className="text-slate-300">
                      Cảnh báo chờ:{' '}
                      <strong className="text-amber-400">{evUnverifiedAlerts.length}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(ev)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#09111f] text-slate-200 border border-slate-700 hover:bg-slate-800 transition-colors whitespace-nowrap"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sửa & Phân khu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenZoneMapForEvent(ev.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 text-blue-300 border border-blue-500/30 hover:bg-slate-700 transition-colors whitespace-nowrap"
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      <span>Sơ đồ mặt bằng</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectEventScope(isActiveScope ? 'ALL' : ev.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
                        isActiveScope
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-blue-600 text-white hover:bg-blue-500'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isActiveScope ? 'Đang giám sát' : 'Chọn giám sát'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PaginationBar
        currentPage={safePage}
        pageSize={pageSize}
        totalItems={filtered.length}
        onPageChange={setPage}
      />

      {/* Create / Edit Event Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={editingEvent ? `Chỉnh sửa sự kiện ${editingEvent.code}` : 'Tạo sự kiện mới'}
        >
          <div className="w-full max-w-3xl bg-[#0e1729] border border-slate-700 rounded-xl shadow-2xl overflow-hidden my-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-slate-100">
                  {editingEvent
                    ? `Cập nhật sự kiện & Phân chia khu vực (${editingEvent.code})`
                    : 'Khai báo sự kiện an ninh mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Đóng biểu mẫu sự kiện"
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded bg-red-500/10 border border-red-500/40 text-red-300">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Mã sự kiện *</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="VD: HN-2026-05"
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Tên sự kiện *</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Hội nghị An toàn Thông tin & Chuyển đổi số Quốc gia"
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Địa điểm tổ chức *</label>
                  <input
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Trung tâm Hội nghị / Sân vận động / Quảng trường..."
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Trạng thái triển khai</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SecurityEvent['status'])}
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Thời gian diễn ra */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Giờ mở cửa / bắt đầu</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Quy mô, Sức chứa, Khách dự kiến, Cấp độ bảo vệ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Quy mô sự kiện</label>
                  <select
                    value={scale}
                    onChange={(e) => setScale(e.target.value as SecurityEvent['scale'])}
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100"
                  >
                    {SCALE_OPTIONS.map((sc) => (
                      <option key={sc} value={sc}>
                        {sc}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Sức chứa địa điểm (người)</label>
                  <input
                    type="number"
                    min={100}
                    value={totalCapacity}
                    onChange={(e) => setTotalCapacity(Number(e.target.value))}
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Lượng khách dự kiến</label>
                  <input
                    type="number"
                    min={50}
                    value={expectedAttendees}
                    onChange={(e) => setExpectedAttendees(Number(e.target.value))}
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Cấp độ bảo vệ</label>
                  <select
                    value={securityLevel}
                    onChange={(e) =>
                      setSecurityLevel(e.target.value as SecurityEvent['securityLevel'])
                    }
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-2.5 py-2 text-slate-100"
                  >
                    <option value="Đặc biệt">Đặc biệt</option>
                    <option value="Cao">Cao</option>
                    <option value="Tiêu chuẩn">Tiêu chuẩn</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Chỉ huy trưởng bảo vệ</label>
                  <input
                    value={commander}
                    onChange={(e) => setCommander(e.target.value)}
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Mô tả & Phương án bảo vệ</label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Đặc điểm địa bàn, đoàn VIP, yêu cầu kiểm soát đặc thù..."
                    className="w-full bg-[#09111f] border border-slate-700 rounded px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              {/* Zone Allocation Checkboxes */}
              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-200">
                    Phân chia khu vực áp dụng cho sự kiện ({selectedZoneIds.length}/{zones.length} khu vực)
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-blue-300">
                    Tổng sức chứa các khu vực đã chọn:{' '}
                    {selectedZonesTotalCapacity.toLocaleString('vi-VN')} người
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {zones.map((z) => {
                    const checked = selectedZoneIds.includes(z.id);
                    const zPoints = mapPoints.filter((p) => p.zoneId === z.id).length;
                    return (
                      <label
                        key={z.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-md border cursor-pointer transition-colors ${
                          checked
                            ? 'bg-blue-600/15 border-blue-500/60 text-slate-100'
                            : 'bg-[#09111f] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleZoneSelection(z.id)}
                          className="mt-0.5 accent-blue-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-blue-300 font-semibold">{z.code}</span>
                            <span className="text-[11px] text-slate-400">
                              {z.isRestricted ? 'Vùng hạn chế' : z.protectionLevel}
                            </span>
                          </div>
                          <div className="font-medium truncate mt-0.5">{z.name}</div>
                          <div className="text-[11px] font-mono tabular-nums text-slate-400 mt-0.5">
                            Sức chứa: {z.capacity.toLocaleString('vi-VN')} · {zPoints} điểm kiểm soát/tập kết
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 font-medium"
                >
                  {editingEvent ? 'Cập nhật sự kiện' : 'Lưu & Tạo sự kiện'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

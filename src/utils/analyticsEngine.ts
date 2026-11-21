import { DEMO_REFERENCE_DATE } from '../data/demoSeed';
import {
  AnalyticsGranularity,
  Attendee,
  ComputedMetrics,
  GlobalFilterState,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
  SecurityAlert,
  SecurityEvent,
  SecurityIncident,
  SecurityZone,
} from '../types/security';

export const SEVERITY_ORDER: IncidentSeverity[] = [
  'Thấp',
  'Trung bình',
  'Cao',
  'Nghiêm trọng',
  'Khẩn cấp',
];

export const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  Thấp: '#38BDF8',
  'Trung bình': '#3B82F6',
  Cao: '#F59E0B',
  'Nghiêm trọng': '#F97316',
  'Khẩn cấp': '#EF4444',
};

export const STATUS_ORDER: IncidentStatus[] = [
  'Mới tiếp nhận',
  'Đang xác minh',
  'Đã phân công',
  'Đang xử lý',
  'Chờ xác nhận',
  'Đã đóng',
];

export interface PeriodDelta {
  current: number;
  previous: number;
  deltaAbsolute: number;
  deltaPercent: number | null;
  isNewEmergence: boolean;
  displayPercent: string;
  displayFull: string;
}

/**
 * Single authoritative formula for period-over-period growth/decline.
 * Safely handles previous === 0 without dividing by zero.
 */
export function computePeriodDelta(current: number, previous: number): PeriodDelta {
  const deltaAbsolute = current - previous;

  if (previous === 0) {
    if (current > 0) {
      return {
        current,
        previous: 0,
        deltaAbsolute,
        deltaPercent: null,
        isNewEmergence: true,
        displayPercent: 'Phát sinh mới',
        displayFull: 'Phát sinh mới',
      };
    }
    return {
      current: 0,
      previous: 0,
      deltaAbsolute: 0,
      deltaPercent: null,
      isNewEmergence: false,
      displayPercent: '0%',
      displayFull: 'Không phát sinh',
    };
  }

  const deltaPercent = Number(((deltaAbsolute / previous) * 100).toFixed(1));
  const sign = deltaAbsolute > 0 ? '+' : '';
  const pctSign = deltaPercent > 0 ? '+' : '';

  return {
    current,
    previous,
    deltaAbsolute,
    deltaPercent,
    isNewEmergence: false,
    displayPercent: `${pctSign}${deltaPercent}%`,
    displayFull: `${sign}${deltaAbsolute} vụ (${pctSign}${deltaPercent}%)`,
  };
}

function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function formatDateOnly(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getDateWindow(filters: GlobalFilterState): {
  startDate: string;
  endDate: string;
  prevStartDate: string;
  prevEndDate: string;
  dayCount: number;
} {
  const ref = parseDateOnly(DEMO_REFERENCE_DATE);
  let start: Date;
  let end: Date;

  if (filters.timeRange === 'today') {
    start = new Date(ref);
    end = new Date(ref);
  } else if (filters.timeRange === '7d') {
    end = new Date(ref);
    start = new Date(ref);
    start.setDate(start.getDate() - 6);
  } else if (filters.timeRange === '30d') {
    end = new Date(ref);
    start = new Date(ref);
    start.setDate(start.getDate() - 29);
  } else {
    start = filters.customStartDate ? parseDateOnly(filters.customStartDate) : new Date(ref);
    end = filters.customEndDate ? parseDateOnly(filters.customEndDate) : new Date(ref);
    if (start > end) {
      const tmp = start;
      start = end;
      end = tmp;
    }
  }

  const diffMs = end.getTime() - start.getTime();
  const dayCount = Math.max(1, Math.round(diffMs / 86400000) + 1);

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (dayCount - 1));

  return {
    startDate: formatDateOnly(start),
    endDate: formatDateOnly(end),
    prevStartDate: formatDateOnly(prevStart),
    prevEndDate: formatDateOnly(prevEnd),
    dayCount,
  };
}

export function matchesNonDateFilters(
  inc: SecurityIncident,
  filters: GlobalFilterState
): boolean {
  if (filters.eventId !== 'ALL' && inc.eventId !== filters.eventId) return false;
  if (filters.zoneId !== 'ALL' && inc.zoneId !== filters.zoneId) return false;
  if (filters.categoryId !== 'ALL' && inc.categoryId !== filters.categoryId) return false;
  if (filters.severity !== 'ALL' && inc.severity !== filters.severity) return false;
  if (filters.status !== 'ALL' && inc.status !== filters.status) return false;
  if (filters.recordType !== 'ALL' && inc.recordType !== filters.recordType) return false;

  if (filters.searchQuery.trim()) {
    const q = filters.searchQuery.trim().toLowerCase();
    const match =
      inc.code.toLowerCase().includes(q) ||
      inc.title.toLowerCase().includes(q) ||
      inc.description.toLowerCase().includes(q) ||
      inc.source.toLowerCase().includes(q) ||
      inc.receiverName.toLowerCase().includes(q) ||
      inc.reporterName.toLowerCase().includes(q);
    if (!match) return false;
  }

  return true;
}

export function filterIncidents(
  incidents: SecurityIncident[],
  filters: GlobalFilterState,
  windowOverride?: { startDate: string; endDate: string }
): SecurityIncident[] {
  const win = windowOverride ?? getDateWindow(filters);
  return incidents.filter((inc) => {
    const datePart = inc.reportedAt.slice(0, 10);
    if (datePart < win.startDate || datePart > win.endDate) return false;
    return matchesNonDateFilters(inc, filters);
  });
}

export function filterAlerts(
  alerts: SecurityAlert[],
  filters: GlobalFilterState,
  includeDateFilter = true
): SecurityAlert[] {
  const win = getDateWindow(filters);
  return alerts.filter((alt) => {
    if (includeDateFilter) {
      const datePart = alt.detectedAt.slice(0, 10);
      if (datePart < win.startDate || datePart > win.endDate) return false;
    }
    if (filters.eventId !== 'ALL' && alt.eventId !== filters.eventId) return false;
    if (filters.zoneId !== 'ALL' && alt.zoneId !== filters.zoneId) return false;
    if (filters.categoryId !== 'ALL' && alt.categoryId !== filters.categoryId) return false;
    if (filters.severity !== 'ALL' && alt.severity !== filters.severity) return false;

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      const match =
        alt.code.toLowerCase().includes(q) ||
        alt.title.toLowerCase().includes(q) ||
        alt.deviceId.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}

export function isResolvedStatus(status: IncidentStatus): boolean {
  return status === 'Đã đóng';
}

export function getResolutionMinutes(inc: SecurityIncident): number | null {
  if (!inc.resolvedAt) return null;
  const start = new Date(inc.reportedAt).getTime();
  const end = new Date(inc.resolvedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.round((end - start) / 60000);
}

export function isIncidentOnTime(inc: SecurityIncident): boolean | null {
  const mins = getResolutionMinutes(inc);
  if (mins === null) return null;
  return mins <= inc.slaMinutes;
}

export function computeMetrics(
  incidents: SecurityIncident[],
  alerts: SecurityAlert[],
  attendees: Attendee[],
  events: SecurityEvent[],
  filters: GlobalFilterState
): ComputedMetrics {
  const win = getDateWindow(filters);
  const currentIncidents = filterIncidents(incidents, filters, {
    startDate: win.startDate,
    endDate: win.endDate,
  });
  const previousIncidents = filterIncidents(incidents, filters, {
    startDate: win.prevStartDate,
    endDate: win.prevEndDate,
  });

  const currentAlerts = filterAlerts(alerts, filters, true);

  const delta = computePeriodDelta(currentIncidents.length, previousIncidents.length);

  const criticalCount = currentIncidents.filter((i) => i.severity === 'Nghiêm trọng').length;
  const emergencyCount = currentIncidents.filter((i) => i.severity === 'Khẩn cấp').length;
  const seriousTotalCount = criticalCount + emergencyCount;

  const resolvedList = currentIncidents.filter((i) => isResolvedStatus(i.status));
  const resolvedCount = resolvedList.length;
  const inProgressCount = currentIncidents.length - resolvedCount;

  const unverifiedAlertsCount = currentAlerts.filter((a) => a.status === 'Chưa xác minh').length;
  const falseAlertsCount = currentAlerts.filter((a) => a.status === 'Báo động giả').length;

  let onTimeCount = 0;
  let evaluatedSlaCount = 0;
  let totalResMins = 0;
  let resMinsCount = 0;

  for (const inc of resolvedList) {
    const mins = getResolutionMinutes(inc);
    if (mins !== null) {
      evaluatedSlaCount++;
      if (mins <= inc.slaMinutes) onTimeCount++;
      totalResMins += mins;
      resMinsCount++;
    }
  }

  const onTimeRate =
    evaluatedSlaCount > 0 ? Number(((onTimeCount / evaluatedSlaCount) * 100).toFixed(1)) : 0;
  const seriousRate =
    delta.current > 0 ? Number(((seriousTotalCount / delta.current) * 100).toFixed(1)) : 0;
  const avgResolutionMinutes =
    resMinsCount > 0 ? Math.round(totalResMins / resMinsCount) : 0;

  const relevantEvents =
    filters.eventId === 'ALL'
      ? events
      : events.filter((e) => e.id === filters.eventId);
  const attendeesFromEvents = relevantEvents.reduce((sum, e) => sum + e.registeredAttendees, 0);
  const attendeesInScope =
    attendeesFromEvents > 0
      ? attendeesFromEvents
      : attendees.filter((a) => filters.eventId === 'ALL' || a.eventId === filters.eventId).length;

  const incidentRatePer1000 =
    attendeesInScope > 0 ? Number(((delta.current / attendeesInScope) * 1000).toFixed(2)) : 0;

  const vuViecCount = currentIncidents.filter((i) => i.recordType === 'Vụ việc').length;
  const suCoCount = currentIncidents.filter((i) => i.recordType === 'Sự cố').length;

  return {
    totalIncidents: delta.current,
    previousTotalIncidents: delta.previous,
    deltaAbsolute: delta.deltaAbsolute,
    deltaPercent: delta.deltaPercent,
    isNewEmergence: delta.isNewEmergence,
    criticalCount,
    emergencyCount,
    seriousTotalCount,
    resolvedCount,
    inProgressCount,
    unverifiedAlertsCount,
    totalAlertsInScope: currentAlerts.length,
    falseAlertsCount,
    onTimeCount,
    evaluatedSlaCount,
    onTimeRate,
    seriousRate,
    avgResolutionMinutes,
    attendeesInScope,
    incidentRatePer1000,
    vuViecCount,
    suCoCount,
  };
}

export interface TimeSeriesPoint {
  label: string;
  dateKey: string;
  startDate: string;
  endDate: string;
  current: number;
  previous: number;
  serious: number;
  resolved: number;
  deltaAbsolute: number;
  deltaPercent: number | null;
  deltaText: string;
}

/**
 * Builds time-series buckets for Day, Week, or Month granularity.
 * - Day: Compares each day in the selected filter window against the corresponding day in the previous window.
 * - Week: Builds 6 consecutive 7-day rolling/calendar weeks ending at window endDate, comparing each week vs its prior week.
 * - Month: Builds 4 consecutive calendar months ending at window endDate's month, comparing each month vs its prior month.
 * All counts respect shared non-date filters (event, zone, category, severity, status, recordType, search).
 */
export function buildTimeSeriesData(
  incidents: SecurityIncident[],
  filters: GlobalFilterState,
  granularity: AnalyticsGranularity = 'day'
): TimeSeriesPoint[] {
  const win = getDateWindow(filters);
  const scopedNonDate = incidents.filter((inc) => matchesNonDateFilters(inc, filters));

  if (granularity === 'day') {
    const points: TimeSeriesPoint[] = [];
    const start = parseDateOnly(win.startDate);
    const prevStart = parseDateOnly(win.prevStartDate);

    for (let i = 0; i < win.dayCount; i++) {
      const curD = new Date(start);
      curD.setDate(curD.getDate() + i);
      const curKey = formatDateOnly(curD);

      const prvD = new Date(prevStart);
      prvD.setDate(prvD.getDate() + i);
      const prvKey = formatDateOnly(prvD);

      const curDayIncidents = scopedNonDate.filter((x) => x.reportedAt.slice(0, 10) === curKey);
      const prvDayIncidents = scopedNonDate.filter((x) => x.reportedAt.slice(0, 10) === prvKey);
      const delta = computePeriodDelta(curDayIncidents.length, prvDayIncidents.length);

      points.push({
        label: `${curKey.slice(8, 10)}/${curKey.slice(5, 7)}`,
        dateKey: curKey,
        startDate: curKey,
        endDate: curKey,
        current: delta.current,
        previous: delta.previous,
        serious: curDayIncidents.filter(
          (x) => x.severity === 'Nghiêm trọng' || x.severity === 'Khẩn cấp'
        ).length,
        resolved: curDayIncidents.filter((x) => isResolvedStatus(x.status)).length,
        deltaAbsolute: delta.deltaAbsolute,
        deltaPercent: delta.deltaPercent,
        deltaText: delta.displayFull,
      });
    }
    return points;
  }

  if (granularity === 'week') {
    const endAnchor = parseDateOnly(win.endDate);
    const numWeeks = 6;
    const weekBuckets: Array<{ start: string; end: string; label: string; key: string }> = [];

    for (let w = numWeeks - 1; w >= 0; w--) {
      const wEnd = new Date(endAnchor);
      wEnd.setDate(wEnd.getDate() - w * 7);
      const wStart = new Date(wEnd);
      wStart.setDate(wStart.getDate() - 6);

      const sStr = formatDateOnly(wStart);
      const eStr = formatDateOnly(wEnd);
      weekBuckets.push({
        start: sStr,
        end: eStr,
        key: `${sStr}_${eStr}`,
        label: `${sStr.slice(8, 10)}/${sStr.slice(5, 7)}–${eStr.slice(8, 10)}/${eStr.slice(5, 7)}`,
      });
    }

    return weekBuckets.map((wb, idx) => {
      const curList = scopedNonDate.filter((x) => {
        const d = x.reportedAt.slice(0, 10);
        return d >= wb.start && d <= wb.end;
      });

      // Previous week bucket (7 days prior to wb.start)
      const prevEnd = parseDateOnly(wb.start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - 6);
      const pStartStr = formatDateOnly(prevStart);
      const pEndStr = formatDateOnly(prevEnd);

      const prevCount =
        idx > 0
          ? scopedNonDate.filter((x) => {
              const d = x.reportedAt.slice(0, 10);
              return d >= weekBuckets[idx - 1].start && d <= weekBuckets[idx - 1].end;
            }).length
          : scopedNonDate.filter((x) => {
              const d = x.reportedAt.slice(0, 10);
              return d >= pStartStr && d <= pEndStr;
            }).length;

      const delta = computePeriodDelta(curList.length, prevCount);

      return {
        label: wb.label,
        dateKey: wb.key,
        startDate: wb.start,
        endDate: wb.end,
        current: delta.current,
        previous: delta.previous,
        serious: curList.filter(
          (x) => x.severity === 'Nghiêm trọng' || x.severity === 'Khẩn cấp'
        ).length,
        resolved: curList.filter((x) => isResolvedStatus(x.status)).length,
        deltaAbsolute: delta.deltaAbsolute,
        deltaPercent: delta.deltaPercent,
        deltaText: delta.displayFull,
      };
    });
  }

  // Month granularity: 4 consecutive calendar months ending at endDate's month
  const endAnchor = parseDateOnly(win.endDate);
  const numMonths = 4;
  const monthBuckets: Array<{ start: string; end: string; label: string; key: string }> = [];

  for (let m = numMonths - 1; m >= 0; m--) {
    const firstDay = new Date(endAnchor.getFullYear(), endAnchor.getMonth() - m, 1);
    const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);
    const sStr = formatDateOnly(firstDay);
    const eStr = formatDateOnly(lastDay);
    const mm = String(firstDay.getMonth() + 1).padStart(2, '0');
    const yyyy = firstDay.getFullYear();

    monthBuckets.push({
      start: sStr,
      end: eStr,
      key: `${yyyy}-${mm}`,
      label: `Tháng ${mm}/${yyyy}`,
    });
  }

  return monthBuckets.map((mb) => {
    const curList = scopedNonDate.filter((x) => {
      const d = x.reportedAt.slice(0, 10);
      return d >= mb.start && d <= mb.end;
    });

    const curFirst = parseDateOnly(mb.start);
    const prevFirst = new Date(curFirst.getFullYear(), curFirst.getMonth() - 1, 1);
    const prevLast = new Date(curFirst.getFullYear(), curFirst.getMonth(), 0);
    const pStartStr = formatDateOnly(prevFirst);
    const pEndStr = formatDateOnly(prevLast);

    const prevCount = scopedNonDate.filter((x) => {
      const d = x.reportedAt.slice(0, 10);
      return d >= pStartStr && d <= pEndStr;
    }).length;

    const delta = computePeriodDelta(curList.length, prevCount);

    return {
      label: mb.label,
      dateKey: mb.key,
      startDate: mb.start,
      endDate: mb.end,
      current: delta.current,
      previous: delta.previous,
      serious: curList.filter(
        (x) => x.severity === 'Nghiêm trọng' || x.severity === 'Khẩn cấp'
      ).length,
      resolved: curList.filter((x) => isResolvedStatus(x.status)).length,
      deltaAbsolute: delta.deltaAbsolute,
      deltaPercent: delta.deltaPercent,
      deltaText: delta.displayFull,
    };
  });
}

export function buildPeriodComparisonBySeverity(
  incidents: SecurityIncident[],
  filters: GlobalFilterState
): Array<{
  severity: IncidentSeverity;
  current: number;
  previous: number;
  deltaText: string;
}> {
  const win = getDateWindow(filters);
  const cur = filterIncidents(incidents, filters, { startDate: win.startDate, endDate: win.endDate });
  const prev = filterIncidents(incidents, filters, { startDate: win.prevStartDate, endDate: win.prevEndDate });

  return SEVERITY_ORDER.map((severity) => {
    const cCount = cur.filter((i) => i.severity === severity).length;
    const pCount = prev.filter((i) => i.severity === severity).length;
    const delta = computePeriodDelta(cCount, pCount);
    return {
      severity,
      current: delta.current,
      previous: delta.previous,
      deltaText: delta.displayFull,
    };
  });
}

export function buildCategoryBreakdown(
  incidents: SecurityIncident[],
  categories: IncidentCategory[],
  filters: GlobalFilterState
): Array<{
  categoryId: string;
  name: string;
  shortName: string;
  count: number;
  previousCount: number;
  seriousCount: number;
  deltaText: string;
}> {
  const win = getDateWindow(filters);
  const cur = filterIncidents(incidents, filters, { startDate: win.startDate, endDate: win.endDate });
  const prev = filterIncidents(incidents, filters, { startDate: win.prevStartDate, endDate: win.prevEndDate });

  return categories
    .map((cat) => {
      const list = cur.filter((i) => i.categoryId === cat.id);
      const prevList = prev.filter((i) => i.categoryId === cat.id);
      const delta = computePeriodDelta(list.length, prevList.length);
      return {
        categoryId: cat.id,
        name: cat.name,
        shortName: cat.name.split('&')[0].trim(),
        count: list.length,
        previousCount: prevList.length,
        seriousCount: list.filter(
          (i) => i.severity === 'Nghiêm trọng' || i.severity === 'Khẩn cấp'
        ).length,
        deltaText: delta.displayFull,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export function buildZoneBreakdown(
  incidents: SecurityIncident[],
  zones: SecurityZone[],
  filters: GlobalFilterState
): Array<{
  zoneId: string;
  code: string;
  name: string;
  shortName: string;
  count: number;
  previousCount: number;
  seriousCount: number;
  resolvedCount: number;
  inProgressCount: number;
  occupancy: number;
  ratePer1000: number;
  deltaText: string;
}> {
  const win = getDateWindow(filters);
  const cur = filterIncidents(incidents, filters, { startDate: win.startDate, endDate: win.endDate });
  const prev = filterIncidents(incidents, filters, { startDate: win.prevStartDate, endDate: win.prevEndDate });

  return zones
    .map((z) => {
      const list = cur.filter((i) => i.zoneId === z.id);
      const prevList = prev.filter((i) => i.zoneId === z.id);
      const delta = computePeriodDelta(list.length, prevList.length);

      const seriousCount = list.filter(
        (i) => i.severity === 'Nghiêm trọng' || i.severity === 'Khẩn cấp'
      ).length;
      const resolvedCount = list.filter((i) => isResolvedStatus(i.status)).length;
      const occupancy = Math.max(1, z.currentOccupancy);
      return {
        zoneId: z.id,
        code: z.code,
        name: z.name,
        shortName: z.name.split('—')[0].split('&')[0].trim(),
        count: list.length,
        previousCount: prevList.length,
        seriousCount,
        resolvedCount,
        inProgressCount: list.length - resolvedCount,
        occupancy: z.currentOccupancy,
        ratePer1000: Number(((list.length / occupancy) * 1000).toFixed(2)),
        deltaText: delta.displayFull,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export function buildHandlingPipelineData(
  incidents: SecurityIncident[],
  filters: GlobalFilterState
): Array<{
  status: IncidentStatus;
  count: number;
  onTime: number;
  overdue: number;
}> {
  const cur = filterIncidents(incidents, filters);
  return STATUS_ORDER.map((status) => {
    const list = cur.filter((i) => i.status === status);
    let onTime = 0;
    let overdue = 0;
    for (const inc of list) {
      const check = isIncidentOnTime(inc);
      if (check === true) onTime++;
      else if (check === false) overdue++;
      else onTime++;
    }
    return {
      status,
      count: list.length,
      onTime,
      overdue,
    };
  });
}

export function formatDeltaLabel(metrics: ComputedMetrics): string {
  return computePeriodDelta(metrics.totalIncidents, metrics.previousTotalIncidents).displayFull;
}

export function formatDateTimeVi(iso: string | undefined): string {
  if (!iso) return '—';
  const [datePart, timePart] = iso.split('T');
  if (!datePart) return iso;
  const [y, m, d] = datePart.split('-');
  const hhmm = timePart ? timePart.slice(0, 5) : '';
  return hhmm ? `${d}/${m}/${y} ${hhmm}` : `${d}/${m}/${y}`;
}

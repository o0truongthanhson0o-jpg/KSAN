import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { IncidentDetailModal } from './components/modals/IncidentDetailModal';
import { IncidentModal } from './components/modals/IncidentModal';
import { DrilldownPayload, KpiDrilldownDrawer } from './components/modals/KpiDrilldownDrawer';
import {
  AccessControlModule,
  GateVerificationResult,
} from './components/modules/AccessControlModule';
import { AnalyticsModule } from './components/modules/AnalyticsModule';
import { AttendeesModule } from './components/modules/AttendeesModule';
import { DashboardModule } from './components/modules/DashboardModule';
import { EventsModule } from './components/modules/EventsModule';
import { ForcesAlertsModule } from './components/modules/ForcesAlertsModule';
import { IncidentsModule } from './components/modules/IncidentsModule';
import { ZonesModule } from './components/modules/ZonesModule';
import { DEMO_REFERENCE_DATE } from './data/demoSeed';
import { SecurityDataset, defaultRepository } from './services/dataProvider';
import {
  AccessLog,
  AccessResult,
  AccessScenarioTag,
  AppNotification,
  Attendee,
  AttendeeCheckInStatus,
  EvidenceType,
  GlobalFilterState,
  IncidentStatus,
  MapPointStatus,
  ModuleId,
  RegistrationStatus,
  SecurityAlert,
  SecurityEvent,
  SecurityIncident,
  SecurityZone,
  StaffStatus,
  ZoneMapPoint,
} from './types/security';
import { computeMetrics, isResolvedStatus } from './utils/analyticsEngine';

const DEFAULT_FILTERS: GlobalFilterState = {
  eventId: 'ALL',
  zoneId: 'ALL',
  categoryId: 'ALL',
  severity: 'ALL',
  status: 'ALL',
  recordType: 'ALL',
  timeRange: '7d',
  customStartDate: '2026-11-01',
  customEndDate: DEMO_REFERENCE_DATE,
  searchQuery: '',
};

function nextNumericCode(existing: string[], prefix: string, padWidth: number): string {
  let max = 0;
  for (const item of existing) {
    if (!item.startsWith(prefix)) continue;
    const num = Number.parseInt(item.slice(prefix.length), 10);
    if (!Number.isNaN(num) && num > max) max = num;
  }
  return `${prefix}${String(max + 1).padStart(padWidth, '0')}`;
}

export default function App() {
  const [dataset, setDataset] = useState<SecurityDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [filters, setFilters] = useState<GlobalFilterState>(DEFAULT_FILTERS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Shared interactive modals / drawers
  const [incidentModalTarget, setIncidentModalTarget] = useState<{
    open: boolean;
    incident: SecurityIncident | null;
    defaultZoneId?: string;
  }>({ open: false, incident: null });
  const [detailIncidentId, setDetailIncidentId] = useState<string | null>(null);

  const [drilldown, setDrilldown] = useState<DrilldownPayload | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 3600);
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    const data = await defaultRepository.loadDataset();
    setDataset(data);

    // Seed notifications from urgent incidents and unverified alerts
    const urgentIncs = data.incidents
      .filter((i) => !isResolvedStatus(i.status) && (i.severity === 'Khẩn cấp' || i.severity === 'Nghiêm trọng'))
      .slice(0, 4)
      .map((i): AppNotification => ({
        id: `NTF-${i.id}`,
        title: `${i.code}: ${i.title}`,
        message: `Mức độ ${i.severity} · Đang ở trạng thái "${i.status}"`,
        severity: i.severity,
        timestamp: i.reportedAt,
        read: false,
        targetModule: 'incidents',
        refId: i.id,
      }));

    const urgentAlerts = data.alerts
      .filter((a) => a.status === 'Chưa xác minh')
      .slice(0, 3)
      .map((a): AppNotification => ({
        id: `NTF-${a.id}`,
        title: `Cảnh báo chờ xác minh ${a.code}`,
        message: `${a.source} (${a.deviceId}): ${a.title}`,
        severity: a.severity,
        timestamp: a.detectedAt,
        read: false,
        targetModule: 'forces',
        refId: a.id,
      }));

    setNotifications([...urgentIncs, ...urgentAlerts]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  // Single-source-of-truth KPIs used across Dashboard & Analytics
  const metrics = useMemo(() => {
    if (!dataset) return null;
    return computeMetrics(
      dataset.incidents,
      dataset.alerts,
      dataset.attendees,
      dataset.events,
      filters
    );
  }, [dataset, filters]);

  const handleFilterChange = useCallback((patch: Partial<GlobalFilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters((prev) => ({
      ...DEFAULT_FILTERS,
      eventId: prev.eventId,
    }));
  }, []);

  const handleSaveIncident = useCallback(
    (saved: SecurityIncident, isNew: boolean) => {
      let finalCode = saved.code;
      setDataset((prev) => {
        if (!prev) return prev;
        let recordToSave = saved;
        if (
          isNew &&
          prev.incidents.some((item) => item.id === saved.id || item.code === saved.code)
        ) {
          const safeId = nextNumericCode(
            prev.incidents.map((i) => i.id),
            'INC-2026-',
            3
          );
          finalCode = safeId;
          recordToSave = { ...saved, id: safeId, code: safeId };
        }
        const nextIncidents = isNew
          ? [recordToSave, ...prev.incidents]
          : prev.incidents.map((item) => (item.id === recordToSave.id ? recordToSave : item));
        return { ...prev, incidents: nextIncidents };
      });
      if (!isNew && isResolvedStatus(saved.status)) {
        setNotifications((prev) =>
          prev.map((n) => (n.refId === saved.id ? { ...n, read: true } : n))
        );
      }
      showToast(isNew ? `Đã lập hồ sơ ${finalCode}` : `Đã cập nhật hồ sơ ${finalCode}`);
    },
    [showToast]
  );

  const handleTransitionWorkflow = useCallback(
    (incidentId: string, nextStatus: IncidentStatus, note?: string) => {
      setDataset((prev) => {
        if (!prev) return prev;
        const nowStr = `${DEMO_REFERENCE_DATE}T18:18:00`;
        const actor = 'Trung tá Lê Quang Minh';
        const nextIncidents = prev.incidents.map((inc) => {
          if (inc.id !== incidentId) return inc;
          const nowResolved = isResolvedStatus(nextStatus);
          const actionNote =
            note || `Chuyển trạng thái xử lý từ "${inc.status}" sang "${nextStatus}".`;
          return {
            ...inc,
            status: nextStatus,
            resolvedAt: nowResolved ? inc.resolvedAt ?? nowStr : undefined,
            progressUpdates: [
              ...inc.progressUpdates,
              {
                id: `PRG-${Date.now()}`,
                timestamp: nowStr,
                actor,
                stage: nextStatus,
                note: actionNote,
              },
            ],
            auditLogs: [
              ...inc.auditLogs,
              {
                id: `AUD-${Date.now()}`,
                timestamp: nowStr,
                actor,
                action: `Chuyển workflow → ${nextStatus}`,
                detail: actionNote,
              },
            ],
          };
        });
        return { ...prev, incidents: nextIncidents };
      });
      if (isResolvedStatus(nextStatus)) {
        setNotifications((prev) =>
          prev.map((n) => (n.refId === incidentId ? { ...n, read: true } : n))
        );
      }
      showToast(`Đã chuyển hồ sơ ${incidentId} → ${nextStatus}`);
    },
    [showToast]
  );

  const handleReassignStaff = useCallback(
    (incidentId: string, staffId: string) => {
      setDataset((prev) => {
        if (!prev) return prev;
        const nowStr = `${DEMO_REFERENCE_DATE}T18:18:00`;
        const targetStaff = prev.staff.find((s) => s.id === staffId);
        const actor = 'Trung tá Lê Quang Minh';
        const detail = `Phân công cán bộ phụ trách: ${targetStaff?.fullName ?? staffId} (${targetStaff?.unit ?? ''}).`;

        return {
          ...prev,
          incidents: prev.incidents.map((inc) =>
            inc.id === incidentId
              ? {
                  ...inc,
                  assignedStaffId: staffId,
                  progressUpdates: [
                    ...inc.progressUpdates,
                    {
                      id: `PRG-${Date.now()}`,
                      timestamp: nowStr,
                      actor,
                      stage: inc.status,
                      note: detail,
                    },
                  ],
                  auditLogs: [
                    ...inc.auditLogs,
                    {
                      id: `AUD-${Date.now()}`,
                      timestamp: nowStr,
                      actor,
                      action: 'Phân công lại người phụ trách',
                      detail,
                    },
                  ],
                }
              : inc
          ),
        };
      });
      showToast('Đã cập nhật người phụ trách hồ sơ');
    },
    [showToast]
  );

  const handleReassignScope = useCallback(
    (incidentId: string, eventId: string, zoneId: string) => {
      setDataset((prev) => {
        if (!prev) return prev;
        const nowStr = `${DEMO_REFERENCE_DATE}T18:18:30`;
        const ev = prev.events.find((e) => e.id === eventId);
        const zn = prev.zones.find((z) => z.id === zoneId);
        const actor = 'Trung tá Lê Quang Minh';
        const detail = `Gắn hồ sơ vào sự kiện ${ev?.code ?? eventId} · khu vực ${zn?.code ?? zoneId} (${zn?.name ?? ''}).`;

        return {
          ...prev,
          incidents: prev.incidents.map((inc) =>
            inc.id === incidentId
              ? {
                  ...inc,
                  eventId,
                  zoneId,
                  auditLogs: [
                    ...inc.auditLogs,
                    {
                      id: `AUD-${Date.now()}`,
                      timestamp: nowStr,
                      actor,
                      action: 'Cập nhật sự kiện / khu vực vụ việc',
                      detail,
                    },
                  ],
                }
              : inc
          ),
        };
      });
      showToast('Đã cập nhật sự kiện & khu vực cho hồ sơ vụ việc');
    },
    [showToast]
  );

  const handleAddProgress = useCallback(
    (incidentId: string, note: string) => {
      setDataset((prev) => {
        if (!prev) return prev;
        const nowStr = `${DEMO_REFERENCE_DATE}T18:19:00`;
        return {
          ...prev,
          incidents: prev.incidents.map((inc) => {
            if (inc.id !== incidentId) return inc;
            const actor =
              prev.staff.find((s) => s.id === inc.assignedStaffId)?.fullName ??
              'Trung tá Lê Quang Minh';
            return {
              ...inc,
              progressUpdates: [
                ...inc.progressUpdates,
                {
                  id: `PRG-${Date.now()}`,
                  timestamp: nowStr,
                  actor,
                  stage: inc.status,
                  note,
                },
              ],
              auditLogs: [
                ...inc.auditLogs,
                {
                  id: `AUD-${Date.now()}`,
                  timestamp: nowStr,
                  actor,
                  action: 'Cập nhật diễn biến xử lý',
                  detail: note,
                },
              ],
            };
          }),
        };
      });
      showToast('Đã ghi nhận diễn biến xử lý mới');
    },
    [showToast]
  );

  const handleUpdateResult = useCallback(
    (incidentId: string, resolutionNotes: string) => {
      setDataset((prev) => {
        if (!prev) return prev;
        const nowStr = `${DEMO_REFERENCE_DATE}T18:20:00`;
        const actor = 'Trung tá Lê Quang Minh';
        return {
          ...prev,
          incidents: prev.incidents.map((inc) =>
            inc.id === incidentId
              ? {
                  ...inc,
                  resolutionNotes: resolutionNotes || undefined,
                  auditLogs: [
                    ...inc.auditLogs,
                    {
                      id: `AUD-${Date.now()}`,
                      timestamp: nowStr,
                      actor,
                      action: 'Cập nhật kết quả xử lý',
                      detail: resolutionNotes || 'Xóa nội dung kết quả xử lý.',
                    },
                  ],
                }
              : inc
          ),
        };
      });
      showToast('Đã lưu kết quả xử lý hồ sơ');
    },
    [showToast]
  );

  const handleAddEvidence = useCallback(
    (
      incidentId: string,
      evidence: { type: EvidenceType; title: string; referenceCode: string; description: string }
    ) => {
      setDataset((prev) => {
        if (!prev) return prev;
        const nowStr = `${DEMO_REFERENCE_DATE}T18:21:00`;
        const actor = 'Trung tá Lê Quang Minh';
        return {
          ...prev,
          incidents: prev.incidents.map((inc) =>
            inc.id === incidentId
              ? {
                  ...inc,
                  evidences: [
                    ...inc.evidences,
                    {
                      id: `EVD-${Date.now()}`,
                      type: evidence.type,
                      title: evidence.title,
                      referenceCode: evidence.referenceCode,
                      description: evidence.description,
                      capturedAt: nowStr,
                      addedBy: actor,
                    },
                  ],
                  auditLogs: [
                    ...inc.auditLogs,
                    {
                      id: `AUD-${Date.now()}`,
                      timestamp: nowStr,
                      actor,
                      action: 'Bổ sung bằng chứng',
                      detail: `${evidence.type}: ${evidence.title} (${evidence.referenceCode})`,
                    },
                  ],
                }
              : inc
          ),
        };
      });
      showToast('Đã bổ sung bằng chứng vào hồ sơ');
    },
    [showToast]
  );

  const handleLinkAlertToIncident = useCallback(
    (alertId: string, incidentId: string) => {
      setDataset((prev) => {
        if (!prev) return prev;
        const nowStr = `${DEMO_REFERENCE_DATE}T18:22:00`;
        const linkedAlert = prev.alerts.find((a) => a.id === alertId);
        const nextAlerts = prev.alerts.map((a) =>
          a.id === alertId
            ? {
                ...a,
                status: 'Đã xác minh' as const,
                linkedIncidentId: incidentId,
                verifiedBy: 'Trung tá Lê Quang Minh',
                note: `Đã gộp vào hồ sơ ${incidentId}`,
              }
            : a
        );
        const nextIncidents = prev.incidents.map((inc) =>
          inc.id === incidentId && !inc.linkedAlertIds.includes(alertId)
            ? {
                ...inc,
                linkedAlertIds: [...inc.linkedAlertIds, alertId],
                auditLogs: [
                  ...inc.auditLogs,
                  {
                    id: `AUD-${Date.now()}`,
                    timestamp: nowStr,
                    actor: 'Trung tá Lê Quang Minh',
                    action: 'Gộp cảnh báo vào hồ sơ',
                    detail: `Hợp nhất cảnh báo ${linkedAlert?.code ?? alertId} (${linkedAlert?.deviceId ?? ''})`,
                  },
                ],
              }
            : inc
        );
        return { ...prev, alerts: nextAlerts, incidents: nextIncidents };
      });
      setNotifications((prev) =>
        prev.map((n) => (n.refId === alertId ? { ...n, read: true } : n))
      );
      showToast(`Đã xác minh và gộp cảnh báo vào hồ sơ ${incidentId}`);
    },
    [showToast]
  );

  const handleVerifyAlertToNewIncident = useCallback(
    (alert: SecurityAlert) => {
      setDataset((prev) => {
        if (!prev) return prev;
        const cat = prev.categories.find((c) => c.id === alert.categoryId);
        const newIncId = nextNumericCode(
          prev.incidents.map((i) => i.id),
          'INC-2026-',
          3
        );
        const assigned = prev.staff.find((s) => s.assignedZoneId === alert.zoneId) ?? prev.staff[0];
        const receiver = 'Trung tá Lê Quang Minh';

        const newIncident: SecurityIncident = {
          id: newIncId,
          code: newIncId,
          title: alert.title,
          description: `Hồ sơ được lập từ xác minh cảnh báo ${alert.code} (${alert.source} - ${alert.deviceId}).`,
          recordType: cat?.requiresSpecialResponse ? 'Sự cố' : 'Vụ việc',
          eventId: alert.eventId,
          zoneId: alert.zoneId,
          categoryId: alert.categoryId,
          severity: alert.severity,
          status: 'Đã phân công',
          detectedAt: alert.detectedAt,
          reportedAt: alert.detectedAt,
          slaMinutes: cat?.defaultSlaMinutes ?? 15,
          source: alert.source,
          receiverName: receiver,
          assignedStaffId: assigned.id,
          reporterName: `${alert.source} (${alert.deviceId})`,
          linkedAlertIds: [alert.id],
          evidences: [
            {
              id: `EVD-${Date.now()}`,
              type: alert.source === 'Camera AI' ? 'Ảnh Camera' : 'Log thiết bị',
              title: `Tín hiệu gốc từ ${alert.deviceId}`,
              referenceCode: alert.code,
              description: alert.title,
              capturedAt: alert.detectedAt,
              addedBy: receiver,
            },
          ],
          progressUpdates: [
            {
              id: `PRG-${Date.now()}`,
              timestamp: alert.detectedAt,
              actor: receiver,
              stage: 'Đã phân công',
              note: `Xác minh cảnh báo ${alert.code} và giao ${assigned.fullName} xử lý.`,
            },
          ],
          auditLogs: [
            {
              id: `AUD-${Date.now()}`,
              timestamp: alert.detectedAt,
              actor: receiver,
              action: 'Lập hồ sơ từ cảnh báo',
              detail: `Chuyển cảnh báo ${alert.code} thành hồ sơ ${newIncId} (${assigned.fullName} phụ trách).`,
            },
          ],
        };

        const nextAlerts = prev.alerts.map((a) =>
          a.id === alert.id
            ? {
                ...a,
                status: 'Đã xác minh' as const,
                linkedIncidentId: newIncId,
                verifiedBy: receiver,
                note: `Đã chuyển thành hồ sơ ${newIncId}`,
              }
            : a
        );

        return {
          ...prev,
          incidents: [newIncident, ...prev.incidents],
          alerts: nextAlerts,
        };
      });
      setNotifications((prev) =>
        prev.map((n) => (n.refId === alert.id ? { ...n, read: true } : n))
      );
      setDrilldown(null);
      showToast(`Đã xác minh cảnh báo ${alert.code} thành hồ sơ vụ việc mới`);
    },
    [showToast]
  );

  const handleMarkAlertFalse = useCallback(
    (alertId: string) => {
      setDataset((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          alerts: prev.alerts.map((a) =>
            a.id === alertId
              ? {
                  ...a,
                  status: 'Báo động giả' as const,
                  verifiedBy: 'Trung tá Lê Quang Minh',
                  note: 'Đã kiểm tra camera — xác nhận báo động giả.',
                }
              : a
          ),
        };
      });
      setNotifications((prev) =>
        prev.map((n) => (n.refId === alertId ? { ...n, read: true } : n))
      );
      showToast(`Đã đánh dấu ${alertId} là báo động giả`);
    },
    [showToast]
  );

  const handleAddEvent = useCallback(
    (ev: SecurityEvent) => {
      setDataset((prev) => (prev ? { ...prev, events: [ev, ...prev.events] } : prev));
      showToast(`Đã tạo sự kiện ${ev.code}`);
    },
    [showToast]
  );

  const handleUpdateEvent = useCallback(
    (ev: SecurityEvent) => {
      setDataset((prev) =>
        prev
          ? {
              ...prev,
              events: prev.events.map((item) => (item.id === ev.id ? ev : item)),
            }
          : prev
      );
      showToast(`Đã cập nhật sự kiện ${ev.code}`);
    },
    [showToast]
  );

  const handleSaveZone = useCallback(
    (zone: SecurityZone, attachedEventIds: string[], isNew: boolean) => {
      setDataset((prev) => {
        if (!prev) return prev;
        const nextZones = isNew
          ? [...prev.zones, zone]
          : prev.zones.map((z) => (z.id === zone.id ? zone : z));

        const nextEvents = prev.events.map((ev) => {
          const shouldAttach = attachedEventIds.includes(ev.id);
          const alreadyHas = ev.zoneIds.includes(zone.id);
          if (shouldAttach && !alreadyHas) {
            return { ...ev, zoneIds: [...ev.zoneIds, zone.id] };
          }
          if (!shouldAttach && alreadyHas) {
            return { ...ev, zoneIds: ev.zoneIds.filter((id) => id !== zone.id) };
          }
          return ev;
        });

        return { ...prev, zones: nextZones, events: nextEvents };
      });
      showToast(isNew ? `Đã phân chia khu vực mới ${zone.code}` : `Đã cập nhật khu vực ${zone.code}`);
    },
    [showToast]
  );

  const handleSaveMapPoint = useCallback(
    (point: ZoneMapPoint, isNew: boolean) => {
      setDataset((prev) => {
        if (!prev) return prev;
        const nextPoints = isNew
          ? [...prev.mapPoints, point]
          : prev.mapPoints.map((p) => (p.id === point.id ? point : p));

        // Update gateCount on zone if adding/removing gate
        const nextZones = prev.zones.map((z) => {
          if (z.id !== point.zoneId) return z;
          const gatesInZone = nextPoints.filter(
            (p) => p.zoneId === z.id && p.type === 'Cổng kiểm soát'
          ).length;
          return { ...z, gateCount: Math.max(z.gateCount, gatesInZone) };
        });

        return { ...prev, mapPoints: nextPoints, zones: nextZones };
      });
      showToast(isNew ? `Đã khai báo điểm ${point.code}` : `Đã cập nhật điểm ${point.code}`);
    },
    [showToast]
  );

  const handleUpdateMapPointStatus = useCallback(
    (pointId: string, status: MapPointStatus) => {
      setDataset((prev) =>
        prev
          ? {
              ...prev,
              mapPoints: prev.mapPoints.map((p) => (p.id === pointId ? { ...p, status } : p)),
            }
          : prev
      );
      showToast(`Đã chuyển trạng thái điểm kiểm soát → ${status}`);
    },
    [showToast]
  );

  const handleDeleteMapPoint = useCallback(
    (pointId: string) => {
      setDataset((prev) =>
        prev
          ? {
              ...prev,
              mapPoints: prev.mapPoints.filter((p) => p.id !== pointId),
            }
          : prev
      );
      showToast('Đã xóa điểm kiểm soát khỏi sơ đồ');
    },
    [showToast]
  );

  const handleUpdateAttendeeStatus = useCallback(
    (attendeeId: string, status: AttendeeCheckInStatus) => {
      setDataset((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attendees: prev.attendees.map((a) =>
            a.id === attendeeId ? { ...a, checkInStatus: status } : a
          ),
        };
      });
      showToast('Đã cập nhật trạng thái đối tượng tham dự');
    },
    [showToast]
  );

  const handleCreateRegistration = useCallback(
    (attendee: Attendee) => {
      let finalAttendee = attendee;
      setDataset((prev) => {
        if (!prev) return prev;
        const hasDupId = prev.attendees.some((a) => a.id === attendee.id);
        const safeId = hasDupId
          ? nextNumericCode(
              prev.attendees.map((a) => a.id),
              'ATT-',
              3
            )
          : attendee.id;
        const codePrefix = attendee.role === 'Phương tiện' ? 'PT-' : 'TD-';
        const hasDupCode = prev.attendees.some((a) => a.code === attendee.code);
        const safeCode = hasDupCode
          ? nextNumericCode(
              prev.attendees.map((a) => a.code),
              codePrefix,
              3
            )
          : attendee.code;
        finalAttendee = { ...attendee, id: safeId, code: safeCode };
        return { ...prev, attendees: [finalAttendee, ...prev.attendees] };
      });
      showToast(
        finalAttendee.qrCode
          ? `Đã đăng ký & cấp mã QR ${finalAttendee.qrCode}`
          : `Đã tạo hồ sơ đăng ký ${finalAttendee.code} (chờ phê duyệt)`
      );
    },
    [showToast]
  );

  const handleApproveRegistration = useCallback(
    (attendeeId: string) => {
      const nowStr = `${DEMO_REFERENCE_DATE}T18:42:00`;
      setDataset((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attendees: prev.attendees.map((a) => {
            if (a.id !== attendeeId) return a;
            const qrCode =
              a.qrCode ??
              `SCC-QR-${a.eventId.replace('-', '')}-${a.id.replace('ATT-', '')}`;
            return {
              ...a,
              registrationStatus: 'Đã phê duyệt' as const,
              approvedBy: 'Trung tá Lê Quang Minh',
              approvedAt: nowStr,
              qrCode,
              qrStatus: 'Hiệu lực' as const,
              qrIssuedAt: nowStr,
              qrUsageCount: 0,
            };
          }),
        };
      });
      showToast('Đã phê duyệt hồ sơ và cấp mã QR demo hiệu lực');
    },
    [showToast]
  );

  const handleRejectRegistration = useCallback(
    (attendeeId: string) => {
      setDataset((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attendees: prev.attendees.map((a) =>
            a.id === attendeeId
              ? {
                  ...a,
                  registrationStatus: 'Từ chối' as const,
                  qrStatus: 'Thu hồi' as const,
                }
              : a
          ),
        };
      });
      showToast('Đã từ chối hồ sơ đăng ký');
    },
    [showToast]
  );

  const handleToggleLockRegistration = useCallback(
    (attendeeId: string, status: RegistrationStatus) => {
      setDataset((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attendees: prev.attendees.map((a) =>
            a.id === attendeeId
              ? {
                  ...a,
                  registrationStatus: status,
                  qrStatus:
                    status === 'Tạm khóa'
                      ? ('Thu hồi' as const)
                      : a.qrCode
                      ? ('Hiệu lực' as const)
                      : ('Chưa cấp' as const),
                }
              : a
          ),
        };
      });
      showToast(`Đã chuyển trạng thái đăng ký → ${status}`);
    },
    [showToast]
  );

  const handleIssueQr = useCallback(
    (attendeeId: string) => {
      const nowStr = `${DEMO_REFERENCE_DATE}T18:43:00`;
      setDataset((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attendees: prev.attendees.map((a) => {
            if (a.id !== attendeeId) return a;
            const qrCode = `SCC-QR-${a.eventId.replace('-', '')}-${a.id.replace('ATT-', '')}-${String(Date.now()).slice(-2)}`;
            return {
              ...a,
              qrCode,
              qrStatus: 'Hiệu lực' as const,
              qrIssuedAt: nowStr,
              qrUsageCount: 0,
              validUntil:
                a.validUntil < nowStr ? '2026-11-25T22:00:00' : a.validUntil,
            };
          }),
        };
      });
      showToast('Đã cấp lại mã QR demo mới');
    },
    [showToast]
  );

  const handleRevokeQr = useCallback(
    (attendeeId: string) => {
      setDataset((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attendees: prev.attendees.map((a) =>
            a.id === attendeeId ? { ...a, qrStatus: 'Thu hồi' as const } : a
          ),
        };
      });
      showToast('Đã thu hồi mã QR demo');
    },
    [showToast]
  );

  const handleVerifyQrScan = useCallback(
    (params: {
      qrCode: string;
      zoneId: string;
      gateName: string;
      direction: 'Vào' | 'Ra';
      simulateOffline: boolean;
    }): GateVerificationResult => {
      const nowStr = `${DEMO_REFERENCE_DATE}T18:44:00`;
      const trimmedQr = params.qrCode.trim();
      const currentAttendees = dataset?.attendees ?? [];
      const matched = currentAttendees.find(
        (a) => a.qrCode && a.qrCode.toUpperCase() === trimmedQr.toUpperCase()
      );

      let connectionOk = true;
      let qrValid = false;
      let registrationApproved = false;
      let withinValidityWindow = false;
      let zoneAuthorized = false;

      let result: AccessResult = 'Từ chối';
      let scenarioTag: AccessScenarioTag = 'QR không hợp lệ';
      let reason = '';

      if (params.simulateOffline) {
        connectionOk = false;
        result = 'Mất kết nối';
        scenarioTag = 'Mất kết nối';
        reason =
          'Đầu đọc mất kết nối máy chủ xác thực — không thể kiểm tra trực tuyến, chuyển kiểm tra thẻ thủ công tại chốt.';
      } else if (!matched || matched.qrStatus === 'Thu hồi' || matched.qrStatus === 'Chưa cấp') {
        qrValid = false;
        result = 'Từ chối';
        scenarioTag = 'QR không hợp lệ';
        reason = matched
          ? `Từ chối — Mã QR ${trimmedQr} đã bị thu hồi hoặc chưa kích hoạt.`
          : `Từ chối — Không tìm thấy mã QR "${trimmedQr || '(trống)'}" trên hệ thống sự kiện.`;
      } else if (
        matched.qrStatus === 'Đã sử dụng' ||
        (matched.singleUseQr && matched.qrUsageCount >= 1 && params.direction === 'Vào')
      ) {
        qrValid = false;
        registrationApproved = matched.registrationStatus === 'Đã phê duyệt';
        withinValidityWindow =
          nowStr >= matched.validFrom &&
          nowStr <= matched.validUntil &&
          matched.qrStatus !== 'Hết hạn';
        zoneAuthorized = matched.allowedZoneIds.includes(params.zoneId);
        result = 'Từ chối';
        scenarioTag = 'QR đã sử dụng';
        reason = `Từ chối — Mã QR dùng 1 lần (${trimmedQr}) của ${matched.fullName} đã được sử dụng trước đó.`;
      } else {
        qrValid = true;
        registrationApproved = matched.registrationStatus === 'Đã phê duyệt';
        withinValidityWindow =
          nowStr >= matched.validFrom &&
          nowStr <= matched.validUntil &&
          matched.qrStatus !== 'Hết hạn';
        zoneAuthorized = matched.allowedZoneIds.includes(params.zoneId);

        if (!registrationApproved) {
          result = 'Từ chối';
          scenarioTag = 'Chưa phê duyệt / Bị khóa';
          reason = `Từ chối — Hồ sơ của ${matched.fullName} đang ở trạng thái "${matched.registrationStatus}".`;
        } else if (!withinValidityWindow) {
          result = 'Từ chối';
          scenarioTag = 'Hết hạn hiệu lực';
          reason = `Từ chối — Mã QR đã hết thời hạn hiệu lực (${matched.validUntil.slice(0, 16).replace('T', ' ')}).`;
        } else if (!zoneAuthorized) {
          result = 'Cảnh báo';
          scenarioTag = 'Sai khu vực';
          const targetZ = dataset?.zones.find((z) => z.id === params.zoneId);
          reason = `Cảnh báo an ninh — ${matched.fullName} (${matched.role}) không có quyền vào khu vực ${targetZ?.name ?? params.zoneId}.`;
        } else {
          result = 'Hợp lệ';
          scenarioTag = 'Hợp lệ';
          reason = `Xác thực thành công — Cho phép ${matched.fullName} (${matched.role}) ${params.direction.toLowerCase()} qua ${params.gateName}.`;
        }
      }

      const verification: GateVerificationResult = {
        timestamp: nowStr,
        qrCodeUsed: trimmedQr || '(Trống)',
        gateName: params.gateName,
        zoneId: params.zoneId,
        direction: params.direction,
        result,
        scenarioTag,
        reason,
        matchedAttendee: params.simulateOffline ? undefined : matched,
        checks: {
          connectionOk,
          qrValid,
          registrationApproved,
          withinValidityWindow,
          zoneAuthorized,
        },
      };

      setDataset((prev) => {
        if (!prev) return prev;
        const eventScope =
          matched?.eventId ??
          (filters.eventId !== 'ALL' ? filters.eventId : prev.events[0]?.id ?? 'EVT-01');

        const newLog: AccessLog = {
          id: nextNumericCode(
            prev.accessLogs.map((l) => l.id),
            'LOG-',
            3
          ),
          attendeeId: params.simulateOffline || !matched ? 'UNKNOWN' : matched.id,
          attendeeName: params.simulateOffline
            ? 'Không xác định (Mất kết nối)'
            : matched?.fullName ?? 'Mã QR không xác định',
          attendeeRole: params.simulateOffline
            ? 'Không xác định'
            : matched?.role ?? 'Không xác định',
          eventId: eventScope,
          zoneId: params.zoneId,
          gateName: params.gateName,
          direction: params.direction,
          result,
          scenarioTag,
          qrCodeUsed: trimmedQr || '(Trống)',
          timestamp: nowStr,
          reason,
        };

        let nextAlerts = prev.alerts;
        if (result !== 'Hợp lệ') {
          const altId = nextNumericCode(
            prev.alerts.map((a) => a.id),
            'ALT-2026-',
            3
          );
          const altCode = nextNumericCode(
            prev.alerts.map((a) => a.code),
            'CB-',
            3
          );
          const newAlert: SecurityAlert = {
            id: altId,
            code: altCode,
            title: `${scenarioTag} tại ${params.gateName}: ${matched?.fullName ?? (trimmedQr || 'Đầu đọc')}`,
            source: 'Cổng kiểm soát từ',
            deviceId: `GATE-${params.zoneId.slice(-2)}-QR`,
            eventId: eventScope,
            zoneId: params.zoneId,
            categoryId: result === 'Mất kết nối' ? 'CAT-03' : 'CAT-01',
            severity:
              scenarioTag === 'Sai khu vực' || scenarioTag === 'QR không hợp lệ'
                ? 'Cao'
                : 'Trung bình',
            status: 'Chưa xác minh',
            detectedAt: nowStr,
            note: reason,
          };
          nextAlerts = [newAlert, ...prev.alerts];
        }

        const nextAttendees =
          !params.simulateOffline && matched
            ? prev.attendees.map((a) => {
                if (a.id !== matched.id) return a;
                if (result === 'Hợp lệ') {
                  const nextUsage = a.qrUsageCount + 1;
                  return {
                    ...a,
                    qrUsageCount: nextUsage,
                    qrStatus:
                      a.singleUseQr && params.direction === 'Vào'
                        ? ('Đã sử dụng' as const)
                        : a.qrStatus,
                    checkInStatus:
                      params.direction === 'Vào'
                        ? ('Đã check-in' as const)
                        : ('Đã rời khỏi' as const),
                    lastSeenZoneId: params.zoneId,
                    lastCheckInAt: nowStr,
                  };
                }
                if (scenarioTag === 'Sai khu vực' || scenarioTag === 'QR đã sử dụng') {
                  return {
                    ...a,
                    checkInStatus: 'Cần kiểm tra' as const,
                    lastSeenZoneId: params.zoneId,
                    lastCheckInAt: nowStr,
                    securityFlag: reason,
                  };
                }
                return a;
              })
            : prev.attendees;

        return {
          ...prev,
          accessLogs: [newLog, ...prev.accessLogs],
          alerts: nextAlerts,
          attendees: nextAttendees,
        };
      });

      showToast(`${result}: ${scenarioTag}`);
      return verification;
    },
    [dataset, filters.eventId, showToast]
  );

  const handleUpdateStaffAssignment = useCallback(
    (staffId: string, zoneId: string, status: StaffStatus) => {
      setDataset((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          staff: prev.staff.map((s) =>
            s.id === staffId ? { ...s, assignedZoneId: zoneId, status } : s
          ),
        };
      });
      showToast('Đã cập nhật điều động lực lượng');
    },
    [showToast]
  );

  if (loading || !dataset || !metrics) {
    return (
      <div className="min-h-screen bg-[#09111f] text-slate-200 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="text-sm font-semibold">Đang khởi tạo Security Command Center...</div>
          <div className="text-xs text-slate-400">Nạp dữ liệu điều hành minh họa</div>
        </div>
      </div>
    );
  }

  const unverifiedAlertsCount = dataset.alerts.filter(
    (a) => (filters.eventId === 'ALL' || a.eventId === filters.eventId) && a.status === 'Chưa xác minh'
  ).length;

  const openIncidentsCount = dataset.incidents.filter(
    (i) => (filters.eventId === 'ALL' || i.eventId === filters.eventId) && !isResolvedStatus(i.status)
  ).length;

  return (
    <div className="min-h-screen bg-[#09111f] text-slate-100 flex">
      <Sidebar
        activeModule={activeModule}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        unverifiedAlertsCount={unverifiedAlertsCount}
        openIncidentsCount={openIncidentsCount}
        onSelectModule={setActiveModule}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader
          events={dataset.events}
          selectedEventId={filters.eventId}
          notifications={notifications}
          onSelectEvent={(eventId) => handleFilterChange({ eventId })}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onMarkAllNotificationsRead={() =>
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
          }
          onNotificationClick={(n) => {
            setNotifications((prev) =>
              prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
            );
            setActiveModule(n.targetModule);
            if (n.targetModule === 'incidents' && n.refId) {
              const found = dataset.incidents.find((i) => i.id === n.refId);
              if (found) setDetailIncidentId(found.id);
            }
          }}
          onResetDemoData={() => {
            void loadInitialData();
            setFilters(DEFAULT_FILTERS);
            showToast('Đã khôi phục toàn bộ dữ liệu minh họa ban đầu');
          }}
        />

        <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
          {activeModule === 'dashboard' && (
            <DashboardModule
              events={dataset.events}
              zones={dataset.zones}
              categories={dataset.categories}
              incidents={dataset.incidents}
              alerts={dataset.alerts}
              attendees={dataset.attendees}
              metrics={metrics}
              filters={filters}
              onChangeFilter={handleFilterChange}
              onResetFilters={handleResetFilters}
              onOpenDrilldown={setDrilldown}
              onOpenIncidentModal={(inc) => {
                if (inc) setDetailIncidentId(inc.id);
                else setIncidentModalTarget({ open: true, incident: null });
              }}
              onVerifyAlertToIncident={handleVerifyAlertToNewIncident}
              onMarkAlertFalse={handleMarkAlertFalse}
              onNavigateModule={(mod) => setActiveModule(mod)}
            />
          )}

          {activeModule === 'analytics' && (
            <AnalyticsModule
              events={dataset.events}
              zones={dataset.zones}
              categories={dataset.categories}
              incidents={dataset.incidents}
              alerts={dataset.alerts}
              attendees={dataset.attendees}
              metrics={metrics}
              filters={filters}
              onChangeFilter={handleFilterChange}
              onResetFilters={handleResetFilters}
              onOpenDrilldown={setDrilldown}
            />
          )}

          {activeModule === 'events' && (
            <EventsModule
              events={dataset.events}
              zones={dataset.zones}
              mapPoints={dataset.mapPoints}
              incidents={dataset.incidents}
              alerts={dataset.alerts}
              attendees={dataset.attendees}
              selectedEventId={filters.eventId}
              onSelectEventScope={(eventId) => handleFilterChange({ eventId })}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onOpenZoneMapForEvent={(eventId) => {
                handleFilterChange({ eventId });
                setActiveModule('zones');
              }}
            />
          )}

          {activeModule === 'zones' && (
            <ZonesModule
              events={dataset.events}
              zones={dataset.zones}
              mapPoints={dataset.mapPoints}
              incidents={dataset.incidents}
              alerts={dataset.alerts}
              staff={dataset.staff}
              selectedEventId={filters.eventId}
              onSelectEventScope={(eventId) => handleFilterChange({ eventId })}
              onFilterZoneInIncidents={(zoneId) => {
                handleFilterChange({ zoneId });
                setActiveModule('incidents');
              }}
              onCreateIncidentInZone={(zoneId) => {
                setIncidentModalTarget({ open: true, incident: null, defaultZoneId: zoneId });
              }}
              onSaveZone={handleSaveZone}
              onSaveMapPoint={handleSaveMapPoint}
              onUpdateMapPointStatus={handleUpdateMapPointStatus}
              onDeleteMapPoint={handleDeleteMapPoint}
            />
          )}

          {activeModule === 'attendees' && (
            <AttendeesModule
              attendees={dataset.attendees}
              events={dataset.events}
              zones={dataset.zones}
              selectedEventId={filters.eventId}
              onUpdateAttendeeStatus={handleUpdateAttendeeStatus}
              onCreateRegistration={handleCreateRegistration}
              onApproveRegistration={handleApproveRegistration}
              onRejectRegistration={handleRejectRegistration}
              onIssueQr={handleIssueQr}
              onRevokeQr={handleRevokeQr}
            />
          )}

          {activeModule === 'access' && (
            <AccessControlModule
              accessLogs={dataset.accessLogs}
              attendees={dataset.attendees}
              events={dataset.events}
              zones={dataset.zones}
              mapPoints={dataset.mapPoints}
              selectedEventId={filters.eventId}
              onCreateRegistration={handleCreateRegistration}
              onApproveRegistration={handleApproveRegistration}
              onRejectRegistration={handleRejectRegistration}
              onToggleLockRegistration={handleToggleLockRegistration}
              onIssueQr={handleIssueQr}
              onRevokeQr={handleRevokeQr}
              onVerifyQrScan={handleVerifyQrScan}
            />
          )}

          {activeModule === 'incidents' && (
            <IncidentsModule
              events={dataset.events}
              zones={dataset.zones}
              categories={dataset.categories}
              incidents={dataset.incidents}
              staff={dataset.staff}
              filters={filters}
              onChangeFilter={handleFilterChange}
              onResetFilters={handleResetFilters}
              onOpenDetailModal={(inc) => setDetailIncidentId(inc.id)}
              onOpenEditModal={(inc) => setIncidentModalTarget({ open: true, incident: inc })}
              onQuickStatusChange={(id, status) => handleTransitionWorkflow(id, status)}
            />
          )}

          {activeModule === 'forces' && (
            <ForcesAlertsModule
              staff={dataset.staff}
              patrolRoutes={dataset.patrolRoutes}
              alerts={dataset.alerts}
              incidents={dataset.incidents}
              zones={dataset.zones}
              selectedEventId={filters.eventId}
              onUpdateStaffAssignment={handleUpdateStaffAssignment}
              onVerifyAlertToIncident={handleVerifyAlertToNewIncident}
              onLinkAlertToExistingIncident={handleLinkAlertToIncident}
              onMarkAlertFalse={handleMarkAlertFalse}
              onOpenIncidentModal={(inc) => setDetailIncidentId(inc.id)}
            />
          )}
        </main>
      </div>

      {/* Incident Detail & Audit Modal */}
      {detailIncidentId &&
        (() => {
          const target = dataset.incidents.find((i) => i.id === detailIncidentId);
          if (!target) return null;
          return (
            <IncidentDetailModal
              incident={target}
              events={dataset.events}
              zones={dataset.zones}
              categories={dataset.categories}
              staff={dataset.staff}
              alerts={dataset.alerts}
              onClose={() => setDetailIncidentId(null)}
              onEdit={(inc) => {
                setDetailIncidentId(null);
                setIncidentModalTarget({ open: true, incident: inc });
              }}
              onTransitionWorkflow={handleTransitionWorkflow}
              onReassignStaff={handleReassignStaff}
              onReassignScope={handleReassignScope}
              onAddProgress={handleAddProgress}
              onUpdateResult={handleUpdateResult}
              onAddEvidence={handleAddEvidence}
              onLinkAlert={handleLinkAlertToIncident}
            />
          );
        })()}

      {/* Incident Create / Edit Modal */}
      {incidentModalTarget.open && (
        <IncidentModal
          incident={incidentModalTarget.incident}
          events={dataset.events}
          zones={dataset.zones}
          categories={dataset.categories}
          staff={dataset.staff}
          defaultEventId={filters.eventId}
          defaultZoneId={incidentModalTarget.defaultZoneId}
          onClose={() => setIncidentModalTarget({ open: false, incident: null })}
          onSave={handleSaveIncident}
        />
      )}

      {/* KPI / Chart Drill-down Drawer */}
      <KpiDrilldownDrawer
        payload={drilldown}
        zones={dataset.zones}
        categories={dataset.categories}
        onClose={() => setDrilldown(null)}
        onSelectIncident={(inc) => {
          setDrilldown(null);
          setDetailIncidentId(inc.id);
        }}
        onVerifyAlertToNewIncident={handleVerifyAlertToNewIncident}
      />

      {/* Action Confirmation Toast */}
      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-[#101a2d] border border-blue-500/50 text-xs font-medium text-slate-100 shadow-2xl"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}

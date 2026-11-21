export type ModuleId =
  | 'dashboard'
  | 'analytics'
  | 'events'
  | 'zones'
  | 'attendees'
  | 'access'
  | 'incidents'
  | 'forces';

export type IncidentRecordType = 'Vụ việc' | 'Sự cố';

export type IncidentSeverity =
  | 'Thấp'
  | 'Trung bình'
  | 'Cao'
  | 'Nghiêm trọng'
  | 'Khẩn cấp';

export type IncidentStatus =
  | 'Mới tiếp nhận'
  | 'Đang xác minh'
  | 'Đã phân công'
  | 'Đang xử lý'
  | 'Chờ xác nhận'
  | 'Đã đóng';

export type EvidenceType =
  | 'Ảnh Camera'
  | 'Video trích xuất'
  | 'Biên bản hiện trường'
  | 'Log thiết bị'
  | 'Hình ảnh hiện vật';

export interface IncidentEvidence {
  id: string;
  type: EvidenceType;
  title: string;
  referenceCode: string;
  description: string;
  capturedAt: string; // ISO datetime
  addedBy: string;
}

export interface IncidentProgressEntry {
  id: string;
  timestamp: string; // ISO datetime
  actor: string;
  stage: IncidentStatus;
  note: string;
}

export interface IncidentAuditLog {
  id: string;
  timestamp: string; // ISO datetime
  actor: string;
  action: string;
  detail: string;
}

export type AlertStatus = 'Chưa xác minh' | 'Đã xác minh' | 'Báo động giả';

export type AlertSource =
  | 'Camera AI'
  | 'Cổng kiểm soát từ'
  | 'Cảm biến PCCC'
  | 'Tổ tuần tra'
  | 'Máy soi X-Ray'
  | 'Giám sát mạng';

export type TimeRangePreset = 'today' | '7d' | '30d' | 'custom';
export type AnalyticsGranularity = 'day' | 'week' | 'month';

export interface SecurityEvent {
  id: string;
  code: string;
  name: string;
  venue: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'Đang diễn ra' | 'Chuẩn bị triển khai' | 'Đã kết thúc';
  scale: 'Cấp Quốc gia' | 'Quốc tế' | 'Cấp Thành phố' | 'Nội bộ / Doanh nghiệp';
  totalCapacity: number;
  expectedAttendees: number;
  registeredAttendees: number;
  securityLevel: 'Đặc biệt' | 'Cao' | 'Tiêu chuẩn';
  commander: string;
  zoneIds: string[];
  description: string;
}

export type ZoneType =
  | 'Sân khấu'
  | 'Cổng kiểm soát'
  | 'VIP'
  | 'Triển lãm'
  | 'Bãi đỗ xe'
  | 'Kỹ thuật';

export type MapPointType =
  | 'Cổng kiểm soát'
  | 'Lối vào'
  | 'Lối ra'
  | 'Vùng hạn chế'
  | 'Điểm tập kết';

export type MapPointStatus = 'Hoạt động' | 'Hạn chế' | 'Khóa khẩn cấp';

export interface ZoneMapPoint {
  id: string;
  code: string;
  name: string;
  type: MapPointType;
  zoneId: string;
  status: MapPointStatus;
  x: number; // Tọa độ X trên sơ đồ mặt bằng (0..840)
  y: number; // Tọa độ Y trên sơ đồ mặt bằng (0..420)
  note?: string;
}

export interface SecurityZone {
  id: string;
  code: string;
  name: string;
  type: ZoneType;
  capacity: number;
  currentOccupancy: number;
  protectionLevel: 'Tuyệt mật' | 'Rất cao' | 'Cao' | 'Trung bình';
  isRestricted?: boolean;
  cameraCount: number;
  gateCount: number;
  assignedUnit: string;
  assemblyPoint?: string;
  description?: string;
  mapRect: { x: number; y: number; w: number; h: number };
}

export interface IncidentCategory {
  id: string;
  code: string;
  name: string;
  defaultSlaMinutes: number;
  requiresSpecialResponse: boolean;
}

export interface SecurityIncident {
  id: string;
  code: string;
  title: string;
  description: string;
  recordType: IncidentRecordType; // Phân biệt rõ Vụ việc vs Sự cố
  eventId: string;
  zoneId: string;
  categoryId: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  detectedAt: string; // Thời gian phát hiện (ISO datetime)
  reportedAt: string; // Thời gian lập hồ sơ tiếp nhận (ISO datetime)
  resolvedAt?: string; // Thời gian đóng hồ sơ (ISO datetime)
  slaMinutes: number;
  source: string; // Nguồn thông tin
  receiverName: string; // Người tiếp nhận
  assignedStaffId: string; // Người phụ trách
  reporterName: string;
  linkedAlertIds: string[]; // Nhiều cảnh báo có thể gộp vào 1 hồ sơ vụ việc
  evidences: IncidentEvidence[]; // Bằng chứng
  progressUpdates: IncidentProgressEntry[]; // Diễn biến xử lý
  resolutionNotes?: string; // Kết quả xử lý
  auditLogs: IncidentAuditLog[]; // Nhật ký thao tác
}

export interface SecurityAlert {
  id: string;
  code: string;
  title: string;
  source: AlertSource;
  deviceId: string;
  eventId: string;
  zoneId: string;
  categoryId: string;
  severity: IncidentSeverity;
  status: AlertStatus;
  detectedAt: string; // ISO datetime
  linkedIncidentId?: string;
  verifiedBy?: string;
  note?: string;
}

export type AttendeeRole =
  | 'Khách'
  | 'Đại biểu'
  | 'VIP'
  | 'Nhân viên'
  | 'Báo chí'
  | 'Nhà thầu'
  | 'Phương tiện';

export type AttendeeCheckInStatus =
  | 'Đã check-in'
  | 'Chưa đến'
  | 'Đã rời khỏi'
  | 'Cần kiểm tra';

export type RegistrationStatus =
  | 'Chờ phê duyệt'
  | 'Đã phê duyệt'
  | 'Từ chối'
  | 'Tạm khóa';

export type QrTokenStatus =
  | 'Chưa cấp'
  | 'Hiệu lực'
  | 'Đã sử dụng'
  | 'Hết hạn'
  | 'Thu hồi';

export type AccessResult = 'Hợp lệ' | 'Cảnh báo' | 'Từ chối' | 'Mất kết nối';

export type AccessScenarioTag =
  | 'Hợp lệ'
  | 'QR không hợp lệ'
  | 'QR đã sử dụng'
  | 'Sai khu vực'
  | 'Hết hạn hiệu lực'
  | 'Chưa phê duyệt / Bị khóa'
  | 'Mất kết nối';

export interface Attendee {
  id: string;
  code: string;
  fullName: string;
  organization: string;
  role: AttendeeRole;
  eventId: string;
  badgeNumber: string;
  identityLast4: string;
  phone?: string;
  vehiclePlate?: string;
  vehicleType?: string;
  allowedZoneIds: string[];
  registrationStatus: RegistrationStatus;
  approvedBy?: string;
  approvedAt?: string;
  qrCode?: string;
  qrStatus: QrTokenStatus;
  qrIssuedAt?: string;
  validFrom: string; // ISO datetime
  validUntil: string; // ISO datetime
  singleUseQr?: boolean;
  qrUsageCount: number;
  checkInStatus: AttendeeCheckInStatus;
  lastSeenZoneId?: string;
  lastCheckInAt?: string;
  securityFlag?: string;
}

export interface AccessLog {
  id: string;
  attendeeId: string;
  attendeeName: string;
  attendeeRole: AttendeeRole | 'Không xác định';
  eventId: string;
  zoneId: string;
  gateName: string;
  direction: 'Vào' | 'Ra';
  result: AccessResult;
  scenarioTag?: AccessScenarioTag;
  qrCodeUsed?: string;
  timestamp: string;
  reason?: string;
}

export type StaffUnit =
  | 'Phản ứng nhanh'
  | 'Kiểm soát cổng'
  | 'Giám sát CCTV'
  | 'Bảo vệ VIP'
  | 'Tuần tra khu vực';

export type StaffStatus =
  | 'Đang trực'
  | 'Đang tuần tra'
  | 'Ứng phó sự cố'
  | 'Nghỉ ca';

export interface SecurityStaff {
  id: string;
  code: string;
  fullName: string;
  rank: string;
  unit: StaffUnit;
  assignedZoneId: string;
  status: StaffStatus;
  shift: 'Ca sáng (06:00 - 14:00)' | 'Ca chiều (14:00 - 22:00)' | 'Ca đêm (22:00 - 06:00)';
  phone: string;
  radioChannel: string;
  activeIncidentId?: string;
}

export interface PatrolRoute {
  id: string;
  code: string;
  name: string;
  zoneIds: string[];
  assignedStaffId: string;
  intervalMinutes: number;
  lastCheckpointAt: string;
  status: 'Đúng lịch' | 'Chậm checkpoint' | 'Tạm dừng điều động';
}

export interface GlobalFilterState {
  eventId: string; // 'ALL' or specific eventId
  zoneId: string; // 'ALL' or specific zoneId
  categoryId: string; // 'ALL' or specific categoryId
  severity: 'ALL' | IncidentSeverity;
  status: 'ALL' | IncidentStatus;
  recordType: 'ALL' | IncidentRecordType;
  timeRange: TimeRangePreset;
  customStartDate: string; // YYYY-MM-DD
  customEndDate: string; // YYYY-MM-DD
  searchQuery: string;
}

export interface ComputedMetrics {
  totalIncidents: number;
  previousTotalIncidents: number;
  deltaAbsolute: number;
  deltaPercent: number | null; // null khi kỳ trước = 0 -> hiển thị "Phát sinh mới"
  isNewEmergence: boolean;
  criticalCount: number;
  emergencyCount: number;
  seriousTotalCount: number; // Nghiêm trọng + Khẩn cấp
  resolvedCount: number;
  inProgressCount: number;
  unverifiedAlertsCount: number;
  totalAlertsInScope: number;
  falseAlertsCount: number;
  onTimeCount: number;
  evaluatedSlaCount: number;
  onTimeRate: number; // 0 - 100
  seriousRate: number; // 0 - 100
  avgResolutionMinutes: number;
  attendeesInScope: number;
  incidentRatePer1000: number;
  vuViecCount: number;
  suCoCount: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  severity: IncidentSeverity;
  timestamp: string;
  read: boolean;
  targetModule: ModuleId;
  refId?: string;
}

import {
  AccessLog,
  AccessScenarioTag,
  Attendee,
  AttendeeCheckInStatus,
  AttendeeRole,
  IncidentAuditLog,
  IncidentCategory,
  IncidentEvidence,
  IncidentProgressEntry,
  IncidentRecordType,
  IncidentSeverity,
  IncidentStatus,
  PatrolRoute,
  QrTokenStatus,
  RegistrationStatus,
  SecurityAlert,
  SecurityEvent,
  SecurityIncident,
  SecurityStaff,
  SecurityZone,
  ZoneMapPoint,
} from '../types/security';

export const DEMO_REFERENCE_DATE = '2026-11-20';

export const DEMO_EVENTS: SecurityEvent[] = [
  {
    id: 'EVT-01',
    code: 'HN-2026-TECH',
    name: 'Hội nghị Thượng đỉnh Công nghệ Quốc tế 2026',
    venue: 'Trung tâm Hội nghị Quốc gia Mỹ Đình',
    startDate: '2026-11-14',
    endDate: '2026-11-22',
    startTime: '07:30',
    endTime: '21:30',
    status: 'Đang diễn ra',
    scale: 'Quốc tế',
    totalCapacity: 15900,
    expectedAttendees: 8500,
    registeredAttendees: 8140,
    securityLevel: 'Đặc biệt',
    commander: 'Thượng tá Nguyễn Văn Hùng',
    zoneIds: ['ZON-01', 'ZON-02', 'ZON-03', 'ZON-04', 'ZON-05', 'ZON-06'],
    description:
      'Sự kiện cấp quốc tế có nguyên thủ, lãnh đạo tập đoàn công nghệ và 42 đoàn đại biểu tham dự.',
  },
  {
    id: 'EVT-02',
    code: 'LH-2026-MUSIC',
    name: 'Lễ hội Âm nhạc & Ánh sáng Quốc gia Mùa Thu',
    venue: 'Quảng trường Trung tâm & Công viên Thống Nhất',
    startDate: '2026-11-01',
    endDate: '2026-11-21',
    startTime: '16:00',
    endTime: '23:30',
    status: 'Đang diễn ra',
    scale: 'Cấp Quốc gia',
    totalCapacity: 28000,
    expectedAttendees: 24000,
    registeredAttendees: 22650,
    securityLevel: 'Cao',
    commander: 'Trung tá Trần Minh Quân',
    zoneIds: ['ZON-01', 'ZON-02', 'ZON-04', 'ZON-05', 'ZON-06'],
    description:
      'Chương trình biểu diễn ngoài trời tập trung mật độ khán giả rất lớn vào khung giờ cao điểm 18:00 - 23:00.',
  },
  {
    id: 'EVT-03',
    code: 'TL-2026-INNO',
    name: 'Triển lãm Công nghiệp & Đổi mới Sáng tạo 2026',
    venue: 'Trung tâm Triển lãm Quốc tế ICE',
    startDate: '2026-10-18',
    endDate: '2026-10-30',
    startTime: '08:00',
    endTime: '18:00',
    status: 'Đã kết thúc',
    scale: 'Cấp Thành phố',
    totalCapacity: 14500,
    expectedAttendees: 12000,
    registeredAttendees: 11420,
    securityLevel: 'Cao',
    commander: 'Thiếu tá Lê Hoàng Nam',
    zoneIds: ['ZON-02', 'ZON-03', 'ZON-04', 'ZON-05', 'ZON-06'],
    description:
      'Triển lãm thiết bị công nghiệp nặng, robot tự hành và các gian hàng công nghệ cao.',
  },
  {
    id: 'EVT-04',
    code: 'DD-2026-ASEAN',
    name: 'Diễn đàn Kinh tế & An ninh Khu vực ASEAN',
    venue: 'Tổ hợp Hội thảo Grand Plaza',
    startDate: '2026-11-20',
    endDate: '2026-11-25',
    startTime: '07:00',
    endTime: '20:00',
    status: 'Chuẩn bị triển khai',
    scale: 'Quốc tế',
    totalCapacity: 8200,
    expectedAttendees: 3200,
    registeredAttendees: 2980,
    securityLevel: 'Đặc biệt',
    commander: 'Thượng tá Nguyễn Văn Hùng',
    zoneIds: ['ZON-01', 'ZON-02', 'ZON-03', 'ZON-06'],
    description:
      'Diễn đàn ngoại giao kinh tế đang trong giai đoạn kiểm tra an ninh tiền sự kiện và lắp đặt cổng kiểm soát.',
  },
];

export const DEMO_ZONES: SecurityZone[] = [
  {
    id: 'ZON-01',
    code: 'KV-SK01',
    name: 'Sân khấu & Hội trường Chính',
    type: 'Sân khấu',
    capacity: 5000,
    currentOccupancy: 4120,
    protectionLevel: 'Cao',
    isRestricted: false,
    cameraCount: 18,
    gateCount: 4,
    assignedUnit: 'Phản ứng nhanh',
    assemblyPoint: 'Điểm tập kết Quảng trường Nam (TK-02)',
    description: 'Khu vực khán phòng chính, sân khấu trung tâm và cánh gà biểu diễn.',
    mapRect: { x: 280, y: 40, w: 280, h: 165 },
  },
  {
    id: 'ZON-02',
    code: 'KV-CA01',
    name: 'Cổng Kiểm soát A1 — Lối vào Chính',
    type: 'Cổng kiểm soát',
    capacity: 1800,
    currentOccupancy: 1490,
    protectionLevel: 'Rất cao',
    isRestricted: false,
    cameraCount: 14,
    gateCount: 8,
    assignedUnit: 'Kiểm soát cổng',
    assemblyPoint: 'Điểm tập kết Sơ tán Tây Bắc (TK-01)',
    description: 'Trạm kiểm tra an ninh đầu vào với 8 làn cửa từ và máy soi hành lý X-Ray.',
    mapRect: { x: 50, y: 235, w: 215, h: 155 },
  },
  {
    id: 'ZON-03',
    code: 'KV-VIP01',
    name: 'Sảnh VIP & Phòng Tiếp đón Nguyên thủ',
    type: 'VIP',
    capacity: 600,
    currentOccupancy: 245,
    protectionLevel: 'Tuyệt mật',
    isRestricted: true,
    cameraCount: 16,
    gateCount: 2,
    assignedUnit: 'Bảo vệ VIP',
    assemblyPoint: 'Điểm tập kết Đội PƯN Đông (TK-03)',
    description: 'Vùng bảo vệ tuyệt mật dành riêng cho nguyên thủ, khách VIP và đoàn ngoại giao.',
    mapRect: { x: 590, y: 40, w: 200, h: 165 },
  },
  {
    id: 'ZON-04',
    code: 'KV-TL01',
    name: 'Khu Triển lãm & Gian hàng Trung tâm',
    type: 'Triển lãm',
    capacity: 4200,
    currentOccupancy: 3180,
    protectionLevel: 'Trung bình',
    isRestricted: false,
    cameraCount: 22,
    gateCount: 4,
    assignedUnit: 'Tuần tra khu vực',
    assemblyPoint: 'Điểm tập kết Quảng trường Nam (TK-02)',
    description: 'Không gian trưng bày mở với 45 gian hàng công nghệ và hành lang lưu thông rộng.',
    mapRect: { x: 295, y: 235, w: 265, h: 155 },
  },
  {
    id: 'ZON-05',
    code: 'KV-BDX02',
    name: 'Bãi đỗ xe & Vành đai An ninh B',
    type: 'Bãi đỗ xe',
    capacity: 3500,
    currentOccupancy: 2210,
    protectionLevel: 'Trung bình',
    isRestricted: false,
    cameraCount: 16,
    gateCount: 3,
    assignedUnit: 'Tuần tra khu vực',
    assemblyPoint: 'Điểm tập kết Sơ tán Tây Bắc (TK-01)',
    description: 'Vành đai kiểm soát phương tiện ra vào, bãi đỗ xe đại biểu và xe hậu cần.',
    mapRect: { x: 50, y: 40, w: 200, h: 165 },
  },
  {
    id: 'ZON-06',
    code: 'KV-KT01',
    name: 'Hành lang Kỹ thuật & Khu Hậu cần',
    type: 'Kỹ thuật',
    capacity: 800,
    currentOccupancy: 340,
    protectionLevel: 'Cao',
    isRestricted: true,
    cameraCount: 10,
    gateCount: 3,
    assignedUnit: 'Giám sát CCTV',
    assemblyPoint: 'Điểm tập kết Đội PƯN Đông (TK-03)',
    description: 'Vùng hạn chế chứa trạm biến áp, phòng máy chủ CCTV, kho thiết bị và lối tiếp vận.',
    mapRect: { x: 590, y: 235, w: 200, h: 155 },
  },
];

export const DEMO_MAP_POINTS: ZoneMapPoint[] = [
  { id: 'PT-01', code: 'C-A1', name: 'Cổng X-Ray Chính A1', type: 'Cổng kiểm soát', zoneId: 'ZON-02', status: 'Hoạt động', x: 85, y: 372, note: '8 làn soi chiếu hành lý + cổng từ' },
  { id: 'PT-02', code: 'LV-01', name: 'Lối vào Khán giả Tây', type: 'Lối vào', zoneId: 'ZON-02', status: 'Hoạt động', x: 50, y: 310, note: 'Phân luồng thẻ đại biểu & khách mời' },
  { id: 'PT-03', code: 'LR-01', name: 'Lối ra Kiểm soát Nam', type: 'Lối ra', zoneId: 'ZON-02', status: 'Hoạt động', x: 205, y: 390, note: 'Kiểm soát 1 chiều ra ngoài vành đai' },

  { id: 'PT-04', code: 'LV-02', name: 'Lối vào Xe Đại biểu', type: 'Lối vào', zoneId: 'ZON-05', status: 'Hoạt động', x: 50, y: 120, note: 'Cổng barie tự động nhận diện biển số' },
  { id: 'PT-05', code: 'C-B2', name: 'Trạm Soi gầm xe B2', type: 'Cổng kiểm soát', zoneId: 'ZON-05', status: 'Hoạt động', x: 175, y: 205, note: 'Kiểm tra an ninh phương tiện trước bãi đỗ' },
  { id: 'PT-06', code: 'TK-01', name: 'Điểm Tập kết Tây Bắc', type: 'Điểm tập kết', zoneId: 'ZON-05', status: 'Hoạt động', x: 195, y: 65, note: 'Sức chứa sơ tán 3.000 người, mặt bằng thoáng' },

  { id: 'PT-07', code: 'C-SK', name: 'Chốt An ninh Sân khấu', type: 'Cổng kiểm soát', zoneId: 'ZON-01', status: 'Hoạt động', x: 280, y: 125, note: 'Kiểm soát vòng trong vào hội trường' },
  { id: 'PT-08', code: 'HC-01', name: 'Vùng Hạn chế Cánh gà', type: 'Vùng hạn chế', zoneId: 'ZON-01', status: 'Hạn chế', x: 510, y: 180, note: 'Chỉ thẻ BTC & Kỹ thuật sân khấu được phép tiếp cận' },
  { id: 'PT-09', code: 'LR-02', name: 'Lối Thoát hiểm Hội trường', type: 'Lối ra', zoneId: 'ZON-01', status: 'Hoạt động', x: 375, y: 205, note: 'Cửa thoát hiểm 4 cánh mở tự động khi báo cháy' },

  { id: 'PT-10', code: 'C-VIP', name: 'Cổng Sinh trắc học VIP', type: 'Cổng kiểm soát', zoneId: 'ZON-03', status: 'Hoạt động', x: 590, y: 125, note: 'Xác thực khuôn mặt & thẻ từ VIP cấp độ Tuyệt mật' },
  { id: 'PT-11', code: 'HC-02', name: 'Vùng Tuyệt mật Nguyên thủ', type: 'Vùng hạn chế', zoneId: 'ZON-03', status: 'Hạn chế', x: 740, y: 180, note: 'Phạm vi bảo vệ tiếp cận gần cấp đặc biệt' },
  { id: 'PT-12', code: 'LR-VIP', name: 'Lối ra Đoàn Hộ tống Đông', type: 'Lối ra', zoneId: 'ZON-03', status: 'Hạn chế', x: 790, y: 120, note: 'Tuyến rút khẩn cấp dành cho xe hộ tống VIP' },

  { id: 'PT-13', code: 'LV-03', name: 'Lối vào Triển lãm Trung tâm', type: 'Lối vào', zoneId: 'ZON-04', status: 'Hoạt động', x: 295, y: 312, note: 'Kết nối luồng khách từ Cổng A1 sang khu gian hàng' },
  { id: 'PT-14', code: 'TK-02', name: 'Điểm Tập kết Quảng trường Nam', type: 'Điểm tập kết', zoneId: 'ZON-04', status: 'Hoạt động', x: 515, y: 365, note: 'Điểm tập kết chính cho khán giả khu triển lãm & sân khấu' },
  { id: 'PT-15', code: 'LR-03', name: 'Lối Thoát hiểm Gian hàng', type: 'Lối ra', zoneId: 'ZON-04', status: 'Hoạt động', x: 400, y: 390, note: 'Lối thoát rộng 8m thông ra quảng trường phía Nam' },

  { id: 'PT-16', code: 'C-KT', name: 'Chốt Thẻ Kỹ thuật Hậu cần', type: 'Cổng kiểm soát', zoneId: 'ZON-06', status: 'Hoạt động', x: 590, y: 312, note: 'Kiểm soát thẻ kỹ thuật viên và vận chuyển thiết bị' },
  { id: 'PT-17', code: 'HC-03', name: 'Vùng Hạn chế Trạm điện & Server', type: 'Vùng hạn chế', zoneId: 'ZON-06', status: 'Hạn chế', x: 735, y: 365, note: 'Cấm người không nhiệm vụ; khóa thẻ từ 2 lớp' },
  { id: 'PT-18', code: 'TK-03', name: 'Điểm Tập kết Phản ứng nhanh', type: 'Điểm tập kết', zoneId: 'ZON-06', status: 'Hoạt động', x: 750, y: 260, note: 'Vị trí tập kết dự bị lực lượng PƯN & Y tế' },
];

export const DEMO_CATEGORIES: IncidentCategory[] = [
  { id: 'CAT-01', code: 'XAM-NHAP', name: 'Xâm nhập & Tiếp cận trái phép', defaultSlaMinutes: 15, requiresSpecialResponse: true },
  { id: 'CAT-02', code: 'UN-TAC', name: 'Ùn tắc & Quá tải đám đông', defaultSlaMinutes: 20, requiresSpecialResponse: false },
  { id: 'CAT-03', code: 'KIEM-SOAT', name: 'Lỗi thiết bị & Kiểm soát ra vào', defaultSlaMinutes: 25, requiresSpecialResponse: false },
  { id: 'CAT-04', code: 'Y-TE', name: 'Sự cố Y tế & Cấp cứu', defaultSlaMinutes: 10, requiresSpecialResponse: true },
  { id: 'CAT-05', code: 'PCCC', name: 'An toàn PCCC & Kỹ thuật điện', defaultSlaMinutes: 10, requiresSpecialResponse: true },
  { id: 'CAT-06', code: 'GAY-ROI', name: 'Mâu thuẫn & Gây rối trật tự', defaultSlaMinutes: 15, requiresSpecialResponse: true },
  { id: 'CAT-07', code: 'VAT-THE', name: 'Vật thể nghi vấn & Hành lý bỏ quên', defaultSlaMinutes: 12, requiresSpecialResponse: true },
  { id: 'CAT-08', code: 'AN-NINH-VIP', name: 'An ninh VIP & Tuyến hộ tống', defaultSlaMinutes: 10, requiresSpecialResponse: true },
  { id: 'CAT-09', code: 'AN-MANG', name: 'An ninh mạng & Hệ thống giám sát', defaultSlaMinutes: 30, requiresSpecialResponse: false },
  { id: 'CAT-10', code: 'HO-TRO', name: 'Thất lạc tài sản & Hỗ trợ khách', defaultSlaMinutes: 45, requiresSpecialResponse: false },
];

export const DEMO_STAFF: SecurityStaff[] = [
  { id: 'STF-01', code: 'AN-001', fullName: 'Nguyễn Hữu Thắng', rank: 'Đội trưởng', unit: 'Phản ứng nhanh', assignedZoneId: 'ZON-01', status: 'Đang trực', shift: 'Ca sáng (06:00 - 14:00)', phone: '0904-112-801', radioChannel: 'CH-01' },
  { id: 'STF-02', code: 'AN-002', fullName: 'Trần Quốc Bảo', rank: 'Tổ trưởng', unit: 'Phản ứng nhanh', assignedZoneId: 'ZON-01', status: 'Ứng phó sự cố', shift: 'Ca chiều (14:00 - 22:00)', phone: '0904-112-802', radioChannel: 'CH-01', activeIncidentId: 'INC-2026-061' },
  { id: 'STF-03', code: 'AN-003', fullName: 'Lê Văn Dũng', rank: 'Nhân viên', unit: 'Phản ứng nhanh', assignedZoneId: 'ZON-02', status: 'Đang tuần tra', shift: 'Ca chiều (14:00 - 22:00)', phone: '0904-112-803', radioChannel: 'CH-01' },
  { id: 'STF-04', code: 'AN-004', fullName: 'Phạm Minh Tuấn', rank: 'Nhân viên', unit: 'Phản ứng nhanh', assignedZoneId: 'ZON-05', status: 'Đang trực', shift: 'Ca sáng (06:00 - 14:00)', phone: '0904-112-804', radioChannel: 'CH-01' },
  { id: 'STF-05', code: 'AN-005', fullName: 'Hoàng Đức Anh', rank: 'Đội trưởng', unit: 'Kiểm soát cổng', assignedZoneId: 'ZON-02', status: 'Đang trực', shift: 'Ca sáng (06:00 - 14:00)', phone: '0904-112-805', radioChannel: 'CH-02' },
  { id: 'STF-06', code: 'AN-006', fullName: 'Vũ Thị Mai Hương', rank: 'Tổ trưởng', unit: 'Kiểm soát cổng', assignedZoneId: 'ZON-02', status: 'Ứng phó sự cố', shift: 'Ca chiều (14:00 - 22:00)', phone: '0904-112-806', radioChannel: 'CH-02', activeIncidentId: 'INC-2026-063' },
  { id: 'STF-07', code: 'AN-007', fullName: 'Đặng Quang Huy', rank: 'Nhân viên', unit: 'Kiểm soát cổng', assignedZoneId: 'ZON-02', status: 'Đang trực', shift: 'Ca chiều (14:00 - 22:00)', phone: '0904-112-807', radioChannel: 'CH-02' },
  { id: 'STF-08', code: 'AN-008', fullName: 'Bùi Thị Lan Anh', rank: 'Nhân viên', unit: 'Kiểm soát cổng', assignedZoneId: 'ZON-04', status: 'Đang trực', shift: 'Ca sáng (06:00 - 14:00)', phone: '0904-112-808', radioChannel: 'CH-02' },
  { id: 'STF-09', code: 'AN-009', fullName: 'Đỗ Tiến Đạt', rank: 'Nhân viên', unit: 'Kiểm soát cổng', assignedZoneId: 'ZON-05', status: 'Nghỉ ca', shift: 'Ca đêm (22:00 - 06:00)', phone: '0904-112-809', radioChannel: 'CH-02' },
  { id: 'STF-10', code: 'AN-010', fullName: 'Ngô Thanh Tùng', rank: 'Đội trưởng', unit: 'Bảo vệ VIP', assignedZoneId: 'ZON-03', status: 'Đang trực', shift: 'Ca sáng (06:00 - 14:00)', phone: '0904-112-810', radioChannel: 'CH-03' },
  { id: 'STF-11', code: 'AN-011', fullName: 'Vương Đình Khải', rank: 'Tổ trưởng', unit: 'Bảo vệ VIP', assignedZoneId: 'ZON-03', status: 'Đang tuần tra', shift: 'Ca chiều (14:00 - 22:00)', phone: '0904-112-811', radioChannel: 'CH-03' },
  { id: 'STF-12', code: 'AN-012', fullName: 'Trịnh Xuân Phúc', rank: 'Nhân viên', unit: 'Bảo vệ VIP', assignedZoneId: 'ZON-03', status: 'Đang trực', shift: 'Ca chiều (14:00 - 22:00)', phone: '0904-112-812', radioChannel: 'CH-03' },
  { id: 'STF-13', code: 'AN-013', fullName: 'Nguyễn Ngọc Linh', rank: 'Nhân viên', unit: 'Bảo vệ VIP', assignedZoneId: 'ZON-01', status: 'Đang trực', shift: 'Ca sáng (06:00 - 14:00)', phone: '0904-112-813', radioChannel: 'CH-03' },
  { id: 'STF-14', code: 'AN-014', fullName: 'Phan Trọng Nghĩa', rank: 'Kỹ thuật viên', unit: 'Giám sát CCTV', assignedZoneId: 'ZON-06', status: 'Đang trực', shift: 'Ca sáng (06:00 - 14:00)', phone: '0904-112-814', radioChannel: 'CH-04' },
  { id: 'STF-15', code: 'AN-015', fullName: 'Lý Hoài Nam', rank: 'Kỹ thuật viên', unit: 'Giám sát CCTV', assignedZoneId: 'ZON-06', status: 'Ứng phó sự cố', shift: 'Ca chiều (14:00 - 22:00)', phone: '0904-112-815', radioChannel: 'CH-04', activeIncidentId: 'INC-2026-062' },
  { id: 'STF-16', code: 'AN-016', fullName: 'Đinh Công Minh', rank: 'Nhân viên', unit: 'Giám sát CCTV', assignedZoneId: 'ZON-06', status: 'Đang trực', shift: 'Ca đêm (22:00 - 06:00)', phone: '0904-112-816', radioChannel: 'CH-04' },
  { id: 'STF-17', code: 'AN-017', fullName: 'Mai Thế Vinh', rank: 'Nhân viên', unit: 'Giám sát CCTV', assignedZoneId: 'ZON-04', status: 'Nghỉ ca', shift: 'Ca đêm (22:00 - 06:00)', phone: '0904-112-817', radioChannel: 'CH-04' },
  { id: 'STF-18', code: 'AN-018', fullName: 'Tạ Quang Thắng', rank: 'Tổ trưởng', unit: 'Tuần tra khu vực', assignedZoneId: 'ZON-04', status: 'Đang tuần tra', shift: 'Ca chiều (14:00 - 22:00)', phone: '0904-112-818', radioChannel: 'CH-05' },
  { id: 'STF-19', code: 'AN-019', fullName: 'Chu Văn Kiên', rank: 'Nhân viên', unit: 'Tuần tra khu vực', assignedZoneId: 'ZON-04', status: 'Đang tuần tra', shift: 'Ca sáng (06:00 - 14:00)', phone: '0904-112-819', radioChannel: 'CH-05' },
  { id: 'STF-20', code: 'AN-020', fullName: 'Dương Minh Hiếu', rank: 'Nhân viên', unit: 'Tuần tra khu vực', assignedZoneId: 'ZON-05', status: 'Đang tuần tra', shift: 'Ca chiều (14:00 - 22:00)', phone: '0904-112-820', radioChannel: 'CH-05' },
  { id: 'STF-21', code: 'AN-021', fullName: 'Cao Xuân Trường', rank: 'Nhân viên', unit: 'Tuần tra khu vực', assignedZoneId: 'ZON-05', status: 'Đang trực', shift: 'Ca sáng (06:00 - 14:00)', phone: '0904-112-821', radioChannel: 'CH-05' },
  { id: 'STF-22', code: 'AN-022', fullName: 'Võ Hoàng Long', rank: 'Nhân viên', unit: 'Tuần tra khu vực', assignedZoneId: 'ZON-06', status: 'Nghỉ ca', shift: 'Ca đêm (22:00 - 06:00)', phone: '0904-112-822', radioChannel: 'CH-05' },
  { id: 'STF-23', code: 'AN-023', fullName: 'Hồ Thanh Bình', rank: 'Nhân viên', unit: 'Phản ứng nhanh', assignedZoneId: 'ZON-03', status: 'Đang trực', shift: 'Ca chiều (14:00 - 22:00)', phone: '0904-112-823', radioChannel: 'CH-01' },
  { id: 'STF-24', code: 'AN-024', fullName: 'Lương Ngọc Sơn', rank: 'Nhân viên', unit: 'Kiểm soát cổng', assignedZoneId: 'ZON-01', status: 'Đang trực', shift: 'Ca chiều (14:00 - 22:00)', phone: '0904-112-824', radioChannel: 'CH-02' },
];

export const DEMO_PATROL_ROUTES: PatrolRoute[] = [
  { id: 'PTR-01', code: 'TT-VD01', name: 'Tuyến Vành đai Ngoài & Bãi xe B', zoneIds: ['ZON-05', 'ZON-02'], assignedStaffId: 'STF-20', intervalMinutes: 20, lastCheckpointAt: '2026-11-20T17:48:00', status: 'Đúng lịch' },
  { id: 'PTR-02', code: 'TT-SK02', name: 'Tuyến Hậu trường & Sân khấu Chính', zoneIds: ['ZON-01', 'ZON-06'], assignedStaffId: 'STF-03', intervalMinutes: 15, lastCheckpointAt: '2026-11-20T17:52:00', status: 'Đúng lịch' },
  { id: 'PTR-03', code: 'TT-VIP03', name: 'Tuyến Hành lang VIP & Cửa thoát hiểm', zoneIds: ['ZON-03'], assignedStaffId: 'STF-11', intervalMinutes: 10, lastCheckpointAt: '2026-11-20T17:55:00', status: 'Đúng lịch' },
  { id: 'PTR-04', code: 'TT-TL04', name: 'Tuyến Gian hàng Trung tâm A-D', zoneIds: ['ZON-04'], assignedStaffId: 'STF-18', intervalMinutes: 25, lastCheckpointAt: '2026-11-20T17:19:00', status: 'Chậm checkpoint' },
  { id: 'PTR-05', code: 'TT-KT05', name: 'Tuyến Trạm điện & Phòng Server CCTV', zoneIds: ['ZON-06'], assignedStaffId: 'STF-15', intervalMinutes: 30, lastCheckpointAt: '2026-11-20T16:40:00', status: 'Tạm dừng điều động' },
  { id: 'PTR-06', code: 'TT-CA06', name: 'Tuyến Kiểm tra Cổng Soi chiếu A1', zoneIds: ['ZON-02'], assignedStaffId: 'STF-07', intervalMinutes: 15, lastCheckpointAt: '2026-11-20T17:50:00', status: 'Đúng lịch' },
];

// Deterministic PRNG for repeatable, realistic demo records
function createRng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const MIDDLE_NAMES = ['Văn', 'Thị', 'Minh', 'Quốc', 'Hoàng', 'Ngọc', 'Thanh', 'Đức', 'Anh', 'Thu', 'Hữu', 'Khánh'];
const FIRST_NAMES = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Hải', 'Hùng', 'Hương', 'Khánh', 'Khoa', 'Linh', 'Long', 'Mai', 'Nam', 'Ngân', 'Phong', 'Phúc', 'Quân', 'Quỳnh', 'Sơn', 'Thảo', 'Trang', 'Trung', 'Tuấn', 'Tùng', 'Vân', 'Việt'];
const ORGS = [
  'Bộ Khoa học & Công nghệ',
  'Tập đoàn Công nghệ VNPT',
  'Viettel Solutions',
  'FPT Software',
  'Đài Truyền hình Việt Nam',
  'Thông tấn xã Việt Nam',
  'Đại học Bách Khoa Hà Nội',
  'Hiệp hội Doanh nghiệp ASEAN',
  'Công ty Truyền thông Ánh Dương',
  'Ban Tổ chức Sự kiện Quốc gia',
  'Khách mời Tự do',
  'Đơn vị Kỹ thuật Âm thanh ProStage',
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

function addMinutesIso(isoStr: string, minutes: number): string {
  const d = new Date(isoStr);
  d.setMinutes(d.getMinutes() + minutes);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}

const VEHICLE_TYPES = ['Xe công vụ VIP', 'Xe đưa đón đại biểu', 'Xe tải hậu cần', 'Xe kỹ thuật phát thanh'];

export function buildDemoAttendees(): Attendee[] {
  const rng = createRng(20261120);
  const roles: AttendeeRole[] = [
    'Khách',
    'Đại biểu',
    'VIP',
    'Nhân viên',
    'Báo chí',
    'Nhà thầu',
    'Phương tiện',
  ];
  const roleWeights = [0.24, 0.22, 0.08, 0.14, 0.11, 0.11, 0.10];

  const attendees: Attendee[] = [];
  for (let i = 1; i <= 112; i++) {
    const ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const mn = MIDDLE_NAMES[Math.floor(rng() * MIDDLE_NAMES.length)];
    const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const driverName = `${ln} ${mn} ${fn}`;

    let role: AttendeeRole = 'Khách';
    if (i <= 7) {
      // Guarantee all 7 roles are represented cleanly in the top records
      role = roles[i - 1];
    } else {
      const rRoll = rng();
      let acc = 0;
      for (let r = 0; r < roles.length; r++) {
        acc += roleWeights[r];
        if (rRoll <= acc) {
          role = roles[r];
          break;
        }
      }
    }

    const eventId =
      i <= 56 ? 'EVT-01' : i <= 90 ? 'EVT-02' : i <= 104 ? 'EVT-03' : 'EVT-04';

    let allowedZoneIds: string[] = ['ZON-02', 'ZON-04', 'ZON-05'];
    if (role === 'VIP') allowedZoneIds = ['ZON-01', 'ZON-02', 'ZON-03', 'ZON-04', 'ZON-05'];
    else if (role === 'Đại biểu') allowedZoneIds = ['ZON-01', 'ZON-02', 'ZON-04', 'ZON-05'];
    else if (role === 'Nhân viên') allowedZoneIds = ['ZON-01', 'ZON-02', 'ZON-04', 'ZON-05', 'ZON-06'];
    else if (role === 'Báo chí') allowedZoneIds = ['ZON-01', 'ZON-02', 'ZON-04'];
    else if (role === 'Nhà thầu') allowedZoneIds = ['ZON-02', 'ZON-05', 'ZON-06'];
    else if (role === 'Phương tiện') allowedZoneIds = ['ZON-05', 'ZON-06'];

    const isVehicle = role === 'Phương tiện';
    const plateNum = `${29 + (i % 3)}${['A', 'B', 'C'][i % 3]}-${100 + ((i * 37) % 899)}.${pad2((i * 13) % 99)}`;
    const vehicleType = isVehicle ? VEHICLE_TYPES[i % VEHICLE_TYPES.length] : undefined;
    const fullName = isVehicle ? `${plateNum} (${driverName})` : driverName;

    // Seed explicit edge-case statuses for realistic testing
    let registrationStatus: RegistrationStatus = 'Đã phê duyệt';
    let qrStatus: QrTokenStatus = 'Hiệu lực';
    let singleUseQr = role === 'Khách' || role === 'Nhà thầu';
    let qrUsageCount = 0;
    let validFrom = `2026-11-14T07:00:00`;
    let validUntil = `2026-11-25T22:00:00`;

    if (i % 14 === 0) {
      registrationStatus = 'Chờ phê duyệt';
      qrStatus = 'Chưa cấp';
    } else if (i % 19 === 0) {
      registrationStatus = 'Tạm khóa';
      qrStatus = 'Thu hồi';
    } else if (i % 23 === 0) {
      registrationStatus = 'Từ chối';
      qrStatus = 'Thu hồi';
    } else if (i === 6 || i % 15 === 0) {
      // Single-use QR already scanned once
      singleUseQr = true;
      qrStatus = 'Đã sử dụng';
      qrUsageCount = 1;
    } else if (eventId === 'EVT-03' || i === 11 || i % 17 === 0) {
      // Expired QR validity window
      qrStatus = 'Hết hạn';
      validFrom = '2026-10-18T08:00:00';
      validUntil = '2026-10-30T18:00:00';
    }

    const qrCode =
      qrStatus === 'Chưa cấp'
        ? undefined
        : `SCC-QR-${eventId.replace('-', '')}-${pad3(i)}`;

    let checkInStatus: AttendeeCheckInStatus = 'Đã check-in';
    if (registrationStatus !== 'Đã phê duyệt' || eventId === 'EVT-04') {
      checkInStatus = 'Chưa đến';
    } else if (eventId === 'EVT-03') {
      checkInStatus = 'Đã rời khỏi';
    } else {
      const sRoll = rng();
      if (sRoll < 0.65) checkInStatus = 'Đã check-in';
      else if (sRoll < 0.82) checkInStatus = 'Chưa đến';
      else if (sRoll < 0.93) checkInStatus = 'Đã rời khỏi';
      else checkInStatus = 'Cần kiểm tra';
    }

    const lastSeenZoneId =
      checkInStatus === 'Đã check-in' || checkInStatus === 'Cần kiểm tra'
        ? allowedZoneIds[Math.floor(rng() * allowedZoneIds.length)]
        : undefined;

    const hour = 7 + Math.floor(rng() * 11);
    const min = Math.floor(rng() * 60);
    const day = eventId === 'EVT-03' ? 25 : 20;
    const month = eventId === 'EVT-03' ? 10 : 11;

    attendees.push({
      id: `ATT-${pad3(i)}`,
      code: isVehicle ? `PT-${pad3(i)}` : `TD-${pad3(i)}`,
      fullName,
      organization: ORGS[Math.floor(rng() * ORGS.length)],
      role,
      eventId,
      badgeNumber: `BG-${eventId.slice(-2)}-${1000 + i}`,
      identityLast4: String(1000 + Math.floor(rng() * 8999)),
      phone: `09${pad2(10 + (i % 89))}-${pad3(100 + ((i * 7) % 899))}-${pad3(200 + ((i * 11) % 799))}`,
      vehiclePlate: isVehicle ? plateNum : undefined,
      vehicleType,
      allowedZoneIds,
      registrationStatus,
      approvedBy:
        registrationStatus === 'Đã phê duyệt' ? 'Trung tá Lê Quang Minh' : undefined,
      approvedAt:
        registrationStatus === 'Đã phê duyệt' ? '2026-11-19T14:20:00' : undefined,
      qrCode,
      qrStatus,
      qrIssuedAt: qrCode ? '2026-11-19T15:00:00' : undefined,
      validFrom,
      validUntil,
      singleUseQr,
      qrUsageCount,
      checkInStatus,
      lastSeenZoneId,
      lastCheckInAt:
        checkInStatus === 'Chưa đến'
          ? undefined
          : `2026-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(min)}:00`,
      securityFlag:
        checkInStatus === 'Cần kiểm tra'
          ? 'Ghi nhận quét sai phân khu hoặc mã QR đã sử dụng trước đó'
          : undefined,
    });
  }
  return attendees;
}

interface IncidentTemplate {
  title: string;
  description: string;
  categoryId: string;
  recordType: IncidentRecordType;
  preferredZones: string[];
  severityPool: IncidentSeverity[];
}

const INCIDENT_TEMPLATES: IncidentTemplate[] = [
  {
    title: 'Phát hiện người không có thẻ tiếp cận hành lang kỹ thuật',
    description: 'Camera phân tích hành vi ghi nhận cá nhân đi qua cửa phụ không quẹt thẻ từ.',
    categoryId: 'CAT-01',
    recordType: 'Sự cố',
    preferredZones: ['ZON-06', 'ZON-03', 'ZON-01'],
    severityPool: ['Cao', 'Nghiêm trọng', 'Khẩn cấp'],
  },
  {
    title: 'Ùn tắc cục bộ tại làn kiểm soát an ninh số 3 và số 4',
    description: 'Lưu lượng khách tăng đột biến trước giờ khai mạc khiến hàng chờ kéo dài vượt ngưỡng an toàn.',
    categoryId: 'CAT-02',
    recordType: 'Vụ việc',
    preferredZones: ['ZON-02', 'ZON-04', 'ZON-01'],
    severityPool: ['Trung bình', 'Cao', 'Nghiêm trọng'],
  },
  {
    title: 'Lỗi đầu đọc thẻ RFID và gián đoạn cổng xoay tự động',
    description: 'Cổng kiểm soát mất kết nối máy chủ xác thực tạm thời, cần chuyển sang quét mã QR dự phòng.',
    categoryId: 'CAT-03',
    recordType: 'Vụ việc',
    preferredZones: ['ZON-02', 'ZON-05', 'ZON-06'],
    severityPool: ['Thấp', 'Trung bình', 'Cao'],
  },
  {
    title: 'Khách tham dự bị choáng ngất cần hỗ trợ y tế khẩn cấp',
    description: 'Nhân viên tuần tra phát hiện người tham dự có dấu hiệu tụt huyết áp và đã gọi tổ y tế tại chỗ.',
    categoryId: 'CAT-04',
    recordType: 'Sự cố',
    preferredZones: ['ZON-01', 'ZON-04', 'ZON-02'],
    severityPool: ['Cao', 'Nghiêm trọng', 'Khẩn cấp'],
  },
  {
    title: 'Cảnh báo quá nhiệt tủ điện phụ trợ khu vực sân khấu',
    description: 'Cảm biến nhiệt độ ghi nhận mức tăng bất thường tại tủ phân phối nguồn ánh sáng phụ.',
    categoryId: 'CAT-05',
    recordType: 'Sự cố',
    preferredZones: ['ZON-06', 'ZON-01', 'ZON-04'],
    severityPool: ['Nghiêm trọng', 'Khẩn cấp'],
  },
  {
    title: 'Tranh cãi lớn tiếng và xô xát nhẹ tại khu vực gian hàng',
    description: 'Hai nhóm khách tham dự phát sinh mâu thuẫn xếp hàng, tổ phản ứng nhanh đã tiếp cận tách đám đông.',
    categoryId: 'CAT-06',
    recordType: 'Vụ việc',
    preferredZones: ['ZON-04', 'ZON-05', 'ZON-02'],
    severityPool: ['Trung bình', 'Cao', 'Nghiêm trọng'],
  },
  {
    title: 'Phát hiện vali không người nhận gần lối vào sảnh chính',
    description: 'Hành lý đặt quá 15 phút không có chủ sở hữu; đã thiết lập vành đai cách ly tạm thời để kiểm tra.',
    categoryId: 'CAT-07',
    recordType: 'Sự cố',
    preferredZones: ['ZON-02', 'ZON-03', 'ZON-01'],
    severityPool: ['Nghiêm trọng', 'Khẩn cấp'],
  },
  {
    title: 'Phương tiện lạ dừng đỗ chắn tuyến đường ưu tiên đoàn VIP',
    description: 'Xe tải giao nhận đỗ sai vị trí tại làn ưu tiên vành đai B trong khung giờ đón đoàn.',
    categoryId: 'CAT-08',
    recordType: 'Sự cố',
    preferredZones: ['ZON-05', 'ZON-03'],
    severityPool: ['Cao', 'Nghiêm trọng', 'Khẩn cấp'],
  },
  {
    title: 'Mất tín hiệu 02 camera góc rộng hành lang phía Đông',
    description: 'Switch PoE tầng kỹ thuật báo suy hao tín hiệu khiến 02 luồng video gián đoạn.',
    categoryId: 'CAT-09',
    recordType: 'Vụ việc',
    preferredZones: ['ZON-06', 'ZON-04', 'ZON-05'],
    severityPool: ['Thấp', 'Trung bình', 'Cao'],
  },
  {
    title: 'Tiếp nhận khai báo thất lạc thẻ đại biểu và thiết bị cá nhân',
    description: 'Đại biểu báo mất thẻ ra vào kèm túi hồ sơ; bộ phận an ninh tiến hành khóa thẻ cũ và tra cứu camera.',
    categoryId: 'CAT-10',
    recordType: 'Vụ việc',
    preferredZones: ['ZON-04', 'ZON-02', 'ZON-01'],
    severityPool: ['Thấp', 'Trung bình'],
  },
];

// Curated incident schedule across Oct 18 - Nov 20, 2026 so day/week/month & comparisons have rich signal
const INCIDENT_DAY_OFFSETS: Array<{ date: string; eventId: string; count: number }> = [
  // Previous month / Oct exhibition (EVT-03)
  { date: '2026-10-19', eventId: 'EVT-03', count: 2 },
  { date: '2026-10-21', eventId: 'EVT-03', count: 3 },
  { date: '2026-10-23', eventId: 'EVT-03', count: 2 },
  { date: '2026-10-26', eventId: 'EVT-03', count: 4 },
  { date: '2026-10-29', eventId: 'EVT-03', count: 2 },
  // Early November (EVT-02 festival start)
  { date: '2026-11-02', eventId: 'EVT-02', count: 2 },
  { date: '2026-11-04', eventId: 'EVT-02', count: 3 },
  { date: '2026-11-06', eventId: 'EVT-02', count: 2 },
  { date: '2026-11-08', eventId: 'EVT-02', count: 3 },
  { date: '2026-11-10', eventId: 'EVT-02', count: 2 },
  { date: '2026-11-12', eventId: 'EVT-02', count: 2 },
  // Previous 7-day window (2026-11-07 to 2026-11-13) + overlap
  { date: '2026-11-13', eventId: 'EVT-02', count: 3 },
  // Current 7-day window (2026-11-14 to 2026-11-20) — high activity across EVT-01 & EVT-02
  { date: '2026-11-14', eventId: 'EVT-01', count: 4 },
  { date: '2026-11-15', eventId: 'EVT-01', count: 5 },
  { date: '2026-11-16', eventId: 'EVT-02', count: 4 },
  { date: '2026-11-17', eventId: 'EVT-01', count: 5 },
  { date: '2026-11-18', eventId: 'EVT-02', count: 4 },
  { date: '2026-11-19', eventId: 'EVT-01', count: 6 },
  { date: '2026-11-20', eventId: 'EVT-01', count: 5 },
  { date: '2026-11-20', eventId: 'EVT-02', count: 2 },
  // 1 pre-event incident for EVT-04 today (so EVT-04 has "Phát sinh mới" vs 0 prior!)
  { date: '2026-11-20', eventId: 'EVT-04', count: 1 },
];

export function buildDemoIncidentsAndAlerts(): {
  incidents: SecurityIncident[];
  alerts: SecurityAlert[];
} {
  const rng = createRng(998877);
  const incidents: SecurityIncident[] = [];
  const alerts: SecurityAlert[] = [];

  const alertSources: SecurityAlert['source'][] = [
    'Camera AI',
    'Cổng kiểm soát từ',
    'Cảm biến PCCC',
    'Tổ tuần tra',
    'Máy soi X-Ray',
    'Giám sát mạng',
  ];

  let incIndex = 1;
  let alertIndex = 1;

  for (const slot of INCIDENT_DAY_OFFSETS) {
    for (let k = 0; k < slot.count; k++) {
      const tpl = INCIDENT_TEMPLATES[(incIndex - 1) % INCIDENT_TEMPLATES.length];
      const cat = DEMO_CATEGORIES.find((c) => c.id === tpl.categoryId)!;
      const zoneId = tpl.preferredZones[Math.floor(rng() * tpl.preferredZones.length)];
      const severity = tpl.severityPool[Math.floor(rng() * tpl.severityPool.length)];
      const staff = DEMO_STAFF[Math.floor(rng() * DEMO_STAFF.length)];

      const hour = slot.date === DEMO_REFERENCE_DATE ? 8 + Math.floor(rng() * 10) : 8 + Math.floor(rng() * 13);
      const min = Math.floor(rng() * 59);
      const reportedAt = `${slot.date}T${pad2(hour)}:${pad2(min)}:00`;
      const detectedAt = addMinutesIso(reportedAt, -3);

      // Distribute across exact 6-step workflow:
      // Mới tiếp nhận -> Đang xác minh -> Đã phân công -> Đang xử lý -> Chờ xác nhận -> Đã đóng
      let status: IncidentStatus;
      if (slot.date < '2026-11-18') {
        status = 'Đã đóng';
      } else if (slot.date === '2026-11-18' || slot.date === '2026-11-19') {
        const roll = rng();
        if (roll < 0.65) status = 'Đã đóng';
        else if (roll < 0.82) status = 'Chờ xác nhận';
        else status = 'Đang xử lý';
      } else {
        // 2026-11-20 (today): spread across all 6 workflow states
        const roll = rng();
        if (roll < 0.18) status = 'Mới tiếp nhận';
        else if (roll < 0.34) status = 'Đang xác minh';
        else if (roll < 0.5) status = 'Đã phân công';
        else if (roll < 0.68) status = 'Đang xử lý';
        else if (roll < 0.84) status = 'Chờ xác nhận';
        else status = 'Đã đóng';
      }

      // Compute resolution time for closed incidents (some on-time, some overdue)
      let resolvedAt: string | undefined;
      if (status === 'Đã đóng') {
        const sla = cat.defaultSlaMinutes;
        const onTime = rng() < 0.82;
        const elapsed = onTime
          ? Math.max(4, Math.floor(sla * (0.35 + rng() * 0.6)))
          : Math.floor(sla * (1.1 + rng() * 0.9));
        resolvedAt = addMinutesIso(reportedAt, elapsed);
      }

      const incId = `INC-2026-${pad3(incIndex)}`;

      const primarySource =
        tpl.categoryId === 'CAT-05'
          ? 'Cảm biến PCCC'
          : tpl.categoryId === 'CAT-07'
          ? 'Máy soi X-Ray'
          : tpl.categoryId === 'CAT-03'
          ? 'Cổng kiểm soát từ'
          : tpl.categoryId === 'CAT-09'
          ? 'Giám sát mạng'
          : incIndex % 3 === 0
          ? 'Đường dây nóng An ninh'
          : incIndex % 2 === 0
          ? 'Camera AI'
          : 'Tổ tuần tra';

      const receivers = ['Trung tá Lê Quang Minh', 'Thiếu tá Phạm Hoàng Long', 'Đại úy Vũ Thị Thanh Hà'];
      const receiverName = receivers[incIndex % receivers.length];

      // Generate 1 to 3 linked alerts for this incident (demonstrating N alerts -> 1 incident)
      const linkedAlertCount = incIndex % 3 === 0 ? 3 : incIndex % 2 === 0 ? 2 : 1;
      const linkedAlertIds: string[] = [];
      for (let a = 0; a < linkedAlertCount; a++) {
        const altId = `ALT-2026-${pad3(alertIndex)}`;
        linkedAlertIds.push(altId);
        const source =
          tpl.categoryId === 'CAT-05'
            ? 'Cảm biến PCCC'
            : tpl.categoryId === 'CAT-07'
            ? 'Máy soi X-Ray'
            : tpl.categoryId === 'CAT-03'
            ? 'Cổng kiểm soát từ'
            : tpl.categoryId === 'CAT-09'
            ? 'Giám sát mạng'
            : a % 2 === 0
            ? 'Camera AI'
            : 'Tổ tuần tra';

        const alertTime = addMinutesIso(reportedAt, -(linkedAlertCount - a) * 2);
        alerts.push({
          id: altId,
          code: `CB-${pad3(alertIndex)}`,
          title:
            a === 0
              ? `Tín hiệu cảnh báo: ${tpl.title}`
              : `Cảnh báo bổ sung cùng hiện trường (${source})`,
          source,
          deviceId: `${source === 'Camera AI' ? 'CAM' : source === 'Cổng kiểm soát từ' ? 'GATE' : 'SNS'}-${zoneId.slice(-2)}-${pad2(1 + (alertIndex % 12))}`,
          eventId: slot.eventId,
          zoneId,
          categoryId: tpl.categoryId,
          severity,
          status: 'Đã xác minh',
          detectedAt: alertTime,
          linkedIncidentId: incId,
          verifiedBy: staff.fullName,
          note: `Đã hợp nhất vào hồ sơ ${incId}`,
        });
        alertIndex++;
      }

      const evidences: IncidentEvidence[] = [
        {
          id: `EVD-${incIndex}-1`,
          type: primarySource === 'Camera AI' ? 'Ảnh Camera' : 'Log thiết bị',
          title:
            primarySource === 'Camera AI'
              ? `Ảnh chụp trích xuất từ camera khu vực ${zoneId}`
              : `Nhật ký tín hiệu từ ${primarySource}`,
          referenceCode: `CAM-${zoneId.slice(-2)}-${pad2(1 + (incIndex % 10))}`,
          description: 'Dữ liệu trích xuất tại thời điểm phát hiện bất thường.',
          capturedAt: detectedAt,
          addedBy: receiverName,
        },
      ];
      if (status === 'Đang xử lý' || status === 'Chờ xác nhận' || status === 'Đã đóng') {
        evidences.push({
          id: `EVD-${incIndex}-2`,
          type: 'Biên bản hiện trường',
          title: `Biên bản kiểm tra hiện trường ${incId}`,
          referenceCode: `BB-${pad3(incIndex)}`,
          description: 'Ghi nhận tình trạng hiện trường và lời khai nhân chứng liên quan.',
          capturedAt: addMinutesIso(reportedAt, 5),
          addedBy: staff.fullName,
        });
      }

      const stageOrder: IncidentStatus[] = [
        'Mới tiếp nhận',
        'Đang xác minh',
        'Đã phân công',
        'Đang xử lý',
        'Chờ xác nhận',
        'Đã đóng',
      ];
      const stageIdx = stageOrder.indexOf(status);
      const progressUpdates: IncidentProgressEntry[] = [
        {
          id: `PRG-${incIndex}-0`,
          timestamp: reportedAt,
          actor: receiverName,
          stage: 'Mới tiếp nhận',
          note: `Tiếp nhận thông tin từ ${primarySource}, lập hồ sơ theo dõi.`,
        },
      ];
      if (stageIdx >= 1) {
        progressUpdates.push({
          id: `PRG-${incIndex}-1`,
          timestamp: addMinutesIso(reportedAt, 2),
          actor: receiverName,
          stage: 'Đang xác minh',
          note: 'Kiểm tra chéo camera giám sát và đối chiếu thông tin khu vực.',
        });
      }
      if (stageIdx >= 2) {
        progressUpdates.push({
          id: `PRG-${incIndex}-2`,
          timestamp: addMinutesIso(reportedAt, 3),
          actor: receiverName,
          stage: 'Đã phân công',
          note: `Điều động ${staff.fullName} (${staff.unit}) tiếp cận xử lý.`,
        });
      }
      if (stageIdx >= 3) {
        progressUpdates.push({
          id: `PRG-${incIndex}-3`,
          timestamp: addMinutesIso(reportedAt, 5),
          actor: staff.fullName,
          stage: 'Đang xử lý',
          note: 'Đã có mặt tại hiện trường, triển khai phương án kiểm soát an toàn.',
        });
      }
      if (stageIdx >= 4) {
        progressUpdates.push({
          id: `PRG-${incIndex}-4`,
          timestamp: addMinutesIso(reportedAt, 9),
          actor: staff.fullName,
          stage: 'Chờ xác nhận',
          note: 'Đã xử lý xong hiện trường, gửi báo cáo chờ trực ban xác nhận đóng hồ sơ.',
        });
      }
      if (stageIdx >= 5 && resolvedAt) {
        progressUpdates.push({
          id: `PRG-${incIndex}-5`,
          timestamp: resolvedAt,
          actor: receiverName,
          stage: 'Đã đóng',
          note: 'Trực ban trưởng nghiệm thu kết quả và xác nhận đóng hồ sơ.',
        });
      }

      const auditLogs: IncidentAuditLog[] = progressUpdates.map((p, idx) => ({
        id: `AUD-${incIndex}-${idx}`,
        timestamp: p.timestamp,
        actor: p.actor,
        action: idx === 0 ? 'Tạo hồ sơ vụ việc' : `Chuyển trạng thái → ${p.stage}`,
        detail: p.note,
      }));

      incidents.push({
        id: incId,
        code: incId,
        title: `${tpl.title} (#${pad2(incIndex)})`,
        description: tpl.description,
        recordType: tpl.recordType,
        eventId: slot.eventId,
        zoneId,
        categoryId: tpl.categoryId,
        severity,
        status,
        detectedAt,
        reportedAt,
        resolvedAt,
        slaMinutes: cat.defaultSlaMinutes,
        source: primarySource,
        receiverName,
        assignedStaffId: staff.id,
        reporterName: staff.fullName,
        linkedAlertIds,
        evidences,
        progressUpdates,
        auditLogs,
        resolutionNotes:
          status === 'Chờ xác nhận' || status === 'Đã đóng'
            ? 'Lực lượng tại chỗ đã tiếp cận, xử lý dứt điểm và khôi phục trạng thái an toàn khu vực.'
            : undefined,
      });

      incIndex++;
    }
  }

  // Add unverified alerts (24 alerts) & false alarms (16 alerts) so total alerts >= 120
  const unverifiedTitles = [
    'Phát hiện di chuyển bất thường tại hành lang sau giờ đóng cửa',
    'Mật độ đám đông vượt ngưỡng 85% tại cửa kiểm soát',
    'Quét thẻ từ không hợp lệ liên tiếp 3 lần tại cổng VIP',
    'Nhiệt độ điểm kết nối nguồn khu vực sân khấu tăng nhẹ',
    'Hành lý đặt cố định hơn 10 phút gần khu vực chờ',
    'Camera hành lang kỹ thuật báo che khuất tầm nhìn tạm thời',
    'Phát hiện thiết bị bay không người lái ở rìa vành đai ngoài',
    'Tín hiệu báo mở cửa thoát hiểm số 2 không có lệnh điều phối',
  ];

  const severities: IncidentSeverity[] = ['Thấp', 'Trung bình', 'Cao', 'Nghiêm trọng', 'Khẩn cấp'];

  for (let u = 0; u < 24; u++) {
    const altId = `ALT-2026-${pad3(alertIndex)}`;
    const zone = DEMO_ZONES[u % DEMO_ZONES.length];
    const cat = DEMO_CATEGORIES[u % DEMO_CATEGORIES.length];
    const eventId = u % 3 === 0 ? 'EVT-02' : 'EVT-01';
    const hour = 10 + (u % 8);
    const min = (u * 7) % 59;
    const sev = severities[(u + 1) % severities.length];

    alerts.push({
      id: altId,
      code: `CB-${pad3(alertIndex)}`,
      title: unverifiedTitles[u % unverifiedTitles.length],
      source: alertSources[u % alertSources.length],
      deviceId: `SNS-${zone.id.slice(-2)}-${pad2(1 + (u % 9))}`,
      eventId,
      zoneId: zone.id,
      categoryId: cat.id,
      severity: sev,
      status: 'Chưa xác minh',
      detectedAt: `${DEMO_REFERENCE_DATE}T${pad2(hour)}:${pad2(min)}:00`,
      note: 'Đang chờ trực ban trung tâm xác minh hình ảnh hoặc điều tổ tuần tra kiểm tra.',
    });
    alertIndex++;
  }

  for (let f = 0; f < 18; f++) {
    const altId = `ALT-2026-${pad3(alertIndex)}`;
    const zone = DEMO_ZONES[f % DEMO_ZONES.length];
    const cat = DEMO_CATEGORIES[(f + 2) % DEMO_CATEGORIES.length];
    const eventId = f % 2 === 0 ? 'EVT-01' : 'EVT-02';
    const day = 16 + (f % 5);
    const hour = 9 + (f % 10);

    alerts.push({
      id: altId,
      code: `CB-${pad3(alertIndex)}`,
      title: 'Cảnh báo tự động từ cảm biến chuyển động / khói bụi thi công',
      source: alertSources[(f + 2) % alertSources.length],
      deviceId: `CAM-${zone.id.slice(-2)}-${pad2(1 + (f % 8))}`,
      eventId,
      zoneId: zone.id,
      categoryId: cat.id,
      severity: 'Thấp',
      status: 'Báo động giả',
      detectedAt: `2026-11-${pad2(day)}T${pad2(hour)}:15:00`,
      verifiedBy: DEMO_STAFF[f % DEMO_STAFF.length].fullName,
      note: 'Đã kiểm tra trực tiếp tại hiện trường — xác nhận tín hiệu nhiễu kỹ thuật.',
    });
    alertIndex++;
  }

  // Sort incidents & alerts newest first
  incidents.sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
  alerts.sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));

  return { incidents, alerts };
}

export function buildDemoAccessLogs(attendees: Attendee[]): AccessLog[] {
  const rng = createRng(556677);
  const logs: AccessLog[] = [];
  const gates = [
    'Cổng X-Ray Chính A1',
    'Lối vào Khán giả Tây',
    'Cổng Sinh trắc học VIP',
    'Lối vào Triển lãm Trung tâm',
    'Trạm Soi gầm xe B2',
    'Chốt Thẻ Kỹ thuật Hậu cần',
  ];

  for (let i = 0; i < 120; i++) {
    const att = attendees[i % attendees.length];
    const zoneId = att.lastSeenZoneId || att.allowedZoneIds[0] || 'ZON-02';
    const roll = rng();

    let result: AccessLog['result'] = 'Hợp lệ';
    let scenarioTag: AccessScenarioTag = 'Hợp lệ';
    let reason = 'Xác thực QR demo hợp lệ — khớp sự kiện, thời hạn và phân quyền khu vực.';

    if (i % 24 === 7) {
      result = 'Mất kết nối';
      scenarioTag = 'Mất kết nối';
      reason = 'Mất kết nối máy chủ xác thực tại đầu đọc — chuyển kiểm tra hồ sơ dự phòng tại chốt.';
    } else if (i % 18 === 5) {
      result = 'Từ chối';
      scenarioTag = 'QR đã sử dụng';
      reason = 'Từ chối — Mã QR dùng 1 lần đã được quét check-in trước đó.';
    } else if (i % 21 === 11) {
      result = 'Từ chối';
      scenarioTag = 'QR không hợp lệ';
      reason = 'Từ chối — Mã QR sai định dạng hoặc không tồn tại trên hệ thống sự kiện.';
    } else if (att.checkInStatus === 'Cần kiểm tra' || roll > 0.91) {
      result = 'Cảnh báo';
      scenarioTag = 'Sai khu vực';
      reason = 'Cảnh báo an ninh — Quét thẻ vào khu vực ngoài danh sách phân quyền được cấp.';
    }

    const hour = 7 + Math.floor(rng() * 11);
    const min = Math.floor(rng() * 60);
    const day = att.eventId === 'EVT-03' ? 25 : 20;
    const month = att.eventId === 'EVT-03' ? 10 : 11;

    logs.push({
      id: `LOG-${pad3(i + 1)}`,
      attendeeId: scenarioTag === 'QR không hợp lệ' ? 'UNKNOWN' : att.id,
      attendeeName: scenarioTag === 'QR không hợp lệ' ? 'Mã QR không xác định' : att.fullName,
      attendeeRole: scenarioTag === 'QR không hợp lệ' ? 'Không xác định' : att.role,
      eventId: att.eventId,
      zoneId,
      gateName: gates[i % gates.length],
      direction: i % 5 === 0 ? 'Ra' : 'Vào',
      result,
      scenarioTag,
      qrCodeUsed:
        scenarioTag === 'QR không hợp lệ'
          ? `SCC-QR-INVALID-${100 + i}`
          : att.qrCode ?? `BG-${att.badgeNumber}`,
      timestamp: `2026-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(min)}:00`,
      reason,
    });
  }

  logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return logs;
}

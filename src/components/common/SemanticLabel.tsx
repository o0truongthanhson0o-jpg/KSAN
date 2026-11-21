import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Info,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import {
  AlertStatus,
  IncidentRecordType,
  IncidentSeverity,
  IncidentStatus,
} from '../../types/security';

export function SeverityText({ severity }: { severity: IncidentSeverity }) {
  switch (severity) {
    case 'Khẩn cấp':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 whitespace-nowrap">
          <Flame className="w-3.5 h-3.5 shrink-0" />
          <span>Khẩn cấp</span>
        </span>
      );
    case 'Nghiêm trọng':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 whitespace-nowrap">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Nghiêm trọng</span>
        </span>
      );
    case 'Cao':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Cao</span>
        </span>
      );
    case 'Trung bình':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Trung bình</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-300 whitespace-nowrap">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Thấp</span>
        </span>
      );
  }
}

export function IncidentStatusText({ status }: { status: IncidentStatus }) {
  switch (status) {
    case 'Đã đóng':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Đã đóng</span>
        </span>
      );
    case 'Chờ xác nhận':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Chờ xác nhận</span>
        </span>
      );
    case 'Đang xử lý':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Đang xử lý</span>
        </span>
      );
    case 'Đã phân công':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 whitespace-nowrap">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Đã phân công</span>
        </span>
      );
    case 'Đang xác minh':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Đang xác minh</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Mới tiếp nhận</span>
        </span>
      );
  }
}

export function RecordTypeText({ type }: { type: IncidentRecordType }) {
  if (type === 'Sự cố') {
    return (
      <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-red-300 border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">
        Sự cố
      </span>
    );
  }
  return (
    <span className="inline-block text-[11px] font-medium uppercase tracking-wider text-blue-300 border border-blue-500/35 bg-blue-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">
      Vụ việc
    </span>
  );
}

export function AlertStatusText({ status }: { status: AlertStatus }) {
  switch (status) {
    case 'Chưa xác minh':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Chưa xác minh</span>
        </span>
      );
    case 'Đã xác minh':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Đã xác minh</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Báo động giả</span>
        </span>
      );
  }
}

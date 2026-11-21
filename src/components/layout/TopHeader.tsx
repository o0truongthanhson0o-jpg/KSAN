import { Bell, ChevronDown, Menu, RotateCcw, User } from 'lucide-react';
import { useState } from 'react';
import { AppNotification, SecurityEvent } from '../../types/security';
import { formatDateTimeVi } from '../../utils/analyticsEngine';
import { SeverityText } from '../common/SemanticLabel';

interface TopHeaderProps {
  events: SecurityEvent[];
  selectedEventId: string;
  notifications: AppNotification[];
  onSelectEvent: (eventId: string) => void;
  onOpenMobileSidebar: () => void;
  onMarkAllNotificationsRead: () => void;
  onNotificationClick: (notif: AppNotification) => void;
  onResetDemoData: () => void;
}

export function TopHeader({
  events,
  selectedEventId,
  notifications,
  onSelectEvent,
  onOpenMobileSidebar,
  onMarkAllNotificationsRead,
  onNotificationClick,
  onResetDemoData,
}: TopHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#0b1322]/95 backdrop-blur border-b border-slate-800/90 px-4 flex items-center justify-between gap-4">
      {/* Left: Mobile toggle + System Name */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Mở menu điều hướng"
          className="md:hidden p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-100 truncate whitespace-nowrap">
            Security Command Center
          </div>
          <div className="hidden sm:block text-[11px] text-slate-400 truncate">
            Hệ thống Quản lý & Điều hành An ninh Sự kiện — Dữ liệu minh họa
          </div>
        </div>
      </div>

      {/* Right: Event selector, Notifications, User Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Event Selector */}
        <label className="hidden sm:flex items-center gap-2 text-xs">
          <span className="text-slate-400 whitespace-nowrap">Sự kiện:</span>
          <select
            value={selectedEventId}
            onChange={(e) => onSelectEvent(e.target.value)}
            aria-label="Chọn sự kiện điều hành"
            className="max-w-[230px] bg-[#101a2d] border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 truncate"
          >
            <option value="ALL">Tất cả sự kiện ({events.length})</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.code} — {ev.name}
              </option>
            ))}
          </select>
        </label>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setUserMenuOpen(false);
            }}
            aria-label="Thông báo điều hành"
            className="relative p-2 rounded-md border border-slate-800 bg-[#101a2d] text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-[10px] font-mono font-semibold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0e1729] border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-40">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-100">
                  Thông báo an ninh ({unreadCount} chưa đọc)
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllNotificationsRead}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Không có thông báo mới.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        onNotificationClick(n);
                        setNotifOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-slate-800/50 transition-colors space-y-1 ${
                        n.read ? 'opacity-70' : 'bg-blue-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <SeverityText severity={n.severity} />
                        <span className="text-[11px] font-mono text-slate-400">
                          {formatDateTimeVi(n.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-100">{n.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{n.message}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-md border border-slate-800 bg-[#101a2d] hover:border-slate-700 transition-colors"
          >
            <div className="w-6 h-6 rounded bg-blue-600/25 border border-blue-500/40 flex items-center justify-center text-blue-300">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-medium text-slate-100 leading-tight whitespace-nowrap">
                Trung tá Lê Quang Minh
              </div>
              <div className="text-[10px] text-slate-400 leading-tight whitespace-nowrap">
                Chỉ huy trưởng Trực ban
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0e1729] border border-slate-700 rounded-lg shadow-2xl p-3 space-y-2.5 z-40 text-xs">
              <div className="pb-2 border-b border-slate-800">
                <p className="font-semibold text-slate-100">Trung tá Lê Quang Minh</p>
                <p className="text-slate-400 mt-0.5">Phòng Điều hành An ninh Trung tâm</p>
                <p className="text-[11px] text-blue-300 mt-1">
                  Tài khoản Trực ban · Dữ liệu minh họa
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onResetDemoData();
                  setUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded bg-[#09111f] border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                <span>Khôi phục dữ liệu mẫu ban đầu</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

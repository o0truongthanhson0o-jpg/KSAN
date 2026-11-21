import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  LayoutDashboard,
  MapPinned,
  Shield,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import { ModuleId } from '../../types/security';

export interface NavModuleItem {
  id: ModuleId;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
}

export const NAV_MODULES: NavModuleItem[] = [
  { id: 'dashboard', label: 'Tổng quan an ninh', shortLabel: 'Tổng quan', icon: LayoutDashboard },
  { id: 'analytics', label: 'Phân tích & Xu hướng', shortLabel: 'Phân tích', icon: BarChart3 },
  { id: 'events', label: 'Quản lý sự kiện', shortLabel: 'Sự kiện', icon: CalendarDays },
  { id: 'zones', label: 'Khu vực & Sơ đồ an ninh', shortLabel: 'Khu vực', icon: MapPinned },
  { id: 'attendees', label: 'Đối tượng & Phương tiện', shortLabel: 'Đối tượng', icon: Users },
  { id: 'access', label: 'Đăng ký & Ra vào', shortLabel: 'Ra vào', icon: DoorOpen },
  { id: 'incidents', label: 'Vụ việc & Sự cố', shortLabel: 'Vụ việc', icon: ShieldAlert },
  { id: 'forces', label: 'Lực lượng & Cảnh báo', shortLabel: 'Lực lượng', icon: Activity },
];

interface SidebarProps {
  activeModule: ModuleId;
  collapsed: boolean;
  mobileOpen: boolean;
  unverifiedAlertsCount: number;
  openIncidentsCount: number;
  onSelectModule: (id: ModuleId) => void;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeModule,
  collapsed,
  mobileOpen,
  unverifiedAlertsCount,
  openIncidentsCount,
  onSelectModule,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const renderNav = (isMobile: boolean) => (
    <div className="flex flex-col h-full bg-[#0b1322] border-r border-slate-800/90">
      {/* Brand header */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-slate-800/90 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-md bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <div className="text-xs font-bold tracking-wide text-slate-100 truncate">
                SECURITY COMMAND
              </div>
              <div className="text-[10px] text-slate-400 truncate">Trung tâm Điều hành</div>
            </div>
          )}
        </div>

        {isMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Đóng thanh điều hướng"
            className="p-1.5 text-slate-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1" aria-label="Điều hướng chính">
        {NAV_MODULES.map((item) => {
          const Icon = item.icon;
          const active = activeModule === item.id;
          const badgeCount =
            item.id === 'forces'
              ? unverifiedAlertsCount
              : item.id === 'incidents'
              ? openIncidentsCount
              : 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectModule(item.id);
                if (isMobile) onCloseMobile();
              }}
              title={collapsed && !isMobile ? item.label : undefined}
              className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2.5 rounded-md text-xs font-medium transition-colors ${
                active
                  ? 'bg-blue-600/20 text-blue-200 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-400' : 'text-slate-400'}`} />
                {(!collapsed || isMobile) && (
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                )}
              </span>

              {(!collapsed || isMobile) && badgeCount > 0 && (
                <span
                  className={`font-mono tabular-nums text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                    item.id === 'forces'
                      ? 'text-amber-300 bg-amber-500/15'
                      : 'text-blue-300 bg-blue-500/15'
                  }`}
                >
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Demo Indicator */}
      {(!collapsed || isMobile) && (
        <div className="p-3 border-t border-slate-800/90 text-[11px] text-slate-400 space-y-1">
          <div className="font-medium text-slate-300">Chế độ Dữ liệu minh họa</div>
          <p className="text-slate-500 leading-relaxed">
            Sẵn sàng kết nối Node.js API & Firebase khi triển khai thực tế.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop / Tablet permanent collapsible sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-[width] duration-200 ${
          collapsed ? 'w-[68px]' : 'w-[252px]'
        }`}
      >
        <div className="sticky top-0 h-screen">{renderNav(false)}</div>
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/70" onClick={onCloseMobile} />
          <div className="relative w-64 max-w-[80vw] h-full z-10">{renderNav(true)}</div>
        </div>
      )}
    </>
  );
}

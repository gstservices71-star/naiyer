import React from 'react';
import { User } from '../types';
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  FileSpreadsheet,
  CalendarDays,
  UserCog,
  History,
  FileUp,
  FileDown,
  Settings,
  Receipt,
  X,
  LogOut,
  Landmark,
  ShieldCheck,
  ClipboardList,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'clients'
  | 'office-visits'
  | 'monthly-work'
  | 'bank-turnover'
  | 'reports'
  | 'financial-years'
  | 'users'
  | 'activity-logs'
  | 'import'
  | 'export'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  currentUser: User;
  onLogout: () => void;
  clientCount: number;
  pendingCount: number;
  inVisitsCount?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onLogout,
  clientCount,
  pendingCount,
  inVisitsCount = 0,
  isOpen,
  onClose,
}) => {
  const isAdmin = currentUser.role === 'admin';

  const menuItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'clients' as TabType, label: 'Master Clients', icon: Users, badge: clientCount },
    {
      id: 'office-visits' as TabType,
      label: 'Office Client Entry',
      icon: ClipboardList,
      badge: inVisitsCount > 0 ? `${inVisitsCount} IN` : 'Register',
      badgeColor: inVisitsCount > 0 ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'bg-slate-700/80 text-slate-300',
    },
    { id: 'monthly-work' as TabType, label: 'Monthly GST Work', icon: CalendarCheck2, badge: pendingCount > 0 ? `${pendingCount} pending` : null, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'bank-turnover' as TabType, label: 'Bank Turnover', icon: Landmark, badge: '5 Banks', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
    { id: 'reports' as TabType, label: 'Reports & PDF', icon: FileSpreadsheet, badge: 'PDF', badgeColor: 'bg-blue-500/20 text-blue-300' },
  ];

  const adminItems = [
    { id: 'users' as TabType, label: 'Staff & Users', icon: UserCog },
    { id: 'financial-years' as TabType, label: 'Financial Years', icon: CalendarDays },
    { id: 'import' as TabType, label: 'Import Clients (CSV)', icon: FileUp },
    { id: 'export' as TabType, label: 'Export Data', icon: FileDown },
    { id: 'activity-logs' as TabType, label: 'Staff Activity / Audit Log', icon: ShieldCheck, badge: 'Audit', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 left-0 bottom-0 w-64 bg-slate-900 text-white z-50 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-wide">GST PORTAL</div>
              <div className="text-[10px] text-slate-400 font-medium">PHP 8 & MySQL Suite</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Main Management
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-4 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Administration
              </div>

              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-tab-${item.id}`}
                    onClick={() => {
                      onSelectTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </>
          )}

          <div className="pt-4 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            System & Settings
          </div>

          <button
            id="sidebar-tab-settings"
            onClick={() => {
              onSelectTab('settings');
              onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Portal Settings</span>
          </button>
        </div>

        {/* Footer info & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Role: <strong className="text-slate-200 uppercase">{currentUser.role}</strong></span>
            <span className="text-emerald-400 font-medium text-[10px]">Active Session</span>
          </div>

          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 text-xs font-semibold border border-slate-700/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Lock</span>
          </button>
        </div>
      </aside>
    </>
  );
};

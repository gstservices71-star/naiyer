import React, { useState } from 'react';
import { User, FinancialYear, FY_MONTHS } from '../types';
import { 
  Building2, 
  Calendar, 
  Clock, 
  Download, 
  LogOut, 
  Menu, 
  ShieldCheck, 
  UserCheck, 
  User as UserIcon,
  ChevronDown,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onSwitchUser?: (user: User) => void;
  onLogout: () => void;
  users?: User[];
  financialYears: FinancialYear[];
  selectedFY: FinancialYear;
  onSelectFY: (fy: FinancialYear) => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onToggleSidebar: () => void;
  companyName: string;
  onRefreshPortal?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  onLogout,
  users,
  financialYears,
  selectedFY,
  onSelectFY,
  selectedMonth,
  onSelectMonth,
  onToggleSidebar,
  companyName,
  onRefreshPortal,
  isRefreshing = false,
}) => {
  const [localSpin, setLocalSpin] = useState(false);

  const handleRefreshClick = () => {
    setLocalSpin(true);
    if (onRefreshPortal) {
      onRefreshPortal();
    }
    setTimeout(() => {
      setLocalSpin(false);
    }, 800);
  };

  const isSpinning = isRefreshing || localSpin;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-3 sm:px-4 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Toggle & Bold CA Firm Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none shrink-0"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 flex items-center justify-center text-white shadow-sm font-black shrink-0 ring-2 ring-blue-600/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-slate-950 uppercase tracking-tight text-sm sm:text-base md:text-lg leading-tight truncate">
                  {companyName}
                </h1>
                <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 tracking-wider">
                  CA FIRM
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                <span className="truncate">GST Client & Monthly Work Management Portal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0">
          {/* Refresh All Portal Button */}
          <button
            id="navbar-refresh-portal-btn"
            onClick={handleRefreshClick}
            disabled={isSpinning}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer border ${
              isSpinning
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 opacity-90'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:shadow-sm active:scale-95'
            }`}
            title="Refresh & Sync All Portal Data (Clients, Monthly Work, Bank Turnover, Office Visits, Logs)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin text-emerald-900' : 'text-white'}`} />
            <span className="hidden sm:inline font-bold">
              {isSpinning ? 'Refreshing...' : 'Refresh Portal'}
            </span>
          </button>

          {/* FY Selector */}
          <div className="flex items-center bg-blue-50/90 border border-blue-200 rounded-lg px-2 sm:px-2.5 py-1 text-xs shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600 mr-1 sm:mr-1.5 shrink-0" />
            <span className="font-bold text-blue-950 mr-1 hidden md:inline">FY:</span>
            <select
              id="global-fy-selector"
              value={selectedFY.id}
              onChange={(e) => {
                const found = financialYears.find((f) => f.id === Number(e.target.value));
                if (found) onSelectFY(found);
              }}
              className="bg-transparent font-bold text-blue-800 focus:outline-none cursor-pointer pr-1 text-xs"
              title="Select Active Financial Year"
            >
              {financialYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-2 sm:px-2.5 py-1 text-xs shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-600 mr-1 sm:mr-1.5 shrink-0" />
            <span className="font-bold text-slate-700 mr-1 hidden md:inline">Month:</span>
            <select
              id="global-month-selector"
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
              title="Select Active Month"
            >
              {FY_MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* User Profile & Role Switcher */}
          <div className="relative group">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 sm:px-2.5 py-1 cursor-pointer hover:bg-slate-100 transition-colors shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-800 leading-none truncate max-w-[100px]">
                  {currentUser.name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">
                  {currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            {/* User Profile Dropdown */}
            <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 hidden group-hover:block z-50">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <div className="text-[11px] text-slate-500 font-medium">Signed in as:</div>
                <div className="text-sm font-bold text-slate-900 truncate mt-0.5">{currentUser.name}</div>
                {currentUser.email && (
                  <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                )}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    currentUser.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {currentUser.role === 'admin' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span>{currentUser.role.toUpperCase()} PANEL</span>
                  </span>
                  <span className="text-[10px] text-slate-400">@{currentUser.username}</span>
                </div>
              </div>

              <div className="px-2 pt-1.5 space-y-1">
                <button
                  onClick={handleRefreshClick}
                  className="w-full text-left px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 font-semibold rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
                  <span>Sync & Refresh All Data</span>
                </button>
                <button
                  id="user-logout-dropdown-btn"
                  onClick={onLogout}
                  className="w-full text-left px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-semibold rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Sign Out / Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Direct Logout Icon Button */}
          <button
            id="navbar-logout-btn"
            onClick={onLogout}
            title="Sign Out / Lock Session"
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

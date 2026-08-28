import React, { useState } from 'react';
import { ActivityLog } from '../types';
import { History, Search, ShieldAlert, Clock, User, Filter } from 'lucide-react';

interface ActivityLogsProps {
  logs: ActivityLog[];
}

export const ActivityLogs: React.FC<ActivityLogsProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = logs.filter((log) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchDesc = log.description.toLowerCase().includes(q);
      const matchUser = log.user_name.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      if (!matchDesc && !matchUser && !matchAction) return false;
    }
    if (actionFilter !== 'all' && log.action !== actionFilter) {
      return false;
    }
    return true;
  });

  const actions = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>System Activity Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable tracking log recording all client registrations, monthly status changes, user logins, and settings updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">User & Role</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Details / Target</th>
              <th className="px-4 py-3 text-right">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  No activity logs match your search.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {log.created_at}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{log.user_name}</div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {log.user_role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{log.description}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400 text-[11px]">
                    {log.ip_address}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

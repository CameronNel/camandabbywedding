import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  FileSpreadsheet,
  Home,
  Layers,
  Printer,
  Search,
  Utensils,
  X,
  XCircle,
} from 'lucide-react';
import type { HouseholdInvitation, WeddingConfig } from '../../types/wedding';
import { exportGuestsToCsv } from '../../utils/storage';
import { Button, inputClass } from './AdminPrimitives';

interface MasterWeddingReportModalProps {
  open: boolean;
  onClose: () => void;
  config: WeddingConfig;
  households: HouseholdInvitation[];
  notify: (toast: { tone: 'success' | 'error' | 'info'; message: string }) => void;
}

type ReportTab = 'all' | 'seating' | 'dietary' | 'accommodations';

const getMemberDietary = (m: { dietaryRestrictions?: string[]; dietaryDetails?: string }): string => {
  const parts: string[] = [];
  if (m.dietaryRestrictions && m.dietaryRestrictions.length) {
    parts.push(m.dietaryRestrictions.join(', '));
  }
  if (m.dietaryDetails && m.dietaryDetails.trim()) {
    parts.push(m.dietaryDetails.trim());
  }
  return parts.join(' — ');
};

export const MasterWeddingReportModal: React.FC<MasterWeddingReportModalProps> = ({
  open,
  onClose,
  config,
  households,
  notify,
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('all');
  const [search, setSearch] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Statistics
  const stats = useMemo(() => {
    const totalHouseholds = households.length;
    const totalInvited = households.reduce((sum, h) => sum + (h.members?.length || h.partySize || 1), 0);

    const attendingHouseholds = households.filter(h => h.rsvpStatus === 'attending');
    const declinedHouseholds = households.filter(h => h.rsvpStatus === 'declined');
    const pendingHouseholds = households.filter(h => h.rsvpStatus === 'pending');

    const totalAttendingGuests = attendingHouseholds.reduce((sum, h) => sum + (h.attendingCount || h.members?.filter(m => m.attending !== false).length || h.partySize || 1), 0);
    const totalDeclinedGuests = declinedHouseholds.reduce((sum, h) => sum + (h.members?.length || h.partySize || 1), 0);
    const totalPendingGuests = pendingHouseholds.reduce((sum, h) => sum + (h.members?.length || h.partySize || 1), 0);

    // Seating
    const seatedHouseholds = households.filter(h => Boolean(h.tableNumber && h.tableNumber.trim()));
    const totalSeatedGuests = seatedHouseholds.reduce((sum, h) => sum + (h.attendingCount || h.members?.length || h.partySize || 1), 0);

    // Dietary
    const dietaryMembers: Array<{ guestName: string; householdName: string; dietary: string; table: string }> = [];
    households.forEach(h => {
      if (h.members && h.members.length) {
        h.members.forEach(m => {
          const dietaryStr = getMemberDietary(m);
          if (dietaryStr && m.attending !== false) {
            dietaryMembers.push({
              guestName: m.name,
              householdName: h.name,
              dietary: dietaryStr,
              table: h.tableNumber || 'Unassigned',
            });
          }
        });
      }
    });

    // Housing
    const lodgeHouseholds = households.filter(h => h.tags?.includes('free_venue_housing'));
    const totalLodgeGuests = lodgeHouseholds.reduce((sum, h) => sum + (h.attendingCount || h.members?.length || h.partySize || 1), 0);

    // Tables map
    const tablesMap: Record<string, HouseholdInvitation[]> = {};
    households.forEach(h => {
      const table = (h.tableNumber && h.tableNumber.trim()) ? h.tableNumber.trim() : 'Unassigned';
      if (!tablesMap[table]) tablesMap[table] = [];
      tablesMap[table].push(h);
    });

    return {
      totalHouseholds,
      totalInvited,
      attendingHouseholds: attendingHouseholds.length,
      totalAttendingGuests,
      declinedHouseholds: declinedHouseholds.length,
      totalDeclinedGuests,
      pendingHouseholds: pendingHouseholds.length,
      totalPendingGuests,
      seatedHouseholds: seatedHouseholds.length,
      totalSeatedGuests,
      dietaryMembers,
      lodgeHouseholds: lodgeHouseholds.length,
      totalLodgeGuests,
      tablesMap,
    };
  }, [households]);

  // Filtered households for table search
  const filteredHouseholds = useMemo(() => {
    if (!search.trim()) return households;
    const q = search.toLowerCase();
    return households.filter(h =>
      h.name.toLowerCase().includes(q) ||
      h.inviteCode.toLowerCase().includes(q) ||
      (h.tableNumber && h.tableNumber.toLowerCase().includes(q)) ||
      h.members?.some(m => m.name.toLowerCase().includes(q) || getMemberDietary(m).toLowerCase().includes(q))
    );
  }, [households, search]);

  if (!open) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = async () => {
    const text = `📊 WEDDING MASTER REPORT: ${config.groomShortName || config.groomName} & ${config.brideShortName || config.brideName}
Date: ${config.weddingDate}
Venue: ${config.ceremonyVenue?.name || 'ArendsRus Country Lodge'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RSVP & GUEST SUMMARY:
• Total Invited: ${stats.totalInvited} guests across ${stats.totalHouseholds} households
• ✅ Attending / Accepted: ${stats.totalAttendingGuests} guests (${stats.attendingHouseholds} households)
• ❌ Declined / Rejected: ${stats.totalDeclinedGuests} guests (${stats.declinedHouseholds} households)
• ⏳ Pending: ${stats.totalPendingGuests} guests (${stats.pendingHouseholds} households)
• 🪑 Seated: ${stats.totalSeatedGuests} guests assigned to tables
• 🍽️ Dietary / Allergies: ${stats.dietaryMembers.length} special requests
• 🏡 On-Site Lodge Guests: ${stats.totalLodgeGuests} guests (${stats.lodgeHouseholds} households)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
      notify({ tone: 'success', message: 'Master summary copied to clipboard!' });
    } catch {
      notify({ tone: 'error', message: 'Could not access clipboard.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/70 p-2 backdrop-blur-sm sm:p-4 print:p-0 print:bg-white">
      <div className="relative flex max-h-[94vh] w-full max-w-6xl flex-col rounded-3xl border border-stone-200 bg-white shadow-2xl print:border-none print:shadow-none print:max-h-none">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-stone-200 p-5 sm:flex-row sm:items-center sm:justify-between print:border-b-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8a2947]/10 text-[#8a2947]">
                <FileSpreadsheet className="h-3.5 w-3.5" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a2947]">Executive Wedding Briefing</p>
            </div>
            <h2 className="mt-1 font-serif text-2xl font-bold text-stone-900">
              Master Guest, RSVP &amp; Seating Report
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              {config.groomShortName || config.groomName} &amp; {config.brideShortName || config.brideName} · {config.weddingDate} · {config.ceremonyVenue?.name || 'ArendsRus Country Lodge'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button size="sm" onClick={handleCopySummary} title="Copy summary text">
              {copiedSummary ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
            </Button>
            <Button size="sm" onClick={() => exportGuestsToCsv(households)} title="Download CSV">
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
            <Button size="sm" tone="primary" onClick={handlePrint} title="Print or save as PDF">
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              aria-label="Close report"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Total Invited</p>
              <p className="mt-1 text-2xl font-bold text-stone-900">{stats.totalInvited}</p>
              <p className="mt-0.5 text-[10px] text-stone-500">{stats.totalHouseholds} households</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Accepted
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">{stats.totalAttendingGuests}</p>
              <p className="mt-0.5 text-[10px] text-emerald-700">{stats.attendingHouseholds} households</p>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Declined
              </p>
              <p className="mt-1 text-2xl font-bold text-rose-900">{stats.totalDeclinedGuests}</p>
              <p className="mt-0.5 text-[10px] text-rose-700">{stats.declinedHouseholds} households</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                <Clock3 className="h-3 w-3" /> Pending
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-900">{stats.totalPendingGuests}</p>
              <p className="mt-0.5 text-[10px] text-amber-700">{stats.pendingHouseholds} households</p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                <Layers className="h-3 w-3" /> Seated
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-900">{stats.totalSeatedGuests}</p>
              <p className="mt-0.5 text-[10px] text-blue-700">{Object.keys(stats.tablesMap).filter(k => k !== 'Unassigned').length} tables</p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                <Utensils className="h-3 w-3" /> Dietary
              </p>
              <p className="mt-1 text-2xl font-bold text-purple-900">{stats.dietaryMembers.length}</p>
              <p className="mt-0.5 text-[10px] text-purple-700">Special requests</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-col gap-3 border-b border-stone-200 pb-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div className="flex flex-wrap gap-1 rounded-2xl bg-stone-100 p-1">
              {[
                { id: 'all' as const, label: `All Households (${households.length})` },
                { id: 'seating' as const, label: `Seating Plan (${Object.keys(stats.tablesMap).length} Groups)` },
                { id: 'dietary' as const, label: `Dietary / Catering (${stats.dietaryMembers.length})` },
                { id: 'accommodations' as const, label: `Lodge Stays (${stats.lodgeHouseholds})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-white text-[#7f2540] shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search guest, code, table, dietary…"
                className={`${inputClass} py-1.5 pl-8 text-xs`}
              />
            </div>
          </div>

          {/* TAB 1: ALL HOUSEHOLDS ROSTER */}
          {(activeTab === 'all' || typeof window === 'undefined') && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-stone-200">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-stone-200 bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="px-3 py-2.5">Household</th>
                      <th className="px-3 py-2.5">Code</th>
                      <th className="px-3 py-2.5">RSVP Status</th>
                      <th className="px-3 py-2.5">Party / Attending</th>
                      <th className="px-3 py-2.5">Table</th>
                      <th className="px-3 py-2.5">Individual Guests &amp; Dietary</th>
                      <th className="px-3 py-2.5">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-sans">
                    {filteredHouseholds.map(household => {
                      const statusColor =
                        household.rsvpStatus === 'attending'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : household.rsvpStatus === 'declined'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200';

                      return (
                        <tr key={household.id} className="hover:bg-stone-50/60">
                          <td className="px-3 py-2.5 font-semibold text-stone-900">
                            <div>{household.name}</div>
                            <div className="text-[10px] text-stone-400 font-normal">{household.phone || household.email || 'No contact'}</div>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[11px] text-stone-600">{household.inviteCode}</td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold capitalize ${statusColor}`}>
                              {household.rsvpStatus}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-medium text-stone-700">
                            {household.attendingCount} / {household.partySize}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-stone-800">
                            {household.tableNumber ? (
                              <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-200">
                                {household.tableNumber}
                              </span>
                            ) : (
                              <span className="text-stone-400 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-stone-600 max-w-xs">
                            {household.members && household.members.length ? (
                              <div className="space-y-1">
                                {household.members.map((m, idx) => {
                                  const dietaryStr = getMemberDietary(m);
                                  return (
                                    <div key={idx} className="flex items-center gap-1.5">
                                      <span className={m.attending === false ? 'line-through text-stone-400' : 'font-medium text-stone-800'}>
                                        {m.name}
                                      </span>
                                      {dietaryStr && (
                                        <span className="rounded bg-purple-50 px-1.5 py-0.2 text-[9px] font-semibold text-purple-700 border border-purple-200">
                                          🥗 {dietaryStr}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <span>{household.name} ({household.partySize} guests)</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-[10px]">
                            {household.tags?.includes('free_venue_housing') && (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-bold text-amber-800 border border-amber-200">
                                <Home className="h-3 w-3" /> Lodge
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: SEATING & TABLE PLAN */}
          {activeTab === 'seating' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(stats.tablesMap)
                  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                  .map(([tableName, tableHouseholds]) => {
                    const totalGuestsAtTable = tableHouseholds.reduce(
                      (sum, h) => sum + (h.attendingCount || h.partySize || 1),
                      0
                    );

                    return (
                      <div key={tableName} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                          <h4 className="font-serif text-base font-bold text-stone-900">
                            {tableName === 'Unassigned' ? '⚠️ Unassigned Seating' : `🪑 ${tableName}`}
                          </h4>
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                            {totalGuestsAtTable} guests
                          </span>
                        </div>

                        <ul className="mt-3 space-y-2 text-xs">
                          {tableHouseholds.map(h => (
                            <li key={h.id} className="flex flex-col rounded-xl bg-stone-50 p-2">
                              <div className="flex items-center justify-between">
                                <strong className="text-stone-800">{h.name}</strong>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                                  h.rsvpStatus === 'attending' ? 'text-emerald-700' : 'text-stone-500'
                                }`}>
                                  {h.attendingCount} attending
                                </span>
                              </div>
                              {h.members && h.members.length > 0 && (
                                <p className="mt-1 text-[11px] text-stone-500">
                                  {h.members.map(m => m.name).join(', ')}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 3: DIETARY & CATERING REQUIREMENTS */}
          {activeTab === 'dietary' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 text-xs">
                <p className="font-bold text-purple-900">🥗 Catering &amp; Allergy Master List</p>
                <p className="mt-0.5 text-purple-700">All dietary requirements submitted by confirmed attending guests.</p>
              </div>

              {stats.dietaryMembers.length ? (
                <div className="overflow-x-auto rounded-2xl border border-stone-200">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-stone-200 bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      <tr>
                        <th className="px-3 py-2.5">Guest Name</th>
                        <th className="px-3 py-2.5">Household</th>
                        <th className="px-3 py-2.5">Table</th>
                        <th className="px-3 py-2.5">Dietary Requirement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {stats.dietaryMembers.map((item, idx) => (
                        <tr key={idx} className="hover:bg-stone-50">
                          <td className="px-3 py-2.5 font-bold text-stone-900">{item.guestName}</td>
                          <td className="px-3 py-2.5 text-stone-600">{item.householdName}</td>
                          <td className="px-3 py-2.5 font-semibold text-blue-800">{item.table}</td>
                          <td className="px-3 py-2.5 font-semibold text-purple-800">
                            <span className="rounded bg-purple-50 px-2 py-1 border border-purple-200">
                              {item.dietary}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-stone-500">
                  No dietary requirements logged yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LODGE & ACCOMMODATION STAYS */}
          {activeTab === 'accommodations' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 text-xs">
                <p className="font-bold text-amber-900">🏡 ArendsRus On-Site Lodge Housing List</p>
                <p className="mt-0.5 text-amber-700">Guests flagged with complimentary on-site venue lodging.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {households.filter(h => h.tags?.includes('free_venue_housing')).map(h => (
                  <div key={h.id} className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4">
                    <div className="flex items-center justify-between">
                      <strong className="text-stone-900">{h.name}</strong>
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        {h.attendingCount || h.partySize} guests
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">{h.phone || h.email || 'No contact details'}</p>
                    {h.members && h.members.length > 0 && (
                      <p className="mt-2 text-[11px] text-stone-600 font-medium">
                        Guests: {h.members.map(m => m.name).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 p-4 text-xs text-stone-500 rounded-b-3xl print:hidden">
          <span>Report generated from live shared wedding database</span>
          <Button onClick={onClose}>Close Report</Button>
        </div>
      </div>
    </div>
  );
};
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import { apiGet, API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ActivitySeriesPoint } from "@/types/admin";

type MonthlyItem = { label: string; year: number; month: number; count: number };
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
} from 'recharts';

export function ReportsSection() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ActivitySeriesPoint[]>([]);
  const [allRows, setAllRows] = useState<ActivitySeriesPoint[]>([]); // keep unfiltered copy
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [reportType, setReportType] = useState("Overview");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [monthlyData, setMonthlyData] = useState<{ label: string; year: number; month: number; count: number }[]>([]);
  const [growthData, setGrowthData] = useState<{ label: string; year: number; month: number; listings: number; users: number }[]>([]);
  const [usingSample, setUsingSample] = useState(false);
  const [applyStatus, setApplyStatus] = useState<string | null>(null);
  const [applyPressed, setApplyPressed] = useState(false);
  const [exportPressed, setExportPressed] = useState(false);

  function getEntityForReportType(rt: string) {
    const key = (rt || '').toLowerCase();
    if (key === 'users') return 'users';
    if (key === 'listings') return 'listings';
    if (key === 'reviews') return 'reviews';
    if (key === 'revenue') return 'revenue';
    if (key === 'overview') return 'activity';
    return 'activity';
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Always use authenticated endpoint for monthly activity
        const monthlyEnt = 'reviews';
        const monthly = await apiGet<{ label: string; year: number; month: number; count: number }[]>(`/api/admin/reports/activity/monthly?months=6&entity=${encodeURIComponent(monthlyEnt)}`, user?.token);
        if (!alive) return;
        if (monthly && monthly.length > 0) {
          setMonthlyData(monthly);
          const synth = (monthly as any[]).map(m => ({ d: new Date(`${m.year}-${String(m.month).padStart(2,'0')}-15`).toISOString(), kind: ('ReviewCreate' as any), count: m.count })) as ActivitySeriesPoint[];
          setRows(synth);
          setAllRows(synth);
          setUsingSample(false);
        }

        // Growth Trends: fetch both listings and users monthly series
        if (reportType === 'Overview') {
          const months = 6;
          const fetchMonthlyFor = async (entity: string): Promise<MonthlyItem[]> => {
            try {
              return await apiGet<{ label: string; year: number; month: number; count: number }[]>(`/api/admin/reports/activity/monthly?months=${months}&entity=${encodeURIComponent(entity)}`, user?.token) || [];
            } catch (e) {
              return [] as any;
            }
          };
          const [listingsM, usersM] = await Promise.all([fetchMonthlyFor('listings'), fetchMonthlyFor('users')]);
          if (!alive) return;
          const joined: typeof growthData = [];
          for (let i = 5; i >= 0; i--) {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            const label = d.toLocaleString(undefined, { month: 'short' });
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const l = listingsM.find(x => x.year === year && x.month === month)?.count || 0;
            const u = usersM.find(x => x.year === year && x.month === month)?.count || 0;
            joined.push({ label, year, month, listings: l, users: u });
          }
          setGrowthData(joined);
        }
      } catch (errAll) {
        console.error('Reports fetch unexpected error:', errAll);
        setErr((errAll && (errAll as any).message) ? (errAll as any).message : String(errAll));
        // fallback to sample data
        const sampleSeries: ActivitySeriesPoint[] = Array.from({ length: 14 }).map((_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (13 - i));
          return { d: d.toISOString(), kind: ("Review" as any), count: Math.round(100 + Math.random() * 50) } as ActivitySeriesPoint;
        });
        setRows(sampleSeries);
        setAllRows(sampleSeries);
        const sampleMonthly = [] as { label: string; year: number; month: number; count: number }[];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(); d.setMonth(d.getMonth() - i);
          sampleMonthly.push({ label: d.toLocaleString(undefined, { month: 'short' }), year: d.getFullYear(), month: d.getMonth() + 1, count: 120 + (5 - i) * 40 });
        }
        setMonthlyData(sampleMonthly);
        setUsingSample(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [reportType, user?.token]);

  // Always render the UI; show non-blocking error/status messages above the controls
  if (loading) return <div className="text-sm text-muted-foreground">Loading report…</div>;

  // Build last 6 months labels (short month names) to match the mock (always show 6 bars)
  const lastSixMonths: { key: string; label: string; year: number; month: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString(undefined, { month: 'short' });
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-based month
    const key = `${label} ${year}`;
    lastSixMonths.push({ key, label, year, month });
  }

  // Use monthlyData (real database counts) if available, otherwise aggregate from rows as fallback
  const monthValues = lastSixMonths.map(m => {
    const md = monthlyData.find(x => x.year === m.year && x.month === m.month);
    if (md) return md.count;
    // Fallback: aggregate from rows
    const monthlyCounts = rows.reduce<Record<string, number>>((acc, r) => {
      const dt = new Date(r.d);
      const ky = dt.toLocaleString(undefined, { month: "short" }) + " " + dt.getFullYear();
      acc[ky] = (acc[ky] || 0) + (r.count || 0);
      return acc;
    }, {});
    return monthlyCounts[m.key] || 0;
  });
  // Set fixed Y-axis maximum to 30 for consistent scaling
  const displayTickMax = 30;
  const yStep = 6; // 6 * 5 = 30
  const yTicks = [0, 6, 12, 18, 24, 30];

  function downloadCsv() {
    // Use selected year and month for CSV export
    const path = `/api/admin/reports/export/csv?reportType=${encodeURIComponent(reportType)}&year=${selectedYear}&month=${selectedMonth}`;
    const url = `${API_BASE}${path}`;
    console.log('Downloading CSV from', url);
    
  // Trigger file download
  const token = user?.token;
    const tryUrl = async (u: string, headers?: Record<string,string>) => {
      const r = await fetch(u, { method: 'GET', headers: { ...(headers || {}) } });
      if (!r.ok) {
        const text = await r.text();
        console.warn('CSV attempt failed:', { url: u, status: r.status, body: text });
        throw new Error(`CSV failed ${r.status}`);
      }
      return r.blob();
    }

    (async () => {
      try {
        // try authenticated export first
        if (token) {
          const blob = await tryUrl(url, { Authorization: `Bearer ${token}` });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          // Use dynamic filename based on report type and date
          const fileName = `${reportType}_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          link.remove();
          return;
        }

        // if no token, show error
        alert('Authentication required to download CSV report');
      } catch (err:any) {
        alert('Failed to download CSV: ' + (err && err.message ? err.message : String(err)));
      }
    })();
  }

  async function loadByMonth(year: number, month: number) {
    setApplyStatus('Loading...');
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month - 1, new Date(year, month, 0).getDate(), 23, 59, 59, 999);
    try {
      const monthlyEnt = 'reviews';
      // Authenticated fetch for monthly data
      const mJson = await apiGet<{ label: string; year: number; month: number; count: number }[]>(`/api/admin/reports/activity/monthly?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&entity=${encodeURIComponent(monthlyEnt)}`, user?.token);
      if (mJson && mJson.length > 0) {
        setMonthlyData(mJson);
        const s = (mJson as any[]).map(x => ({ d: new Date(`${x.year}-${String(x.month).padStart(2,'0')}-15`).toISOString(), kind: ('ReviewCreate' as any), count: x.count })) as ActivitySeriesPoint[];
        setRows(s);
        setAllRows(s);
        setUsingSample(false);
        // Growth data for Overview - Always fetch last 6 months for Growth Trends chart
        if (reportType === 'Overview') {
          const fetchMonthlyFor = async (entity: string): Promise<MonthlyItem[]> => {
            try {
              // Always get last 6 months for Growth Trends, not filtered by selected month
              return await apiGet<{ label: string; year: number; month: number; count: number }[]>(`/api/admin/reports/activity/monthly?months=6&entity=${encodeURIComponent(entity)}`, user?.token) || [];
            } catch (e) {
              return [] as any;
            }
          };
          const [listingsM, usersM] = await Promise.all([fetchMonthlyFor('listings'), fetchMonthlyFor('users')]);
          const joined: typeof growthData = [];
          // Build last 6 months array
          for (let i = 5; i >= 0; i--) {
            const d = new Date(); 
            d.setMonth(d.getMonth() - i);
            const label = d.toLocaleString(undefined, { month: 'short' });
            const year = d.getFullYear();
            const mth = d.getMonth() + 1;
            const l = (listingsM.find((x:any)=>x.year===year && x.month===mth)?.count) || 0;
            const u = (usersM.find((x:any)=>x.year===year && x.month===mth)?.count) || 0;
            joined.push({ label, year, month: mth, listings: l, users: u });
          }
          setGrowthData(joined);
        }
        setApplyStatus('Loaded');
        setTimeout(()=>setApplyStatus(null),800);
        return;
      }
    } catch (e) {
      console.warn('loadByMonth failed', e);
    }
    setApplyStatus(null);
  }

  // Load a server-side range (days) and months for monthly endpoint
  async function loadRange(days: number, months: number) {
    setApplyStatus('Loading...');
    const to = new Date();
    const from = new Date(Date.now() - 1000*60*60*24*days);
    try {
      const monthlyEnt = 'reviews';
      const mJson = await apiGet<{ label: string; year: number; month: number; count: number }[]>(`/api/admin/reports/activity/monthly?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&entity=${encodeURIComponent(monthlyEnt)}`, user?.token);
      if (mJson && mJson.length > 0) {
        setMonthlyData(mJson);
        const s = (mJson as any[]).map(x => ({ d: new Date(`${x.year}-${String(x.month).padStart(2,'0')}-15`).toISOString(), kind: ('ReviewCreate' as any), count: x.count })) as ActivitySeriesPoint[];
        setRows(s);
        setAllRows(s);
        setUsingSample(false);
        if (reportType === 'Overview') {
          const fetchMonthlyFor = async (entity: string): Promise<MonthlyItem[]> => {
            try {
              return await apiGet<{ label: string; year: number; month: number; count: number }[]>(`/api/admin/reports/activity/monthly?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&entity=${encodeURIComponent(entity)}`, user?.token) || [];
            } catch (e) {
              return [] as any;
            }
          };
          const [listingsM, usersM] = await Promise.all([fetchMonthlyFor('listings'), fetchMonthlyFor('users')]);
          const joined: typeof growthData = [];
          const monthsArr: Date[] = [];
          for (let d = new Date(from.getFullYear(), from.getMonth(), 1); d <= to; d.setMonth(d.getMonth() + 1)) monthsArr.push(new Date(d));
          for (const d of monthsArr) {
            const label = d.toLocaleString(undefined, { month: 'short' });
            const year = d.getFullYear();
            const mth = d.getMonth() + 1;
            const l = (listingsM.find((x:any)=>x.year===year && x.month===mth)?.count) || 0;
            const u = (usersM.find((x:any)=>x.year===year && x.month===mth)?.count) || 0;
            joined.push({ label, year, month: mth, listings: l, users: u });
          }
          setGrowthData(joined);
        }
        setApplyStatus('Loaded');
        setTimeout(()=>setApplyStatus(null),800);
        return;
      }
    } catch (e) {
      console.warn('loadRange failed, falling back to client data', e);
    }
    // fallback: if we have allRows, filter client-side
    const filtered = allRows.filter(r => new Date(r.d) >= from && new Date(r.d) <= to);
    setRows(filtered);
    recomputeMonthly(filtered);
    setApplyStatus('Loaded');
    setTimeout(()=>setApplyStatus(null),800);
  }

  function recomputeMonthly(source: ActivitySeriesPoint[]) {
    // aggregate counts by year+month
    const map = new Map<string, number>();
    for (const r of source) {
      const d = new Date(r.d);
      const key = `${d.getFullYear()}-${d.getMonth()+1}`;
      map.set(key, (map.get(key) || 0) + (r.count || 0));
    }
    // build lastSixMonths from current date
    const lastSixMonthsArr: { label: string; year: number; month: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()+1}`;
      lastSixMonthsArr.push({ label: d.toLocaleString(undefined, { month: 'short' }), year: d.getFullYear(), month: d.getMonth()+1, count: map.get(key) || 0 });
    }
    setMonthlyData(lastSixMonthsArr);
  }

  return (
    <div className="space-y-6">
      {err && (
        <div className="rounded-lg bg-gradient-to-r from-red-50 to-red-100 border border-red-200 p-4 text-sm text-red-700 animate-in fade-in slide-in-from-top-4 duration-500 shadow-md">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Error loading reports: {err}
          </div>
        </div>
      )}
      {usingSample && (
        <div className="inline-block rounded-full bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 px-4 py-2 text-xs font-semibold animate-bounce shadow-md border border-yellow-200">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Using sample data
          </span>
        </div>
      )}
      {/* Top tabs removed per design request */}

      {/* Generate Reports */}
      <div className="rounded-2xl border border-gray-200 p-6 bg-gradient-to-br from-white via-gray-50/30 to-white shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">Generate Reports</h3>
            <p className="text-sm text-gray-600">Export data and analytics for specific date ranges</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1 pr-4 group">
            <label className="block text-sm mb-2 font-semibold text-gray-700 transition-colors group-hover:text-blue-600">Report Type</label>
            <div className="relative">
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                className="border-2 border-gray-300 rounded-xl px-4 h-11 w-56 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 outline-none cursor-pointer shadow-sm hover:shadow-md appearance-none"
              >
                <option>Overview</option>
                <option>Listings</option>
                <option>Users</option>
                <option>Reviews</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 flex items-center gap-3 md:justify-end">
            <div className="inline-flex items-center gap-3">
              <div className="group">
                <label className="text-sm text-gray-600 mr-2 font-semibold transition-colors group-hover:text-blue-600">Year</label>
                <div className="relative inline-block">
                  <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="border-2 border-gray-300 px-4 h-11 rounded-xl w-32 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 outline-none cursor-pointer shadow-sm hover:shadow-md appearance-none">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const y = new Date().getFullYear() - i;
                      return <option key={y} value={y}>{y}</option>;
                    })}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="text-sm text-gray-600 mr-2 font-semibold transition-colors group-hover:text-blue-600">Month</label>
                <div className="relative inline-block">
                  <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="border-2 border-gray-300 px-4 h-11 rounded-xl w-28 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 outline-none cursor-pointer shadow-sm hover:shadow-md appearance-none">
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, idx) => (
                      <option key={m} value={idx+1}>{m}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setApplyPressed(true); loadByMonth(selectedYear, selectedMonth).finally(() => setApplyPressed(false)); }}
                className={`ml-2 px-6 h-11 flex items-center justify-center border-2 border-gray-300 rounded-xl bg-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-300 transform hover:scale-110 active:scale-95 font-semibold shadow-md hover:shadow-xl hover:border-gray-400 ${applyPressed || applyStatus === 'Loading...' ? 'opacity-80 cursor-not-allowed' : ''}`}
                disabled={applyPressed || applyStatus === 'Loading...'}
                aria-pressed={applyPressed}
              >
                {applyPressed || applyStatus === 'Loading...' ? (
                  <>
                    <svg className="animate-spin mr-2" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Applying...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply
                  </>
                )}
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => { setExportPressed(true); (async () => { try { await downloadCsv(); } finally { setExportPressed(false); } })(); }}
                className={`inline-flex items-center gap-2 bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white px-6 h-11 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 font-semibold shadow-lg hover:shadow-2xl hover:from-gray-800 hover:via-gray-700 hover:to-gray-900 ${exportPressed ? 'opacity-80 cursor-not-allowed' : ''}`}
                disabled={exportPressed}
              >
                {exportPressed ? (
                  <>
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 animate-bounce" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Export CSV
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards: Growth Trends and Monthly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-200 p-6 bg-gradient-to-br from-white via-blue-50/20 to-white min-h-[220px] shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] animate-in fade-in slide-in-from-left-6 hover:border-blue-300 group">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 text-lg">Growth Trends</h4>
              </div>
              <p className="text-sm text-gray-600 ml-14">User and listing growth over time</p>
            </div>
          </div>

          <div style={{ width: '100%', height: 160 }} className="animate-in fade-in duration-700 delay-100">
            <ResponsiveContainer>
              {growthData && growthData.length > 0 ? (
                <ComposedChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111827" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#111827" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Legend />
                  <Bar dataKey="listings" fill="url(#colorListings)" barSize={20} radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={3} dot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                </ComposedChart>
              ) : (
                <ComposedChart data={rows.slice(Math.max(0, rows.length - 40)).map((r, i) => ({ label: new Date(r.d).toLocaleDateString(), v: r.count || 0 }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="label" hide />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="v" fill="#111827" radius={[6, 6, 0, 0]} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 p-6 bg-gradient-to-br from-white via-purple-50/20 to-white min-h-[220px] shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] animate-in fade-in slide-in-from-right-6 hover:border-purple-300 group">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 text-lg">Monthly Activity</h4>
              </div>
              <p className="text-sm text-gray-600 ml-14">Reviews and engagement metrics</p>
            </div>
          </div>

          <div style={{ width: '100%', height: 200 }} className="animate-in fade-in duration-700 delay-100">
            <ResponsiveContainer>
              <BarChart data={lastSixMonths.map((m, idx) => ({ label: m.label, value: monthValues[idx] || 0 }))} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111827" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#111827" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="label" />
                <YAxis ticks={yTicks} domain={[0, 30]} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="value" fill="url(#colorActivity)" barSize={30} radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="text-xs text-gray-600 mt-3 flex items-center justify-center gap-2 font-medium">
              <span className="inline-block w-4 h-4 bg-gradient-to-br from-gray-900 to-gray-700 rounded-sm shadow-sm" /> 
              Reviews
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

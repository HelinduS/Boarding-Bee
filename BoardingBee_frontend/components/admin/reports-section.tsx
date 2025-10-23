"use client";
import { useEffect, useState } from "react";
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
        const monthly = await apiGet<{ label: string; year: number; month: number; count: number }[]>(`/api/admin/reports/activity/monthly?months=6&entity=${encodeURIComponent(monthlyEnt)}`);
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
              return await apiGet<{ label: string; year: number; month: number; count: number }[]>(`/api/admin/reports/activity/monthly?months=${months}&entity=${encodeURIComponent(entity)}`) || [];
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
  }, [reportType]);

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
    const token = getToken();
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
      const mJson = await apiGet<{ label: string; year: number; month: number; count: number }[]>(`/api/admin/reports/activity/monthly?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&entity=${encodeURIComponent(monthlyEnt)}`);
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
              return await apiGet<{ label: string; year: number; month: number; count: number }[]>(`/api/admin/reports/activity/monthly?months=6&entity=${encodeURIComponent(entity)}`) || [];
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
      const mJson = await apiGet<{ label: string; year: number; month: number; count: number }[]>(`/api/admin/reports/activity/monthly?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&entity=${encodeURIComponent(monthlyEnt)}`);
      if (mJson && mJson.length > 0) {
        setMonthlyData(mJson);
        const s = (mJson as any[]).map(x => ({ d: new Date(`${x.year}-${String(x.month).padStart(2,'0')}-15`).toISOString(), kind: ('ReviewCreate' as any), count: x.count })) as ActivitySeriesPoint[];
        setRows(s);
        setAllRows(s);
        setUsingSample(false);
        if (reportType === 'Overview') {
          const fetchMonthlyFor = async (entity: string): Promise<MonthlyItem[]> => {
            try {
              return await apiGet<{ label: string; year: number; month: number; count: number }[]>(`/api/admin/reports/activity/monthly?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&entity=${encodeURIComponent(entity)}`) || [];
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
        <div className="rounded-md bg-red-50 border border-red-100 p-3 text-sm text-red-700">Error loading reports: {err}</div>
      )}
      {usingSample && (
        <div className="inline-block rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-medium">Using sample data</div>
      )}
      {/* Top tabs removed per design request */}

      {/* Generate Reports */}
      <div className="rounded-2xl border p-6 bg-white">
        <h3 className="text-lg font-semibold mb-2">Generate Reports</h3>
        <p className="text-sm text-muted-foreground mb-4">Export data and analytics for specific date ranges</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1 pr-4">
            <label className="block text-sm mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              className="border rounded px-3 h-10 w-56"
            >
              <option>Overview</option>
              <option>Listings</option>
              <option>Users</option>
              <option>Reviews</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-3 md:justify-end">
            <div className="inline-flex items-center gap-2">
              <label className="text-sm text-muted-foreground mr-2">Year</label>
              <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="border px-3 h-10 rounded w-28">
                {Array.from({ length: 10 }).map((_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>

              <label className="text-sm text-muted-foreground ml-4 mr-2">Month</label>
              <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="border px-3 h-10 rounded w-24">
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, idx) => (
                  <option key={m} value={idx+1}>{m}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => { setApplyPressed(true); loadByMonth(selectedYear, selectedMonth).finally(() => setApplyPressed(false)); }}
                className={`ml-4 px-4 h-10 flex items-center justify-center border rounded bg-white transition transform active:scale-95 ${applyPressed || applyStatus === 'Loading...' ? 'opacity-80' : 'hover:shadow-sm'}`}
                disabled={applyPressed || applyStatus === 'Loading...'}
                aria-pressed={applyPressed}
              >
                {applyPressed || applyStatus === 'Loading...' ? (
                  <>
                    <svg className="animate-spin mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 18v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.93 4.93l2.83 2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16.24 16.24l2.83 2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Applying
                  </>
                ) : (
                  'Apply'
                )}
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => { setExportPressed(true); (async () => { try { await downloadCsv(); } finally { setExportPressed(false); } })(); }}
                className={`inline-flex items-center gap-2 bg-black text-white px-4 h-10 rounded transition transform active:scale-95 ${exportPressed ? 'opacity-80' : 'hover:brightness-110'}`}
                disabled={exportPressed}
              >
                {exportPressed ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 18v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.93 4.93l2.83 2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16.24 16.24l2.83 2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Exporting
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
  <div className="rounded-2xl border p-6 bg-white min-h-[220px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold">Growth Trends</h4>
              <p className="text-sm text-muted-foreground">User and listing growth over time</p>
            </div>
          </div>

          {/* Growth Trends chart: show Listings and Users over last 6 months when available; otherwise show aggregated rows */}
          <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer>
              {growthData && growthData.length > 0 ? (
                <ComposedChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="listings" barSize={18} fill="#111827" />
                  <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              ) : (
                <ComposedChart data={rows.slice(Math.max(0, rows.length - 40)).map((r, i) => ({ label: new Date(r.d).toLocaleDateString(), v: r.count || 0 }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                  <XAxis dataKey="label" hide />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="v" fill="#111827" />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border p-6 bg-white min-h-[220px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold">Monthly Activity</h4>
              <p className="text-sm text-muted-foreground">Reviews and engagement metrics</p>
            </div>
          </div>

          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={lastSixMonths.map((m, idx) => ({ label: m.label, value: monthValues[idx] || 0 }))} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                <XAxis dataKey="label" />
                <YAxis ticks={yTicks} domain={[0, 30]} />
                <Tooltip />
                <Bar dataKey="value" fill="#111827" barSize={28} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="text-xs text-muted-foreground mt-3 flex items-center">
              <span className="inline-block w-3 h-3 bg-black mr-2" /> Reviews
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

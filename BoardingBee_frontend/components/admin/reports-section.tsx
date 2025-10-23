"use client";
import { useEffect, useState } from "react";
import { apiGet, API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ActivitySeriesPoint } from "@/types/admin";

export function ReportsSection() {
  const [rows, setRows] = useState<ActivitySeriesPoint[]>([]);
  const [allRows, setAllRows] = useState<ActivitySeriesPoint[]>([]); // keep unfiltered copy
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [reportType, setReportType] = useState("Overview");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [monthlyData, setMonthlyData] = useState<{ label: string; year: number; month: number; count: number }[]>([]);
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
        // Prefer public debug endpoints (no auth) so dev sees charts reliably
        let seriesLoaded = false;
        try {
          const ent = getEntityForReportType(reportType);
          const sres = await fetch(`${API_BASE}/api/admin/reports/debug/public/activity/series?days=180&entity=${encodeURIComponent(ent)}`);
          if (sres.ok) {
            const dbg = await sres.json();
            if (!alive) return;
            console.debug('Activity series loaded (public debug):', dbg?.length ?? 0);
            setRows(dbg || []);
            setAllRows(dbg || []);
            recomputeMonthly(dbg || []);
            seriesLoaded = true;
            setUsingSample(false);
          }
        } catch (e) {
          console.warn('Public debug series request failed:', e);
        }

        if (!seriesLoaded) {
          // try authenticated endpoint
          try {
            const ent = getEntityForReportType(reportType);
            const series = await apiGet<ActivitySeriesPoint[]>(`/api/admin/reports/activity/series?days=180&entity=${encodeURIComponent(ent)}`);
            if (!alive) return;
            console.debug('Activity series loaded (auth):', series?.length ?? 0);
            setRows(series || []);
            setAllRows(series || []);
            recomputeMonthly(series || []);
            seriesLoaded = true;
            setUsingSample(false);
          } catch (e) {
            console.warn('Failed to load activity series (auth):', e);
          }
        }

        // Monthly: prefer public debug
        let monthlyLoaded = false;
        try {
          const ent = getEntityForReportType(reportType);
          const mres = await fetch(`${API_BASE}/api/admin/reports/debug/public/activity/monthly?months=6&entity=${encodeURIComponent(ent)}`);
          if (mres.ok) {
            const dbg = await mres.json();
            if (!alive) return;
            console.debug('Monthly activity loaded (public debug):', dbg?.length ?? 0);
            setMonthlyData(dbg || []);
            // also ensure rows/allRows contain corresponding series points if missing
            if ((allRows.length === 0 || rows.length === 0) && (dbg && dbg.length > 0)) {
              const synth = (dbg as any[]).map(m => ({ d: new Date(`${m.year}-${String(m.month).padStart(2,'0')}-15`).toISOString(), kind: ('ReviewCreate' as any), count: m.count })) as ActivitySeriesPoint[];
              setRows(synth);
              setAllRows(synth);
            }
            monthlyLoaded = true;
            setUsingSample(false);
          }
        } catch (e) {
          console.warn('Public debug monthly request failed:', e);
        }

        if (!monthlyLoaded) {
          try {
            const ent = getEntityForReportType(reportType);
            const monthly = await apiGet<{ label: string; year: number; month: number; count: number }[]>(`/api/admin/reports/activity/monthly?months=6&entity=${encodeURIComponent(ent)}`);
            if (!alive) return;
            console.debug('Monthly activity loaded (auth):', monthly?.length ?? 0);
            setMonthlyData(monthly || []);
            if ((allRows.length === 0 || rows.length === 0) && (monthly && monthly.length > 0)) {
              const synth = (monthly as any[]).map(m => ({ d: new Date(`${m.year}-${String(m.month).padStart(2,'0')}-15`).toISOString(), kind: ('ReviewCreate' as any), count: m.count })) as ActivitySeriesPoint[];
              setRows(synth);
              setAllRows(synth);
              recomputeMonthly(synth);
            }
            monthlyLoaded = true;
            setUsingSample(false);
          } catch (e) {
            console.warn('Failed to load monthly activity (auth):', e);
          }
        }

        // If we have series but monthlyData wasn't provided, compute it from the series so charts render
        if ((rows.length > 0 || (allRows && allRows.length > 0)) && (monthlyData.length === 0)) {
          const src = (allRows && allRows.length > 0) ? allRows : rows;
          recomputeMonthly(src);
        }

        // If no data obtained from server, populate safe sample so UI shows something during development
  if (alive && rows.length === 0 && monthlyData.length === 0) {
          const sampleSeries: ActivitySeriesPoint[] = Array.from({ length: 14 }).map((_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (13 - i));
            return { d: d.toISOString(), kind: ("Review" as any), count: Math.round(100 + Math.random() * 50) } as ActivitySeriesPoint;
          });
          setRows(sampleSeries);
          setAllRows(sampleSeries);
          recomputeMonthly(sampleSeries);

          const sampleMonthly = [] as { label: string; year: number; month: number; count: number }[];
          for (let i = 5; i >= 0; i--) {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            sampleMonthly.push({ label: d.toLocaleString(undefined, { month: 'short' }), year: d.getFullYear(), month: d.getMonth() + 1, count: 120 + (5 - i) * 40 });
          }
          setMonthlyData(sampleMonthly);
          setUsingSample(true);
          console.warn('Reports: using sample data because server data is not available');
        }
  // ensure we have a fallback allRows (if none of the above paths set it)
  setAllRows(prev => (prev.length === 0 ? (rows.length ? rows : prev) : prev));

      } catch (errAll) {
        console.error('Reports fetch unexpected error:', errAll);
        setErr((errAll && (errAll as any).message) ? (errAll as any).message : String(errAll));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Always render the UI; show non-blocking error/status messages above the controls
  if (loading) return <div className="text-sm text-muted-foreground">Loading report…</div>;

  // Aggregate rows by month for the right-side monthly activity chart
  const monthlyCounts = rows.reduce<Record<string, number>>((acc, r) => {
    const dt = new Date(r.d);
    const key = dt.toLocaleString(undefined, { month: "short" }) + " " + dt.getFullYear();
    acc[key] = (acc[key] || 0) + (r.count || 0);
    return acc;
  }, {});

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

  // If monthlyData is present use it; otherwise fallback to aggregating from rows
  if (monthlyData.length === 0) {
    // fill monthlyCounts from rows (existing fallback)
    // monthlyCounts already computed above from rows
  }

  const monthValues = lastSixMonths.map(m => {
    const md = monthlyData.find(x => x.year === m.year && x.month === m.month);
    if (md) return md.count;
    return monthlyCounts[m.key] || 0;
  });
  // Compute the real max from data so bars fill visibly. For display ticks we can still show up to 300,
  // but scale bars to the actual data max so small datasets are visible.
  const dataMax = Math.max(1, ...monthValues);
  const displayTickMax = Math.max(300, dataMax);
  const maxCount = dataMax;

  function downloadCsv() {
    // build from/to based on selectedRange
  const to = new Date();
  const fromD = new Date(Date.now() - 1000*60*60*24*30); // default to 30 days
  const from = fromD.toISOString();
  const ent = getEntityForReportType(reportType);
  const path = `/api/admin/reports/export/csv?reportType=${encodeURIComponent(reportType)}&entity=${encodeURIComponent(ent)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to.toISOString())}`;
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
          link.download = 'report.csv';
          document.body.appendChild(link);
          link.click();
          link.remove();
          return;
        }

        // if no token or the above failed, try the public debug CSV endpoint
  const publicUrl = `${API_BASE}/api/admin/reports/debug/public/export/csv?reportType=${encodeURIComponent(reportType)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to.toISOString())}`;
        console.log('No auth token; attempting public CSV at', publicUrl);
        const blob2 = await tryUrl(publicUrl);
        const link2 = document.createElement('a');
        link2.href = URL.createObjectURL(blob2);
        link2.download = 'public-report.csv';
        document.body.appendChild(link2);
        link2.click();
        link2.remove();
      } catch (err:any) {
        alert('Failed to download CSV: ' + (err && err.message ? err.message : String(err)));
      }
    })();
  }

  async function loadByMonth(year: number, month: number) {
    setApplyStatus('Loading...');
    // compute start and end for the month (month is 1-12)
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month - 1, new Date(year, month, 0).getDate(), 23, 59, 59, 999);
    try {
  const ent = getEntityForReportType(reportType);
  const sUrl = `${API_BASE}/api/admin/reports/debug/public/activity/series?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&entity=${encodeURIComponent(ent)}`;
  const mUrl = `${API_BASE}/api/admin/reports/debug/public/activity/monthly?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&entity=${encodeURIComponent(ent)}`;
      const [sRes, mRes] = await Promise.all([fetch(sUrl), fetch(mUrl)]);
      if (sRes.ok && mRes.ok) {
        const sJson = await sRes.json();
        const mJson = await mRes.json();
        const s = (sJson as any[]).map(x => ({ d: x.d, kind: ('ReviewCreate' as any), count: x.count })) as ActivitySeriesPoint[];
        setRows(s);
        setAllRows(s);
        setMonthlyData(mJson);
        setUsingSample(false);
        recomputeMonthly(s);
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
  const ent = getEntityForReportType(reportType);
  const sUrl = `${API_BASE}/api/admin/reports/debug/public/activity/series?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&entity=${encodeURIComponent(ent)}`;
  const mUrl = `${API_BASE}/api/admin/reports/debug/public/activity/monthly?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&entity=${encodeURIComponent(ent)}`;
      const [sRes, mRes] = await Promise.all([fetch(sUrl), fetch(mUrl)]);
      if (sRes.ok && mRes.ok) {
        const sJson = await sRes.json();
        const mJson = await mRes.json();
        const s = (sJson as any[]).map(x => ({ d: x.d, kind: ('ReviewCreate' as any), count: x.count })) as ActivitySeriesPoint[];
        setRows(s);
        setAllRows(s);
        setMonthlyData(mJson);
        setUsingSample(false);
        recomputeMonthly(s);
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
              <option>Revenue</option>
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

          {/* Growth sparkline as compact bars instead of dots */}
          <div className="h-40 flex items-end">
            <div className="w-full flex items-end gap-1" style={{ alignItems: 'flex-end' }}>
              {rows.length > 0 ? (() => {
                const max = Math.max(...rows.map(r => r.count || 0), 1);
                // show up to 40 bars maximum by sampling if rows is large
                const sample = rows.length > 40 ? rows.slice(rows.length - 40) : rows;
                return sample.map((r, i) => {
                  const hPercent = Math.round(((r.count || 0) / max) * 100);
                  return (
                    <div key={i} className="flex-1 bg-transparent flex flex-col items-center" style={{ minWidth: 2 }}>
                      <div className="w-full bg-black" style={{ height: `${hPercent}%`, borderRadius: '2px 2px 0 0' }} />
                    </div>
                  );
                });
              })() : (
                <div className="text-sm text-muted-foreground">No data</div>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-3 flex gap-4">
            <span>0</span>
            <span className="ml-auto">{rows.length > 0 ? new Date(rows[rows.length-1].d).toLocaleString(undefined, { month: 'short' }) : ''}</span>
          </div>
        </div>

        <div className="rounded-2xl border p-6 bg-white min-h-[220px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold">Monthly Activity</h4>
              <p className="text-sm text-muted-foreground">Reviews and engagement metrics</p>
            </div>
          </div>

          <div className="mt-2 flex">
            {/* Y-axis ticks */}
            <div className="w-12 pr-3 text-xs text-muted-foreground flex flex-col justify-between" style={{ height: 160 }}>
              {[300,225,150,75,0].map(t => (
                <div key={t} className="h-0">{t}</div>
              ))}
            </div>

            {/* Bars area */}
            <div className="flex-1">
              <div className="h-40 flex items-end gap-4">
                {lastSixMonths.map((m, idx) => {
                  const v = monthValues[idx] || 0;
                  const hPercent = Math.round((v / Math.max(maxCount, 1)) * 100);
                  return (
                    <div key={m.key} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-black" style={{ height: `${hPercent}%`, borderRadius: '3px 3px 0 0' }} />
                      <div className="text-xs text-muted-foreground mt-2">{m.label}</div>
                    </div>
                  );
                })}
              </div>

              <div className="text-xs text-muted-foreground mt-3 flex items-center">
                <span className="inline-block w-3 h-3 bg-black mr-2" /> Reviews
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

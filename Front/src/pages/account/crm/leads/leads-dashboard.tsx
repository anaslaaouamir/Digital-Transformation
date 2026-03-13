import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

const Fa = ({ icon, className = '', style = {} }: { icon: string; className?: string; style?: React.CSSProperties }) => (
  <i className={`${icon} ${className}`} aria-hidden="true" style={style} />
);

type LeadItem = {
  company: string;
  name: string;
  phone?: string;
  sector: string;
  status: string;
  score: number;
  city: string;
  website?: string;
};
type HistoryItem = { date: string; count: number; avgScore: number };

export function LeadsDashboard({
  leads,
  scanHistory,
  sectorIcon,
  onGoScan,
}: {
  leads: LeadItem[];
  scanHistory: HistoryItem[];
  sectorIcon: (s: string) => string;
  onGoScan: () => void;
}) {
  const stats = useMemo(() => {
    const total = leads.length;
    const hot   = leads.filter(l => l.status === 'hot').length;
    const warm  = leads.filter(l => l.status === 'warm').length;
    const cold  = leads.filter(l => l.status === 'cold').length;
    const avg   = total ? Math.round(leads.reduce((s, l) => s + l.score, 0) / total) : 0;
    const withWebsite = leads.filter(l => !!l.website).length;
    const bySector = Object.entries(
      leads.reduce<Record<string, number>>((acc, l) => { acc[l.sector] = (acc[l.sector] || 0) + 1; return acc; }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const byCity = Object.entries(
      leads.reduce<Record<string, number>>((acc, l) => { acc[l.city] = (acc[l.city] || 0) + 1; return acc; }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const hotPct  = total ? Math.round((hot / total) * 100) : 0;
    const sitePct = total ? Math.round((withWebsite / total) * 100) : 0;
    const last = scanHistory.slice(-1)[0]?.count ?? 0;
    const prev = scanHistory.slice(-2, -1)[0]?.count ?? 0;
    const growthPct = prev > 0 ? Math.round(((last - prev) / prev) * 100) : (last > 0 ? 100 : 0);
    return { total, hot, warm, cold, avg, bySector, byCity, withWebsite, hotPct, sitePct, growthPct };
  }, [leads]);

  const chartBase = {
    chart: {
      background: 'transparent',
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      sparkline: { enabled: false },
    },
    grid: { borderColor: '#f1f1f4', strokeDashArray: 4, padding: { left: 0, right: 0 } },
    tooltip: { theme: 'light', style: { fontSize: '12px', fontFamily: 'Inter, sans-serif' } },
  };

  const statusDonut = useMemo(() => ({
    series: [stats.hot, stats.warm, stats.cold],
    options: {
      ...chartBase,
      chart: { ...chartBase.chart, type: 'donut' },
      labels: ['Chauds', 'Tièdes', 'Froids'],
      colors: ['#f8285a', '#f6b100', '#1b84ff'],
      legend: {
        position: 'bottom',
        labels: { colors: '#78829d' },
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
        markers: { width: 8, height: 8, radius: 4 },
        itemMargin: { horizontal: 10 },
      },
      dataLabels: { enabled: false },
      stroke: { width: 2, colors: ['#fff'] },
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                color: '#99a1b7',
                fontSize: '11px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
              },
              value: { color: '#071437', fontSize: '22px', fontWeight: 700, fontFamily: 'Inter, sans-serif' },
            },
          },
        },
      },
    },
  }), [stats.hot, stats.warm, stats.cold]);

  const sectorBar = useMemo(() => ({
    series: [{ name: 'Prospects', data: stats.bySector.map(([, c]) => c) }],
    options: {
      ...chartBase,
      chart: { ...chartBase.chart, type: 'bar' },
      xaxis: {
        categories: stats.bySector.map(([s]) => s),
        labels: { style: { colors: '#99a1b7', fontSize: '11px', fontFamily: 'Inter, sans-serif' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: '#99a1b7', fontFamily: 'Inter, sans-serif' } } },
      colors: ['#1b84ff'],
      fill: { opacity: 1 },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '45%', borderRadiusApplication: 'end' } },
      dataLabels: { enabled: false },
      states: { hover: { filter: { type: 'darken', value: 0.85 } } },
    },
  }), [stats.bySector]);

  const cityBar = useMemo(() => ({
    series: [{ name: 'Prospects', data: stats.byCity.map(([, c]) => c) }],
    options: {
      ...chartBase,
      chart: { ...chartBase.chart, type: 'bar' },
      xaxis: {
        categories: stats.byCity.map(([s]) => s),
        labels: { style: { colors: '#99a1b7', fontSize: '11px', fontFamily: 'Inter, sans-serif' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: '#99a1b7', fontFamily: 'Inter, sans-serif' } } },
      colors: ['#17c653'],
      fill: { opacity: 1 },
      plotOptions: { bar: { borderRadius: 4, columnWidth: '45%', borderRadiusApplication: 'end' } },
      dataLabels: { enabled: false },
    },
  }), [stats.byCity]);

  const historyLine = useMemo(() => ({
    series: [{ name: 'Prospects', data: scanHistory.map(h => h.count) }],
    options: {
      ...chartBase,
      chart: { ...chartBase.chart, type: 'area' },
      xaxis: {
        categories: scanHistory.map(h => h.date),
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: '#99a1b7', fontFamily: 'Inter, sans-serif' } } },
      colors: ['#1b84ff'],
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.18, opacityTo: 0.0, stops: [0, 100] },
      },
      stroke: { width: 2, curve: 'smooth' },
      dataLabels: { enabled: false },
      markers: { size: 0 },
    },
  }), [scanHistory]);

  const scoreArc = Math.round((stats.avg / 100) * 251.2);

  const statusMap: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    hot:  { label: 'Chaud',  color: '#f8285a', bg: '#fff1f3', dot: '#f8285a' },
    warm: { label: 'Tiède', color: '#f6b100', bg: '#fff8dd', dot: '#f6b100' },
    cold: { label: 'Froid',  color: '#1b84ff', bg: '#e9f3ff', dot: '#1b84ff' },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .ld {
          font-family: 'Inter', sans-serif;
          background: transparent;
          min-height: 100vh;
          padding: 0;
          margin: 0;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          gap: 20px;
          color: #071437;
          font-size: 13px;
          line-height: 1.5;
        }

        /* ── Cards ── */
        .ld-card {
          background: #ffffff;
          border: 1px solid #f1f1f4;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(7,20,55,0.04);
        }
        .ld-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px 16px;
          border-bottom: 1px solid #f1f1f4;
        }
        .ld-card-head-left { display: flex; align-items: center; gap: 10px; }
        .ld-card-icon {
          width: 36px; height: 36px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }
        .ld-card-title {
          font-size: 14px;
          font-weight: 600;
          color: #071437;
          line-height: 1.2;
        }
        .ld-card-sub {
          font-size: 11.5px;
          color: #99a1b7;
          margin-top: 1px;
          font-weight: 400;
        }
        .ld-card-body { padding: 20px 22px; }

        /* ── Stat Cards ── */
        .ld-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media(max-width:900px){ .ld-stats{ grid-template-columns: repeat(2,1fr); } }
        @media(max-width:500px){ .ld-stats{ grid-template-columns: 1fr; } }

        .ld-stat {
          background: #fff;
          border: 1px solid #f1f1f4;
          border-radius: 12px;
          padding: 22px 22px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 1px 3px rgba(7,20,55,0.04);
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.18s, transform 0.18s;
        }
        .ld-stat:hover { box-shadow: 0 4px 16px rgba(7,20,55,0.08); transform: translateY(-1px); }

        .ld-stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .ld-stat-ico {
          width: 38px; height: 38px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }
        .ld-stat-badge {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 11px; font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.1px;
        }
        .ld-stat-num {
          font-size: 28px;
          font-weight: 700;
          color: #071437;
          line-height: 1;
          letter-spacing: -0.5px;
        }
        .ld-stat-lbl {
          font-size: 12px;
          font-weight: 500;
          color: #99a1b7;
          margin-top: 3px;
        }
        .ld-stat-sep { height: 1px; background: #f1f1f4; margin: 14px 0 12px; }
        .ld-stat-footer { font-size: 11.5px; color: #78829d; font-weight: 400; }
        .ld-stat-footer strong { color: #071437; font-weight: 600; }

        /* stat color variants */
        .ls-total .ld-stat-ico { background: #eef6ff; color: #1b84ff; }
        .ls-total .ld-stat-badge { background: #eef6ff; color: #1b84ff; }
        .ls-hot .ld-stat-ico { background: #fff1f3; color: #f8285a; }
        .ls-hot .ld-stat-badge { background: #fff1f3; color: #f8285a; }
        .ls-warm .ld-stat-ico { background: #fff8dd; color: #f6b100; }
        .ls-warm .ld-stat-badge { background: #fff8dd; color: #f6b100; }
        .ls-cold .ld-stat-ico { background: #eef6ff; color: #1b84ff; }
        .ls-cold .ld-stat-badge { background: #eef6ff; color: #1b84ff; }

        /* ── Progress Bar ── */
        .ld-progress-track {
          height: 6px; background: #f1f1f4;
          border-radius: 10px; overflow: hidden;
          margin-top: 10px;
        }
        .ld-progress-fill {
          height: 100%; border-radius: 10px;
          transition: width 1.1s cubic-bezier(.4,0,.2,1);
        }

        /* ── Grid Layouts ── */
        .ld-2col  { display: grid; grid-template-columns: 340px 1fr; gap: 16px; }
        .ld-2eq   { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .ld-3col  { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        @media(max-width:900px) { .ld-2col, .ld-2eq, .ld-3col { grid-template-columns: 1fr; } }

        /* ── Score Ring ── */
        .ld-score-wrap { display: flex; flex-direction: column; align-items: center; padding: 8px 0 4px; }
        .ld-ring-rel { position: relative; width: 140px; height: 140px; }
        .ld-ring-svg { transform: rotate(-90deg); }
        .ld-ring-track { fill: none; stroke: #f1f1f4; stroke-width: 8; }
        .ld-ring-fill {
          fill: none; stroke-width: 8; stroke-linecap: round;
          stroke: #1b84ff;
          stroke-dasharray: 251.2;
          transition: stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1);
        }
        .ld-ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ld-ring-val { font-size: 28px; font-weight: 700; color: #071437; line-height: 1; }
        .ld-ring-cap { font-size: 11px; color: #99a1b7; font-weight: 500; margin-top: 2px; }
        .ld-score-meta { margin-top: 14px; text-align: center; }
        .ld-score-meta p { font-size: 12px; color: #78829d; line-height: 1.7; }

        /* ── Web Presence ── */
        .ld-web-num { font-size: 36px; font-weight: 700; color: #071437; letter-spacing: -1px; line-height: 1; }
        .ld-web-of { font-size: 12px; color: #99a1b7; font-weight: 400; margin-left: 8px; }
        .ld-web-pills { display: flex; gap: 20px; margin-top: 4px; }
        .ld-web-pill { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #78829d; font-weight: 500; }
        .ld-pill-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        /* ── Table ── */
        .ld-overflow { overflow-x: auto; }
        .ld-table { width: 100%; border-collapse: collapse; min-width: 680px; }
        .ld-table th {
          padding: 9px 18px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: #99a1b7;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-bottom: 1px solid #f1f1f4;
          white-space: nowrap;
          background: #fafafa;
        }
        .ld-table th:first-child { border-radius: 0; }
        .ld-table td {
          padding: 13px 18px;
          border-bottom: 1px solid #f9f9f9;
          font-size: 13px;
          white-space: nowrap;
          vertical-align: middle;
        }
        .ld-table tr:last-child td { border-bottom: none; }
        .ld-table tbody tr { transition: background 0.1s; }
        .ld-table tbody tr:hover td { background: #fafcff; }

        .ld-rank {
          width: 28px; height: 28px; border-radius: 8px;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600;
          background: #f9f9f9; color: #99a1b7;
          border: 1px solid #f1f1f4;
        }
        .ld-rank-1 { background: #fff8dd; color: #c47a00; border-color: #fde68a; }
        .ld-rank-2 { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }
        .ld-rank-3 { background: #fff4ec; color: #b95000; border-color: #fed7aa; }

        .ld-company-name { font-size: 13px; font-weight: 600; color: #071437; }
        .ld-company-url  { font-size: 11.5px; color: #99a1b7; margin-top: 2px; display: flex; align-items: center; gap: 5px; }

        .ld-chip {
          display: inline-flex; align-items: center; gap: 5px;
          border-radius: 6px; padding: 3px 8px;
          font-size: 11.5px; font-weight: 500;
          background: #f9f9f9; color: #78829d;
          border: 1px solid #f1f1f4;
        }
        .ld-city-txt { font-size: 12px; color: #78829d; font-weight: 500; }
        .ld-score-pill {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 36px; height: 24px; border-radius: 6px;
          font-size: 12px; font-weight: 600;
        }
        .ld-status-tag {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11.5px; font-weight: 500;
          padding: 4px 10px; border-radius: 6px;
        }
        .ld-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* ── City Grid ── */
        .ld-city-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        @media(max-width:900px) { .ld-city-grid { grid-template-columns: repeat(3,1fr); } }
        @media(max-width:600px) { .ld-city-grid { grid-template-columns: repeat(2,1fr); } }

        .ld-city-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px;
          background: #fafafa;
          border: 1px solid #f1f1f4;
          border-radius: 10px;
          transition: background 0.15s, border-color 0.15s;
          cursor: default;
        }
        .ld-city-item:hover { background: #f0f7ff; border-color: #cce0ff; }
        .ld-city-left { display: flex; align-items: center; gap: 9px; }
        .ld-city-icon {
          width: 30px; height: 30px; border-radius: 8px;
          background: #fff1f3; color: #f8285a;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; flex-shrink: 0;
        }
        .ld-city-name { font-size: 13px; font-weight: 500; color: #071437; }
        .ld-city-badge {
          font-size: 11px; font-weight: 600;
          background: #fff; color: #f8285a;
          border: 1px solid #fecdd3;
          padding: 2px 8px; border-radius: 20px;
        }

        /* ── CTA Banner ── */
        .ld-cta {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          padding: 20px 26px;
          background: linear-gradient(135deg, #1b84ff 0%, #0067e0 100%);
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(27,132,255,0.28);
        }
        .ld-cta-left { display: flex; align-items: center; gap: 14px; }
        .ld-cta-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 16px; flex-shrink: 0;
        }
        .ld-cta-title { font-size: 14px; font-weight: 600; color: #fff; line-height: 1.2; }
        .ld-cta-desc  { font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 2px; }
        .ld-cta-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 20px; border-radius: 8px;
          background: #fff; color: #1b84ff;
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 600;
          border: none; cursor: pointer;
          transition: opacity 0.18s, transform 0.18s, box-shadow 0.18s;
          box-shadow: 0 2px 8px rgba(7,20,55,0.12);
          white-space: nowrap;
          letter-spacing: 0.1px;
        }
        .ld-cta-btn:hover { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(7,20,55,0.14); }

        /* ── Section label ── */
        .ld-section-sep {
          display: flex; align-items: center; gap: 10px;
          margin: 2px 0;
        }
        .ld-section-sep-line { flex: 1; height: 1px; background: #f1f1f4; }
        .ld-section-sep-txt { font-size: 11px; font-weight: 600; color: #c4cada; letter-spacing: 0.8px; text-transform: uppercase; white-space: nowrap; }

        /* ── Toolbar tag ── */
        .ld-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 4px;
        }
        .ld-toolbar-title { font-size: 18px; font-weight: 700; color: #071437; letter-spacing: -0.2px; }
        .ld-live-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: #eef6ff; border: 1px solid #cce0ff; color: #1b84ff;
          font-size: 11px; font-weight: 600;
          padding: 5px 12px; border-radius: 20px;
        }
        .ld-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #1b84ff; animation: blink 2s infinite; }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:.2} }

        /* ── Separator between sections ── */
        .ld-divider { height: 1px; background: #f1f1f4; margin: 2px 0; display: none; }
      `}</style>

      <div className="ld">

        {/* Toolbar */}
        <div className="ld-toolbar">
          <div>
            <div className="ld-toolbar-title">Tableau de bord</div>
            <div style={{ fontSize: 12, color: '#99a1b7', marginTop: 3, fontWeight: 400 }}>
              Vue d'ensemble de vos prospects
            </div>
          </div>
          <div className="ld-live-badge">
            <span className="ld-live-dot" />
            Données en direct
          </div>
        </div>

        {/* KPI Stats */}
        <div className="ld-stats">
          {/* Total */}
          <div className="ld-stat ls-total">
            <div className="ld-stat-top">
              <div className="ld-stat-ico"><Fa icon="fa-solid fa-users" /></div>
              <div className="ld-stat-badge">
                <Fa icon="fa-solid fa-arrow-trend-up" style={{ fontSize: 9 }} />
                +{stats.growthPct}%
              </div>
            </div>
            <div className="ld-stat-num">{stats.total}</div>
            <div className="ld-stat-lbl">Total prospects</div>
            <div className="ld-stat-sep" />
            <div className="ld-stat-footer">Depuis le dernier scan</div>
          </div>

          {/* Chauds */}
          <div className="ld-stat ls-hot">
            <div className="ld-stat-top">
              <div className="ld-stat-ico"><Fa icon="fa-solid fa-fire" /></div>
              <div className="ld-stat-badge">{stats.hotPct}%</div>
            </div>
            <div className="ld-stat-num">{stats.hot}</div>
            <div className="ld-stat-lbl">Prospects chauds</div>
            <div className="ld-stat-sep" />
            <div className="ld-stat-footer">Priorité <strong>haute</strong></div>
          </div>

          {/* Tièdes */}
          <div className="ld-stat ls-warm">
            <div className="ld-stat-top">
              <div className="ld-stat-ico"><Fa icon="fa-solid fa-temperature-half" /></div>
              <div className="ld-stat-badge">{stats.total ? Math.round((stats.warm / stats.total) * 100) : 0}%</div>
            </div>
            <div className="ld-stat-num">{stats.warm}</div>
            <div className="ld-stat-lbl">Prospects tièdes</div>
            <div className="ld-stat-sep" />
            <div className="ld-stat-footer">À <strong>relancer</strong></div>
          </div>

          {/* Froids */}
          <div className="ld-stat ls-cold">
            <div className="ld-stat-top">
              <div className="ld-stat-ico"><Fa icon="fa-solid fa-snowflake" /></div>
              <div className="ld-stat-badge">{stats.total ? Math.round((stats.cold / stats.total) * 100) : 0}%</div>
            </div>
            <div className="ld-stat-num">{stats.cold}</div>
            <div className="ld-stat-lbl">Prospects froids</div>
            <div className="ld-stat-sep" />
            <div className="ld-stat-footer">Nurturing <strong>requis</strong></div>
          </div>
        </div>

        {/* Score + Sectors */}
        <div className="ld-2col">
          {/* Score Ring Card */}
          <div className="ld-card">
            <div className="ld-card-head">
              <div className="ld-card-head-left">
                <div className="ld-card-icon" style={{ background: '#eef6ff', color: '#1b84ff' }}>
                  <Fa icon="fa-solid fa-gauge-high" />
                </div>
                <div>
                  <div className="ld-card-title">Score moyen</div>
                  <div className="ld-card-sub">Qualification des prospects</div>
                </div>
              </div>
            </div>
            <div className="ld-card-body">
              <div className="ld-score-wrap">
                <div className="ld-ring-rel">
                  <svg className="ld-ring-svg" width="140" height="140" viewBox="0 0 90 90">
                    <circle className="ld-ring-track" cx="45" cy="45" r="40" />
                    <circle className="ld-ring-fill" cx="45" cy="45" r="40" strokeDashoffset={251.2 - scoreArc} />
                  </svg>
                  <div className="ld-ring-center">
                    <span className="ld-ring-val">{stats.avg}</span>
                    <span className="ld-ring-cap">/100</span>
                  </div>
                </div>
                <div className="ld-score-meta">
                  <p>Score moyen de qualification<br />calculé sur <strong>{stats.total}</strong> prospects</p>
                </div>
              </div>

              {/* mini stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
                {[
                  { lbl: 'Score max', val: leads.length ? Math.max(...leads.map(l => l.score)) : '—', color: '#17c653', bg: '#e9faf0' },
                  { lbl: 'Score min', val: leads.length ? Math.min(...leads.map(l => l.score)) : '—', color: '#f8285a', bg: '#fff1f3' },
                ].map(item => (
                  <div key={item.lbl} style={{ background: item.bg, borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: item.color, fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.lbl}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#071437', letterSpacing: '-0.5px' }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sectors Bar */}
          <div className="ld-card">
            <div className="ld-card-head">
              <div className="ld-card-head-left">
                <div className="ld-card-icon" style={{ background: '#eef6ff', color: '#1b84ff' }}>
                  <Fa icon="fa-solid fa-layer-group" />
                </div>
                <div>
                  <div className="ld-card-title">Top secteurs</div>
                  <div className="ld-card-sub">Répartition par secteur d'activité</div>
                </div>
              </div>
            </div>
            <div className="ld-card-body" style={{ paddingTop: 8 }}>
              <ReactApexChart options={sectorBar.options as any} series={sectorBar.series} type="bar" height={218} />
            </div>
          </div>
        </div>

        {/* Cities tile grid */}
        <div className="ld-card">
          <div className="ld-card-head">
            <div className="ld-card-head-left">
              <div className="ld-card-icon" style={{ background: '#fff1f3', color: '#f8285a' }}>
                <Fa icon="fa-solid fa-location-dot" />
              </div>
              <div>
                <div className="ld-card-title">Couverture géographique</div>
                <div className="ld-card-sub">Top villes par nombre de prospects</div>
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#99a1b7', background: '#f9f9f9', border: '1px solid #f1f1f4', borderRadius: 6, padding: '4px 10px' }}>
              {stats.byCity.length} villes
            </div>
          </div>
          <div className="ld-card-body">
            <div className="ld-city-grid">
              {stats.byCity.map(([city, count], idx) => (
                <div key={city + idx} className="ld-city-item">
                  <div className="ld-city-left">
                    <div className="ld-city-icon"><Fa icon="fa-solid fa-city" /></div>
                    <div className="ld-city-name">{city || '—'}</div>
                  </div>
                  <div className="ld-city-badge">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* City bar + History line */}
        <div className="ld-2eq">
          <div className="ld-card">
            <div className="ld-card-head">
              <div className="ld-card-head-left">
                <div className="ld-card-icon" style={{ background: '#e9faf0', color: '#17c653' }}>
                  <Fa icon="fa-solid fa-map-pin" />
                </div>
                <div>
                  <div className="ld-card-title">Top villes</div>
                  <div className="ld-card-sub">Distribution par ville</div>
                </div>
              </div>
            </div>
            <div className="ld-card-body" style={{ paddingTop: 8 }}>
              <ReactApexChart options={cityBar.options as any} series={cityBar.series} type="bar" height={200} />
            </div>
          </div>

          <div className="ld-card">
            <div className="ld-card-head">
              <div className="ld-card-head-left">
                <div className="ld-card-icon" style={{ background: '#eef6ff', color: '#1b84ff' }}>
                  <Fa icon="fa-solid fa-chart-area" />
                </div>
                <div>
                  <div className="ld-card-title">Historique des scans</div>
                  <div className="ld-card-sub">Évolution du volume de prospects</div>
                </div>
              </div>
            </div>
            <div className="ld-card-body" style={{ paddingTop: 8 }}>
              <ReactApexChart options={historyLine.options as any} series={historyLine.series} type="area" height={200} />
            </div>
          </div>
        </div>

        {/* Donut + Web Presence */}
        <div className="ld-3col">
          <div className="ld-card">
            <div className="ld-card-head">
              <div className="ld-card-head-left">
                <div className="ld-card-icon" style={{ background: '#fff1f3', color: '#f8285a' }}>
                  <Fa icon="fa-solid fa-chart-pie" />
                </div>
                <div>
                  <div className="ld-card-title">Répartition statuts</div>
                  <div className="ld-card-sub">Chauds · Tièdes · Froids</div>
                </div>
              </div>
            </div>
            <div className="ld-card-body">
              <ReactApexChart options={statusDonut.options as any} series={statusDonut.series} type="donut" height={220} />
            </div>
          </div>

          <div className="ld-card" style={{ gridColumn: 'span 2' }}>
            <div className="ld-card-head">
              <div className="ld-card-head-left">
                <div className="ld-card-icon" style={{ background: '#eef6ff', color: '#1b84ff' }}>
                  <Fa icon="fa-solid fa-globe" />
                </div>
                <div>
                  <div className="ld-card-title">Présence web</div>
                  <div className="ld-card-sub">Prospects disposant d'un site web</div>
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#1b84ff', background: '#eef6ff', border: '1px solid #cce0ff', borderRadius: 6, padding: '4px 10px' }}>
                {stats.sitePct}% avec site
              </div>
            </div>
            <div className="ld-card-body">
              {/* big number */}
              <div style={{ marginBottom: 18 }}>
                <span className="ld-web-num">{stats.withWebsite}</span>
                <span className="ld-web-of">sur {stats.total} prospects</span>
              </div>
              {/* progress */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 12, color: '#78829d', fontWeight: 500 }}>Avec site web</span>
                  <span style={{ fontSize: 12, color: '#071437', fontWeight: 600 }}>{stats.sitePct}%</span>
                </div>
                <div className="ld-progress-track">
                  <div className="ld-progress-fill" style={{ width: `${stats.sitePct}%`, background: '#1b84ff' }} />
                </div>
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 12, color: '#78829d', fontWeight: 500 }}>Sans site web</span>
                  <span style={{ fontSize: 12, color: '#071437', fontWeight: 600 }}>{100 - stats.sitePct}%</span>
                </div>
                <div className="ld-progress-track">
                  <div className="ld-progress-fill" style={{ width: `${100 - stats.sitePct}%`, background: '#e2e8f0' }} />
                </div>
              </div>
              {/* pills */}
              <div style={{ display: 'flex', gap: 14, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f1f4' }}>
                <div className="ld-web-pill">
                  <span className="ld-pill-dot" style={{ background: '#1b84ff' }} />
                  <span>Avec site · <strong>{stats.withWebsite}</strong></span>
                </div>
                <div className="ld-web-pill">
                  <span className="ld-pill-dot" style={{ background: '#e2e8f0' }} />
                  <span>Sans site · <strong>{stats.total - stats.withWebsite}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top 10 Table */}
        <div className="ld-card">
          <div className="ld-card-head">
            <div className="ld-card-head-left">
              <div className="ld-card-icon" style={{ background: '#fff8dd', color: '#f6b100' }}>
                <Fa icon="fa-solid fa-trophy" />
              </div>
              <div>
                <div className="ld-card-title">Top 10 prospects</div>
                <div className="ld-card-sub">Classés par score de qualification</div>
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#f6b100', background: '#fff8dd', border: '1px solid #fde68a', borderRadius: 6, padding: '4px 10px' }}>
              Meilleurs scores
            </div>
          </div>
          <div className="ld-overflow">
            <table className="ld-table">
              <thead>
                <tr>
                  {['#', 'Entreprise', 'Contact', 'Secteur', 'Ville', 'Score', 'Statut'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.slice().sort((a, b) => b.score - a.score).slice(0, 10).map((l, idx) => {
                  const sm = statusMap[l.status] ?? { label: l.status, color: '#78829d', bg: '#f9f9f9', dot: '#99a1b7' };
                  const hi = l.score >= 80;
                  return (
                    <tr key={idx}>
                      <td>
                        <span className={`ld-rank ${idx < 3 ? `ld-rank-${idx + 1}` : ''}`}>{idx + 1}</span>
                      </td>
                      <td>
                        <div className="ld-company-name">{l.company}</div>
                        <div className="ld-company-url">
                          {l.website ? (
                            <>
                              <Fa icon="fa-solid fa-globe" style={{ fontSize: 10, color: '#1b84ff' }} />
                              <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.website}</span>
                            </>
                          ) : (
                            <>
                              <Fa icon="fa-solid fa-ban" style={{ fontSize: 10 }} />
                              <span>Pas de site</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#071437' }}>{l.name}</div>
                        {l.phone && (
                          <div className="ld-company-url">
                            <Fa icon="fa-solid fa-phone" style={{ fontSize: 10 }} />
                            <span>{l.phone}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="ld-chip">
                          <Fa icon={sectorIcon(l.sector)} style={{ fontSize: 10 }} />
                          {l.sector}
                        </span>
                      </td>
                      <td>
                        <span className="ld-city-txt">
                          <Fa icon="fa-solid fa-location-dot" style={{ fontSize: 10, marginRight: 4, color: '#c4cada' }} />
                          {l.city}
                        </span>
                      </td>
                      <td>
                        <span
                          className="ld-score-pill"
                          style={{
                            background: hi ? '#eef6ff' : '#f9f9f9',
                            color: hi ? '#1b84ff' : '#78829d',
                            border: `1px solid ${hi ? '#cce0ff' : '#f1f1f4'}`,
                          }}
                        >
                          {l.score}
                        </span>
                      </td>
                      <td>
                        <span className="ld-status-tag" style={{ background: sm.bg, color: sm.color }}>
                          <span className="ld-status-dot" style={{ background: sm.dot }} />
                          {sm.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="ld-cta">
          <div className="ld-cta-left">
            <div className="ld-cta-icon"><Fa icon="fa-solid fa-satellite-dish" /></div>
            <div>
              <div className="ld-cta-title">Trouver de nouveaux prospects</div>
              <div className="ld-cta-desc">Lancez un scan pour découvrir de nouvelles opportunités dans votre secteur</div>
            </div>
          </div>
          <button className="ld-cta-btn" onClick={onGoScan}>
            <Fa icon="fa-solid fa-satellite-dish" />
            Lancer un scan
          </button>
        </div>

      </div>
    </>
  );
}

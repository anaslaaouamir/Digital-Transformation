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

  const baseChart = {
    chart: { background: 'transparent', toolbar: { show: false }, fontFamily: 'Plus Jakarta Sans, sans-serif' },
    grid: { borderColor: '#f0f3f9', strokeDashArray: 4 },
    tooltip: { theme: 'light' },
  };

  const statusDonut = useMemo(() => ({
    series: [stats.hot, stats.warm, stats.cold],
    options: {
      ...baseChart,
      chart: { ...baseChart.chart, type: 'donut' },
      labels: ['Chauds', 'Tièdes', 'Froids'],
      colors: ['#ef4444', '#f59e0b', '#3b82f6'],
      legend: { position: 'bottom', labels: { colors: '#94a3b8' }, fontSize: '12px' },
      dataLabels: { enabled: false },
      stroke: { width: 3, colors: ['#fff'] },
      plotOptions: { pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Total', color: '#94a3b8', fontSize: '12px' }, value: { color: '#1e293b', fontSize: '24px', fontWeight: 700 } } } } },
    },
  }), [stats.hot, stats.warm, stats.cold]);

  const sectorBar = useMemo(() => ({
    series: [{ name: 'Prospects', data: stats.bySector.map(([, c]) => c) }],
    options: {
      ...baseChart,
      chart: { ...baseChart.chart, type: 'bar' },
      xaxis: { categories: stats.bySector.map(([s]) => s), labels: { style: { colors: '#94a3b8', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: '#94a3b8' } } },
      colors: ['#6366f1'],
      fill: { type: 'gradient', gradient: { type: 'vertical', gradientToColors: ['#a5b4fc'], stops: [0, 100] } },
      plotOptions: { bar: { borderRadius: 6, columnWidth: '52%' } },
      dataLabels: { enabled: false },
    },
  }), [stats.bySector]);

  const cityBar = useMemo(() => ({
    series: [{ name: 'Prospects', data: stats.byCity.map(([, c]) => c) }],
    options: {
      ...baseChart,
      chart: { ...baseChart.chart, type: 'bar' },
      xaxis: { categories: stats.byCity.map(([s]) => s), labels: { style: { colors: '#94a3b8', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: '#94a3b8' } } },
      colors: ['#f43f5e'],
      fill: { type: 'gradient', gradient: { type: 'vertical', gradientToColors: ['#fda4af'], stops: [0, 100] } },
      plotOptions: { bar: { borderRadius: 6, columnWidth: '52%' } },
      dataLabels: { enabled: false },
    },
  }), [stats.byCity]);

  const historyLine = useMemo(() => ({
    series: [{ name: 'Prospects', data: scanHistory.map(h => h.count) }],
    options: {
      ...baseChart,
      chart: { ...baseChart.chart, type: 'area' },
      xaxis: { categories: scanHistory.map(h => h.date), labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: '#94a3b8' } } },
      colors: ['#6366f1'],
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.22, opacityTo: 0.0, stops: [0, 90] } },
      stroke: { width: 2.5, curve: 'smooth' },
      dataLabels: { enabled: false },
    },
  }), [scanHistory]);

  const scoreArc = Math.round((stats.avg / 100) * 251.2);

  const statusMap: Record<string, { label: string; color: string; light: string }> = {
    hot:  { label: 'Chaud',  color: '#ef4444', light: '#fef2f2' },
    warm: { label: 'Tiède', color: '#f59e0b', light: '#fffbeb' },
    cold: { label: 'Froid',  color: '#3b82f6', light: '#eff6ff' },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .ld { font-family: 'Plus Jakarta Sans', sans-serif; background: transparent; min-height: 100vh; padding: 0; display: flex; flex-direction: column; gap: 20px; color: #0f172a; }

        .ld-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 4px; }
        .ld-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 2.5px; color: #6366f1; text-transform: uppercase; margin-bottom: 5px; }
        .ld-title { font-family: 'Playfair Display', serif; font-weight: 800; font-size: 32px; letter-spacing: -0.5px; color: #0f172a; line-height: 1; }
        .ld-live { display: inline-flex; align-items: center; gap: 6px; background: #eef2ff; border: 1px solid #c7d2fe; color: #6366f1; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 1px; padding: 6px 13px; border-radius: 20px; }
        .ld-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #6366f1; animation: blink 2s infinite; }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0.25} }

        .ld-card { background: #ffffff; border: 1px solid #e8ecf4; border-radius: 20px; box-shadow: 0 1px 4px rgba(15,23,42,0.05); overflow: hidden; transition: box-shadow .2s, transform .2s; }
        .ld-card:hover { box-shadow: 0 6px 20px rgba(15,23,42,0.08); transform: translateY(-1px); }
        .ld-card-head { padding: 10px 22px 14px; border-bottom: 1px solid #f0f3f9; display: flex; align-items: center; gap: 12px; }
        .ld-card-icon { width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .ld-card-title { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 14px; color: #0f172a; line-height: 1.2; }
        .ld-card-desc { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; margin-top: 2px; }
        .ld-card-body { padding: 20px 22px; }

        .ld-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
        @media(max-width:640px){ .ld-stats{ grid-template-columns:repeat(2,1fr); } }

        .ld-stat { border-radius: 20px; padding: 22px 20px; position: relative; overflow: hidden; transition: transform .2s, box-shadow .2s; }
        .ld-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(15,23,42,0.10); }
        .ld-stat-decor { position: absolute; width: 100px; height: 100px; border-radius: 50%; bottom: -30px; right: -30px; }
        .ld-stat-lbl { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
        .ld-stat-num { font-family: 'Playfair Display', serif; font-weight: 800; font-size: 42px; line-height: 1; letter-spacing: -2px; }
        .ld-stat-sub { font-size: 11px; font-weight: 500; margin-top: 6px; opacity: 0.65; }
        .ld-stat-chip { display: inline-flex; align-items: center; gap: 4px; margin-top: 10px; font-size: 10px; font-family: 'JetBrains Mono', monospace; padding: 3px 9px; border-radius: 10px; font-weight: 500; }

        /* Total – dark ink card */
        .ls-total { background: #0f172a; border: 1px solid #1e293b; box-shadow: 0 4px 20px rgba(15,23,42,0.15); }
        .ls-total .ld-stat-lbl { color: rgba(255,255,255,0.35); }
        .ls-total .ld-stat-num { color: #fff; }
        .ls-total .ld-stat-sub { color: rgba(255,255,255,0.3); }
        .ls-total .ld-stat-decor { background: #6366f1; opacity: 0.15; }
        .ls-total .ld-stat-chip { background: rgba(99,102,241,0.25); color: #a5b4fc; }

        .ls-hot { background: #fef2f2; border: 1px solid #fecaca; }
        .ls-hot .ld-stat-lbl { color: #f87171; }
        .ls-hot .ld-stat-num { color: #ef4444; }
        .ls-hot .ld-stat-decor { background: #ef4444; opacity: 0.10; }
        .ls-hot .ld-stat-chip { background: rgba(239,68,68,0.12); color: #ef4444; }

        .ls-warm { background: #fffbeb; border: 1px solid #fde68a; }
        .ls-warm .ld-stat-lbl { color: #fbbf24; }
        .ls-warm .ld-stat-num { color: #f59e0b; }
        .ls-warm .ld-stat-decor { background: #f59e0b; opacity: 0.10; }
        .ls-warm .ld-stat-chip { background: rgba(245,158,11,0.12); color: #f59e0b; }

        .ls-cold { background: #eff6ff; border: 1px solid #bfdbfe; }
        .ls-cold .ld-stat-lbl { color: #60a5fa; }
        .ls-cold .ld-stat-num { color: #3b82f6; }
        .ls-cold .ld-stat-decor { background: #3b82f6; opacity: 0.10; }
        .ls-cold .ld-stat-chip { background: rgba(59,130,246,0.12); color: #3b82f6; }

        .ld-2col { display: grid; grid-template-columns: 1fr 2fr; gap: 14px; }
        @media(max-width:768px){ .ld-2col{ grid-template-columns:1fr; } }
        .ld-2eq { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media(max-width:640px){ .ld-2eq{ grid-template-columns:1fr; } }
        .ld-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
        @media(max-width:768px){ .ld-3col{ grid-template-columns:1fr; } }

        /* Score ring */
        .ld-score-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 8px 0; }
        .ld-ring-rel { position: relative; width: 130px; height: 130px; }
        .ld-ring-svg { transform: rotate(-90deg); }
        .ld-ring-track { fill: none; stroke: #f1f5f9; stroke-width: 9; }
        .ld-ring-fill { fill: none; stroke-width: 9; stroke-linecap: round; stroke: url(#scoreGradW); stroke-dasharray: 251.2; transition: stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1); }
        .ld-ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ld-ring-val { font-family: 'Playfair Display', serif; font-weight: 800; font-size: 30px; color: #0f172a; line-height: 1; }
        .ld-ring-cap { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #94a3b8; letter-spacing: 1px; margin-top: 1px; }
        .ld-score-meta p { font-size: 11px; color: #94a3b8; line-height: 1.6; text-align: center; }

        /* Website */
        .ld-web-num { font-family: 'Playfair Display', serif; font-weight: 800; font-size: 46px; color: #0f172a; letter-spacing: -2px; line-height: 1; }
        .ld-web-of { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #94a3b8; margin-left: 8px; vertical-align: middle; }
        .ld-bar-track { height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden; margin: 14px 0 16px; }
        .ld-bar-fill { height: 100%; border-radius: 10px; background: linear-gradient(90deg, #6366f1, #a78bfa); transition: width 1.2s cubic-bezier(.4,0,.2,1); }
        .ld-web-pills { display: flex; gap: 18px; }
        .ld-web-pill { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 500; color: #64748b; }
        .ld-pill-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        /* Table */
        .ld-overflow { overflow-x: auto; }
        .ld-table { width: 100%; border-collapse: collapse; }
        .ld-table th { padding: 10px 18px; text-align: left; font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid #f0f3f9; white-space: nowrap; }
        .ld-table td { padding: 13px 18px; border-bottom: 1px solid #f8fafc; font-size: 13px; white-space: nowrap; }
        .ld-table tr:last-child td { border-bottom: none; }
        .ld-table tbody tr { transition: background .12s; }
        .ld-table tbody tr:hover { background: #fafbff; }
        .ld-rank { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 11px; background: #f1f5f9; color: #94a3b8; }
        .ld-rank-1 { background: linear-gradient(135deg,#fef3c7,#fde68a); color: #92400e; }
        .ld-rank-2 { background: linear-gradient(135deg,#f1f5f9,#e2e8f0); color: #475569; }
        .ld-rank-3 { background: linear-gradient(135deg,#fff7ed,#fed7aa); color: #9a3412; }
        .ld-company { font-weight: 600; color: #0f172a; }
        .ld-contact { font-size: 12px; color: #94a3b8; }
        .ld-chip { display: inline-flex; align-items: center; gap: 5px; border-radius: 7px; padding: 3px 9px; font-size: 11px; font-family: 'JetBrains Mono', monospace; background: #f8fafc; color: #64748b; border: 1px solid #e8ecf4; }
        .ld-city-txt { font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #94a3b8; }
        .ld-score-pill { display: inline-flex; align-items: center; justify-content: center; min-width: 38px; height: 24px; border-radius: 7px; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 500; }
        .ld-status-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-family: 'JetBrains Mono', monospace; padding: 3px 9px; border-radius: 20px; font-weight: 500; }

        /* CTA */
        .ld-cta { background: #0f172a; border-radius: 20px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; box-shadow: 0 8px 32px rgba(15,23,42,0.15); }
        .ld-cta-left { display: flex; align-items: center; gap: 12px; }
        .ld-cta-icon { width: 40px; height: 40px; border-radius: 12px; background: rgba(99,102,241,0.2); display: flex; align-items: center; justify-content: center; color: #a5b4fc; font-size: 15px; flex-shrink: 0; }
        .ld-cta-text { font-size: 13px; color: rgba(255,255,255,0.5); }
        .ld-cta-btn { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; background: linear-gradient(135deg,#6366f1,#818cf8); color: #fff; border: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13px; padding: 11px 22px; border-radius: 12px; transition: opacity .2s, transform .2s, box-shadow .2s; box-shadow: 0 4px 18px rgba(99,102,241,0.4); white-space: nowrap; letter-spacing: 0.2px; }
        .ld-cta-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(99,102,241,0.5); }
      `}</style>

      <div className="ld">
        {/* Header removed to match spacing of Scan/Prospects */}

        {/* Stats */}
        <div className="ld-stats">
          <div className={`ld-stat ls-total`}>
            <div className="ld-stat-decor" />
            <div className="ld-stat-lbl">Total</div>
            <div className="ld-stat-num">{stats.total}</div>
            <div className="ld-stat-sub">prospects</div>
            <div className="ld-stat-chip">↑ +{stats.growthPct}%</div>
          </div>
          <div className={`ld-stat ls-hot`}>
            <div className="ld-stat-decor" />
            <div className="ld-stat-lbl">Chauds</div>
            <div className="ld-stat-num">{stats.hot}</div>
            <div className="ld-stat-sub">prioritaires</div>
            <div className="ld-stat-chip">{stats.hotPct}% du total</div>
          </div>
          <div className={`ld-stat ls-warm`}>
            <div className="ld-stat-decor" />
            <div className="ld-stat-lbl">Tièdes</div>
            <div className="ld-stat-num">{stats.warm}</div>
            <div className="ld-stat-sub">à relancer</div>
          </div>
          <div className={`ld-stat ls-cold`}>
            <div className="ld-stat-decor" />
            <div className="ld-stat-lbl">Froids</div>
            <div className="ld-stat-num">{stats.cold}</div>
            <div className="ld-stat-sub">&nbsp;</div>
          </div>
        </div>

        {/* Score + Sectors */}
        <div className="ld-2col">
          <div className="ld-card">
            <div className="ld-card-head">
              <div className="ld-card-icon" style={{ background: '#eef2ff', color: '#6366f1' }}><Fa icon="fa-solid fa-gauge-high" /></div>
              <div><div className="ld-card-title">Score Moyen</div><div className="ld-card-desc">Qualification</div></div>
            </div>
            <div className="ld-card-body">
              <div className="ld-score-wrap">
                <div className="ld-ring-rel">
                  <svg className="ld-ring-svg" width="130" height="130" viewBox="0 0 90 90">
                    <defs>
                      <linearGradient id="scoreGradW" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a78bfa" />
                      </linearGradient>
                    </defs>
                    <circle className="ld-ring-track" cx="45" cy="45" r="40" />
                    <circle className="ld-ring-fill" cx="45" cy="45" r="40" strokeDashoffset={251.2 - scoreArc} />
                  </svg>
                  <div className="ld-ring-center">
                    <span className="ld-ring-val">{stats.avg}</span>
                    <span className="ld-ring-cap">/100</span>
                  </div>
                </div>
                <div className="ld-score-meta">
                  <p>Score moyen de qualification<br />sur {stats.total} prospects</p>
                </div>
              </div>
            </div>
          </div>

          <div className="ld-card">
            <div className="ld-card-head">
              <div className="ld-card-icon" style={{ background: '#eef2ff', color: '#6366f1' }}><Fa icon="fa-solid fa-layer-group" /></div>
              <div><div className="ld-card-title">Top Secteurs</div><div className="ld-card-desc">Répartition par secteur</div></div>
            </div>
            <div className="ld-card-body" style={{ paddingTop: 8 }}>
              <ReactApexChart options={sectorBar.options as any} series={sectorBar.series} type="bar" height={200} />
            </div>
          </div>
        </div>

        {/* Cities + History */}
        <div className="ld-2eq">
          <div className="ld-card">
            <div className="ld-card-head">
              <div className="ld-card-icon" style={{ background: '#fff1f2', color: '#f43f5e' }}><Fa icon="fa-solid fa-city" /></div>
              <div><div className="ld-card-title">Top Villes</div><div className="ld-card-desc">Répartition par ville</div></div>
            </div>
            <div className="ld-card-body" style={{ paddingTop: 8 }}>
              <ReactApexChart options={cityBar.options as any} series={cityBar.series} type="bar" height={200} />
            </div>
          </div>
          <div className="ld-card">
            <div className="ld-card-head">
              <div className="ld-card-icon" style={{ background: '#eef2ff', color: '#6366f1' }}><Fa icon="fa-solid fa-chart-area" /></div>
              <div><div className="ld-card-title">Historique Scans</div><div className="ld-card-desc">Évolution des prospects</div></div>
            </div>
            <div className="ld-card-body" style={{ paddingTop: 8 }}>
              <ReactApexChart options={historyLine.options as any} series={historyLine.series} type="area" height={200} />
            </div>
          </div>
        </div>

        {/* Donut + Website */}
        <div className="ld-3col">
          <div className="ld-card">
            <div className="ld-card-head">
              <div className="ld-card-icon" style={{ background: '#fef2f2', color: '#ef4444' }}><Fa icon="fa-solid fa-chart-pie" /></div>
              <div><div className="ld-card-title">Répartition</div><div className="ld-card-desc">Statuts des prospects</div></div>
            </div>
            <div className="ld-card-body">
              <ReactApexChart options={statusDonut.options as any} series={statusDonut.series} type="donut" height={220} />
            </div>
          </div>

          <div className="ld-card" style={{ gridColumn: 'span 2' }}>
            <div className="ld-card-head">
              <div className="ld-card-icon" style={{ background: '#eef2ff', color: '#6366f1' }}><Fa icon="fa-solid fa-globe" /></div>
              <div><div className="ld-card-title">Présence Web</div><div className="ld-card-desc">Prospects avec site web</div></div>
            </div>
            <div className="ld-card-body">
              <div>
                <span className="ld-web-num">{stats.sitePct}%</span>
                <span className="ld-web-of">ont un site web</span>
              </div>
              <div className="ld-bar-track">
                <div className="ld-bar-fill" style={{ width: `${stats.sitePct}%` }} />
              </div>
              <div className="ld-web-pills">
                <div className="ld-web-pill">
                  <span className="ld-pill-dot" style={{ background: '#6366f1' }} />
                  Avec site · <strong style={{ marginLeft: 3 }}>{stats.withWebsite}</strong>
                </div>
                <div className="ld-web-pill">
                  <span className="ld-pill-dot" style={{ background: '#e2e8f0' }} />
                  Sans site · <strong style={{ marginLeft: 3 }}>{stats.total - stats.withWebsite}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top 10 */}
        <div className="ld-card">
          <div className="ld-card-head">
            <div className="ld-card-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}><Fa icon="fa-solid fa-trophy" /></div>
            <div><div className="ld-card-title">Top 10 Prospects</div><div className="ld-card-desc">Meilleurs scores de qualification</div></div>
          </div>
          <div className="ld-overflow">
            <table className="ld-table">
              <thead>
                <tr>{['#','Entreprise','Contact','Secteur','Ville','Score','Statut'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {leads.slice().sort((a, b) => b.score - a.score).slice(0, 10).map((l, idx) => {
                  const sm = statusMap[l.status] ?? { label: l.status, color: '#64748b', light: '#f8fafc' };
                  const hi = l.score >= 80;
                  return (
                    <tr key={idx}>
                      <td><span className={`ld-rank ld-rank-${idx + 1}`}>{idx + 1}</span></td>
                      <td>
                        <div className="ld-company">{l.company}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          {l.website ? (
                            <>
                              <Fa icon="fa-solid fa-globe" style={{ fontSize: 11, color: '#0ea5e9' }} />
                              <span className="ld-contact" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.website}</span>
                            </>
                          ) : (
                            <>
                              <Fa icon="fa-solid fa-ban" style={{ fontSize: 11, color: '#94a3b8' }} />
                              <span className="ld-contact">Pas de site</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="ld-contact">{l.name}</div>
                        {l.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <Fa icon="fa-solid fa-phone" style={{ fontSize: 11, color: '#64748b' }} />
                            <span className="ld-contact">{l.phone}</span>
                          </div>
                        )}
                      </td>
                      <td><span className="ld-chip"><Fa icon={sectorIcon(l.sector)} style={{ fontSize: 10 }} />{l.sector}</span></td>
                      <td><span className="ld-city-txt">{l.city}</span></td>
                      <td><span className="ld-score-pill" style={{ background: hi ? '#eef2ff' : '#f8fafc', color: hi ? '#6366f1' : '#64748b' }}>{l.score}</span></td>
                      <td>
                        <span className="ld-status-tag" style={{ background: sm.light, color: sm.color }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sm.color, display: 'inline-block' }} />
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

        {/* CTA */}
        <div className="ld-cta">
          <div className="ld-cta-left">
            <div className="ld-cta-icon"><Fa icon="fa-solid fa-satellite-dish" /></div>
            <span className="ld-cta-text">Découvrez de nouveaux prospects en lançant un scan</span>
          </div>
          <button className="ld-cta-btn" onClick={onGoScan}>
            <Fa icon="fa-solid fa-satellite-dish" /> Lancer un scan
          </button>
        </div>
      </div>
    </>
  );
}

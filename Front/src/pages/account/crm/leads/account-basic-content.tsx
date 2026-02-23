'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTable,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ── Inject Font Awesome CDN automatically ────────────────────────────────────
function useFontAwesome() {
  useEffect(() => {
    const id = 'fa-cdn';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    document.head.appendChild(link);
  }, []);
}

// ── FA helper ─────────────────────────────────────────────────────────────────
const Fa = ({ icon, className = '' }: { icon: string; className?: string }) => (
  <i className={`${icon} ${className}`} aria-hidden="true" />
);

// ── Config ───────────────────────────────────────────────────────────────────
const MOROCCAN_REGIONS: Record<string, { cities: string[] }> = {
  'Casablanca-Settat':        { cities: ['Casablanca', 'Mohammedia', 'El Jadida', 'Settat', 'Berrechid', 'Benslimane'] },
  'Rabat-Salé-Kénitra':      { cities: ['Rabat', 'Salé', 'Kénitra', 'Témara', 'Skhirat'] },
  'Marrakech-Safi':           { cities: ['Marrakech', 'Safi', 'Essaouira', 'El Kelaa des Sraghna'] },
  'Fès-Meknès':               { cities: ['Fès', 'Meknès', 'Ifrane', 'Sefrou', 'Taza'] },
  'Tanger-Tétouan-Al Hoceima':{ cities: ['Tanger', 'Tétouan', 'Al Hoceima', 'Larache', 'Chefchaouen'] },
  'Souss-Massa':              { cities: ['Agadir', 'Inezgane', 'Tiznit', 'Taroudant'] },
  'Oriental':                 { cities: ['Oujda', 'Nador', 'Berkane', 'Taourirt'] },
  'Drâa-Tafilalet':           { cities: ['Ouarzazate', 'Errachidia', 'Zagora', 'Tinghir'] },
};
const ALL_CITIES = Object.values(MOROCCAN_REGIONS).flatMap((r) => r.cities).sort();

const SECTORS: Record<string, { faIcon: string; googleType: string }> = {
  Restauration:    { faIcon: 'fa-solid fa-utensils',       googleType: 'restaurant' },
  Hôtellerie:      { faIcon: 'fa-solid fa-hotel',           googleType: 'lodging' },
  Immobilier:      { faIcon: 'fa-solid fa-house-chimney',   googleType: 'real_estate_agency' },
  Santé:           { faIcon: 'fa-solid fa-stethoscope',     googleType: 'doctor' },
  Éducation:       { faIcon: 'fa-solid fa-graduation-cap',  googleType: 'school' },
  'Tech / IT':     { faIcon: 'fa-solid fa-microchip',       googleType: 'electronics_store' },
  Commerce:        { faIcon: 'fa-solid fa-bag-shopping',    googleType: 'store' },
  Automobile:      { faIcon: 'fa-solid fa-car',             googleType: 'car_repair' },
  Beauté:          { faIcon: 'fa-solid fa-scissors',        googleType: 'beauty_salon' },
  Juridique:       { faIcon: 'fa-solid fa-scale-balanced',  googleType: 'lawyer' },
  BTP:             { faIcon: 'fa-solid fa-helmet-safety',   googleType: 'general_contractor' },
  Transport:       { faIcon: 'fa-solid fa-truck',           googleType: 'moving_company' },
  Tourisme:        { faIcon: 'fa-solid fa-plane',           googleType: 'travel_agency' },
  Finance:         { faIcon: 'fa-solid fa-coins',           googleType: 'accounting' },
  Agroalimentaire: { faIcon: 'fa-solid fa-wheat-awn',       googleType: 'food' },
};

const SCAN_STEPS = [
  { id: 'init',   label: 'Initialisation', faIcon: 'fa-solid fa-bolt',        desc: 'Préparation des requêtes' },
  { id: 'google', label: 'Google Places',  faIcon: 'fa-solid fa-map-pin',     desc: 'Recherche établissements' },
  { id: 'ai',     label: 'Scoring IA',     faIcon: 'fa-solid fa-brain',       desc: 'Qualification & scoring' },
  { id: 'done',   label: 'Finalisation',   faIcon: 'fa-solid fa-circle-check',desc: 'Déduplication & tri' },
];

const LEADS_PER_PAGE = 15;

// ── Scoring ───────────────────────────────────────────────────────────────────
function generateMockPlaces(city: string, type: string) {
  const names: Record<string, string[]> = {
    restaurant:         ['Le Jardin', 'La Table du Marché', 'Chez Hassan', 'Dar Essalam', 'Le Comptoir', 'Café de France', 'Al Baraka', "L'Oriental", 'Le Foundouk', 'Amal Center'],
    lodging:            ['Riad Lotus', 'Hotel Kenzi', 'Riad Dar Anika', 'Atlas Medina', 'Hotel Farah', 'Villa Mandarine', 'Riad Kniza', 'Hotel Diwane'],
    real_estate_agency: ['Century 21 Maroc', 'Immo Expert', 'Sarouty Premium', 'Mubawab Agence', 'Coldwell Banker'],
    doctor:             ['Clinique Atlas', 'Cabinet Dr. Tazi', 'Polyclinique du Sud', 'Centre Médical Al Hayat', 'Clinique Avicenne'],
    beauty_salon:       ['Salon Prestige', "L'Atelier Beauté", 'Zen Spa', 'Beauté Royale', "L'Institut"],
    lawyer:             ['Cabinet Fassi', 'Alaoui & Partners', 'Me. Benkirane', 'Légal Consulting Maroc'],
    default:            ['Entreprise Alpha', 'Société Beta', 'Groupe Gamma', 'Delta Services', 'Epsilon Corp'],
  };
  const roles: Record<string, string> = {
    restaurant: 'Gérant', lodging: 'Directeur', real_estate_agency: 'Agent Principal',
    doctor: 'Médecin Chef', beauty_salon: 'Propriétaire', lawyer: 'Associé', default: 'Directeur',
  };
  const list = names[type] || names.default;
  const role = roles[type] || roles.default;
  const fN = ['Youssef','Fatima','Mohammed','Sara','Ahmed','Khadija','Omar','Salma','Rachid','Nadia'];
  const lN = ['Bennani','El Fassi','Tazi','Chraibi','Alaoui','Idrissi','Berrada','Hakimi','Filali','Sefrioui'];
  const streets = ['Bd Mohammed V', 'Rue de la Liberté', 'Avenue Hassan II', 'Bd Zerktouni', 'Rue Moulay Ismail'];
  return list.slice(0, 5 + Math.floor(Math.random() * 3)).map((name, i) => ({
    name:        `${name} ${city}`,
    address:     `${Math.floor(Math.random() * 200) + 1}, ${streets[i % 5]}, ${city}`,
    phone:       `+212 ${['5','6'][Math.floor(Math.random() * 2)]}${Math.floor(Math.random() * 100000000).toString().padStart(8,'0')}`,
    website:     Math.random() > 0.35 ? `${name.toLowerCase().replace(/[^a-z]/g,'')}.ma` : '',
    rating:      (3.5 + Math.random() * 1.5).toFixed(1),
    reviewCount: Math.floor(Math.random() * 500) + 5,
    ownerName:   `${fN[i % 10]} ${lN[i % 10]}`,
    ownerRole:   role,
    email:       `contact@${name.toLowerCase().replace(/[^a-z]/g,'')}.ma`,
    city,
    isOpen:      Math.random() > 0.15,
  }));
}

async function fetchPlaces(sector: string, city: string, _radius: number, type: string) {
  await new Promise((r) => setTimeout(r, 120));
  return generateMockPlaces(city, type);
}

function calcScore(p: { website?: string; rating?: string; reviewCount?: number }) {
  let s = 45;
  if (p.website)                      s += 12;
  if (Number(p.rating) >= 4.0)        s += 10;
  else if (Number(p.rating) >= 3.5)   s += 5;
  if ((p.reviewCount ?? 0) > 100)     s += 8;
  else if ((p.reviewCount ?? 0) > 30) s += 5;
  if (!p.website)                     s += 5;
  return Math.min(Math.max(s + Math.floor(Math.random() * 8), 25), 99);
}

const scoreMeta = (s: number) =>
  s >= 80 ? { t: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', bar: '#10b981' } :
  s >= 60 ? { t: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',     bar: '#f59e0b' } :
             { t: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200',     bar: '#94a3b8' };

const statusOf = (s: number) => (s >= 80 ? 'hot' : s >= 60 ? 'warm' : 'cold');
const STATUS: Record<string, { label: string; dot: string; badge: string; icon: string }> = {
  hot:  { label: 'Chaud', dot: 'bg-red-500',   badge: 'bg-red-50 text-red-700 border-red-200',       icon: 'fa-solid fa-fire' },
  warm: { label: 'Tiède', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'fa-solid fa-temperature-half' },
  cold: { label: 'Froid', dot: 'bg-slate-400', badge: 'bg-slate-50 text-slate-600 border-slate-200', icon: 'fa-solid fa-snowflake' },
};

type Lead = {
  id: number; name: string; company: string; role: string; email: string;
  phone: string; city: string; address?: string; website?: string;
  rating?: string; reviewCount?: number; sector: string; score: number; status: string;
};

// ── Component ─────────────────────────────────────────────────────────────────
export function AccountCrmLeadsContent() {
  useFontAwesome();

  const [view,             setView]             = useState<'scan' | 'leads'>('scan');
  const [leads,            setLeads]            = useState<Lead[]>([]);
  const [selectedLead,     setSelectedLead]     = useState<Lead | null>(null);
  const [currentPage,      setCurrentPage]      = useState(1);
  const [sortBy,           setSortBy]           = useState<'score' | 'name' | 'city'>('score');
  const [filterStatus,     setFilterStatus]     = useState('all');
  const [filterSector,     setFilterSector]     = useState('all');
  const [searchQuery,      setSearchQuery]      = useState('');
  const [isScanning,       setIsScanning]       = useState(false);
  const [scanProgress,     setScanProgress]     = useState(0);
  const [scanPhase,        setScanPhase]        = useState('');
  const [scanStep,         setScanStep]         = useState(0);
  const [scanLog,          setScanLog]          = useState<string[]>([]);
  const [scanHistory,      setScanHistory]      = useState<{ date: string; count: number; avgScore: number }[]>([]);
  const [emailSentFor,     setEmailSentFor]     = useState<number | null>(null);

  const [filters, setFilters] = useState({
    sectors: [] as string[], cities: [] as string[],
    postalCode: '', maxResults: 20, hasWebsite: '',
  });

  const emailTemplate = { subject: 'Collaboration digitale — {{company}}', body: 'Bonjour {{firstName}},\n\nJ\'ai découvert {{company}}. Seriez-vous disponible pour un échange de 15 minutes ?\n\nCordialement,\nAbderrahim\nELBAHI.NET' };

  const applyTemplate = useCallback((lead: Lead) => {
    const vars: Record<string, string> = { '{{firstName}}': lead.name.split(' ')[0], '{{company}}': lead.company, '{{sector}}': lead.sector, '{{city}}': lead.city };
    let s = emailTemplate.subject, b = emailTemplate.body;
    Object.entries(vars).forEach(([k, v]) => { s = s.split(k).join(v); b = b.split(k).join(v); });
    return { subject: s, body: b };
  }, []);

  // ── Scan ───────────────────────────────────────────────────────────────────
  const handleScan = async () => {
    if (!filters.sectors.length) return;
    setIsScanning(true); setScanProgress(0); setScanLog([]); setScanStep(0);
    const all: Lead[] = [];
    const cities = filters.cities.length ? filters.cities : ['Casablanca'];
    const total = filters.sectors.length * cities.length;
    let step = 0;

    setScanLog(['Système initialisé']); await new Promise(r => setTimeout(r, 400));
    setScanStep(1); setScanLog(p => [...p, 'Connexion Google Places API...']); await new Promise(r => setTimeout(r, 300));

    for (const sector of filters.sectors) {
      for (const city of cities) {
        step++;
        setScanPhase(`${sector} — ${city}`);
        setScanProgress(Math.round((step / total) * 70));
        setScanLog(p => [...p.slice(-6), `Scan ${sector} à ${city}...`]);
        await new Promise(r => setTimeout(r, 280 + Math.random() * 140));

        let places = await fetchPlaces(sector, city, 0, SECTORS[sector]?.googleType || 'establishment');
        if (filters.hasWebsite === 'yes') places = places.filter(p => p.website);
        if (filters.hasWebsite === 'no')  places = places.filter(p => !p.website);
        places = places.slice(0, filters.maxResults);
        setScanLog(p => [...p.slice(-6), `${places.length} établissements à ${city}`]);

        for (const pl of places) {
          const score = calcScore(pl);
          all.push({ id: Date.now() + Math.random() * 9999, name: pl.ownerName, company: pl.name, role: pl.ownerRole, email: pl.email, phone: pl.phone, city: pl.city, address: pl.address, website: pl.website, rating: pl.rating, reviewCount: pl.reviewCount, sector, score, status: statusOf(score) });
        }
      }
    }

    setScanStep(2); setScanLog(p => [...p.slice(-6), 'Analyse IA et scoring...']); setScanProgress(88); await new Promise(r => setTimeout(r, 600));
    setScanStep(3); setScanLog(p => [...p.slice(-6), 'Déduplication & tri...'  ]); setScanProgress(96); await new Promise(r => setTimeout(r, 400));

    const unique = all.filter((l, i, a) => a.findIndex(x => x.company === l.company) === i).sort((a, b) => b.score - a.score);
    setScanLog(p => [...p.slice(-6), `${unique.length} prospects qualifiés !`]); setScanProgress(100);
    setScanHistory(p => [...p, { date: new Date().toLocaleString('fr-MA'), count: unique.length, avgScore: unique.length ? Math.round(unique.reduce((s, l) => s + l.score, 0) / unique.length) : 0 }]);
    setLeads(p => { const ex = new Set(p.map(l => l.company)); return [...p, ...unique.filter(l => !ex.has(l.company))]; });
    await new Promise(r => setTimeout(r, 800));
    setIsScanning(false); setView('leads');
  };

  // ── Filtered leads ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = [...leads];
    if (filterStatus !== 'all') r = r.filter(l => l.status === filterStatus);
    if (filterSector  !== 'all') r = r.filter(l => l.sector  === filterSector);
    if (searchQuery) { const q = searchQuery.toLowerCase(); r = r.filter(l => l.company.toLowerCase().includes(q) || l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q)); }
    r.sort((a, b) => sortBy === 'score' ? b.score - a.score : sortBy === 'name' ? a.company.localeCompare(b.company) : a.city.localeCompare(b.city));
    return r;
  }, [leads, filterStatus, filterSector, searchQuery, sortBy]);

  const totalPages     = Math.ceil(filtered.length / LEADS_PER_PAGE);
  const paginated      = filtered.slice((currentPage - 1) * LEADS_PER_PAGE, currentPage * LEADS_PER_PAGE);
  const uniqueSectors  = useMemo(() => [...new Set(leads.map(l => l.sector))], [leads]);

  // ── CSV export ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = 'Entreprise,Contact,Rôle,Email,Téléphone,Ville,Secteur,Score,Statut,Site web';
    const rows = filtered.map(l => [l.company, l.name, l.role, l.email, l.phone, l.city, l.sector, l.score, STATUS[l.status]?.label, l.website || ''].map(v => `"${v}"`).join(','));
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'prospects.csv'; a.click();
  };

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="grid gap-5 lg:gap-7">

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-1.5">
          <nav className="flex items-center gap-1">
            {([
              { k: 'scan' as const,  label: 'Scan',      fa: 'fa-solid fa-satellite-dish' },
              { k: 'leads' as const, label: 'Prospects', fa: 'fa-solid fa-users'          },
            ]).map(tab => (
              <button
                key={tab.k}
                onClick={() => setView(tab.k)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  view === tab.k ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                )}
              >
                <Fa icon={tab.fa} className="text-[13px]" />
                {tab.label}
                {tab.k === 'leads' && leads.length > 0 && (
                  <span className="rounded-full bg-teal-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">{leads.length}</span>
                )}
              </button>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* ══════════════════ SCAN ══════════════════════════════════════════ */}
      {view === 'scan' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">

            {/* Sector picker */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50 pb-3 pt-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-slate-900">
                    <Fa icon="fa-solid fa-layer-group" className="text-[13px] text-white" />
                  </span>
                  <div>
                    <CardTitle className="text-sm font-semibold">Secteurs à scanner</CardTitle>
                    <CardDescription className="text-xs">Sélectionnez un ou plusieurs secteurs cibles</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {Object.entries(SECTORS).map(([sector, info]) => {
                    const sel = filters.sectors.includes(sector);
                    return (
                      <button
                        key={sector}
                        onClick={() => setFilters(p => ({ ...p, sectors: sel ? p.sectors.filter(s => s !== sector) : [...p.sectors, sector] }))}
                        className={cn(
                          'group relative flex flex-col items-center gap-2 rounded-xl border px-2 py-3.5 text-center transition-all duration-150',
                          sel ? 'border-slate-900 bg-slate-900 shadow-md' : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm'
                        )}
                      >
                        {sel && (
                          <div className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-teal-500 shadow-sm">
                            <Fa icon="fa-solid fa-check" className="text-[8px] text-white" />
                          </div>
                        )}
                        <Fa icon={info.faIcon} className={cn('text-base', sel ? 'text-white' : 'text-slate-500')} />
                        <span className={cn('text-[10px] font-medium leading-tight', sel ? 'text-slate-200' : 'text-slate-500')}>{sector}</span>
                      </button>
                    );
                  })}
                </div>
                {filters.sectors.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {filters.sectors.map(s => (
                      <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
                        <Fa icon={SECTORS[s]?.faIcon} className="text-[10px]" />
                        {s}
                        <button onClick={() => setFilters(p => ({ ...p, sectors: p.sectors.filter(x => x !== s) }))} className="ml-0.5 flex size-3.5 items-center justify-center rounded-full bg-slate-300 text-slate-600 hover:bg-slate-400">
                          <Fa icon="fa-solid fa-xmark" className="text-[8px]" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location & Filters */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50 pb-3 pt-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-slate-900">
                    <Fa icon="fa-solid fa-location-dot" className="text-[13px] text-white" />
                  </span>
                  <div>
                    <CardTitle className="text-sm font-semibold">Localisation & Filtres</CardTitle>
                    <CardDescription className="text-xs">Définissez la zone géographique de prospection</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-4">
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    <Fa icon="fa-solid fa-city" className="text-[10px]" /> Ville cible
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                    {ALL_CITIES.slice(0, 20).map(c => {
                      const sel = filters.cities.includes(c);
                      return (
                        <button
                          key={c}
                          onClick={() => setFilters(p => ({ ...p, cities: sel ? [] : [c] }))}
                          className={cn(
                            'flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-all',
                            sel ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'
                          )}
                        >
                          {sel && <Fa icon="fa-solid fa-circle-dot" className="text-[8px] text-teal-400" />}
                          {c}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
                    <Fa icon="fa-solid fa-circle-info" className="text-[10px]" />
                    Une seule ville. Aucune sélection = Casablanca
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {/* Code postal */}
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      <Fa icon="fa-solid fa-mailbox" className="text-[10px]" /> Code postal
                    </label>
                    <input type="text" placeholder="ex. 20000" value={filters.postalCode}
                      onChange={e => setFilters(p => ({ ...p, postalCode: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
                  </div>
                  {/* Max results */}
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      <Fa icon="fa-solid fa-list-ol" className="text-[10px]" /> Max résultats
                    </label>
                    <select value={filters.maxResults} onChange={e => setFilters(p => ({ ...p, maxResults: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none">
                      {[10, 20, 30, 50, 60].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  {/* Website */}
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      <Fa icon="fa-solid fa-globe" className="text-[10px]" /> Site web
                    </label>
                    <select value={filters.hasWebsite} onChange={e => setFilters(p => ({ ...p, hasWebsite: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none">
                      <option value="">Tous</option>
                      <option value="yes">Avec site</option><option value="no">Sans site</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Right panel ──────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Summary */}
            {filters.sectors.length > 0 && !isScanning && (
              <Card className="border border-slate-200 bg-slate-50">
                <CardContent className="space-y-3 py-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    <Fa icon="fa-solid fa-clipboard-list" /> Résumé du scan
                  </p>
                  <div className="space-y-2">
                    {[
                      { fa: 'fa-solid fa-layer-group',  label: 'Secteurs',    val: filters.sectors.join(', ') },
                      { fa: 'fa-solid fa-city',         label: 'Ville',       val: filters.cities.length ? filters.cities[0] : 'Casablanca' },
                      { fa: 'fa-solid fa-mailbox',      label: 'Code postal', val: filters.postalCode || '—' },
                      { fa: 'fa-solid fa-sliders',      label: 'Max / ville', val: `${filters.maxResults} résultats` },
                    ].map(row => (
                      <div key={row.label} className="flex items-start gap-2 text-sm">
                        <Fa icon={row.fa} className="mt-0.5 w-4 shrink-0 text-center text-[12px] text-slate-400" />
                        <span className="text-[11px] text-slate-400 w-20 shrink-0">{row.label}</span>
                        <span className="font-medium text-slate-700 text-[12px]">{row.val}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Launch button */}
            <button
              disabled={!filters.sectors.length || isScanning}
              onClick={handleScan}
              className={cn(
                'relative w-full overflow-hidden rounded-2xl px-6 py-5 text-left transition-all duration-200',
                filters.sectors.length && !isScanning
                  ? 'cursor-pointer bg-slate-900 shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-xl'
                  : 'cursor-not-allowed bg-slate-200 opacity-60'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-base">
                    {isScanning ? scanPhase || 'Scan en cours...' : 'Lancer le scan'}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-400">
                    {isScanning
                      ? `${scanProgress}% complété`
                      : filters.sectors.length
                        ? `${filters.sectors.length} secteur(s) · ${filters.cities.length ? '1 ville' : 'Casablanca'}`
                        : 'Sélectionnez des secteurs'}
                  </p>
                </div>
                <Fa icon={isScanning ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-rocket'} className="text-xl text-white" />
              </div>
              {isScanning && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-teal-400 transition-all duration-500" style={{ width: `${scanProgress}%` }} />
              )}
            </button>

            {/* Console */}
            {isScanning && (
              <Card className="overflow-hidden border border-slate-800 bg-slate-950">
                <CardHeader className="border-b border-slate-800 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="size-2.5 rounded-full bg-red-500" />
                      <span className="size-2.5 rounded-full bg-yellow-500" />
                      <span className="size-2.5 rounded-full bg-green-500 animate-pulse" />
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                      <Fa icon="fa-solid fa-terminal" className="text-[9px]" /> scan.log
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="mb-3 flex gap-1">
                    {SCAN_STEPS.map((s, i) => (
                      <div key={s.id} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                        <div className={cn('h-1 w-full rounded-full transition-all duration-500', i <= scanStep ? 'bg-teal-500' : 'bg-slate-700')} />
                        <span className={cn('text-[9px] font-mono', i <= scanStep ? 'text-teal-400' : 'text-slate-600')}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <Fa icon={SCAN_STEPS[scanStep]?.faIcon || 'fa-solid fa-gear'} className="text-teal-400 text-sm" />
                    <div>
                      <p className="text-xs font-semibold text-teal-400">{SCAN_STEPS[scanStep]?.label}</p>
                      <p className="text-[10px] text-slate-500">{SCAN_STEPS[scanStep]?.desc}</p>
                    </div>
                  </div>
                  <div className="space-y-0.5 font-mono text-[10px]">
                    {scanLog.slice(-5).map((line, i) => (
                      <p key={i} className={cn(i === scanLog.slice(-5).length - 1 ? 'text-green-400' : 'text-slate-500')}>
                        <span className="mr-1.5 text-slate-700">{new Date().toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        {line}
                      </p>
                    ))}
                    <span className="inline-block w-1.5 h-3 bg-green-400 animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* History */}
            {scanHistory.length > 0 && !isScanning && (
              <Card>
                <CardHeader className="pb-2 pt-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    <Fa icon="fa-solid fa-clock-rotate-left" /> Historique
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 pb-4">
                  {scanHistory.slice(-3).reverse().map((h, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Fa icon="fa-solid fa-chart-pie" className="text-slate-400 text-[11px]" />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{h.count} prospects</p>
                          <p className="text-[10px] text-slate-400">{h.date}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-bold text-white">moy. {h.avgScore}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════ LEADS ═════════════════════════════════════════ */}
      {view === 'leads' && (
        <>
          {leads.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <span className="flex size-16 items-center justify-center rounded-2xl bg-slate-100">
                  <Fa icon="fa-solid fa-users" className="text-2xl text-slate-400" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-800">Aucun prospect</h3>
                <p className="mt-1 text-sm text-slate-400">Lancez un scan pour découvrir des prospects qualifiés.</p>
                <button onClick={() => setView('scan')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
                  <Fa icon="fa-solid fa-satellite-dish" /> Aller au scan
                </button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* KPI strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { fa: 'fa-solid fa-users',        label: 'Total',     sub: 'prospects',    val: leads.length,                                                               color: 'text-slate-800' },
                  { fa: 'fa-solid fa-fire',          label: 'Chauds',    sub: 'prioritaires', val: leads.filter(l => l.status === 'hot').length,                              color: 'text-red-600' },
                  { fa: 'fa-solid fa-temperature-half', label: 'Tièdes', sub: 'à relancer',   val: leads.filter(l => l.status === 'warm').length,                             color: 'text-amber-600' },
                  { fa: 'fa-solid fa-chart-simple',  label: 'Score moy',sub: '/ 100',        val: leads.length ? Math.round(leads.reduce((s,l)=>s+l.score,0)/leads.length):0, color: 'text-teal-600' },
                ].map(stat => (
                  <Card key={stat.label}>
                    <CardContent className="flex items-center gap-3 py-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                        <Fa icon={stat.fa} className="text-slate-500" />
                      </span>
                      <div>
                        <p className={cn('text-2xl font-bold tabular-nums', stat.color)}>{stat.val}</p>
                        <p className="text-[11px] text-slate-400">{stat.label} · {stat.sub}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Toolbar */}
              <Card>
                <CardContent className="flex flex-wrap items-center gap-3 py-3">
                  <div className="relative min-w-48 flex-1">
                    <Fa icon="fa-solid fa-magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[12px]" />
                    <input type="text" placeholder="Rechercher entreprise, contact, ville..." value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
                  </div>
                  <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                    {[
                      { k: 'all',  l: 'Tous',   fa: 'fa-solid fa-border-all'       },
                      { k: 'hot',  l: 'Chauds', fa: 'fa-solid fa-fire'             },
                      { k: 'warm', l: 'Tièdes', fa: 'fa-solid fa-temperature-half' },
                      { k: 'cold', l: 'Froids', fa: 'fa-solid fa-snowflake'        },
                    ].map(o => (
                      <button key={o.k} onClick={() => { setFilterStatus(o.k); setCurrentPage(1); }}
                        className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                          filterStatus === o.k ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                        <Fa icon={o.fa} className="text-[10px]" />{o.l}
                      </button>
                    ))}
                  </div>
                  <select value={filterSector} onChange={e => { setFilterSector(e.target.value); setCurrentPage(1); }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none">
                    <option value="all">Tous secteurs</option>
                    {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as 'score'|'name'|'city')}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none">
                    <option value="score">Trier: Score</option>
                    <option value="name">Trier: Nom</option>
                    <option value="city">Trier: Ville</option>
                  </select>
                  <button onClick={exportCSV} className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800">
                    <Fa icon="fa-solid fa-file-csv" className="text-[12px]" /> CSV
                  </button>
                </CardContent>
              </Card>

              {/* Count */}
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Fa icon="fa-solid fa-filter" className="text-[11px]" />
                  <span className="font-semibold text-slate-700">{filtered.length}</span> prospects
                  {filtered.length !== leads.length && ` (sur ${leads.length})`}
                </span>
                <span className="flex items-center gap-1.5">
                  <Fa icon="fa-solid fa-book-open" className="text-[11px]" />
                  Page {currentPage} / {totalPages || 1}
                </span>
              </div>

              {/* Table */}
              <Card className="overflow-hidden">
                <CardTable>
                  <table className="w-full border-collapse text-left text-sm">
                    <colgroup>
                      <col className="w-48" />
                      <col className="w-36" />
                      <col className="w-32" />
                      <col className="w-28" />
                      <col className="w-20" />
                      <col className="w-14" />
                      <col className="w-24" />
                      <col className="w-10" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        {[
                          { label: 'Entreprise', fa: 'fa-solid fa-building' },
                          { label: 'Contact',    fa: 'fa-solid fa-user'     },
                          { label: 'Secteur',    fa: 'fa-solid fa-tag'      },
                          { label: 'Ville',      fa: 'fa-solid fa-map-pin'  },
                          { label: 'Note',       fa: 'fa-solid fa-star'     },
                          { label: 'Score',      fa: 'fa-solid fa-gauge'    },
                          { label: 'Statut',     fa: 'fa-solid fa-circle'   },
                          { label: '',           fa: ''                     },
                        ].map(h => (
                          <th key={h.label} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                            <span className="flex items-center gap-1.5">
                              {h.fa && <Fa icon={h.fa} className="text-[10px]" />}
                              {h.label}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginated.map(l => {
                        const sc = scoreMeta(l.score);
                        const si = STATUS[l.status];
                        return (
                          <tr key={l.id} onClick={() => setSelectedLead(l)} className="cursor-pointer transition-colors hover:bg-slate-50/60">
                            <td className="px-4 py-3 max-w-[180px]">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                                  <Fa icon={SECTORS[l.sector]?.faIcon || 'fa-solid fa-building'} className="text-[12px] text-slate-500" />
                                </span>
                                <div className="min-w-0 overflow-hidden">
                                  <p className="truncate font-semibold text-slate-800" title={l.company}>{l.company}</p>
                                  <p className="truncate text-[11px] text-slate-400">
                                    {l.website
                                      ? <span className="flex items-center gap-1"><Fa icon="fa-solid fa-globe" className="text-[9px] text-teal-500" /><span className="truncate">{l.website}</span></span>
                                      : <span className="flex items-center gap-1 text-slate-300"><Fa icon="fa-solid fa-ban" className="text-[9px]" />Pas de site</span>
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="flex items-center gap-1.5 font-medium text-slate-700">
                                <Fa icon="-" className="text-slate-300 text-[13px]" />
                                {l.name}
                              </p>
                              <p className="ml-5 text-[11px] text-slate-400">{l.role}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                <Fa icon={SECTORS[l.sector]?.faIcon || 'fa-solid fa-building'} className="text-[10px]" />
                                {l.sector}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                                <Fa icon="" className="text-[10px] text-slate-400" />
                                {l.city}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-500">
                                <Fa icon="fa-solid fa-star" className="text-[10px]" />
                                {l.rating || '—'}
                              </span>
                              {l.reviewCount && <p className="text-[10px] text-slate-400">{l.reviewCount} avis</p>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="relative size-9">
                                <svg viewBox="0 0 36 36" className="size-9 -rotate-90">
                                  <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                                  <circle cx="18" cy="18" r="14" fill="none" stroke={sc.bar} strokeWidth="3.5"
                                    strokeDasharray={`${(l.score / 100) * 88} 88`} strokeLinecap="round" />
                                </svg>
                                <span className={cn('absolute inset-0 flex items-center justify-center text-[9px] font-bold', sc.t)}>{l.score}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold', si.badge)}>
                                <Fa icon={si.icon} className="text-[9px]" />
                                {si.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 shrink-0 w-10">
                              <button onClick={e => { e.stopPropagation(); setSelectedLead(l); }}
                                className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-slate-400 hover:text-slate-700">
                                <Fa icon="fa-solid fa-eye" className="text-[11px]" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardTable>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                    <p className="text-sm text-slate-400">{(currentPage-1)*LEADS_PER_PAGE+1}–{Math.min(currentPage*LEADS_PER_PAGE,filtered.length)} sur {filtered.length}</p>
                    <div className="flex items-center gap-1">
                      <button disabled={currentPage===1} onClick={() => setCurrentPage(p=>Math.max(1,p-1))}
                        className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-400 disabled:opacity-40">
                        <Fa icon="fa-solid fa-chevron-left" className="text-[10px]" />
                      </button>
                      {Array.from({length:Math.min(totalPages,7)},(_,i)=>{
                        const page = totalPages<=7?i+1:currentPage<=4?i+1:currentPage>=totalPages-3?totalPages-6+i:currentPage-3+i;
                        return (
                          <button key={page} onClick={() => setCurrentPage(page)}
                            className={cn('flex size-8 items-center justify-center rounded-lg text-sm font-medium transition',
                              currentPage===page?'bg-slate-900 text-white':'border border-slate-200 text-slate-500 hover:border-slate-400')}>
                            {page}
                          </button>
                        );
                      })}
                      <button disabled={currentPage===totalPages} onClick={() => setCurrentPage(p=>Math.min(totalPages,p+1))}
                        className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-400 disabled:opacity-40">
                        <Fa icon="fa-solid fa-chevron-right" className="text-[10px]" />
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

      {/* ══════════════════ MODAL ════════════════════════════════════════ */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSelectedLead(null)}>
          <Card className="max-h-[90vh] w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                    <Fa icon={SECTORS[selectedLead.sector]?.faIcon || 'fa-solid fa-building'} className="text-lg text-slate-600" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900">{selectedLead.name}</h3>
                    <p className="text-sm text-slate-500">{selectedLead.role} — {selectedLead.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('flex size-9 items-center justify-center rounded-lg border text-sm font-bold', scoreMeta(selectedLead.score).bg, scoreMeta(selectedLead.score).t)}>
                    {selectedLead.score}
                  </span>
                  <button onClick={() => setSelectedLead(null)} className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700">
                    <Fa icon="fa-solid fa-xmark" className="text-sm" />
                  </button>
                </div>
              </div>
            </div>

            <CardContent className="space-y-4 overflow-y-auto py-4">
              <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', STATUS[selectedLead.status]?.badge)}>
                <Fa icon={STATUS[selectedLead.status]?.icon} className="text-[9px]" />
                {STATUS[selectedLead.status]?.label}
              </span>

              <div className="space-y-1.5">
                {[
                  { fa: 'fa-solid fa-building',       label: 'Entreprise', val: selectedLead.company },
                  { fa: 'fa-solid fa-tag',             label: 'Secteur',   val: selectedLead.sector  },
                  { fa: 'fa-solid fa-location-dot',   label: 'Adresse',   val: selectedLead.address || selectedLead.city },
                  { fa: 'fa-solid fa-envelope',        label: 'Email',     val: selectedLead.email   },
                  { fa: 'fa-solid fa-phone',           label: 'Tél.',      val: selectedLead.phone || '—' },
                  { fa: 'fa-solid fa-globe',           label: 'Site web',  val: selectedLead.website || 'Aucun site web' },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
                    <Fa icon={row.fa} className="w-4 shrink-0 text-center text-[12px] text-slate-400" />
                    <span className="w-20 shrink-0 text-[11px] text-slate-400">{row.label}</span>
                    <span className="min-w-0 truncate font-medium text-slate-800">{row.val}</span>
                  </div>
                ))}
                {selectedLead.rating && (
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
                    <Fa icon="fa-solid fa-star" className="w-4 shrink-0 text-center text-[12px] text-amber-400" />
                    <span className="w-20 shrink-0 text-[11px] text-slate-400">Google</span>
                    <span className="font-medium text-slate-800">{selectedLead.rating} ★ · {selectedLead.reviewCount} avis</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                {emailSentFor === selectedLead.id ? (
                  <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                    <Fa icon="fa-solid fa-circle-check" /> Email envoyé !
                  </div>
                ) : (
                  <button
                    onClick={() => { applyTemplate(selectedLead); setEmailSentFor(selectedLead.id); setTimeout(() => { setEmailSentFor(null); setSelectedLead(null); }, 1500); }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    <Fa icon="fa-solid fa-paper-plane" /> Envoyer email
                  </button>
                )}
                <button onClick={() => setSelectedLead(null)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400">
                  <Fa icon="fa-solid fa-xmark" /> Fermer
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
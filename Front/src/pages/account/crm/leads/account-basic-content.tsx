'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTable,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LeadsDashboard } from './leads-dashboard';
import { CRM } from './crm';
import LeadMessanger from './lead-messanger';
import { MessageSequenceTemplatesView } from './components/message-sequence-templates-view';
import { LeadEditView } from './edit-lead';

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
const MOROCCAN_REGIONS: Record<string, { cities: { name: string; postalCode: string }[] }> = {
  'Casablanca-Settat': {
    cities: [
      { name: 'Casablanca',   postalCode: '20000' },
      { name: 'Mohammedia',   postalCode: '28800' },
      { name: 'El Jadida',    postalCode: '24000' },
      { name: 'Settat',       postalCode: '26000' },
      { name: 'Berrechid',    postalCode: '26100' },
      { name: 'Benslimane',   postalCode: '13000' },
    ],
  },
  'Rabat-Salé-Kénitra': {
    cities: [
      { name: 'Rabat',    postalCode: '10000' },
      { name: 'Salé',     postalCode: '11000' },
      { name: 'Kénitra',  postalCode: '14000' },
      { name: 'Témara',   postalCode: '12000' },
      { name: 'Skhirat',  postalCode: '12010' },
    ],
  },
  'Marrakech-Safi': {
    cities: [
      { name: 'Marrakech',              postalCode: '40000' },
      { name: 'Safi',                   postalCode: '46000' },
      { name: 'Essaouira',              postalCode: '44000' },
      { name: 'El Kelaa des Sraghna',   postalCode: '43000' },
    ],
  },
  'Fès-Meknès': {
    cities: [
      { name: 'Fès',    postalCode: '30000' },
      { name: 'Meknès', postalCode: '50000' },
      { name: 'Ifrane', postalCode: '53000' },
      { name: 'Sefrou', postalCode: '31000' },
      { name: 'Taza',   postalCode: '35000' },
    ],
  },
  'Tanger-Tétouan-Al Hoceima': {
    cities: [
      { name: 'Tanger',       postalCode: '90000' },
      { name: 'Tétouan',      postalCode: '93000' },
      { name: 'Al Hoceima',   postalCode: '32000' },
      { name: 'Larache',      postalCode: '92000' },
      { name: 'Chefchaouen',  postalCode: '91000' },
    ],
  },
  'Souss-Massa': {
    cities: [
      { name: 'Agadir',     postalCode: '80000' },
      { name: 'Inezgane',   postalCode: '80350' },
      { name: 'Tiznit',     postalCode: '85000' },
      { name: 'Taroudant',  postalCode: '83000' },
    ],
  },
  'Oriental': {
    cities: [
      { name: 'Oujda',    postalCode: '60000' },
      { name: 'Nador',    postalCode: '62000' },
      { name: 'Berkane',  postalCode: '63300' },
      { name: 'Taourirt', postalCode: '63000' },
    ],
  },
  'Drâa-Tafilalet': {
    cities: [
      { name: 'Ouarzazate', postalCode: '45000' },
      { name: 'Errachidia', postalCode: '52000' },
      { name: 'Zagora',     postalCode: '47900' },
      { name: 'Tinghir',    postalCode: '45800' },
    ],
  },
};

// Helper: flat city list per region
const citiesForRegion = (region: string) =>
  region ? (MOROCCAN_REGIONS[region]?.cities ?? []) : [];

// Helper: get postal code for a city
const postalCodeForCity = (cityName: string): string => {
  for (const region of Object.values(MOROCCAN_REGIONS)) {
    const found = region.cities.find(c => c.name === cityName);
    if (found) return found.postalCode;
  }
  return '';
};

function cleanStr(v?: string): string {
  return String(v || '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickField(obj: any, variants: string[], cleaner?: (v?: string) => string): string {
  if (!obj) return '';
  const lcMap: Record<string, string> = {};
  for (const k of Object.keys(obj)) lcMap[k.toLowerCase()] = k;
  for (const v of variants) {
    const k = lcMap[v.toLowerCase()];
    if (k && obj[k] != null && String(obj[k]).trim() !== '') {
      const val = String(obj[k]);
      return cleaner ? cleaner(val) : val;
    }
  }
  return '';
}

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
  { id: 'init',   label: 'Initialisation', faIcon: 'fa-solid fa-bolt',         desc: 'Préparation des requêtes' },
  { id: 'google', label: 'Google Places',  faIcon: 'fa-solid fa-map-pin',      desc: 'Recherche établissements' },
  { id: 'ai',     label: 'Scoring IA',     faIcon: 'fa-solid fa-brain',        desc: 'Qualification & scoring' },
  { id: 'done',   label: 'Finalisation',   faIcon: 'fa-solid fa-circle-check', desc: 'Déduplication & tri' },
];

const LEADS_PER_PAGE = 15;

// ── Types ─────────────────────────────────────────────────────────────────────
type RawPlace = {
  name:         string;
  address:      string;
  phone:        string;
  website:      string;
  rating:       string;
  reviewCount:  number;
  ownerName:    string;
  ownerRole:    string;
  email:        string;
  city:         string;
  isOpen:       boolean;
  linkedIn:     string;
  apolloScore:  number;
};

// ── Scoring ───────────────────────────────────────────────────────────────────
function calcScore(p: { website?: string; rating?: string; reviewCount?: number }, useApollo: boolean) {
  let s = 45;
  if (p.website)                      s += 12;
  if (Number(p.rating) >= 4.0)        s += 10;
  else if (Number(p.rating) >= 3.5)   s += 5;
  if ((p.reviewCount ?? 0) > 100)     s += 8;
  else if ((p.reviewCount ?? 0) > 30) s += 5;
  if (!p.website)                     s += 5;
  if (useApollo)                      s += Math.floor(Math.random() * 10) + 3;
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
  linkedIn?: string; apolloEnriched?: boolean;
};

// ── Toggle Component ──────────────────────────────────────────────────────────
const Toggle = ({ value, onChange, label, sublabel, icon }: {
  value: boolean; onChange: (v: boolean) => void;
  label: string; sublabel?: string; icon: string;
}) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={cn(
      'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200',
      value
        ? 'border-indigo-300 bg-indigo-50 shadow-sm'
        : 'border-slate-200 bg-white hover:border-slate-300'
    )}
  >
    <span className={cn(
      'flex size-9 shrink-0 items-center justify-center rounded-lg transition-all',
      value ? 'bg-indigo-600 shadow-md' : 'bg-slate-100'
    )}>
      <Fa icon={icon} className={cn('text-sm', value ? 'text-white' : 'text-slate-400')} />
    </span>
    <div className="flex-1 min-w-0">
      <p className={cn('text-sm font-semibold', value ? 'text-indigo-900' : 'text-slate-700')}>{label}</p>
      {sublabel && <p className={cn('text-[11px]', value ? 'text-indigo-500' : 'text-slate-400')}>{sublabel}</p>}
    </div>
    <div className={cn(
      'relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300',
      value ? 'bg-indigo-600' : 'bg-slate-300'
    )}>
      <span className={cn(
        'absolute size-4 rounded-full bg-white shadow-md transition-all duration-300',
        value ? 'left-6' : 'left-1'
      )} />
    </div>
  </button>
);

// ── Component ─────────────────────────────────────────────────────────────────
export function AccountCrmLeadsContent() {
  useFontAwesome();

  const [leads, setLeads] = useState<Lead[]>([]);

  const [scanHistory, setScanHistory] = useState<{ date: string; count: number; avgScore: number; apollo: boolean }[]>(() => {
    try {
      const saved = localStorage.getItem('crm_scan_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Sync history to localStorage whenever it changes
  useEffect(() => {
    try { localStorage.setItem('crm_scan_history', JSON.stringify(scanHistory)); } catch {}
  }, [scanHistory]);

  const [view,         setView]         = useState<'dashboard' | 'scan' | 'leads' | 'messenger' | 'templates' | 'edit'>(() => {
    try { return (localStorage.getItem('crm_view') as any) || 'leads'; } catch { return 'leads'; }
  });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [sortBy,       setSortBy]       = useState<'score' | 'name' | 'city'>('score');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSector, setFilterSector] = useState('all');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [isScanning,   setIsScanning]   = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhase,    setScanPhase]    = useState('');
  const [scanStep,     setScanStep]     = useState(0);
  const [scanLog,      setScanLog]      = useState<string[]>([]);
  const [emailSentFor, setEmailSentFor] = useState<number | null>(null);
  const [composeForLeadId, setComposeForLeadId] = useState<number | null>(null);

  useEffect(() => {
    try { localStorage.setItem('crm_view', view); } catch {}
  }, [view]);

  const [filters, setFilters] = useState({
    sectors:    [] as string[],
    region:     '',
    cities:     [] as string[],
    postalCode: '',
    maxResults: 20,
    hasWebsite: '',
    useApollo:  false,
  });

  // ── Auto-update postal code based on city selection ───────────────────────
  useEffect(() => {
    if (filters.cities.length === 0) {
      setFilters(p => ({ ...p, postalCode: '' }));
    } else if (filters.cities.length === 1) {
      setFilters(p => ({ ...p, postalCode: postalCodeForCity(filters.cities[0]) }));
    }
  }, [filters.cities]);

  // ── Reset cities when region changes ─────────────────────────────────────
  useEffect(() => {
    setFilters(p => ({ ...p, cities: [], postalCode: '' }));
  }, [filters.region]);

  const availableCities = useMemo(() => citiesForRegion(filters.region), [filters.region]);

  const gateway = useMemo(() => axios.create({
    baseURL: (import.meta as any).env?.VITE_GATEWAY_BASE_URL || 'http://localhost:8081/api'
  }), []);

  const refreshLeadsFromDb = useCallback(async () => {
    try {
      const resp = await gateway.get('/leads');
      const rows: any[] = resp?.data ?? [];
      if (rows && rows.length) {
        try { console.debug('[GET /leads] sample keys:', Object.keys(rows[0] || {})); } catch {}
      }
      let mapped: Lead[] = rows.map(l => {
        const temp = String(l.temperature || '').toLowerCase();
        const status = temp === 'hot' || temp === 'warm' || temp === 'cold' ? temp : statusOf(Number(l.aiScore || 0));
        return {
          id: Number(l.id),
          name: '',
          company: l.companyName || '',
          role: '',
          email: pickField(l, ['email','emailAddress','email_address','contactEmail','contact_email','primaryEmail','leadEmail','decisionMakerEmail','dmEmail'], cleanStr),
          phone: pickField(l, ['phoneNumber','phone','telephone'], cleanStr),
          city: l.city || '',
          address: '',
          website: pickField(l, ['website','site','websiteUrl','url'], cleanStr),
          rating: l.googleRating != null ? String(l.googleRating) : '',
          reviewCount: l.googleReviews != null ? Number(l.googleReviews) : undefined,
          sector: l.secteurName || '—',
          score: l.aiScore != null ? Number(l.aiScore) : 0,
          status,
          linkedIn: pickField(l, ['linkedinUrl','linkedin','linkedin_url'], cleanStr),
          apolloEnriched: false,
        };
      });
      const needEmail = mapped.filter(l => !l.email).slice(0, 10);
      if (needEmail.length > 0) {
        const filled = await Promise.all(needEmail.map(async (ld) => {
          try {
            const r = await gateway.get(`/leads/${ld.id}`).catch(() => null);
            const d = r?.data || {};
            let em = cleanStr(
              d.email || d.emailAddress || d.email_address || d.contactEmail || d.contact_email || d.primaryEmail || d.leadEmail || d.decisionMakerEmail || d.dmEmail || ''
            );
            if (!em) {
              const ri = await gateway.get(`/interactions/lead/${ld.id}`).catch(() => null);
              const rowsI: any[] = ri?.data ?? [];
              const first = rowsI.find(r2 => String(r2.channel || r2.channel_type || '').toUpperCase() === 'EMAIL');
              em = cleanStr(first?.to_email || first?.toEmail || first?.email || first?.contactEmail || first?.contact_email || '');
            }
            return { id: ld.id, email: em };
          } catch {
            return { id: ld.id, email: '' };
          }
        }));
        if (filled.some(f => f.email)) {
          mapped = mapped.map(l => {
            const f = filled.find(x => x.id === l.id);
            return f && f.email ? { ...l, email: f.email } : l;
          });
        }
      }
      setLeads(mapped);
      if (view === 'scan') setView('leads');
      return mapped.length;
    } catch (err) {
      console.error('[GET /leads] failed', err);
      setLeads([]);
      if (!['crm','leads','messenger'].includes(view)) setView('scan');
      return 0;
    }
  }, [gateway, view, setView]);

  // ── Load prospects from DB on mount ────────────────────────────────────────
  useEffect(() => {
    refreshLeadsFromDb();
  }, []);

  useEffect(() => {
    const hydrateEmail = async () => {
      if (!selectedLead || selectedLead.email) return;
      try {
        // Try lead details endpoint first (some backends include email only here)
        const rLead = await gateway.get(`/leads/${selectedLead.id}`).catch(() => null);
        const d = rLead?.data;
        let foundEmail = cleanStr(
          d?.email ||
          d?.emailAddress ||
          d?.email_address ||
          d?.contactEmail ||
          d?.contact_email ||
          d?.primaryEmail ||
          d?.leadEmail ||
          d?.decisionMakerEmail ||
          d?.dmEmail ||
          ''
        );
        // Fallback: look into interactions for any email target
        if (!foundEmail) {
          const resp = await gateway.get(`/interactions/lead/${selectedLead.id}`).catch(() => null);
          const rows: any[] = resp?.data ?? [];
          const first = rows.find(r => (String(r.channel || r.channel_type || '').toUpperCase() === 'EMAIL'));
          foundEmail = cleanStr(
            first?.to_email ||
            first?.toEmail ||
            first?.email ||
            first?.contactEmail ||
            first?.contact_email ||
            ''
          );
        }
        if (foundEmail) {
          setSelectedLead(prev => prev ? { ...prev, email: foundEmail } : prev);
          setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, email: foundEmail } : l));
        }
      } catch {}
    };
    hydrateEmail();
  }, [selectedLead, gateway]);

  const toggleCity = (cityName: string) =>
    setFilters(p => ({
      ...p,
      cities: p.cities.includes(cityName)
        ? p.cities.filter(c => c !== cityName)
        : [...p.cities, cityName],
    }));

  const emailTemplate = {
    subject: 'Collaboration digitale — {{company}}',
    body: 'Bonjour,\n\nJ\'ai découvert {{company}}. Seriez-vous disponible pour un échange de 15 minutes ?\n\nCordialement,\nAbderrahim\nELBAHI.NET',
  };

  const applyTemplate = useCallback((lead: Lead) => {
    const vars: Record<string, string> = {
      '{{firstName}}': lead.name.split(' ')[0],
      '{{company}}':   lead.company,
      '{{sector}}':    lead.sector,
      '{{city}}':      lead.city,
    };
    let s = emailTemplate.subject, b = emailTemplate.body;
    Object.entries(vars).forEach(([k, v]) => { s = s.split(k).join(v); b = b.split(k).join(v); });
    return { subject: s, body: b };
  }, []);

  // ── Fetch real results from backend with polling ──────────────────────────
  // Spring's ScanController starts async processing and returns job_id immediately.
  // We poll GET /lead_agent/results/{jobId} until status is done or results arrive.
  const fetchRealPlaces = async (
    jobId: string,
    city: string,
    maxAttempts = 30,   // 30 × 2s = 60s max wait
    intervalMs  = 2000,
  ): Promise<RawPlace[]> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(r => setTimeout(r, intervalMs));
      try {
        const res  = await gateway.get(`/lead_agent/results/${jobId}`);
        const data = res?.data;

        const isDone    = data?.status === 'done' || data?.status === 'completed' || data?.status === 'DONE' || data?.status === 'COMPLETED';
        const hasResult = Array.isArray(data?.results) && data.results.length > 0;
        const hasLeads  = Array.isArray(data?.leads)   && data.leads.length   > 0;

        if (isDone || hasResult || hasLeads) {
          const raw: any[] = data?.results ?? data?.leads ?? [];
          return raw.map((item: any): RawPlace => ({
            name:        item.name          ?? item.business_name  ?? item.businessName  ?? '',
            address:     item.address       ?? item.location       ?? city,
            phone:       item.phone         ?? item.telephone      ?? item.phoneNumber   ?? '',
            website:     item.website       ?? item.url            ?? item.websiteUrl    ?? '',
            rating:      String(item.rating ?? item.google_rating  ?? item.googleRating  ?? '0'),
            reviewCount: Number(item.review_count ?? item.reviews_count ?? item.reviewCount ?? 0),
            ownerName:   item.owner_name    ?? item.contact_name   ?? item.ownerName     ?? item.contact ?? '—',
            ownerRole:   item.owner_role    ?? item.job_title      ?? item.ownerRole     ?? 'Responsable',
            email:       item.email         ?? item.contact_email  ?? item.contactEmail  ?? '',
            city,
            isOpen:      item.is_open       ?? item.isOpen         ?? true,
            linkedIn:    item.linkedin      ?? item.linkedin_url   ?? item.linkedinUrl   ?? '',
            apolloScore: Number(item.apollo_score ?? item.apolloScore ?? 0),
          }));
        }
        // status pending/running/PROCESSING → keep polling
      } catch (e: any) {
        // 404 means job not ready yet — keep polling
        if (e?.response?.status !== 404) {
          // unexpected error — stop polling
          break;
        }
      }
    }
    return []; // timed out or error
  };

  // ── Scan ───────────────────────────────────────────────────────────────────
  const handleScan = async () => {
    if (!filters.sectors.length) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanLog([]);
    setScanStep(0);

    const all: Lead[] = [];
    const targetCities = filters.cities.length ? filters.cities : ['Casablanca'];
    const total = filters.sectors.length * targetCities.length;
    let step = 0;

    setScanLog(['Système initialisé']);
    await new Promise(r => setTimeout(r, 400));
    setScanStep(1);
    setScanLog(p => [...p, filters.useApollo
      ? 'Connexion Google Places + Apollo.io...'
      : 'Connexion Google Places API...']);
    await new Promise(r => setTimeout(r, 300));

    for (const sector of filters.sectors) {
      for (const city of targetCities) {
        step++;
        setScanPhase(`${sector} — ${city}`);
        setScanProgress(Math.round((step / total) * 70));
        setScanLog(p => [...p.slice(-6), `Scan ${sector} à ${city}...`]);

        let jobId = '';

        // ── POST /lead_agent/start ────────────────────────────────────────
        // Confirmed API: POST http://localhost:8082/api/lead_agent/start
        // Body: { city, category, max_results }
        try {
          const resp = await gateway.post('/lead_agent/start', {
            city,
            category:    sector,
            max_results: filters.maxResults,
          }, {
            headers: { 'Content-Type': 'application/json' },
          });
          jobId = resp?.data?.job_id ?? resp?.data?.jobId ?? '';
          setScanLog(p => [...p.slice(-6), jobId
            ? `Job démarré (${jobId})`
            : 'Job démarré — en attente des résultats...']);
        } catch (err: any) {
          const status   = err?.response?.status ?? '?';
          const respData = err?.response?.data;
          console.error('[lead_agent/start] HTTP', status);
          console.error('[lead_agent/start] response:', respData);
          const detail = typeof respData === 'string'
            ? respData
            : respData?.message ?? respData?.error ?? JSON.stringify(respData) ?? err?.message ?? 'Voir console';
          setScanLog(p => [...p.slice(-6), `Erreur ${status}: ${detail}`]);
          continue;
        }

        // ── Poll for results ──────────────────────────────────────────────
        setScanLog(p => [...p.slice(-6), `Récupération des résultats...`]);
        let places: RawPlace[] = await fetchRealPlaces(jobId, city);

        if (places.length === 0) {
          setScanLog(p => [...p.slice(-6), `Aucun résultat pour ${sector} à ${city}`]);
          continue;
        }

        // ── Apply hasWebsite filter ───────────────────────────────────────
        if (filters.hasWebsite === 'yes') places = places.filter(p => p.website);
        if (filters.hasWebsite === 'no')  places = places.filter(p => !p.website);
        places = places.slice(0, filters.maxResults);

        setScanLog(p => [...p.slice(-6), `${places.length} établissements trouvés à ${city}`]);

        if (filters.useApollo) {
          setScanLog(p => [...p.slice(-6), `Apollo: ${places.length} contacts enrichis`]);
        }

        // ── Map to Lead objects ───────────────────────────────────────────
        for (const pl of places) {
          const score = calcScore(pl, filters.useApollo);
          all.push({
            id:             Date.now() + Math.random() * 9999,
            name:           pl.ownerName,
            company:        pl.name,
            role:           pl.ownerRole,
            email:          pl.email,
            phone:          pl.phone,
            city:           pl.city,
            address:        pl.address,
            website:        pl.website,
            rating:         pl.rating,
            reviewCount:    pl.reviewCount,
            sector,
            score,
            status:         statusOf(score),
            linkedIn:       filters.useApollo ? pl.linkedIn : '',
            apolloEnriched: filters.useApollo,
          });
        }
      }
    }

    setScanStep(2);
    setScanLog(p => [...p.slice(-6), 'Analyse IA et scoring...']);
    setScanProgress(88);
    await new Promise(r => setTimeout(r, 500));

    setScanStep(3);
    setScanLog(p => [...p.slice(-6), 'Déduplication & tri...']);
    setScanProgress(96);
    await new Promise(r => setTimeout(r, 300));

    const unique = all
      .filter((l, i, a) => a.findIndex(x => x.company === l.company) === i)
      .sort((a, b) => b.score - a.score);

    setScanLog(p => [...p.slice(-6), `${unique.length} prospects qualifiés !`]);
    setScanProgress(100);

    setScanHistory(p => [...p, {
      date:     new Date().toLocaleString('fr-MA'),
      count:    unique.length,
      avgScore: unique.length
        ? Math.round(unique.reduce((s, l) => s + l.score, 0) / unique.length)
        : 0,
      apollo: filters.useApollo,
    }]);

    await new Promise(r => setTimeout(r, 1200));
    const count = await refreshLeadsFromDb();
    if (count === 0 && unique.length > 0) {
      setLeads(unique);
    }
    setIsScanning(false);
    setView('leads');
  };

  // ── Filtered leads ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = [...leads];
    if (filterStatus !== 'all') r = r.filter(l => l.status === filterStatus);
    if (filterSector  !== 'all') r = r.filter(l => l.sector  === filterSector);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      r = r.filter(l =>
        l.company.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q)
      );
    }
    r.sort((a, b) =>
      sortBy === 'score' ? b.score - a.score :
      sortBy === 'name'  ? a.company.localeCompare(b.company) :
                           a.city.localeCompare(b.city)
    );
    return r;
  }, [leads, filterStatus, filterSector, searchQuery, sortBy]);

  const totalPages    = Math.ceil(filtered.length / LEADS_PER_PAGE);
  const paginated     = filtered.slice((currentPage - 1) * LEADS_PER_PAGE, currentPage * LEADS_PER_PAGE);
  const uniqueSectors = useMemo(() => [...new Set(leads.map(l => l.sector))], [leads]);
  const dashboardStats = useMemo(() => {
    const total = leads.length;
    const hot   = leads.filter(l => l.status === 'hot').length;
    const warm  = leads.filter(l => l.status === 'warm').length;
    const cold  = leads.filter(l => l.status === 'cold').length;
    const avg   = total ? Math.round(leads.reduce((s, l) => s + l.score, 0) / total) : 0;
    const bySector = Object.entries(
      leads.reduce<Record<string, number>>((acc, l) => {
        acc[l.sector] = (acc[l.sector] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const byCity = Object.entries(
      leads.reduce<Record<string, number>>((acc, l) => {
        acc[l.city] = (acc[l.city] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return { total, hot, warm, cold, avg, bySector, byCity };
  }, [leads]);

  // ── CSV export ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = 'Entreprise,Contact,Rôle,Email,Téléphone,Ville,Secteur,Score,Statut,Site web,LinkedIn';
    const rows = filtered.map(l =>
      [l.company, l.name, l.role, l.email, l.phone, l.city, l.sector, l.score,
       STATUS[l.status]?.label, l.website || '', l.linkedIn || '']
        .map(v => `"${v}"`)
        .join(',')
    );
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'prospects.csv';
    a.click();
  };

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="grid gap-5 lg:gap-7">

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-1.5">
          <nav className="flex items-center gap-1">
            {([
              { k: 'dashboard' as const, label: 'Dashboard', fa: 'fa-solid fa-chart-pie' },
              { k: 'scan'  as const, label: 'Scan',      fa: 'fa-solid fa-satellite-dish' },
              { k: 'leads' as const, label: 'Prospects', fa: 'fa-solid fa-users'          },
              { k: 'crm' as const, label: 'Crm', fa: 'fa-solid fa-address-card' },
              { k: 'messenger' as const, label: 'Interactions', fa: 'fa-solid fa-comments' },
              { k: 'templates'  as const, label: 'Templates',    fa: 'fa-solid fa-envelope-open-text' },
              { k: 'edit' as const, label: 'Edit Test', fa: 'fa-solid fa-pen-to-square' },
                
            ]).map(tab => (
              <button
                key={tab.k}
                onClick={() => setView(tab.k)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  view === tab.k
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                )}
              >
                <Fa icon={tab.fa} className="text-[13px]" />
                {tab.label}
                {tab.k === 'leads' && leads.length > 0 && (
                  <span className="rounded-full bg-teal-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                    {leads.length}
                  </span>
                )}
                {/* count badge removed for interactions to avoid using local storage */}
              </button>
            ))}
          </nav>
        </CardContent>
      </Card>

      {view === 'dashboard' && (
        <LeadsDashboard
          leads={leads as any}
          scanHistory={scanHistory as any}
          sectorIcon={(s) => SECTORS[s]?.faIcon || 'fa-solid fa-tag'}
          onGoScan={() => setView('scan')}
        />
      )}

      {view === 'messenger' && (
        <LeadMessanger
          leads={leads.map(l => ({ id: l.id, company: l.company, name: l.name, city: l.city, sector: l.sector, email: l.email, phone: l.phone }))}
          composeForLeadId={composeForLeadId ?? undefined}
        />
      )}

      {view === 'crm' && (
        <div className="max-w-[1100px] mx-auto">
          <CRM
            leads={leads.map(l => ({
              id: l.id,
              name: l.name,
              company: l.company,
              role: l.role,
              email: l.email,
              phone: l.phone,
              city: l.city,
              sector: l.sector,
              score: l.score,
              status: l.status,
              website: l.website,
              linkedin: l.linkedIn,
              enriched: l.apolloEnriched,
            })) as any}
          />
        </div>
      )}

      {view === 'templates' && (
        <MessageSequenceTemplatesView />
      )}

      {view === 'edit' && (
        <LeadEditView
          leadId={288}
          onClose={() => setView('leads')}
          onSaved={refreshLeadsFromDb}
        />
      )}

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
                        onClick={() => setFilters(p => ({
                          ...p,
                          sectors: sel
                            ? p.sectors.filter(s => s !== sector)
                            : [...p.sectors, sector],
                        }))}
                        className={cn(
                          'group relative flex flex-col items-center gap-2 rounded-xl border px-2 py-3.5 text-center transition-all duration-150',
                          sel
                            ? 'border-slate-900 bg-slate-900 shadow-md'
                            : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm'
                        )}
                      >
                        {sel && (
                          <div className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-teal-500 shadow-sm">
                            <Fa icon="fa-solid fa-check" className="text-[8px] text-white" />
                          </div>
                        )}
                        <Fa icon={info.faIcon} className={cn('text-base', sel ? 'text-white' : 'text-slate-500')} />
                        <span className={cn('text-[10px] font-medium leading-tight', sel ? 'text-slate-200' : 'text-slate-500')}>
                          {sector}
                        </span>
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
                        <button
                          onClick={() => setFilters(p => ({ ...p, sectors: p.sectors.filter(x => x !== s) }))}
                          className="ml-0.5 flex size-3.5 items-center justify-center rounded-full bg-slate-300 text-slate-600 hover:bg-slate-400"
                        >
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

                {/* Région */}
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    <Fa icon="fa-solid fa-map" className="text-[10px]" /> Région
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                    {Object.keys(MOROCCAN_REGIONS).map(region => {
                      const sel = filters.region === region;
                      return (
                        <button
                          key={region}
                          onClick={() => setFilters(p => ({ ...p, region: sel ? '' : region }))}
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left text-[11px] font-medium transition-all',
                            sel
                              ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700'
                          )}
                        >
                          {sel && <Fa icon="fa-solid fa-circle-dot" className="shrink-0 text-[8px] text-teal-400" />}
                          <span className="truncate">{region}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Villes */}
                {filters.region && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition-all">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                        <Fa icon="fa-solid fa-city" className="text-[10px]" />
                        Villes de {filters.region}
                      </label>
                      <div className="flex items-center gap-2">
                        {filters.cities.length > 0 && (
                          <span className="rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            {filters.cities.length} sélectionnée{filters.cities.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {filters.cities.length > 0 && (
                          <button
                            onClick={() => setFilters(p => ({ ...p, cities: [] }))}
                            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Fa icon="fa-solid fa-xmark" className="text-[9px]" /> Tout désélectionner
                          </button>
                        )}
                        {filters.cities.length < availableCities.length && (
                          <button
                            onClick={() => setFilters(p => ({ ...p, cities: availableCities.map(c => c.name) }))}
                            className="flex items-center gap-1 text-[10px] text-teal-600 hover:text-teal-800 transition-colors"
                          >
                            <Fa icon="fa-solid fa-check-double" className="text-[9px]" /> Tout sélectionner
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      {availableCities.map(c => {
                        const sel = filters.cities.includes(c.name);
                        return (
                          <button
                            key={c.name}
                            onClick={() => toggleCity(c.name)}
                            className={cn(
                              'relative flex flex-col rounded-lg border px-3 py-2 text-left transition-all',
                              sel
                                ? 'border-teal-500 bg-teal-500 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                            )}
                          >
                            {sel && (
                              <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-teal-700 shadow-sm">
                                <Fa icon="fa-solid fa-check" className="text-[7px] text-white" />
                              </span>
                            )}
                            <span className={cn('text-[12px] font-semibold', sel ? 'text-white' : 'text-slate-700')}>{c.name}</span>
                            <span className={cn('flex items-center gap-1 text-[10px] font-mono mt-0.5', sel ? 'text-teal-100' : 'text-slate-400')}>
                              <Fa icon="fa-solid fa-hashtag" className="text-[8px]" />
                              {c.postalCode}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {filters.cities.length === 0 && (
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                        <Fa icon="fa-solid fa-circle-info" className="text-[10px]" />
                        Sélectionnez une ou plusieurs villes — multi-sélection possible
                      </p>
                    )}
                    {filters.cities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {filters.cities.map(cn_ => (
                          <span key={cn_} className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                            {cn_}
                            <button
                              onClick={() => toggleCity(cn_)}
                              className="ml-0.5 flex size-3 items-center justify-center rounded-full bg-teal-300 hover:bg-teal-400 transition-colors"
                            >
                              <Fa icon="fa-solid fa-xmark" className="text-[7px] text-teal-800" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Autres filtres */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className={cn(filters.cities.length > 1 ? 'col-span-2 sm:col-span-3' : '')}>
                    <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      <Fa icon="fa-solid fa-mailbox" className="text-[10px]" /> Code postal
                    </label>
                    {filters.cities.length <= 1 && (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="ex. 20000"
                          value={filters.postalCode}
                          onChange={e => setFilters(p => ({ ...p, postalCode: e.target.value }))}
                          className={cn(
                            'w-full rounded-lg border px-3 py-2 pr-8 text-sm focus:outline-none',
                            filters.postalCode
                              ? 'border-teal-300 bg-teal-50 text-teal-800 focus:border-teal-500'
                              : 'border-slate-200 bg-white text-slate-700 focus:border-slate-400'
                          )}
                        />
                        {filters.postalCode && (
                          <Fa icon="fa-solid fa-circle-check" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-teal-500" />
                        )}
                        {filters.cities.length === 1 && filters.postalCode && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-teal-600">
                            <Fa icon="fa-solid fa-bolt" className="text-[9px]" /> Auto-rempli · {filters.cities[0]}
                          </p>
                        )}
                      </div>
                    )}
                    {filters.cities.length > 1 && (
                      <div className="flex flex-wrap gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2">
                        {filters.cities.map(cityName => (
                          <span key={cityName} className="inline-flex items-center gap-1.5 rounded-md bg-white border border-teal-200 px-2 py-1 text-[11px] font-medium text-teal-800 shadow-sm">
                            <Fa icon="fa-solid fa-hashtag" className="text-[9px] text-teal-400" />
                            <span className="font-semibold">{postalCodeForCity(cityName)}</span>
                            <span className="text-teal-500">·</span>
                            <span className="text-slate-500">{cityName}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      <Fa icon="fa-solid fa-list-ol" className="text-[10px]" /> Max résultats
                    </label>
                    <select
                      value={filters.maxResults}
                      onChange={e => setFilters(p => ({ ...p, maxResults: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                    >
                      {[10, 20, 30, 50, 60].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      <Fa icon="fa-solid fa-globe" className="text-[10px]" /> Site web
                    </label>
                    <select
                      value={filters.hasWebsite}
                      onChange={e => setFilters(p => ({ ...p, hasWebsite: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                    >
                      <option value="">Tous</option>
                      <option value="yes">Avec site</option>
                      <option value="no">Sans site</option>
                    </select>
                  </div>
                </div>

                {/* Apollo Toggle */}
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    <Fa icon="fa-solid fa-wand-magic-sparkles" className="text-[10px]" /> Enrichissement
                  </label>
                  <Toggle
                    value={filters.useApollo}
                    onChange={v => setFilters(p => ({ ...p, useApollo: v }))}
                    icon="fa-solid fa-rocket"
                    label="Enrichissement Apollo.io"
                    sublabel={filters.useApollo
                      ? 'Actif — LinkedIn, email pro, score boosté'
                      : 'Inactif — données Google Places uniquement'}
                  />
                  {filters.useApollo && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
                      <Fa icon="fa-solid fa-circle-info" className="shrink-0 text-[11px] text-indigo-400" />
                      <p className="text-[11px] text-indigo-600">
                        Apollo enrichira chaque contact avec profil LinkedIn, email professionnel vérifié et données firmographiques.
                      </p>
                    </div>
                  )}
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
                      { fa: 'fa-solid fa-layer-group', label: 'Secteurs',    val: filters.sectors.join(', ') },
                      { fa: 'fa-solid fa-map',          label: 'Région',      val: filters.region || '—' },
                      { fa: 'fa-solid fa-city',         label: 'Villes',      val: filters.cities.length ? filters.cities.join(', ') : 'Casablanca' },
                      { fa: 'fa-solid fa-mailbox',      label: 'Code postal', val: filters.cities.length > 1 ? filters.cities.map(c => postalCodeForCity(c)).join(', ') : (filters.postalCode || '—') },
                      { fa: 'fa-solid fa-sliders',      label: 'Max / ville', val: `${filters.maxResults} résultats` },
                      { fa: 'fa-solid fa-rocket',       label: 'Apollo',      val: filters.useApollo ? 'Oui ✓' : 'Non' },
                    ].map(row => (
                      <div key={row.label} className="flex items-start gap-2 text-sm">
                        <Fa icon={row.fa} className={cn(
                          'mt-0.5 w-4 shrink-0 text-center text-[12px]',
                          row.label === 'Apollo' && filters.useApollo ? 'text-indigo-400' : 'text-slate-400'
                        )} />
                        <span className="text-[11px] text-slate-400 w-20 shrink-0">{row.label}</span>
                        <span className={cn('font-medium text-[12px]', row.label === 'Apollo' && filters.useApollo ? 'text-indigo-600' : 'text-slate-700')}>
                          {row.val}
                        </span>
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
                        ? `${filters.sectors.length} secteur(s) · ${filters.cities.length > 1 ? `${filters.cities.length} villes` : (filters.cities[0] || 'Casablanca')}${filters.useApollo ? ' · Apollo ✓' : ''}`
                        : 'Sélectionnez des secteurs'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {filters.useApollo && !isScanning && (
                    <span className="flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      <Fa icon="fa-solid fa-rocket" className="text-[8px]" /> Apollo
                    </span>
                  )}
                  <Fa icon={isScanning ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-rocket'} className="text-xl text-white" />
                </div>
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
                        <span className="mr-1.5 text-slate-700">
                          {new Date().toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
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
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            {h.count} prospects
                            {h.apollo && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600">
                                <Fa icon="fa-solid fa-rocket" className="text-[7px]" /> Apollo
                              </span>
                            )}
                          </p>
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
                <button
                  onClick={() => setView('scan')}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  <Fa icon="fa-solid fa-satellite-dish" /> Aller au scan
                </button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* KPI strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { fa: 'fa-solid fa-users',            label: 'Total',     sub: 'prospects',    val: leads.length,                                                                color: 'text-slate-800' },
                  { fa: 'fa-solid fa-fire',              label: 'Chauds',    sub: 'prioritaires', val: leads.filter(l => l.status === 'hot').length,                               color: 'text-red-600'   },
                  { fa: 'fa-solid fa-temperature-half', label: 'Tièdes',    sub: 'à relancer',   val: leads.filter(l => l.status === 'warm').length,                              color: 'text-amber-600' },
                  { fa: 'fa-solid fa-chart-simple',     label: 'Score moy', sub: '/ 100',        val: leads.length ? Math.round(leads.reduce((s,l)=>s+l.score,0)/leads.length):0, color: 'text-teal-600'  },
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

              {/* Apollo banner */}
              {leads.some(l => l.apolloEnriched) && (
                <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                  <Fa icon="fa-solid fa-rocket" className="text-indigo-500" />
                  <p className="text-sm text-indigo-700">
                    <span className="font-bold">{leads.filter(l => l.apolloEnriched).length} prospects</span> enrichis via Apollo.io — LinkedIn et emails vérifiés disponibles.
                  </p>
                </div>
              )}

              {/* Toolbar */}
              <Card>
                <CardContent className="flex flex-wrap items-center gap-3 py-3">
                  <div className="relative min-w-48 flex-1">
                    <Fa icon="fa-solid fa-magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[12px]" />
                    <input
                      type="text"
                      placeholder="Rechercher entreprise, contact, ville..."
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                    {[
                      { k: 'all',  l: 'Tous',   fa: 'fa-solid fa-border-all'       },
                      { k: 'hot',  l: 'Chauds', fa: 'fa-solid fa-fire'             },
                      { k: 'warm', l: 'Tièdes', fa: 'fa-solid fa-temperature-half' },
                      { k: 'cold', l: 'Froids', fa: 'fa-solid fa-snowflake'        },
                    ].map(o => (
                      <button
                        key={o.k}
                        onClick={() => { setFilterStatus(o.k); setCurrentPage(1); }}
                        className={cn(
                          'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                          filterStatus === o.k ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        <Fa icon={o.fa} className="text-[10px]" />{o.l}
                      </button>
                    ))}
                  </div>
                  <select
                    value={filterSector}
                    onChange={e => { setFilterSector(e.target.value); setCurrentPage(1); }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                  >
                    <option value="all">Tous secteurs</option>
                    {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as 'score' | 'name' | 'city')}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                  >
                    <option value="score">Trier: Score</option>
                    <option value="name">Trier: Nom</option>
                    <option value="city">Trier: Ville</option>
                  </select>
                  <button
                    onClick={exportCSV}
                    className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
                  >
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
                          <tr
                            key={l.id}
                            onClick={() => setSelectedLead(l)}
                            className="cursor-pointer transition-colors hover:bg-slate-50/60"
                          >
                            <td className="px-4 py-3 max-w-[180px]">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="relative flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                                  <Fa icon={SECTORS[l.sector]?.faIcon || 'fa-solid fa-building'} className="text-[12px] text-slate-500" />
                                  {l.apolloEnriched && (
                                    <span className="absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full bg-indigo-500">
                                      <Fa icon="fa-solid fa-rocket" className="text-[5px] text-white" />
                                    </span>
                                  )}
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
                              <p className="flex items-center gap-1.5 font-medium text-slate-700">{l.name}</p>
                              <p className="text-[11px] text-slate-400">{l.role}</p>
                              <p className="mt-0.5 flex items-center gap-1.5 text-[14px] text-slate-500">
                                <Fa icon="" className="text-[9px]" />
                                <span className="truncate max-w-[120px]">{l.phone || '—'}</span>
                              </p>
                              {l.linkedIn && (
                                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-indigo-500">
                                  <Fa icon="fa-brands fa-linkedin" className="text-[9px]" />
                                  <span className="truncate max-w-[120px]">{l.linkedIn}</span>
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                <Fa icon={SECTORS[l.sector]?.faIcon || 'fa-solid fa-building'} className="text-[10px]" />
                                {l.sector}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 text-sm text-slate-500">{l.city}</span>
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
                              <button
                                onClick={e => { e.stopPropagation(); setSelectedLead(l); }}
                                className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-slate-400 hover:text-slate-700"
                              >
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
                    <p className="text-sm text-slate-400">
                      {(currentPage - 1) * LEADS_PER_PAGE + 1}–{Math.min(currentPage * LEADS_PER_PAGE, filtered.length)} sur {filtered.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-400 disabled:opacity-40"
                      >
                        <Fa icon="fa-solid fa-chevron-left" className="text-[10px]" />
                      </button>
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        const page = totalPages <= 7 ? i + 1 : currentPage <= 4 ? i + 1 : currentPage >= totalPages - 3 ? totalPages - 6 + i : currentPage - 3 + i;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              'flex size-8 items-center justify-center rounded-lg text-sm font-medium transition',
                              currentPage === page ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-500 hover:border-slate-400'
                            )}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-400 disabled:opacity-40"
                      >
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedLead(null)}
        >
          <Card className="max-h-[90vh] w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="relative flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                    <Fa icon={SECTORS[selectedLead.sector]?.faIcon || 'fa-solid fa-building'} className="text-lg text-slate-600" />
                    {selectedLead.apolloEnriched && (
                      <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-indigo-500 shadow">
                        <Fa icon="fa-solid fa-rocket" className="text-[8px] text-white" />
                      </span>
                    )}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900">{selectedLead.name}</h3>
                    <p className="text-sm text-slate-500">{selectedLead.role} — {selectedLead.company}</p>
                    {selectedLead.apolloEnriched && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                        <Fa icon="fa-solid fa-rocket" className="text-[8px]" /> Enrichi Apollo
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('flex size-9 items-center justify-center rounded-lg border text-sm font-bold', scoreMeta(selectedLead.score).bg, scoreMeta(selectedLead.score).t)}>
                    {selectedLead.score}
                  </span>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                  >
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
                  { fa: 'fa-solid fa-building',     label: 'Entreprise', val: selectedLead.company },
                  { fa: 'fa-solid fa-tag',           label: 'Secteur',   val: selectedLead.sector  },
                  { fa: 'fa-solid fa-location-dot', label: 'Adresse',   val: selectedLead.address || selectedLead.city },
                  { fa: 'fa-solid fa-envelope',      label: 'Email',     val: selectedLead.email   },
                  { fa: 'fa-solid fa-phone',         label: 'Tél.',      val: selectedLead.phone || '—' },
                  { fa: 'fa-solid fa-globe',         label: 'Site web',  val: selectedLead.website || 'Aucun site web' },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
                    <Fa icon={row.fa} className="w-4 shrink-0 text-center text-[12px] text-slate-400" />
                    <span className="w-20 shrink-0 text-[11px] text-slate-400">{row.label}</span>
                    <span className="min-w-0 truncate font-medium text-slate-800">{row.val}</span>
                  </div>
                ))}
                {selectedLead.linkedIn && (
                  <div className="flex items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2.5 text-sm">
                    <Fa icon="fa-brands fa-linkedin" className="w-4 shrink-0 text-center text-[12px] text-indigo-500" />
                    <span className="w-20 shrink-0 text-[11px] text-indigo-400">LinkedIn</span>
                    <span className="min-w-0 truncate font-medium text-indigo-700">{selectedLead.linkedIn}</span>
                  </div>
                )}
                {selectedLead.rating && (
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
                    <Fa icon="fa-solid fa-star" className="w-4 shrink-0 text-center text-[12px] text-amber-400" />
                    <span className="w-20 shrink-0 text-[11px] text-slate-400">Google</span>
                    <span className="font-medium text-slate-800">{selectedLead.rating} ★ · {selectedLead.reviewCount} avis</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setComposeForLeadId(selectedLead.id);
                    setView('messenger');
                    setSelectedLead(null);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  <Fa icon="fa-solid fa-paper-plane" /> Envoyer propositions
                </button>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400"
                >
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

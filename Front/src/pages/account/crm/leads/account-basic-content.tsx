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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadsDashboard } from './leads-dashboard';
import { useLocation } from 'react-router-dom';
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
      { name: 'Marrakech',            postalCode: '40000' },
      { name: 'Safi',                 postalCode: '46000' },
      { name: 'Essaouira',            postalCode: '44000' },
      { name: 'El Kelaa des Sraghna', postalCode: '43000' },
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
      { name: 'Tanger',      postalCode: '90000' },
      { name: 'Tétouan',     postalCode: '93000' },
      { name: 'Al Hoceima',  postalCode: '32000' },
      { name: 'Larache',     postalCode: '92000' },
      { name: 'Chefchaouen', postalCode: '91000' },
    ],
  },
  'Souss-Massa': {
    cities: [
      { name: 'Agadir',    postalCode: '80000' },
      { name: 'Inezgane',  postalCode: '80350' },
      { name: 'Tiznit',    postalCode: '85000' },
      { name: 'Taroudant', postalCode: '83000' },
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

const citiesForRegion = (region: string) =>
  region ? (MOROCCAN_REGIONS[region]?.cities ?? []) : [];

const postalCodeForCity = (cityName: string): string => {
  for (const region of Object.values(MOROCCAN_REGIONS)) {
    const found = region.cities.find(c => c.name === cityName);
    if (found) return found.postalCode;
  }
  return '';
};

function cleanStr(v?: string): string {
  return String(v || '').replace(/`/g, '').replace(/\s+/g, ' ').trim();
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

// ── Sectors ───────────────────────────────────────────────────────────────────
const SECTORS: Record<string, {
  faIcon: string;
  googleType: string;
  iconColor: string;
  iconBg: string;
  pillBg: string;
  pillText: string;
  selectedBg: string;
  selectedBorder: string;
  activeGradient: string;
  color: string;
  bg: string;
  border: string;
}> = {
  Restauration:    { faIcon: 'fa-solid fa-utensils',      googleType: 'restaurant',         iconColor: 'text-orange-500',   iconBg: 'bg-orange-50',   pillBg: 'bg-orange-100',  pillText: 'text-orange-800',  selectedBg: 'bg-orange-600',   selectedBorder: 'border-orange-600',   color: 'text-orange-600',  bg: 'bg-orange-50',   border: 'border-orange-200',  activeGradient: 'from-orange-500 to-orange-600'   },
  Hôtellerie:      { faIcon: 'fa-solid fa-hotel',          googleType: 'lodging',            iconColor: 'text-yellow-500',   iconBg: 'bg-yellow-50',   pillBg: 'bg-yellow-100',  pillText: 'text-yellow-800',  selectedBg: 'bg-yellow-500',   selectedBorder: 'border-yellow-500',   color: 'text-yellow-600',  bg: 'bg-yellow-50',   border: 'border-yellow-200',  activeGradient: 'from-yellow-400 to-yellow-500'   },
  Immobilier:      { faIcon: 'fa-solid fa-house-chimney',  googleType: 'real_estate_agency', iconColor: 'text-teal-600',     iconBg: 'bg-teal-50',     pillBg: 'bg-teal-100',    pillText: 'text-teal-800',    selectedBg: 'bg-teal-600',     selectedBorder: 'border-teal-600',     color: 'text-teal-600',    bg: 'bg-teal-50',     border: 'border-teal-200',    activeGradient: 'from-teal-500 to-teal-600'       },
  Santé:           { faIcon: 'fa-solid fa-stethoscope',    googleType: 'doctor',             iconColor: 'text-rose-500',     iconBg: 'bg-rose-50',     pillBg: 'bg-rose-100',    pillText: 'text-rose-800',    selectedBg: 'bg-rose-600',     selectedBorder: 'border-rose-600',     color: 'text-rose-600',    bg: 'bg-rose-50',     border: 'border-rose-200',    activeGradient: 'from-rose-500 to-rose-600'       },
  Éducation:       { faIcon: 'fa-solid fa-graduation-cap', googleType: 'school',             iconColor: 'text-indigo-500',   iconBg: 'bg-indigo-50',   pillBg: 'bg-indigo-100',  pillText: 'text-indigo-800',  selectedBg: 'bg-indigo-600',   selectedBorder: 'border-indigo-600',   color: 'text-indigo-600',  bg: 'bg-indigo-50',   border: 'border-indigo-200',  activeGradient: 'from-indigo-500 to-indigo-600'   },
  'Tech / IT':     { faIcon: 'fa-solid fa-microchip',      googleType: 'electronics_store',  iconColor: 'text-violet-500',   iconBg: 'bg-violet-50',   pillBg: 'bg-violet-100',  pillText: 'text-violet-800',  selectedBg: 'bg-[rgb(15,23,42)]',   selectedBorder: 'border-[rgb(15,23,42)]',   color: 'text-[rgb(15,23,42)]',  bg: 'bg-violet-50',   border: 'border-violet-200',  activeGradient: 'from-violet-500 to-[rgb(15,23,42)]'   },
  Commerce:        { faIcon: 'fa-solid fa-bag-shopping',   googleType: 'store',              iconColor: 'text-pink-500',     iconBg: 'bg-pink-50',     pillBg: 'bg-pink-100',    pillText: 'text-pink-800',    selectedBg: 'bg-pink-600',     selectedBorder: 'border-pink-600',     color: 'text-pink-600',    bg: 'bg-pink-50',     border: 'border-pink-200',    activeGradient: 'from-pink-500 to-pink-600'       },
  Automobile:      { faIcon: 'fa-solid fa-car',            googleType: 'car_repair',         iconColor: 'text-sky-500',      iconBg: 'bg-sky-50',      pillBg: 'bg-sky-100',     pillText: 'text-sky-800',     selectedBg: 'bg-sky-600',      selectedBorder: 'border-sky-600',      color: 'text-sky-600',     bg: 'bg-sky-50',      border: 'border-sky-200',     activeGradient: 'from-sky-500 to-sky-600'         },
  Beauté:          { faIcon: 'fa-solid fa-scissors',       googleType: 'beauty_salon',       iconColor: 'text-fuchsia-500',  iconBg: 'bg-fuchsia-50',  pillBg: 'bg-fuchsia-100', pillText: 'text-fuchsia-800', selectedBg: 'bg-fuchsia-600',  selectedBorder: 'border-fuchsia-600',  color: 'text-fuchsia-600', bg: 'bg-fuchsia-50',  border: 'border-fuchsia-200', activeGradient: 'from-fuchsia-500 to-fuchsia-600' },
  Juridique:       { faIcon: 'fa-solid fa-scale-balanced', googleType: 'lawyer',             iconColor: 'text-amber-600',    iconBg: 'bg-amber-50',    pillBg: 'bg-amber-100',   pillText: 'text-amber-800',   selectedBg: 'bg-amber-600',    selectedBorder: 'border-amber-600',    color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200',   activeGradient: 'from-amber-500 to-amber-600'     },
  BTP:             { faIcon: 'fa-solid fa-helmet-safety',  googleType: 'general_contractor', iconColor: 'text-lime-600',     iconBg: 'bg-lime-50',     pillBg: 'bg-lime-100',    pillText: 'text-lime-800',    selectedBg: 'bg-lime-600',     selectedBorder: 'border-lime-600',     color: 'text-lime-600',    bg: 'bg-lime-50',     border: 'border-lime-200',    activeGradient: 'from-lime-500 to-lime-600'       },
  Transport:       { faIcon: 'fa-solid fa-truck',          googleType: 'moving_company',     iconColor: 'text-cyan-500',     iconBg: 'bg-cyan-50',     pillBg: 'bg-cyan-100',    pillText: 'text-cyan-800',    selectedBg: 'bg-cyan-600',     selectedBorder: 'border-cyan-600',     color: 'text-cyan-600',    bg: 'bg-cyan-50',     border: 'border-cyan-200',    activeGradient: 'from-cyan-500 to-cyan-600'       },
  Tourisme:        { faIcon: 'fa-solid fa-plane',          googleType: 'travel_agency',      iconColor: 'text-blue-500',     iconBg: 'bg-blue-50',     pillBg: 'bg-blue-100',    pillText: 'text-blue-800',    selectedBg: 'bg-blue-600',     selectedBorder: 'border-blue-600',     color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200',    activeGradient: 'from-blue-500 to-blue-600'       },
  Finance:         { faIcon: 'fa-solid fa-coins',          googleType: 'accounting',         iconColor: 'text-emerald-600',  iconBg: 'bg-emerald-50',  pillBg: 'bg-emerald-100', pillText: 'text-emerald-800', selectedBg: 'bg-emerald-600',  selectedBorder: 'border-emerald-600',  color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200', activeGradient: 'from-emerald-500 to-emerald-600' },
  Agroalimentaire: { faIcon: 'fa-solid fa-wheat-awn',      googleType: 'food',               iconColor: 'text-green-600',    iconBg: 'bg-green-50',    pillBg: 'bg-green-100',   pillText: 'text-green-800',   selectedBg: 'bg-green-600',    selectedBorder: 'border-green-600',    color: 'text-green-600',   bg: 'bg-green-50',    border: 'border-green-200',   activeGradient: 'from-green-500 to-green-600'     },
};

const SCAN_STEPS = [
  { id: 'init',   label: 'Initialisation', faIcon: 'fa-solid fa-bolt',         desc: 'Préparation des requêtes' },
  { id: 'google', label: 'Google Places',  faIcon: 'fa-solid fa-map-pin',      desc: 'Recherche établissements' },
  { id: 'ai',     label: 'Scoring IA',     faIcon: 'fa-solid fa-brain',        desc: 'Qualification & scoring'  },
  { id: 'done',   label: 'Finalisation',   faIcon: 'fa-solid fa-circle-check', desc: 'Déduplication & tri'      },
];

const LEADS_PER_PAGE = 15;

// ── Types ─────────────────────────────────────────────────────────────────────
type RawPlace = {
  name: string; address: string; phone: string; website: string;
  rating: string; reviewCount: number; ownerName: string; ownerRole: string;
  email: string; city: string; isOpen: boolean; linkedIn: string; apolloScore: number;
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
  hot:  { label: 'Chaud', dot: 'bg-red-500',   badge: 'bg-red-50 text-red-700 border-red-200',       icon: 'fa-solid fa-fire'             },
  warm: { label: 'Tiède', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'fa-solid fa-temperature-half' },
  cold: { label: 'Froid', dot: 'bg-sky-400',   badge: 'bg-sky-50 text-sky-700 border-sky-200',       icon: 'fa-solid fa-snowflake'        },
};

type Lead = {
  id: number; name: string; company: string; role: string; email: string;
  phone: string; city: string; address?: string; website?: string;
  rating?: string; reviewCount?: number; sector: string; score: number; status: string;
  linkedIn?: string; apolloEnriched?: boolean;
};

// ── Sector Icon bubble ────────────────────────────────────────────────────────
const SectorIconBubble = ({ sector, size = 'sm' }: { sector: string; size?: 'sm' | 'md' | 'lg' }) => {
  const info = SECTORS[sector];
  const dims = size === 'sm' ? 'size-8' : size === 'md' ? 'size-10' : 'size-12';
  const iconSize = size === 'sm' ? 'text-[12px]' : size === 'md' ? 'text-sm' : 'text-base';
  if (!info) return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-lg bg-slate-100', dims)}>
      <Fa icon="fa-solid fa-building" className={cn('text-slate-400', iconSize)} />
    </span>
  );
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-lg', info.iconBg, dims)}>
      <Fa icon={info.faIcon} className={cn(info.iconColor, iconSize)} />
    </span>
  );
};

// ── Scan Section Card ─────────────────────────────────────────────────────────
const ScanSectionCard = ({
  icon, title, subtitle, children, iconBg = 'bg-gray-900', badge,
}: {
  icon: string; title: string; subtitle: string; children: React.ReactNode;
  iconBg?: string; badge?: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm shadow-gray-100/50">
    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
      <div className="flex items-center gap-3.5">
        <span className={cn('flex size-9 items-center justify-center rounded-xl', iconBg)}>
          <Fa icon={icon} className="text-[13px] text-white" />
        </span>
        <div>
          <h3 className="text-[13px] font-semibold text-gray-900">{title}</h3>
          <p className="text-[11px] text-gray-400">{subtitle}</p>
        </div>
      </div>
      {badge}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// ── Apollo Toggle ─────────────────────────────────────────────────────────────
const ApolloToggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={cn(
      'group flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all duration-200',
      value ? 'border-violet-200 bg-violet-50/60 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
    )}
  >
    <span className={cn(
      'flex size-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
      value ? 'bg-[rgb(15,23,42)] shadow-lg shadow-gray-200' : 'bg-gray-100 group-hover:bg-gray-200'
    )}>
      <Fa icon="fa-solid fa-rocket" className={cn('text-sm', value ? 'text-white' : 'text-gray-400')} />
    </span>
    <div className="flex-1 min-w-0">
      <p className={cn('text-sm font-semibold leading-tight', value ? 'text-gray-900' : 'text-gray-700')}>
        Enrichissement Apollo.io
      </p>
      <p className={cn('mt-0.5 text-[11px] leading-tight', value ? 'text-[rgb(15,23,42)]' : 'text-gray-400')}>
        {value ? 'Actif — LinkedIn, email professionnel vérifié, score boosté' : 'Inactif — données Google Places uniquement'}
      </p>
    </div>
    <div className={cn(
      'relative flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300',
      value ? 'bg-[rgb(15,23,42)]' : 'bg-gray-300'
    )}>
      <span className={cn(
        'absolute size-3.5 rounded-full bg-white shadow-md transition-all duration-300',
        value ? 'left-[18px]' : 'left-[3px]'
      )} />
    </div>
  </button>
);

// ── Summary Row ───────────────────────────────────────────────────────────────
const SummaryRow = ({ icon, label, value, accent = false }: { icon: string; label: string; value: string; accent?: boolean }) => (
  <div className="flex items-center gap-3 rounded-xl bg-gray-50/80 px-3.5 py-2.5">
    <Fa icon={icon} className={cn('w-4 shrink-0 text-center text-xs', accent ? 'text-violet-500' : 'text-gray-400')} />
    <span className="w-24 shrink-0 text-[11px] font-medium text-gray-400">{label}</span>
    <span className={cn('text-[12px] font-semibold', accent ? 'text-violet-700' : 'text-gray-800')}>{value}</span>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────
export function AccountCrmLeadsContent() {
  useFontAwesome();

  const [leads, setLeads] = useState<Lead[]>([]);

  const [scanHistory, setScanHistory] = useState<{ date: string; count: number; avgScore: number; apollo: boolean }[]>(() => {
    try { const saved = localStorage.getItem('crm_scan_history'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem('crm_scan_history', JSON.stringify(scanHistory)); } catch {}
  }, [scanHistory]);

  const [view, setView] = useState<'dashboard' | 'scan' | 'leads' | 'messenger' | 'templates' | 'edit'>(() => {
    try { return (localStorage.getItem('crm_view') as any) || 'leads'; } catch { return 'leads'; }
  });
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
  const [stepProgress,     setStepProgress]     = useState<number[]>([0, 0, 0, 0]);
  const [composeForLeadId, setComposeForLeadId] = useState<number | null>(null);
  const [editLeadId,       setEditLeadId]       = useState<number | null>(null);
  const [apolloLoading,    setApolloLoading]    = useState(false);
  const [openSectors,      setOpenSectors]      = useState(false);
  const [openCities,       setOpenCities]       = useState(false);

  useEffect(() => { try { localStorage.setItem('crm_view', view); } catch {} }, [view]);
  const location = useLocation();
  useEffect(() => {
    try {
      const v = new URLSearchParams(location.search).get('v');
      const allowed = ['dashboard','scan','leads','crm','messenger','templates','edit'];
      if (v && allowed.includes(v)) setView(v as any);
    } catch {}
  }, [location.search]);

  const [filters, setFilters] = useState({
    sectors:    [] as string[],
    region:     '',
    cities:     [] as string[],
    postalCode: '',
    maxResults: 20,
    hasWebsite: '',
    useApollo:  false,
  });

  useEffect(() => {
    if (filters.cities.length === 0) setFilters(p => ({ ...p, postalCode: '' }));
    else if (filters.cities.length === 1) setFilters(p => ({ ...p, postalCode: postalCodeForCity(filters.cities[0]) }));
  }, [filters.cities]);

  useEffect(() => { setFilters(p => ({ ...p, cities: [], postalCode: '' })); }, [filters.region]);

  const availableCities = useMemo(() => citiesForRegion(filters.region), [filters.region]);

  const gateway = useMemo(() => axios.create({
    baseURL: (import.meta as any).env?.VITE_GATEWAY_BASE_URL || 'http://localhost:8081/api',
  }), []);

  const refreshLeadsFromDb = useCallback(async () => {
    try {
      const resp = await gateway.get('/leads');
      const rows: any[] = resp?.data ?? [];
      let mapped: Lead[] = rows.map(l => {
        const temp = String(l.temperature || '').toLowerCase();
        const status = ['hot','warm','cold'].includes(temp) ? temp : statusOf(Number(l.aiScore || 0));
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
        const filled = await Promise.all(needEmail.map(async ld => {
          try {
            const r = await gateway.get(`/leads/${ld.id}`).catch(() => null);
            const d = r?.data || {};
            let em = cleanStr(d.email || d.emailAddress || d.email_address || d.contactEmail || d.contact_email || d.primaryEmail || d.leadEmail || d.decisionMakerEmail || d.dmEmail || '');
            if (!em) {
              const ri = await gateway.get(`/interactions/lead/${ld.id}`).catch(() => null);
              const rowsI: any[] = ri?.data ?? [];
              const first = rowsI.find(r2 => String(r2.channel || r2.channel_type || '').toUpperCase() === 'EMAIL');
              em = cleanStr(first?.to_email || first?.toEmail || first?.email || first?.contactEmail || first?.contact_email || '');
            }
            return { id: ld.id, email: em };
          } catch { return { id: ld.id, email: '' }; }
        }));
        if (filled.some(f => f.email))
          mapped = mapped.map(l => { const f = filled.find(x => x.id === l.id); return f && f.email ? { ...l, email: f.email } : l; });
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

  useEffect(() => { refreshLeadsFromDb(); }, []);

  useEffect(() => {
    const hydrateEmail = async () => {
      if (!selectedLead || selectedLead.email) return;
      try {
        const rLead = await gateway.get(`/leads/${selectedLead.id}`).catch(() => null);
        const d = rLead?.data;
        let foundEmail = cleanStr(d?.email || d?.emailAddress || d?.email_address || d?.contactEmail || d?.contact_email || d?.primaryEmail || d?.leadEmail || d?.decisionMakerEmail || d?.dmEmail || '');
        if (!foundEmail) {
          const resp = await gateway.get(`/interactions/lead/${selectedLead.id}`).catch(() => null);
          const rows: any[] = resp?.data ?? [];
          const first = rows.find(r => String(r.channel || r.channel_type || '').toUpperCase() === 'EMAIL');
          foundEmail = cleanStr(first?.to_email || first?.toEmail || first?.email || first?.contactEmail || first?.contact_email || '');
        }
        if (foundEmail) {
          setSelectedLead(prev => prev ? { ...prev, email: foundEmail } : prev);
          setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, email: foundEmail } : l));
        }
      } catch {}
    };
    hydrateEmail();
  }, [selectedLead, gateway]);

  const toggleSector = (s: string) =>
    setFilters(p => ({
      ...p,
      sectors: p.sectors.includes(s) ? p.sectors.filter(x => x !== s) : [...p.sectors, s],
    }));

  const toggleCity = (cityName: string) =>
    setFilters(p => ({
      ...p,
      cities: p.cities.includes(cityName) ? p.cities.filter(c => c !== cityName) : [...p.cities, cityName],
    }));

  const fetchRealPlaces = async (jobId: string, city: string, maxAttempts = 30, intervalMs = 2000): Promise<RawPlace[]> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(r => setTimeout(r, intervalMs));
      try {
        const res  = await gateway.get(`/lead_agent/results/${jobId}`);
        const data = res?.data;
        const isDone    = ['done','completed','DONE','COMPLETED'].includes(data?.status);
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
      } catch (e: any) { if (e?.response?.status !== 404) break; }
    }
    return [];
  };

  const handleScan = async () => {
    if (!filters.sectors.length) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanLog([]);
    setScanStep(0);
    setStepProgress([0, 0, 0, 0]);
    const all: Lead[] = [];
    const targetCities = filters.cities.length ? filters.cities : ['Casablanca'];
    const total = filters.sectors.length * targetCities.length;
    let step = 0;

    const log = (msg: string) => setScanLog(p => [...p.slice(-8), msg]);

    log('Système initialisé');
    await new Promise(r => setTimeout(r, 400));
    setStepProgress([100, 0, 0, 0]);
    setScanStep(1);
    log(filters.useApollo ? 'Connexion Google Places + Apollo.io...' : 'Connexion Google Places API...');
    await new Promise(r => setTimeout(r, 300));

    for (const sector of filters.sectors) {
      for (const city of targetCities) {
        step++;
        setScanPhase(`${sector} — ${city}`);
        setScanProgress(Math.round((step / total) * 70));
        setStepProgress([100, Math.round((step / total) * 100), 0, 0]);
        log(`Scan ${sector} à ${city}...`);
        let jobId = '';
        try {
          const resp = await gateway.post('/lead_agent/start', { city, category: sector, max_results: filters.maxResults }, { headers: { 'Content-Type': 'application/json' } });
          jobId = resp?.data?.job_id ?? resp?.data?.jobId ?? '';
          log(jobId ? `Job démarré (${jobId})` : 'Job démarré — en attente des résultats...');
        } catch (err: any) {
          const status = err?.response?.status ?? '?';
          const respData = err?.response?.data;
          const detail = typeof respData === 'string' ? respData : respData?.message ?? respData?.error ?? JSON.stringify(respData) ?? err?.message ?? 'Voir console';
          log(`Erreur ${status}: ${detail}`);
          continue;
        }
        log('Récupération des résultats...');
        let places: RawPlace[] = await fetchRealPlaces(jobId, city);
        if (places.length === 0) { log(`Aucun résultat pour ${sector} à ${city}`); continue; }
        if (filters.hasWebsite === 'yes') places = places.filter(p => p.website);
        if (filters.hasWebsite === 'no')  places = places.filter(p => !p.website);
        places = places.slice(0, filters.maxResults);
        log(`${places.length} établissements trouvés à ${city}`);
        if (filters.useApollo) log(`Apollo: ${places.length} contacts enrichis`);
        for (const pl of places) {
          const score = calcScore(pl, filters.useApollo);
          all.push({ id: Date.now() + Math.random() * 9999, name: pl.ownerName, company: pl.name, role: pl.ownerRole, email: pl.email, phone: pl.phone, city: pl.city, address: pl.address, website: pl.website, rating: pl.rating, reviewCount: pl.reviewCount, sector, score, status: statusOf(score), linkedIn: filters.useApollo ? pl.linkedIn : '', apolloEnriched: filters.useApollo });
        }
      }
    }

    setScanStep(2);
    setStepProgress([100, 100, 0, 0]);
    log('Analyse IA et scoring...');
    setScanProgress(88);
    await new Promise(r => setTimeout(r, 500));

    setScanStep(3);
    setStepProgress([100, 100, 100, 0]);
    log('Déduplication & tri...');
    setScanProgress(96);
    await new Promise(r => setTimeout(r, 300));

    const unique = all.filter((l, i, a) => a.findIndex(x => x.company === l.company) === i).sort((a, b) => b.score - a.score);
    setStepProgress([100, 100, 100, 100]);
    log(`🎯 ${unique.length} prospects qualifiés !`);
    setScanProgress(100);
    setScanHistory(p => [...p, { date: new Date().toLocaleString('fr-MA'), count: unique.length, avgScore: unique.length ? Math.round(unique.reduce((s, l) => s + l.score, 0) / unique.length) : 0, apollo: filters.useApollo }]);
    await new Promise(r => setTimeout(r, 1200));
    const count = await refreshLeadsFromDb();
    if (count === 0 && unique.length > 0) setLeads(unique);
    setIsScanning(false);
    setView('leads');
  };

  const filtered = useMemo(() => {
    let r = [...leads];
    if (filterStatus !== 'all') r = r.filter(l => l.status === filterStatus);
    if (filterSector  !== 'all') r = r.filter(l => l.sector  === filterSector);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      r = r.filter(l => l.company.toLowerCase().includes(q) || l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q));
    }
    r.sort((a, b) => sortBy === 'score' ? b.score - a.score : sortBy === 'name' ? a.company.localeCompare(b.company) : a.city.localeCompare(b.city));
    return r;
  }, [leads, filterStatus, filterSector, searchQuery, sortBy]);

  const totalPages    = Math.ceil(filtered.length / LEADS_PER_PAGE);
  const paginated     = filtered.slice((currentPage - 1) * LEADS_PER_PAGE, currentPage * LEADS_PER_PAGE);
  const uniqueSectors = useMemo(() => [...new Set(leads.map(l => l.sector))], [leads]);

  const exportCSV = () => {
    const header = 'Entreprise,Contact,Rôle,Email,Téléphone,Ville,Secteur,Score,Statut,Site web,LinkedIn';
    const rows = filtered.map(l =>
      [l.company, l.name, l.role, l.email, l.phone, l.city, l.sector, l.score, STATUS[l.status]?.label, l.website || '', l.linkedIn || ''].map(v => `"${v}"`).join(',')
    );
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'prospects.csv'; a.click();
  };

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="grid gap-5 lg:gap-7">

      {view === 'dashboard' && (
        <LeadsDashboard leads={leads as any} scanHistory={scanHistory as any} sectorIcon={s => SECTORS[s]?.faIcon || 'fa-solid fa-tag'} onGoScan={() => setView('scan')} />
      )}
      {view === 'messenger' && (
        <LeadMessanger leads={leads.map(l => ({ id: l.id, company: l.company, name: l.name, city: l.city, sector: l.sector, email: l.email, phone: l.phone }))} composeForLeadId={composeForLeadId ?? undefined} />
      )}
      {view === 'crm' && (
        <div className="max-w-[1100px] mx-auto">
          <CRM leads={leads.map(l => ({ id: l.id, name: l.name, company: l.company, role: l.role, email: l.email, phone: l.phone, city: l.city, sector: l.sector, score: l.score, status: l.status, website: l.website, linkedin: l.linkedIn, enriched: l.apolloEnriched })) as any} />
        </div>
      )}
      {view === 'templates' && <MessageSequenceTemplatesView />}
      {view === 'edit' && editLeadId != null && (
        <LeadEditView leadId={editLeadId} onClose={() => { setView('leads'); setEditLeadId(null); }} onSaved={async () => { await refreshLeadsFromDb(); }} />
      )}

      {/* ══════════════════ SCAN — Enhanced Metronic Style ═══════════════ */}
      {view === 'scan' && (
        <div className="space-y-6">

          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Scan de Prospects</h1>
              <p className="mt-0.5 text-sm text-gray-400">
                Configurez vos critères et lancez la détection automatique de leads qualifiés
              </p>
            </div>
            {scanHistory.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
                <Fa icon="fa-solid fa-clock-rotate-left" className="text-[11px] text-gray-400" />
                <span className="text-[12px] font-medium text-gray-500">
                  Dernier scan :{' '}
                  <span className="font-bold text-gray-800">{scanHistory[scanHistory.length - 1].count} leads</span>
                </span>
              </div>
            )}
          </div>

          {/* Step progress indicator */}
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
            <div className="flex items-center">
              {SCAN_STEPS.map((step, i) => {
                const isDone   = isScanning ? stepProgress[i] === 100 : false;
                const isActive = isScanning && scanStep === i;
                const isPending = isScanning && scanStep < i;
                return (
                  <div key={step.id} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className={cn(
                        'relative flex size-10 items-center justify-center rounded-xl border-2 transition-all duration-500',
                        isDone   ? 'border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-100' :
                        isActive ? 'border-blue-500 bg-blue-500 shadow-lg shadow-blue-100' :
                        isPending ? 'border-gray-200 bg-gray-50' :
                        'border-gray-200 bg-white'
                      )}>
                        {isDone   ? <Fa icon="fa-solid fa-check" className="text-xs text-white" /> :
                         isActive ? <Fa icon="fa-solid fa-circle-notch fa-spin" className="text-xs text-white" /> :
                                    <Fa icon={step.faIcon} className={cn('text-xs', isPending ? 'text-gray-300' : 'text-gray-400')} />}
                      </div>
                      <div className="text-center">
                        <p className={cn('text-[11px] font-semibold transition-colors',
                          isDone ? 'text-emerald-600' : isActive ? 'text-blue-600' : 'text-gray-400'
                        )}>{step.label}</p>
                        <p className="text-[10px] text-gray-300 hidden sm:block">{step.desc}</p>
                      </div>
                    </div>
                    {i < SCAN_STEPS.length - 1 && (
                      <div className="mx-2 mb-6 flex-1 h-0.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                          style={{ width: isDone ? '100%' : isActive ? '50%' : '0%' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

            {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
            <div className="space-y-5">

              {/* Sector picker */}
              <ScanSectionCard
                icon="fa-solid fa-layer-group"
                title="Secteurs cibles"
                subtitle="Sélectionnez les secteurs d'activité à prospecter"
                badge={
                  filters.sectors.length > 0 ? (
                    <span className="flex size-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                      {filters.sectors.length}
                    </span>
                  ) : null
                }
              >
                <div className="space-y-4">
                  <Popover open={openSectors} onOpenChange={setOpenSectors}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100",
                          filters.sectors.length > 0 && "border-blue-200 bg-blue-50/30"
                        )}
                      >
                        <div className="flex flex-wrap gap-1.5 overflow-hidden">
                          {filters.sectors.length > 0 ? (
                            filters.sectors.map((s) => (
                              <Badge
                                key={s}
                                variant="secondary"
                                className="h-6 gap-1 rounded-lg border-blue-100 bg-blue-100 px-2 text-[10px] font-bold text-blue-700"
                              >
                                <Fa icon={SECTORS[s]?.faIcon || 'fa-solid fa-tag'} className="text-[9px]" />
                                {s}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSector(s);
                                  }}
                                  className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-blue-200"
                                >
                                  <Fa icon="fa-solid fa-xmark" className="text-[8px]" />
                                </span>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400">Choisir des secteurs...</span>
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0" align="start">
                      <Command className="border-none shadow-none">
                        <CommandInput placeholder="Rechercher un secteur..." className="h-10" />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty>Aucun secteur trouvé.</CommandEmpty>
                          <CommandGroup>
                            <div className="grid grid-cols-1 gap-1 p-1">
                              {Object.entries(SECTORS).map(([name, info]) => {
                                const active = filters.sectors.includes(name);
                                return (
                                  <CommandItem
                                    key={name}
                                    onSelect={() => toggleSector(name)}
                                    className={cn(
                                      "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors",
                                      active ? "bg-blue-50" : "hover:bg-gray-50"
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className={cn(
                                        "flex size-8 items-center justify-center rounded-lg transition-colors",
                                        active ? "bg-blue-600 text-white" : info.bg + " " + info.color
                                      )}>
                                        <Fa icon={info.faIcon} className="text-xs" />
                                      </span>
                                      <span className={cn(
                                        "text-[13px] font-semibold",
                                        active ? "text-blue-900" : "text-gray-700"
                                      )}>
                                        {name}
                                      </span>
                                    </div>
                                    {active && (
                                      <Check className="h-4 w-4 text-blue-600" />
                                    )}
                                  </CommandItem>
                                );
                              })}
                            </div>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {filters.sectors.length > 0 && (
                    <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5">
                      <span className="text-[12px] font-medium text-blue-700">
                        <Fa icon="fa-solid fa-circle-check" className="mr-1.5 text-blue-500" />
                        {filters.sectors.length} secteur{filters.sectors.length > 1 ? 's' : ''} sélectionné{filters.sectors.length > 1 ? 's' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFilters(p => ({ ...p, sectors: [] }))}
                        className="text-[11px] font-semibold text-blue-500 hover:text-blue-700"
                      >
                        Effacer tout
                      </button>
                    </div>
                  )}
                </div>
              </ScanSectionCard>

              {/* Location */}
              <ScanSectionCard
                icon="fa-solid fa-location-dot"
                title="Zone géographique"
                subtitle="Définissez la région et les villes de prospection"
              >
                <div className="space-y-5">
                  {/* Region */}
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      <Fa icon="fa-solid fa-map" className="mr-1" /> Région
                    </label>
                    <div className="relative">
                      <select
                        value={filters.region}
                        onChange={e => setFilters(p => ({ ...p, region: e.target.value }))}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm font-medium text-gray-700 transition focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Toutes les régions du Maroc</option>
                        {Object.keys(MOROCCAN_REGIONS).map(region => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                      <Fa icon="fa-solid fa-chevron-down" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400" />
                    </div>
                  </div>

                  {/* Cities */}
                  {filters.region && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          <Fa icon="fa-solid fa-city" className="mr-1" /> Villes — {filters.region}
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setFilters(p => ({ ...p, cities: availableCities.map(c => c.name) }))}
                            className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700 transition hover:bg-teal-100"
                          >
                            <Fa icon="fa-solid fa-check-double" className="text-[9px]" /> Tout
                          </button>
                          <button
                            type="button"
                            onClick={() => setFilters(p => ({ ...p, cities: [] }))}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-500 transition hover:bg-gray-100"
                          >
                            <Fa icon="fa-solid fa-eraser" className="text-[9px]" /> Aucune
                          </button>
                        </div>
                      </div>

                      <Popover open={openCities} onOpenChange={setOpenCities}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-100",
                              filters.cities.length > 0 && "border-teal-200 bg-teal-50/30"
                            )}
                          >
                            <div className="flex flex-wrap gap-1.5 overflow-hidden">
                              {filters.cities.length > 0 ? (
                                filters.cities.map((cityName) => (
                                  <Badge
                                    key={cityName}
                                    variant="secondary"
                                    className="h-6 gap-1 rounded-lg border-teal-100 bg-teal-100 px-2 text-[10px] font-bold text-teal-700"
                                  >
                                    <Fa icon="fa-solid fa-city" className="text-[9px]" />
                                    {cityName}
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCity(cityName);
                                      }}
                                      className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-teal-200"
                                    >
                                      <Fa icon="fa-solid fa-xmark" className="text-[8px]" />
                                    </span>
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-gray-400">Choisir des villes...</span>
                              )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command className="border-none shadow-none">
                            <CommandInput placeholder="Rechercher une ville..." className="h-10" />
                            <CommandList className="max-h-[300px]">
                              <CommandEmpty>Aucune ville trouvée.</CommandEmpty>
                              <CommandGroup>
                                <div className="grid grid-cols-1 gap-1 p-1">
                                  {availableCities.map((c) => {
                                    const active = filters.cities.includes(c.name);
                                    return (
                                      <CommandItem
                                        key={c.name}
                                        onSelect={() => toggleCity(c.name)}
                                        className={cn(
                                          "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors",
                                          active ? "bg-teal-50" : "hover:bg-gray-50"
                                        )}
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className={cn(
                                            "flex size-8 items-center justify-center rounded-lg transition-colors",
                                            active ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-400"
                                          )}>
                                            <Fa icon="fa-solid fa-city" className="text-xs" />
                                          </span>
                                          <div className="min-w-0">
                                            <p className={cn("text-[13px] font-semibold truncate", active ? "text-teal-900" : "text-gray-700")}>{c.name}</p>
                                            <p className={cn("text-[10px]", active ? "text-teal-600" : "text-gray-400")}>{c.postalCode}</p>
                                          </div>
                                        </div>
                                        {active && (
                                          <Check className="h-4 w-4 text-teal-600" />
                                        )}
                                      </CommandItem>
                                    );
                                  })}
                                </div>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {filters.cities.length > 0 && (
                        <p className="mt-3 text-[11px] font-medium text-teal-600">
                          <Fa icon="fa-solid fa-circle-check" className="mr-1" />
                          {filters.cities.length} ville{filters.cities.length > 1 ? 's' : ''} sélectionnée{filters.cities.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Filter row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        <Fa icon="fa-solid fa-list-ol" className="mr-1" /> Max résultats
                      </label>
                      <div className="relative">
                        <select
                          value={filters.maxResults}
                          onChange={e => setFilters(p => ({ ...p, maxResults: Number(e.target.value) }))}
                          className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-8 text-sm font-medium text-gray-700 transition focus:border-blue-400 focus:bg-white focus:outline-none"
                        >
                          {[10, 20, 30, 50, 60].map(n => <option key={n} value={n}>{n} résultats</option>)}
                        </select>
                        <Fa icon="fa-solid fa-chevron-down" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        <Fa icon="fa-solid fa-globe" className="mr-1" /> Site web
                      </label>
                      <div className="relative">
                        <select
                          value={filters.hasWebsite}
                          onChange={e => setFilters(p => ({ ...p, hasWebsite: e.target.value }))}
                          className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-8 text-sm font-medium text-gray-700 transition focus:border-blue-400 focus:bg-white focus:outline-none"
                        >
                          <option value="">Tous</option>
                          <option value="yes">Avec site</option>
                          <option value="no">Sans site</option>
                        </select>
                        <Fa icon="fa-solid fa-chevron-down" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        <Fa icon="fa-solid fa-hashtag" className="mr-1" /> Code postal
                      </label>
                      {filters.cities.length > 1 ? (
                        <div className="flex flex-wrap gap-1 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2">
                          {filters.cities.map(cityName => (
                            <span key={cityName} className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-teal-800">
                              <Fa icon="fa-solid fa-hashtag" className="text-[8px] text-teal-400" />
                              {postalCodeForCity(cityName)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="ex. 20000"
                          value={filters.postalCode}
                          onChange={e => setFilters(p => ({ ...p, postalCode: e.target.value }))}
                          className={cn(
                            'w-full rounded-xl border px-4 py-3 text-sm font-medium transition focus:outline-none',
                            filters.postalCode
                              ? 'border-teal-300 bg-teal-50 text-teal-800 focus:border-teal-400'
                              : 'border-gray-200 bg-gray-50 text-gray-700 focus:border-blue-400 focus:bg-white'
                          )}
                        />
                      )}
                      {filters.cities.length === 1 && filters.postalCode && (
                        <p className="mt-1 flex items-center gap-1 text-[10px] text-teal-600">
                          <Fa icon="fa-solid fa-bolt" className="text-[9px]" /> Auto-rempli · {filters.cities[0]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </ScanSectionCard>

              {/* Enrichissement */}
              <ScanSectionCard
                icon="fa-solid fa-wand-magic-sparkles"
                title="Enrichissement des données"
                subtitle="Augmentez la qualité des contacts avec des données tierces"
                iconBg="bg-violet-600"
              >
                <ApolloToggle value={filters.useApollo} onChange={v => setFilters(p => ({ ...p, useApollo: v }))} />
                {filters.useApollo && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { icon: 'fa-brands fa-linkedin',           label: 'LinkedIn',    desc: 'Profil vérifié',  bg: 'bg-[#0a66c2]/10', color: 'text-[#0a66c2]'  },
                      { icon: 'fa-solid fa-envelope-circle-check', label: 'Email Pro',  desc: 'Adresse vérifiée', bg: 'bg-emerald-50',   color: 'text-emerald-600'},
                      { icon: 'fa-solid fa-chart-bar',            label: 'Firmographie', desc: 'Données B2B',   bg: 'bg-violet-50',    color: 'text-violet-600' },
                    ].map(f => (
                      <div key={f.label} className="flex flex-col items-center gap-2 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-3 text-center">
                        <span className={cn('flex size-9 items-center justify-center rounded-xl', f.bg)}>
                          <Fa icon={f.icon} className={cn('text-sm', f.color)} />
                        </span>
                        <div>
                          <p className="text-[11px] font-bold text-gray-700">{f.label}</p>
                          <p className="text-[10px] text-gray-400">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScanSectionCard>
            </div>

            {/* ── RIGHT COLUMN ─────────────────────────────────────────── */}
            <div className="space-y-5">

              {/* Summary */}
              {filters.sectors.length > 0 && !isScanning && (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-5 py-4">
                    <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-gray-400">
                      <Fa icon="fa-solid fa-clipboard-list" className="text-blue-500" /> Récapitulatif
                    </p>
                  </div>
                  <div className="space-y-2 p-5">
                    <SummaryRow icon="fa-solid fa-layer-group" label="Secteurs"    value={filters.sectors.slice(0, 2).join(', ') + (filters.sectors.length > 2 ? ` +${filters.sectors.length - 2}` : '')} />
                    <SummaryRow icon="fa-solid fa-map"          label="Région"      value={filters.region || 'Toutes'} />
                    <SummaryRow icon="fa-solid fa-city"         label="Villes"      value={filters.cities.length ? `${filters.cities.length} ville(s)` : 'Casablanca'} />
                    <SummaryRow icon="fa-solid fa-sliders"      label="Max / ville" value={`${filters.maxResults} résultats`} />
                    <SummaryRow icon="fa-solid fa-globe"        label="Site web"    value={filters.hasWebsite === 'yes' ? 'Avec site' : filters.hasWebsite === 'no' ? 'Sans site' : 'Tous'} />
                    <SummaryRow icon="fa-solid fa-rocket"       label="Apollo"      value={filters.useApollo ? 'Activé ✓' : 'Désactivé'} accent={filters.useApollo} />
                  </div>
                  <div className="border-t border-gray-100 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium text-gray-400">Prospects estimés</p>
                      <p className="text-lg font-bold text-gray-900">
                        ~{filters.sectors.length * (filters.cities.length || 1) * filters.maxResults}
                      </p>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                        style={{ width: `${Math.min(100, (filters.sectors.length / 5) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Launch button */}
              <button
                disabled={!filters.sectors.length || isScanning}
                onClick={handleScan}
                className={cn(
                  'relative w-full overflow-hidden rounded-2xl px-6 py-5 text-left transition-all duration-200',
                  filters.sectors.length && !isScanning
                    ? 'cursor-pointer bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-xl shadow-gray-900/20 hover:-translate-y-0.5 hover:shadow-2xl'
                    : 'cursor-not-allowed bg-gray-200 opacity-50'
                )}
              >
                {/* Grid overlay */}
                {(filters.sectors.length > 0 && !isScanning) && (
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  />
                )}
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <p className="text-base font-bold text-white">
                        {isScanning ? scanPhase || 'Scan en cours...' : 'Lancer le scan'}
                      </p>
                      {filters.useApollo && !isScanning && (
                        <span className="flex items-center gap-1 rounded-full bg-violet-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
                          <Fa icon="fa-solid fa-rocket" className="text-[8px]" /> Apollo
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-400">
                      {isScanning
                        ? `${scanProgress}% complété — ${scanLog[scanLog.length - 1] || ''}`
                        : filters.sectors.length
                        ? `${filters.sectors.length} secteur${filters.sectors.length > 1 ? 's' : ''} · ${filters.cities.length > 1 ? `${filters.cities.length} villes` : filters.cities[0] || 'Casablanca'}`
                        : 'Sélectionnez au moins un secteur'
                      }
                    </p>
                  </div>
                  <div className={cn(
                    'flex size-12 items-center justify-center rounded-xl',
                    isScanning ? 'bg-blue-600' : 'bg-white/10'
                  )}>
                    <Fa
                      icon={isScanning ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-rocket'}
                      className="text-xl text-white"
                    />
                  </div>
                </div>
                {isScanning && (
                  <div className="relative mt-4 h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400 transition-all duration-700"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                )}
              </button>

              {/* Live console */}
              {isScanning && (
                <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 shadow-xl">
                  <div className="flex items-center justify-between border-b border-gray-800/80 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="size-3 rounded-full bg-red-500" />
                        <span className="size-3 rounded-full bg-yellow-500" />
                        <span className="size-3 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <span className="font-mono text-[10px] text-gray-500">
                        <Fa icon="fa-solid fa-terminal" className="mr-1" /> scan.log — en direct
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                      <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> LIVE
                    </span>
                  </div>

                  {/* Step mini progress */}
                  <div className="grid grid-cols-4 border-b border-gray-800/60 px-4 py-3">
                    {SCAN_STEPS.map((step, i) => (
                      <div key={step.id} className="flex flex-col items-center gap-1">
                        <div className={cn(
                          'flex size-7 items-center justify-center rounded-lg transition-all duration-500',
                          stepProgress[i] === 100 ? 'bg-emerald-500/20' : scanStep === i ? 'bg-blue-500/20' : 'bg-gray-800'
                        )}>
                          <Fa
                            icon={stepProgress[i] === 100 ? 'fa-solid fa-check' : scanStep === i ? 'fa-solid fa-circle-notch fa-spin' : step.faIcon}
                            className={cn(
                              'text-[10px]',
                              stepProgress[i] === 100 ? 'text-emerald-400' : scanStep === i ? 'text-blue-400' : 'text-gray-600'
                            )}
                          />
                        </div>
                        <div className="h-0.5 w-10 overflow-hidden rounded-full bg-gray-800">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                            style={{ width: `${stepProgress[i]}%` }}
                          />
                        </div>
                        <p className={cn(
                          'text-[9px] font-mono',
                          stepProgress[i] === 100 ? 'text-emerald-500' : scanStep === i ? 'text-blue-400' : 'text-gray-600'
                        )}>{step.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Log */}
                  <div className="space-y-1 p-4">
                    {scanLog.slice(-6).map((line, i) => {
                      const isLast = i === scanLog.slice(-6).length - 1;
                      return (
                        <p key={i} className={cn('font-mono text-[11px] leading-relaxed', isLast ? 'text-emerald-400' : 'text-gray-500')}>
                          <span className="mr-2 text-gray-700">
                            {new Date().toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          {line}
                        </p>
                      );
                    })}
                    <span className="inline-block h-3.5 w-2 animate-pulse rounded-sm bg-emerald-400" />
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-800/60 px-4 py-3">
                    <span className="font-mono text-[10px] text-gray-500">{scanPhase}</span>
                    <span className="font-mono text-[11px] font-bold text-emerald-400">{scanProgress}%</span>
                  </div>
                </div>
              )}

              {/* Scan history */}
              {scanHistory.length > 0 && !isScanning && (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-5 py-4">
                    <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-gray-400">
                      <Fa icon="fa-solid fa-clock-rotate-left" className="text-blue-400" /> Historique des scans
                    </p>
                  </div>
                  <div className="space-y-3 p-5">
                    {scanHistory.slice(-4).reverse().map((h, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 transition hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="flex size-8 items-center justify-center rounded-lg bg-white shadow-sm border border-gray-100">
                            <Fa icon="fa-solid fa-chart-pie" className="text-[11px] text-blue-500" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[12px] font-bold text-gray-800">{h.count} prospects</p>
                              {h.apollo && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-600">
                                  <Fa icon="fa-solid fa-rocket" className="text-[7px]" /> Apollo
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400">{h.date}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="rounded-full bg-gray-900 px-3 py-0.5 text-[11px] font-bold text-white">{h.avgScore}</span>
                          <span className="text-[9px] text-gray-400">score moy.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips — only when idle with no sectors */}
              {!isScanning && filters.sectors.length === 0 && (
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/60 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-blue-600">
                      <Fa icon="fa-solid fa-lightbulb" className="text-sm text-white" />
                    </span>
                    <p className="text-[12px] font-bold text-blue-900">Conseils de scan</p>
                  </div>
                  <ul className="space-y-2">
                    {[
                      'Sélectionnez 1–3 secteurs pour des résultats plus ciblés',
                      'Cibler une région précise améliore la qualité des leads',
                      'Activez Apollo pour obtenir des emails professionnels vérifiés',
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Fa icon={`fa-solid fa-${i + 1}`} className="mt-0.5 shrink-0 text-[10px] text-blue-400" />
                        <span className="text-[11px] leading-relaxed text-blue-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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
                  { fa: 'fa-solid fa-users',            label: 'Total',     sub: 'prospects',    val: leads.length,                                                                                        iconBg: 'bg-slate-100',    iconColor: 'text-slate-500',   valColor: 'text-slate-800'   },
                  { fa: 'fa-solid fa-fire',              label: 'Chauds',    sub: 'prioritaires', val: leads.filter(l => l.status === 'hot').length,                                                        iconBg: 'bg-red-50',       iconColor: 'text-red-500',     valColor: 'text-red-600'     },
                  { fa: 'fa-solid fa-temperature-half', label: 'Tièdes',    sub: 'à relancer',   val: leads.filter(l => l.status === 'warm').length,                                                       iconBg: 'bg-amber-50',     iconColor: 'text-amber-500',   valColor: 'text-amber-600'   },
                  { fa: 'fa-solid fa-chart-simple',     label: 'Score moy', sub: '/ 100',        val: leads.length ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0,               iconBg: 'bg-emerald-50',   iconColor: 'text-emerald-600', valColor: 'text-emerald-600' },
                ].map(stat => (
                  <Card key={stat.label} className="shadow-sm">
                    <CardContent className="flex items-center gap-3 py-4">
                      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', stat.iconBg)}>
                        <Fa icon={stat.fa} className={stat.iconColor} />
                      </span>
                      <div>
                        <p className={cn('text-2xl font-bold tabular-nums', stat.valColor)}>{stat.val}</p>
                        <p className="text-[11px] text-slate-400">{stat.label} · {stat.sub}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Apollo banner */}
              {leads.some(l => l.apolloEnriched) && (
                <div className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-violet-600">
                    <Fa icon="fa-solid fa-rocket" className="text-sm text-white" />
                  </span>
                  <p className="text-sm text-violet-700">
                    <span className="font-bold">{leads.filter(l => l.apolloEnriched).length} prospects</span> enrichis via Apollo.io — LinkedIn et emails vérifiés disponibles.
                  </p>
                </div>
              )}

              {/* Toolbar */}
              <Card>
                <CardContent className="flex flex-wrap items-center gap-3 py-3">
                  <div className="relative min-w-48 flex-1">
                    <Fa icon="fa-solid fa-magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[12px]" />
                    <input type="text" placeholder="Rechercher entreprise, contact, ville..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
                  </div>
                  <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
                    {[
                      { k: 'all',  l: 'Tous',   fa: 'fa-solid fa-border-all',       active: 'bg-slate-900 text-white'   },
                      { k: 'hot',  l: 'Chauds', fa: 'fa-solid fa-fire',             active: 'bg-red-600 text-white'     },
                      { k: 'warm', l: 'Tièdes', fa: 'fa-solid fa-temperature-half', active: 'bg-amber-500 text-white'   },
                      { k: 'cold', l: 'Froids', fa: 'fa-solid fa-snowflake',        active: 'bg-sky-500 text-white'     },
                    ].map(o => (
                      <button key={o.k} onClick={() => { setFilterStatus(o.k); setCurrentPage(1); }}
                        className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all', filterStatus === o.k ? `${o.active} shadow-sm` : 'text-slate-500 hover:text-slate-700')}>
                        <Fa icon={o.fa} className="text-[10px]" />{o.l}
                      </button>
                    ))}
                  </div>
                  <select value={filterSector} onChange={e => { setFilterSector(e.target.value); setCurrentPage(1); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none">
                    <option value="all">Tous secteurs</option>
                    {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as 'score' | 'name' | 'city')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none">
                    <option value="score">Trier: Score</option>
                    <option value="name">Trier: Nom</option>
                    <option value="city">Trier: Ville</option>
                  </select>
                  <button onClick={exportCSV} className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800">
                    <Fa icon="fa-solid fa-file-csv" className="text-[12px] text-emerald-600" /> CSV
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
                      <col className="w-48" /><col className="w-36" /><col className="w-32" />
                      <col className="w-28" /><col className="w-20" /><col className="w-14" />
                      <col className="w-24" /><col className="w-10" />
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
                              {h.fa && <Fa icon={h.fa} className="text-[10px]" />}{h.label}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginated.map(l => {
                        const sc = scoreMeta(l.score);
                        const si = STATUS[l.status];
                        const sInfo = SECTORS[l.sector];
                        return (
                          <tr key={l.id} onClick={() => setSelectedLead(l)} className="cursor-pointer transition-colors hover:bg-slate-50/60 group">
                            <td className="px-4 py-3 max-w-[180px]">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div className="relative shrink-0">
                                  <SectorIconBubble sector={l.sector} size="sm" />
                                  {l.apolloEnriched && (
                                    <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-violet-500 shadow-sm">
                                      <Fa icon="fa-solid fa-rocket" className="text-[5px] text-white" />
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0 overflow-hidden">
                                  <p className="truncate font-semibold text-slate-800 group-hover:text-blue-700 transition-colors" title={l.company}>{l.company}</p>
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
                              <p className="font-medium text-slate-700">{l.name}</p>
                              <p className="text-[11px] text-slate-400">{l.role}</p>
                              <p className="mt-0.5 text-[11px] text-slate-500">{l.phone || '—'}</p>
                              {l.linkedIn && (
                                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-violet-500">
                                  <Fa icon="fa-brands fa-linkedin" className="text-[9px]" />
                                  <span className="truncate max-w-[120px]">{l.linkedIn}</span>
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                                sInfo ? `${sInfo.pillBg} ${sInfo.pillText}` : 'bg-slate-100 text-slate-600'
                              )}>
                                <Fa icon={sInfo?.faIcon || 'fa-solid fa-tag'} className="text-[10px]" />
                                {l.sector}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1 text-sm text-slate-500">
                                <Fa icon="fa-solid fa-map-pin" className="text-[9px] text-slate-300" />{l.city}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-500">
                                <Fa icon="fa-solid fa-star" className="text-[10px]" />{l.rating || '—'}
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
                                <Fa icon={si.icon} className="text-[9px]" />{si.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 shrink-0 w-10">
                              <button onClick={e => { e.stopPropagation(); setSelectedLead(l); }} className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600">
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
                    <p className="text-sm text-slate-400">{(currentPage - 1) * LEADS_PER_PAGE + 1}–{Math.min(currentPage * LEADS_PER_PAGE, filtered.length)} sur {filtered.length}</p>
                    <div className="flex items-center gap-1">
                      <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-400 disabled:opacity-40">
                        <Fa icon="fa-solid fa-chevron-left" className="text-[10px]" />
                      </button>
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        const page = totalPages <= 7 ? i + 1 : currentPage <= 4 ? i + 1 : currentPage >= totalPages - 3 ? totalPages - 6 + i : currentPage - 3 + i;
                        return (
                          <button key={page} onClick={() => setCurrentPage(page)} className={cn('flex size-8 items-center justify-center rounded-lg text-sm font-medium transition', currentPage === page ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-500 hover:border-slate-400')}>
                            {page}
                          </button>
                        );
                      })}
                      <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-400 disabled:opacity-40">
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
                  <div className="relative">
                    <SectorIconBubble sector={selectedLead.sector} size="lg" />
                    {selectedLead.apolloEnriched && (
                      <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-violet-500 shadow">
                        <Fa icon="fa-solid fa-rocket" className="text-[8px] text-white" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{selectedLead.name}</h3>
                    <p className="text-sm text-slate-500">{selectedLead.role} — {selectedLead.company}</p>
                    {selectedLead.apolloEnriched && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-600">
                        <Fa icon="fa-solid fa-rocket" className="text-[8px]" /> Enrichi Apollo
                      </span>
                    )}
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
                  { fa: 'fa-solid fa-building',     label: 'Entreprise', val: selectedLead.company,                        color: 'text-slate-400'   },
                  { fa: 'fa-solid fa-tag',           label: 'Secteur',   val: selectedLead.sector,                         color: SECTORS[selectedLead.sector]?.iconColor || 'text-slate-400' },
                  { fa: 'fa-solid fa-location-dot',  label: 'Adresse',   val: selectedLead.address || selectedLead.city,   color: 'text-rose-400'    },
                  { fa: 'fa-solid fa-envelope',      label: 'Email',     val: selectedLead.email || '—',                   color: 'text-blue-400'    },
                  { fa: 'fa-solid fa-phone',         label: 'Tél.',      val: selectedLead.phone || '—',                   color: 'text-emerald-500' },
                  { fa: 'fa-solid fa-globe',         label: 'Site web',  val: selectedLead.website || 'Aucun site web',    color: 'text-teal-500'    },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
                    <Fa icon={row.fa} className={cn('w-4 shrink-0 text-center text-[12px]', row.color)} />
                    <span className="w-20 shrink-0 text-[11px] text-slate-400">{row.label}</span>
                    <span className="min-w-0 truncate font-medium text-slate-800">{row.val}</span>
                  </div>
                ))}
                {selectedLead.linkedIn && (
                  <div className="flex items-center gap-3 rounded-lg bg-violet-50 px-3 py-2.5 text-sm">
                    <Fa icon="fa-brands fa-linkedin" className="w-4 shrink-0 text-center text-[12px] text-violet-500" />
                    <span className="w-20 shrink-0 text-[11px] text-violet-400">LinkedIn</span>
                    <span className="min-w-0 truncate font-medium text-violet-700">{selectedLead.linkedIn}</span>
                  </div>
                )}
                {selectedLead.rating && (
                  <div className="flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2.5 text-sm">
                    <Fa icon="fa-solid fa-star" className="w-4 shrink-0 text-center text-[12px] text-amber-400" />
                    <span className="w-20 shrink-0 text-[11px] text-amber-600">Google</span>
                    <span className="font-medium text-amber-800">{selectedLead.rating} ★ · {selectedLead.reviewCount} avis</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setComposeForLeadId(selectedLead.id); setView('messenger'); setSelectedLead(null); }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as any).style.transform = 'translateY(-1px)'; (e.currentTarget as any).style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)'; }}
                  onMouseLeave={e => { (e.currentTarget as any).style.transform = 'translateY(0)'; (e.currentTarget as any).style.boxShadow = '0 4px 14px rgba(99,102,241,0.4)'; }}
                >
                  <Fa icon="fa-solid fa-paper-plane" />  propositions
                </button>
                <button
                  onClick={() => { setEditLeadId(selectedLead.id); setSelectedLead(null); setView('edit'); }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400"
                >
                  <Fa icon="fa-solid fa-pen-to-square" /> Éditer
                </button>
                <button
                  onClick={async () => {
                    if (!selectedLead || apolloLoading) return;
                    try {
                      setApolloLoading(true);
                      await gateway.post(`/enrichment/leads/${selectedLead.id}`);
                      setSelectedLead(prev => prev ? { ...prev, apolloEnriched: true } : prev);
                      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, apolloEnriched: true } : l));
                      await refreshLeadsFromDb();
                    } catch (e) {
                      console.error('[POST /enrichment/leads/{id}] failed', e);
                      alert('Enrichissement Apollo échoué.');
                    } finally { setApolloLoading(false); }
                  }}
                  disabled={apolloLoading}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition',
                    apolloLoading ? 'opacity-70 cursor-not-allowed' : 'hover:border-violet-400 hover:bg-violet-100'
                  )}
                >
                  <Fa icon={apolloLoading ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-rocket'} />
                  {apolloLoading ? 'Apollo…' : 'Apollo'}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
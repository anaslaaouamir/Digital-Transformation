'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

// ── FA helper ─────────────────────────────────────────────────────────────────
const Fa = ({ icon, className = '' }: { icon: string; className?: string }) => (
  <i className={`${icon} ${className}`} aria-hidden="true" />
);

// ── API gateway ───────────────────────────────────────────────────────────────
const gateway = axios.create({
  baseURL: (import.meta as any).env?.VITE_GATEWAY_BASE_URL || 'http://localhost:8081/api',
});

// ── Moroccan cities ───────────────────────────────────────────────────────────
const MOROCCAN_REGIONS: Record<string, string[]> = {
  'Casablanca-Settat':        ['Casablanca','Mohammedia','El Jadida','Settat','Berrechid','Benslimane'],
  'Rabat-Salé-Kénitra':       ['Rabat','Salé','Kénitra','Témara','Skhirat'],
  'Marrakech-Safi':           ['Marrakech','Safi','Essaouira','El Kelaa des Sraghna'],
  'Fès-Meknès':               ['Fès','Meknès','Ifrane','Sefrou','Taza'],
  'Tanger-Tétouan-Al Hoceima':['Tanger','Tétouan','Al Hoceima','Larache','Chefchaouen'],
  'Souss-Massa':               ['Agadir','Inezgane','Tiznit','Taroudant'],
  'Oriental':                  ['Oujda','Nador','Berkane','Taourirt'],
  'Drâa-Tafilalet':            ['Ouarzazate','Errachidia','Zagora','Tinghir'],
};

// ── Types ─────────────────────────────────────────────────────────────────────
type DecisionMaker = {
  id?: number;
  fullName: string;
  title: string;
  email: string;
  directPhone: string;
  linkedinUrl: string;
  isNew?: boolean;
};

type LeadDetail = {
  id: number;
  companyName: string;
  address: string;
  city: string;
  phoneNumber: string;
  email: string;
  website: string;
  linkedinUrl: string;
  employeeCount: string;
  revenueCapital: string;
  googleRating: number | null;
  googleReviews: number | null;
  aiScore: number | null;
  temperature: string;
  contactStatus: string;
  secteurId: number | null;
  secteurName: string;
  decisionMakers: DecisionMaker[];
};

type Secteur = { id: number; name: string };

type Enrollment = {
  id: number;
  sequenceName: string;
  currentStepOrder: number;
  totalSteps: number;
  currentStepName: string;
  nextExecutionDate: string | null;
  status: string;
};

// ── Validation ────────────────────────────────────────────────────────────────
const isValidEmail    = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidUrl      = (v: string) => !v || /^https?:\/\/.+/.test(v);
const isValidLinkedIn = (v: string) => !v || v.includes('linkedin.com');
const isValidPhone    = (v: string) =>
  !v || /^(2126\d{8}|2127\d{8}|05\d{8})$/.test(v.replace(/[\s\-\.]/g, ''));

function normalizeUrl(v: string): string {
  if (!v) return v;
  if (!/^https?:\/\//.test(v)) return 'https://' + v;
  return v;
}

// ── Temperature config ────────────────────────────────────────────────────────
const TEMPERATURES = [
  { k: 'hot',  label: 'Chaud', icon: 'fa-solid fa-fire',             color: 'text-rose-500',   bg: 'bg-rose-50 border-rose-200 text-rose-700'   },
  { k: 'warm', label: 'Tiède', icon: 'fa-solid fa-temperature-half', color: 'text-amber-500',  bg: 'bg-amber-50 border-amber-200 text-amber-700' },
  { k: 'cold', label: 'Froid', icon: 'fa-solid fa-snowflake',        color: 'text-sky-500',    bg: 'bg-sky-50 border-sky-200 text-sky-700'       },
];

// ── Reusable UI primitives ────────────────────────────────────────────────────

function SectionCard({ title, icon, badge, action, children }: {
  title: string; icon: string; badge?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 text-[rgb(15,23,42)]">
            <Fa icon={icon} className="text-xs" />
          </span>
          <h3 className="text-sm font-semibold text-gray-800 tracking-tight">{title}</h3>
          {badge}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FieldLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
      <Fa icon={icon} className="text-[10px] text-gray-400" />
      {label}
    </label>
  );
}

function TextInput({ value, onChange, placeholder = '', type = 'text', invalid = false }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; invalid?: boolean;
}) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`
        w-full h-10 rounded-xl border px-3.5 text-sm text-gray-800 placeholder-gray-300 bg-white outline-none
        transition-all duration-150
        focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400
        ${invalid
          ? 'border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-rose-500/20'
          : 'border-gray-200 hover:border-gray-300'}
      `}
    />
  );
}

function SelectInput({ value, onChange, children }: {
  value: string | number | null; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3.5 pr-9 text-sm text-gray-800 outline-none appearance-none
          transition-all duration-150 hover:border-gray-300
          focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
      >
        {children}
      </select>
      <Fa icon="fa-solid fa-chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none" />
    </div>
  );
}

function ValidationError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 mt-1.5 text-[11px] font-medium text-rose-500">
      <Fa icon="fa-solid fa-circle-exclamation" className="text-[10px]" />
      {msg}
    </p>
  );
}

function ReadOnlyRow({ icon, label, value, valueClass = '' }: {
  icon: string; label: string; value: React.ReactNode; valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 h-10 px-3.5 rounded-xl bg-gray-50 border border-gray-100">
      <Fa icon={icon} className="text-[11px] text-gray-400 shrink-0" />
      <span className="text-xs text-gray-400 w-28 shrink-0">{label}</span>
      <span className={`text-sm font-semibold text-gray-700 ${valueClass}`}>{value}</span>
    </div>
  );
}

// ── Sequence step progress ────────────────────────────────────────────────────
function SequenceProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < current ? 'bg-violet-500' : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 font-medium">
        <span>Début</span>
        <span className="text-violet-500 font-semibold">{current}/{total} étapes</span>
        <span>Fin</span>
      </div>
    </div>
  );
}

// ── Decision Maker Card ───────────────────────────────────────────────────────
function DecisionMakerCard({ dm, index, onChange, onDelete }: {
  dm: DecisionMaker; index: number;
  onChange: (field: keyof DecisionMaker, value: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden group">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100 text-[rgb(15,23,42)] text-xs font-bold">
            {index + 1}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{dm.fullName || 'Nouveau contact'}</p>
            {dm.title && <p className="text-[11px] text-gray-400">{dm.title}</p>}
          </div>
          {dm.isNew && (
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 uppercase tracking-wide">
              Nouveau
            </span>
          )}
        </div>
        <button
          onClick={onDelete}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-300 transition-all hover:bg-rose-50 hover:text-rose-500 opacity-0 group-hover:opacity-100"
        >
          <Fa icon="fa-solid fa-trash-can" className="text-xs" />
        </button>
      </div>

      {/* Card body */}
      <div className="p-4 grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel icon="fa-solid fa-user" label="Nom complet" />
          <TextInput value={dm.fullName} onChange={v => onChange('fullName', v)} placeholder="Prénom Nom" />
        </div>
        <div>
          <FieldLabel icon="fa-solid fa-briefcase" label="Poste / Titre" />
          <TextInput value={dm.title} onChange={v => onChange('title', v)} placeholder="Directeur, CEO..." />
        </div>
        <div>
          <FieldLabel icon="fa-solid fa-envelope" label="Email" />
          <TextInput value={dm.email} onChange={v => onChange('email', v)} placeholder="contact@entreprise.ma" type="email" invalid={!!dm.email && !isValidEmail(dm.email)} />
          <ValidationError msg={dm.email && !isValidEmail(dm.email) ? 'Email invalide' : undefined} />
        </div>
        <div>
          <FieldLabel icon="fa-solid fa-phone" label="Téléphone direct" />
          <TextInput value={dm.directPhone} onChange={v => onChange('directPhone', v)} placeholder="+212 6XX XXX XXX" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel icon="fa-brands fa-linkedin" label="LinkedIn" />
          <TextInput value={dm.linkedinUrl} onChange={v => onChange('linkedinUrl', v)} placeholder="https://linkedin.com/in/..." invalid={!!dm.linkedinUrl && !isValidLinkedIn(dm.linkedinUrl)} />
          <ValidationError msg={dm.linkedinUrl && !isValidLinkedIn(dm.linkedinUrl) ? 'URL LinkedIn invalide' : undefined} />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function LeadEditView({ leadId, onClose, onSaved }: {
  leadId: number;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [lead,       setLead]       = useState<LeadDetail | null>(null);
  const [secteurs,   setSecteurs]   = useState<Secteur[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [saved,      setSaved]      = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [leadResp, secteursResp, enrollmentResp] = await Promise.all([
        gateway.get(`/leads/${leadId}`),
        gateway.get('/leads/secteurs'),
        gateway.get(`/leads/${leadId}/enrollment`).catch(e => {
          if (e?.response?.status === 204 || e?.response?.status === 404) return { data: null };
          return { data: null };
        }),
      ]);
      const l = leadResp.data;
      setLead({
        id: l.id, companyName: l.companyName ?? '', address: l.address ?? '',
        city: l.city ?? '', phoneNumber: l.phoneNumber ?? '', email: l.email ?? '',
        website: l.website ?? '', linkedinUrl: l.linkedinUrl ?? '',
        employeeCount: l.employeeCount ?? '', revenueCapital: l.revenueCapital ?? '',
        googleRating: l.googleRating ?? null, googleReviews: l.googleReviews ?? null,
        aiScore: l.aiScore ?? null, temperature: (l.temperature ?? 'cold').toLowerCase(),
        contactStatus: l.contactStatus ?? 'NON_CONTACTE', secteurId: l.secteurId ?? null,
        secteurName: l.secteurName ?? '',
        decisionMakers: (l.decisionMakers ?? []).map((dm: any) => ({
          id: dm.id, fullName: dm.fullName ?? '', title: dm.title ?? '',
          email: dm.email ?? '', directPhone: dm.directPhone ?? '', linkedinUrl: dm.linkedinUrl ?? '',
        })),
      });
      setSecteurs(secteursResp.data ?? []);
      setEnrollment(enrollmentResp?.data ?? null);
    } catch (err: any) {
      setError('Impossible de charger les données du prospect.');
    } finally { setLoading(false); }
  }, [leadId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const validate = (): boolean => {
    if (!lead) return false;
    const errs: Record<string, string> = {};
    if (lead.email && !isValidEmail(lead.email)) errs.email = 'Adresse email invalide';
    if (lead.website && !isValidUrl(normalizeUrl(lead.website))) errs.website = 'URL invalide';
    if (lead.phoneNumber && !isValidPhone(lead.phoneNumber)) errs.phoneNumber = 'Format invalide — ex: 2126XXXXXXXX';
    if (lead.linkedinUrl && !isValidLinkedIn(lead.linkedinUrl)) errs.linkedinUrl = 'URL LinkedIn invalide';
    lead.decisionMakers.forEach((dm, i) => {
      if (dm.email && !isValidEmail(dm.email)) errs[`dm_email_${i}`] = 'Email invalide';
      if (dm.linkedinUrl && !isValidLinkedIn(dm.linkedinUrl)) errs[`dm_linkedin_${i}`] = 'URL LinkedIn invalide';
    });
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const setField = (field: keyof LeadDetail, value: any) => {
    setLead(prev => prev ? { ...prev, [field]: value } : prev);
    setValidationErrors(prev => { const n = { ...prev }; delete n[field as string]; return n; });
  };

  const addDecisionMaker = () =>
    setLead(prev => prev ? {
      ...prev,
      decisionMakers: [...prev.decisionMakers, { fullName: '', title: '', email: '', directPhone: '', linkedinUrl: '', isNew: true }],
    } : prev);

  const updateDecisionMaker = (index: number, field: keyof DecisionMaker, value: string) =>
    setLead(prev => {
      if (!prev) return prev;
      const dms = [...prev.decisionMakers];
      dms[index] = { ...dms[index], [field]: value };
      return { ...prev, decisionMakers: dms };
    });

  const removeDecisionMaker = (index: number) =>
    setLead(prev => {
      if (!prev) return prev;
      const dms = [...prev.decisionMakers];
      dms.splice(index, 1);
      return { ...prev, decisionMakers: dms };
    });

  const handleSave = async () => {
    if (!lead || !validate()) return;
    setSaving(true); setError(null);
    try {
      const website = normalizeUrl(lead.website);
      await gateway.put(`/leads/${lead.id}`, {
        companyName: lead.companyName, address: lead.address, city: lead.city,
        phoneNumber: lead.phoneNumber, email: lead.email, website, linkedinUrl: lead.linkedinUrl,
        employeeCount: lead.employeeCount, revenueCapital: lead.revenueCapital,
        temperature: lead.temperature.toUpperCase(), secteurId: lead.secteurId,
      });
      const freshResp = await gateway.get(`/leads/${lead.id}`);
      const existingIds: number[] = (freshResp.data.decisionMakers ?? []).map((d: any) => d.id);
      const currentIds = lead.decisionMakers.filter(d => d.id).map(d => d.id as number);
      await Promise.all([
        ...existingIds.filter(id => !currentIds.includes(id)).map(dmId => gateway.delete(`/leads/${lead.id}/decision-makers/${dmId}`)),
        ...lead.decisionMakers.filter(d => !d.id).map(dm => gateway.post(`/leads/${lead.id}/decision-makers`, { fullName: dm.fullName, title: dm.title, email: dm.email, directPhone: dm.directPhone, linkedinUrl: dm.linkedinUrl })),
        ...lead.decisionMakers.filter(d => d.id).map(dm => gateway.put(`/leads/${lead.id}/decision-makers/${dm.id}`, { fullName: dm.fullName, title: dm.title, email: dm.email, directPhone: dm.directPhone, linkedinUrl: dm.linkedinUrl })),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved?.();
    } catch { setError('Erreur lors de la sauvegarde.'); }
    finally { setSaving(false); }
  };

  const handleCancelSequence = async () => {
    if (!lead || !window.confirm('Annuler la séquence pour ce prospect ?')) return;
    setCancelling(true);
    try {
      await gateway.post(`/sequences/cancel/${lead.id}`);
      setEnrollment(null);
      setLead(prev => prev ? { ...prev, contactStatus: 'NON_CONTACTE' } : prev);
    } catch { setError("Impossible d'annuler la séquence."); }
    finally { setCancelling(false); }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-violet-200 border-t-violet-500 animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Chargement du prospect...</p>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
          <Fa icon="fa-solid fa-circle-exclamation" className="text-xl text-rose-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Erreur de chargement</p>
          <p className="text-xs text-gray-400 mt-0.5">{error}</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-400 transition-colors">
          <Fa icon="fa-solid fa-rotate-right" /> Réessayer
        </button>
      </div>
    );
  }

  if (!lead) return null;

  const tempConfig = TEMPERATURES.find(t => t.k === lead.temperature);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-[5] bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onClose}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-700 transition-all">
              <Fa icon="fa-solid fa-arrow-left" className="text-xs" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 truncate">{lead.companyName || '—'}</h2>
              <p className="text-xs text-gray-400 truncate">{lead.secteurName}{lead.secteurName && lead.city ? ' · ' : ''}{lead.city}</p>
            </div>
            {/* Temperature badge */}
            {tempConfig && (
              <span className={`hidden sm:flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${tempConfig.bg}`}>
                <Fa icon={tempConfig.icon} className="text-[11px]" />
                {tempConfig.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {saved && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
                <Fa icon="fa-solid fa-circle-check" /> Enregistré
              </span>
            )}
            {error && (
              <span className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-3 py-1.5">
                {error}
              </span>
            )}
            <button onClick={onClose}
              className="h-9 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-400 transition-all">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              className={`flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-semibold text-white transition-all
                ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-[rgb(15,23,42)] hover:bg-[rgb(15,23,42)]/90 shadow-sm shadow-gray-200'}`}>
              <Fa icon={saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'} className="text-xs" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Active Sequence ────────────────────────────────────────────────── */}
      {enrollment && (
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-violet-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500 text-white">
                <Fa icon="fa-solid fa-paper-plane" className="text-xs" />
              </span>
              <h3 className="text-sm font-semibold text-violet-900">Séquence en cours</h3>
            </div>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider
              ${enrollment.status === 'ACTIVE'
                ? 'border-violet-300 bg-violet-100 text-violet-700'
                : 'border-amber-300 bg-amber-100 text-amber-700'}`}>
              {enrollment.status}
            </span>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-violet-400 uppercase tracking-wide">{enrollment.sequenceName}</p>
                <p className="mt-1 text-sm font-bold text-violet-900">
                  Étape {enrollment.currentStepOrder}/{enrollment.totalSteps} — {enrollment.currentStepName}
                </p>
              </div>
              {enrollment.nextExecutionDate && (
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-violet-400 uppercase tracking-wide font-medium">Prochain envoi</p>
                  <p className="text-sm font-bold text-violet-700 mt-0.5">
                    {new Date(enrollment.nextExecutionDate).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
            <SequenceProgress current={enrollment.currentStepOrder} total={enrollment.totalSteps} />
            <button onClick={handleCancelSequence} disabled={cancelling}
              className="flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 disabled:opacity-50">
              <Fa icon={cancelling ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-ban'} className="text-[11px]" />
              {cancelling ? 'Annulation...' : 'Annuler la séquence'}
            </button>
          </div>
        </div>
      )}

      {/* ── Company Info ───────────────────────────────────────────────────── */}
      <SectionCard title="Informations de l'entreprise" icon="fa-solid fa-building">
        <div className="grid gap-5 sm:grid-cols-2">

          <div>
            <FieldLabel icon="fa-solid fa-building" label="Nom de l'entreprise" />
            <TextInput value={lead.companyName} onChange={v => setField('companyName', v)} placeholder="Nom de l'entreprise" />
          </div>

          <div>
            <FieldLabel icon="fa-solid fa-tag" label="Secteur" />
            <SelectInput value={lead.secteurId} onChange={v => setField('secteurId', v ? Number(v) : null)}>
              <option value="">— Sélectionner un secteur —</option>
              {secteurs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </SelectInput>
          </div>

          <div>
            <FieldLabel icon="fa-solid fa-location-dot" label="Ville" />
            <SelectInput value={lead.city} onChange={v => setField('city', v)}>
              <option value="">— Sélectionner une ville —</option>
              {Object.entries(MOROCCAN_REGIONS).map(([region, cities]) => (
                <optgroup key={region} label={region}>
                  {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </optgroup>
              ))}
            </SelectInput>
          </div>

          <div>
            <FieldLabel icon="fa-solid fa-map-pin" label="Adresse" />
            <TextInput value={lead.address} onChange={v => setField('address', v)} placeholder="Adresse complète" />
          </div>

          <div>
            <FieldLabel icon="fa-solid fa-phone" label="Téléphone" />
            <TextInput value={lead.phoneNumber} onChange={v => setField('phoneNumber', v)}
              placeholder="2126XXXXXXXX / 2127XXXXXXXX"
              invalid={!!validationErrors.phoneNumber} />
            <ValidationError msg={validationErrors.phoneNumber} />
          </div>

          <div>
            <FieldLabel icon="fa-solid fa-envelope" label="Email" />
            <TextInput value={lead.email} onChange={v => setField('email', v)}
              placeholder="contact@entreprise.ma" type="email"
              invalid={!!validationErrors.email} />
            <ValidationError msg={validationErrors.email} />
          </div>

          <div>
            <FieldLabel icon="fa-solid fa-globe" label="Site web" />
            <TextInput value={lead.website} onChange={v => setField('website', v)}
              placeholder="www.entreprise.ma"
              invalid={!!validationErrors.website} />
            <ValidationError msg={validationErrors.website} />
          </div>

          <div>
            <FieldLabel icon="fa-brands fa-linkedin" label="LinkedIn" />
            <TextInput value={lead.linkedinUrl} onChange={v => setField('linkedinUrl', v)}
              placeholder="https://linkedin.com/company/..."
              invalid={!!validationErrors.linkedinUrl} />
            <ValidationError msg={validationErrors.linkedinUrl} />
          </div>

          <div>
            <FieldLabel icon="fa-solid fa-users" label="Effectif" />
            <TextInput value={lead.employeeCount} onChange={v => setField('employeeCount', v)} placeholder="1–10, 11–50, 51–200..." />
          </div>

          <div>
            <FieldLabel icon="fa-solid fa-coins" label="CA / Capital" />
            <TextInput value={lead.revenueCapital} onChange={v => setField('revenueCapital', v)} placeholder="ex: 500K MAD" />
          </div>

        </div>
      </SectionCard>

      {/* ── Qualification ──────────────────────────────────────────────────── */}
      <SectionCard title="Qualification" icon="fa-solid fa-chart-simple">
        <div className="grid gap-5 sm:grid-cols-2">

          {/* Temperature picker */}
          <div className="sm:col-span-2">
            <FieldLabel icon="fa-solid fa-thermometer-half" label="Température" />
            <div className="flex gap-2">
              {TEMPERATURES.map(t => (
                <button key={t.k} onClick={() => setField('temperature', t.k)}
                  className={`flex flex-1 items-center justify-center gap-2 h-10 rounded-xl border text-xs font-semibold transition-all
                    ${lead.temperature === t.k
                      ? t.bg + ' shadow-sm'
                      : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}>
                  <Fa icon={t.icon} className={`text-[11px] ${lead.temperature === t.k ? '' : 'opacity-50'}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <ReadOnlyRow icon="fa-solid fa-flag" label="Statut contact" value={lead.contactStatus.replace(/_/g, ' ')} />

          <ReadOnlyRow icon="fa-brands fa-google" label="Note Google"
            value={lead.googleRating != null
              ? `${lead.googleRating} ★${lead.googleReviews != null ? ` · ${lead.googleReviews} avis` : ''}`
              : '—'} />

          <ReadOnlyRow icon="fa-solid fa-brain" label="Score IA"
            value={lead.aiScore ?? '—'}
            valueClass={(lead.aiScore ?? 0) >= 80 ? 'text-emerald-600' : (lead.aiScore ?? 0) >= 60 ? 'text-amber-600' : ''} />

        </div>
      </SectionCard>

      {/* ── Decision Makers ────────────────────────────────────────────────── */}
      <SectionCard
        title="Décideurs"
        icon="fa-solid fa-id-card"
        badge={lead.decisionMakers.length > 0
          ? <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-[rgb(15,23,42)]">{lead.decisionMakers.length}</span>
          : undefined}
        action={
          <button onClick={addDecisionMaker}
            className="flex items-center gap-1.5 rounded-xl bg-[rgb(15,23,42)] hover:bg-[rgb(15,23,42)]/90 px-3.5 py-2 text-xs font-semibold text-white transition-all shadow-sm shadow-gray-200">
            <Fa icon="fa-solid fa-plus" className="text-[10px]" />
            Ajouter
          </button>
        }
      >
        {lead.decisionMakers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Fa icon="fa-solid fa-user-plus" className="text-2xl text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Aucun décideur enregistré</p>
              <p className="text-xs text-gray-400 mt-0.5">Ajoutez les contacts clés de cette entreprise</p>
            </div>
            <button onClick={addDecisionMaker}
              className="flex items-center gap-2 rounded-xl bg-[rgb(15,23,42)] hover:bg-[rgb(15,23,42)]/90 px-4 py-2.5 text-xs font-semibold text-white transition-all mt-1">
              <Fa icon="fa-solid fa-plus" /> Ajouter le premier décideur
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {lead.decisionMakers.map((dm, i) => (
              <DecisionMakerCard
                key={dm.id ?? `new-${i}`}
                dm={dm} index={i}
                onChange={(field, value) => updateDecisionMaker(i, field, value)}
                onDelete={() => removeDecisionMaker(i)}
              />
            ))}
          </div>
        )}
      </SectionCard>

    </div>
  );
}
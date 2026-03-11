'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ── FA helper ─────────────────────────────────────────────────────────────────
const Fa = ({ icon, className = '' }: { icon: string; className?: string }) => (
  <i className={`${icon} ${className}`} aria-hidden="true" />
);

// ── API gateway (same pattern as all other pages) ─────────────────────────────
const gateway = axios.create({
  baseURL: (import.meta as any).env?.VITE_GATEWAY_BASE_URL || 'http://localhost:8081/api',
});

// ── Moroccan cities (shared with account-basic-content) ───────────────────────
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
// Flat sorted list for the dropdown
const ALL_CITIES = Object.entries(MOROCCAN_REGIONS).flatMap(([region, cities]) =>
  cities.map(city => ({ city, region }))
);

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
const isValidEmail   = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidUrl     = (v: string) => !v || /^https?:\/\/.+/.test(v);
const isValidLinkedIn = (v: string) => !v || v.includes('linkedin.com');
// ADD this on line 87:
const isValidPhone = (v: string) =>
    !v || /^(2126\d{8}|2127\d{8}|05\d{8})$/.test(v.replace(/[\s\-\.]/g, ''));

function normalizeUrl(v: string): string {
  if (!v) return v;
  if (!/^https?:\/\//.test(v)) return 'https://' + v;
  return v;
}

// ── Temperature config ────────────────────────────────────────────────────────
const TEMPERATURES = [
  { k: 'hot',  label: 'Chaud', icon: 'fa-solid fa-fire',            badge: 'bg-red-50 text-red-700 border-red-200'       },
  { k: 'warm', label: 'Tiède', icon: 'fa-solid fa-temperature-half', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { k: 'cold', label: 'Froid', icon: 'fa-solid fa-snowflake',        badge: 'bg-slate-50 text-slate-600 border-slate-200' },
];

// ── Sequence step progress bar ────────────────────────────────────────────────
function SequenceStepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 flex-1 rounded-full transition-all',
            i < current  ? 'bg-indigo-500' :
            i === current - 1 ? 'bg-indigo-500' :
            'bg-slate-200'
          )}
        />
      ))}
    </div>
  );
}

// ── Field + input helpers ─────────────────────────────────────────────────────
function Field({ label, icon, error, children }: {
  label: string; icon: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Fa icon={icon} className="text-[11px]" />
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] font-medium text-red-500">{error}</p>}
    </div>
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
      className={cn(
        'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-300 outline-none transition focus:ring-2 focus:ring-slate-100',
        invalid ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-slate-400'
      )}
    />
  );
}

// ── Decision maker card ───────────────────────────────────────────────────────
function DecisionMakerCard({ dm, index, onChange, onDelete }: {
  dm: DecisionMaker; index: number;
  onChange: (field: keyof DecisionMaker, value: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-slate-700">
            {dm.fullName || 'Nouveau contact'}
          </span>
          {dm.isNew && (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
              Nouveau
            </span>
          )}
        </div>
        <button
          onClick={onDelete}
          className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
        >
          <Fa icon="fa-solid fa-trash-can" className="text-[12px]" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nom complet" icon="fa-solid fa-user">
          <TextInput value={dm.fullName} onChange={v => onChange('fullName', v)} placeholder="Prénom Nom" />
        </Field>
        <Field label="Poste / Titre" icon="fa-solid fa-briefcase">
          <TextInput value={dm.title} onChange={v => onChange('title', v)} placeholder="Directeur, CEO..." />
        </Field>
        <Field label="Email" icon="fa-solid fa-envelope"
          error={dm.email && !isValidEmail(dm.email) ? 'Email invalide' : undefined}>
          <TextInput value={dm.email} onChange={v => onChange('email', v)}
            placeholder="contact@entreprise.ma" type="email"
            invalid={!!dm.email && !isValidEmail(dm.email)} />
        </Field>
        <Field label="Téléphone direct" icon="fa-solid fa-phone">
          <TextInput value={dm.directPhone} onChange={v => onChange('directPhone', v)} placeholder="+212 6XX XXX XXX" />
        </Field>
        <Field label="LinkedIn" icon="fa-brands fa-linkedin"
          error={dm.linkedinUrl && !isValidLinkedIn(dm.linkedinUrl) ? 'URL LinkedIn invalide' : undefined}>
          <TextInput value={dm.linkedinUrl} onChange={v => onChange('linkedinUrl', v)}
            placeholder="https://linkedin.com/in/..."
            invalid={!!dm.linkedinUrl && !isValidLinkedIn(dm.linkedinUrl)} />
        </Field>
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

  // ── Validation errors state ────────────────────────────────────────────────
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadResp, secteursResp, enrollmentResp] = await Promise.all([
        gateway.get(`/leads/${leadId}`),
        gateway.get('/leads/secteurs'),
        gateway.get(`/leads/${leadId}/enrollment`).catch(e => {
          // 204 No Content means no active enrollment — that's fine
          if (e?.response?.status === 204 || e?.response?.status === 404) return { data: null, status: 204 };
          return { data: null, status: 204 };
        }),
      ]);

      const l = leadResp.data;
      setLead({
        id:             l.id,
        companyName:    l.companyName    ?? '',
        address:        l.address        ?? '',
        city:           l.city           ?? '',
        phoneNumber:    l.phoneNumber    ?? '',
        email:          l.email          ?? '',
        website:        l.website        ?? '',
        linkedinUrl:    l.linkedinUrl    ?? '',
        employeeCount:  l.employeeCount  ?? '',
        revenueCapital: l.revenueCapital ?? '',
        googleRating:   l.googleRating   ?? null,
        googleReviews:  l.googleReviews  ?? null,
        aiScore:        l.aiScore        ?? null,
        temperature:    (l.temperature   ?? 'cold').toLowerCase(),
        contactStatus:  l.contactStatus  ?? 'NON_CONTACTE',
        secteurId:      l.secteurId      ?? null,
        secteurName:    l.secteurName    ?? '',
        decisionMakers: (l.decisionMakers ?? []).map((dm: any) => ({
          id: dm.id, fullName: dm.fullName ?? '', title: dm.title ?? '',
          email: dm.email ?? '', directPhone: dm.directPhone ?? '', linkedinUrl: dm.linkedinUrl ?? '',
        })),
      });

      setSecteurs(secteursResp.data ?? []);
      setEnrollment(enrollmentResp?.data ?? null);
    } catch (err: any) {
      console.error('[LeadEdit] fetch failed', err);
      setError('Impossible de charger les données du prospect.');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Validate before save ───────────────────────────────────────────────────
  const validate = (): boolean => {
    if (!lead) return false;
    const errs: Record<string, string> = {};
    if (lead.email && !isValidEmail(lead.email))
      errs.email = 'Adresse email invalide';
    if (lead.website && !isValidUrl(normalizeUrl(lead.website)))
      errs.website = 'URL invalide (doit commencer par http:// ou https://)';
    if (lead.phoneNumber && !isValidPhone(lead.phoneNumber))
        errs.phoneNumber = 'Format invalide — ex: 2126XXXXXXXX, 2127XXXXXXXX ou 05XXXXXXXX';
    if (lead.linkedinUrl && !isValidLinkedIn(lead.linkedinUrl))
      errs.linkedinUrl = 'URL LinkedIn invalide';
    lead.decisionMakers.forEach((dm, i) => {
      if (dm.email && !isValidEmail(dm.email))
        errs[`dm_email_${i}`] = 'Email invalide';
      if (dm.linkedinUrl && !isValidLinkedIn(dm.linkedinUrl))
        errs[`dm_linkedin_${i}`] = 'URL LinkedIn invalide';
    });
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Field updaters ─────────────────────────────────────────────────────────
  const setField = (field: keyof LeadDetail, value: any) => {
    setLead(prev => prev ? { ...prev, [field]: value } : prev);
    setValidationErrors(prev => { const n = { ...prev }; delete n[field as string]; return n; });
  };

  const addDecisionMaker = () =>
    setLead(prev => prev ? {
      ...prev,
      decisionMakers: [...prev.decisionMakers,
        { fullName: '', title: '', email: '', directPhone: '', linkedinUrl: '', isNew: true }],
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

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!lead || !validate()) return;
    setSaving(true);
    setError(null);
    try {
      // Normalize URLs before sending
      const website    = normalizeUrl(lead.website);
      const linkedinUrl = lead.linkedinUrl;

      await gateway.put(`/leads/${lead.id}`, {
        companyName:    lead.companyName,
        address:        lead.address,
        city:           lead.city,
        phoneNumber:    lead.phoneNumber,
        email:          lead.email,
        website,
        linkedinUrl,
        employeeCount:  lead.employeeCount,
        revenueCapital: lead.revenueCapital,
        temperature:    lead.temperature.toUpperCase(),
        secteurId:      lead.secteurId,
      });

      // Decision makers: sync against fresh server state
      const freshResp = await gateway.get(`/leads/${lead.id}`);
      const existingIds: number[] = (freshResp.data.decisionMakers ?? []).map((d: any) => d.id);
      const currentIds = lead.decisionMakers.filter(d => d.id).map(d => d.id as number);

      await Promise.all([
        // Delete removed ones
        ...existingIds.filter(id => !currentIds.includes(id)).map(dmId =>
          gateway.delete(`/leads/${lead.id}/decision-makers/${dmId}`)
        ),
        // Create new ones
        ...lead.decisionMakers.filter(d => !d.id).map(dm =>
          gateway.post(`/leads/${lead.id}/decision-makers`, {
            fullName: dm.fullName, title: dm.title, email: dm.email,
            directPhone: dm.directPhone, linkedinUrl: dm.linkedinUrl,
          })
        ),
        // Update existing ones
        ...lead.decisionMakers.filter(d => d.id).map(dm =>
          gateway.put(`/leads/${lead.id}/decision-makers/${dm.id}`, {
            fullName: dm.fullName, title: dm.title, email: dm.email,
            directPhone: dm.directPhone, linkedinUrl: dm.linkedinUrl,
          })
        ),
      ]);

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved?.();
    } catch (err: any) {
      console.error('[LeadEdit] save failed', err);
      setError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  // ── Cancel sequence ────────────────────────────────────────────────────────
  const handleCancelSequence = async () => {
    if (!lead) return;
    if (!window.confirm('Annuler la séquence pour ce prospect ?')) return;
    setCancelling(true);
    try {
      await gateway.post(`/sequences/cancel/${lead.id}`);
      setEnrollment(null);
      setLead(prev => prev ? { ...prev, contactStatus: 'NON_CONTACTE' } : prev);
    } catch (err: any) {
      console.error('[LeadEdit] cancel sequence failed', err);
      setError('Impossible d\'annuler la séquence.');
    } finally {
      setCancelling(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-slate-400">
        <Fa icon="fa-solid fa-spinner fa-spin" className="mr-2 text-base" />
        Chargement du prospect...
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Fa icon="fa-solid fa-circle-exclamation" className="text-2xl text-red-400" />
        <p className="text-sm font-medium text-red-600">{error}</p>
        <button onClick={fetchData}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400">
          <Fa icon="fa-solid fa-rotate-right" className="mr-1.5" /> Réessayer
        </button>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="grid gap-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-400 hover:text-slate-700">
            <Fa icon="fa-solid fa-arrow-left" className="text-sm" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900">{lead.companyName || '—'}</h2>
            <p className="text-xs text-slate-400">{lead.secteurName} · {lead.city}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <Fa icon="fa-solid fa-circle-check" /> Enregistré
            </span>
          )}
          {error && <span className="text-xs font-medium text-red-600">{error}</span>}
          <button onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition',
              saving ? 'cursor-not-allowed bg-slate-400' : 'bg-slate-900 hover:bg-slate-700'
            )}>
            <Fa icon={saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'} />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* ── Active sequence card (only shown if enrolled) ───────────────────── */}
      {enrollment && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader className="border-b border-indigo-100 pb-3 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
                <Fa icon="fa-solid fa-paper-plane" className="text-indigo-500" />
                Séquence en cours
              </CardTitle>
              <span className={cn(
                'rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                enrollment.status === 'ACTIVE'
                  ? 'border-indigo-300 bg-indigo-100 text-indigo-700'
                  : 'border-amber-300 bg-amber-100 text-amber-700'
              )}>
                {enrollment.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {/* Sequence name + step names */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-indigo-500 font-medium">{enrollment.sequenceName}</p>
                <p className="mt-0.5 text-sm font-semibold text-indigo-900">
                  Étape {enrollment.currentStepOrder}/{enrollment.totalSteps} — {enrollment.currentStepName}
                </p>
              </div>
              {enrollment.nextExecutionDate && (
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-indigo-400">Prochain envoi</p>
                  <p className="text-xs font-semibold text-indigo-700">
                    {new Date(enrollment.nextExecutionDate).toLocaleDateString('fr-MA', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <SequenceStepBar
              current={enrollment.currentStepOrder}
              total={enrollment.totalSteps}
            />

            {/* Step labels */}
            <div className="flex justify-between text-[10px] text-indigo-400">
              <span>Étape 1</span>
              <span>Étape {enrollment.totalSteps}</span>
            </div>

            {/* Cancel button */}
            <div className="pt-1">
              <button
                onClick={handleCancelSequence}
                disabled={cancelling}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:opacity-50"
              >
                <Fa icon={cancelling ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-ban'} className="text-[11px]" />
                {cancelling ? 'Annulation...' : 'Annuler la séquence'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Company info ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="border-b border-slate-100 bg-slate-50 pb-3 pt-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Fa icon="fa-solid fa-building" className="text-slate-500" />
            Informations de l'entreprise
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">

          <Field label="Nom de l'entreprise" icon="fa-solid fa-building">
            <TextInput value={lead.companyName} onChange={v => setField('companyName', v)}
              placeholder="Nom de l'entreprise" />
          </Field>

          <Field label="Secteur" icon="fa-solid fa-tag">
            <select
              value={lead.secteurId ?? ''}
              onChange={e => setField('secteurId', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              <option value="">— Sélectionner un secteur —</option>
              {secteurs.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>

          {/* City: grouped by region */}
          <Field label="Ville" icon="fa-solid fa-location-dot">
            <select
              value={lead.city}
              onChange={e => setField('city', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              <option value="">— Sélectionner une ville —</option>
              {Object.entries(MOROCCAN_REGIONS).map(([region, cities]) => (
                <optgroup key={region} label={region}>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          <Field label="Adresse" icon="fa-solid fa-map-pin">
            <TextInput value={lead.address} onChange={v => setField('address', v)}
              placeholder="Adresse complète" />
          </Field>

            <Field label="Téléphone" icon="fa-solid fa-phone"
            error={validationErrors.phoneNumber}>
            <TextInput value={lead.phoneNumber} onChange={v => setField('phoneNumber', v)}
                placeholder="2126XXXXXXXX / 2127XXXXXXXX / 05XXXXXXXX"
                invalid={!!validationErrors.phoneNumber} />
            </Field>

          <Field label="Email" icon="fa-solid fa-envelope"
            error={validationErrors.email}>
            <TextInput value={lead.email} onChange={v => setField('email', v)}
              placeholder="contact@entreprise.ma" type="email"
              invalid={!!validationErrors.email} />
          </Field>

          <Field label="Site web" icon="fa-solid fa-globe"
            error={validationErrors.website}>
            <TextInput value={lead.website} onChange={v => setField('website', v)}
              placeholder="www.entreprise.ma"
              invalid={!!validationErrors.website} />
          </Field>

          <Field label="LinkedIn" icon="fa-brands fa-linkedin"
            error={validationErrors.linkedinUrl}>
            <TextInput value={lead.linkedinUrl} onChange={v => setField('linkedinUrl', v)}
              placeholder="https://linkedin.com/company/..."
              invalid={!!validationErrors.linkedinUrl} />
          </Field>

          <Field label="Effectif" icon="fa-solid fa-users">
            <TextInput value={lead.employeeCount} onChange={v => setField('employeeCount', v)}
              placeholder="1-10, 11-50, 51-200..." />
          </Field>

          <Field label="CA / Capital" icon="fa-solid fa-coins">
            <TextInput value={lead.revenueCapital} onChange={v => setField('revenueCapital', v)}
              placeholder="ex: 500K MAD" />
          </Field>

        </CardContent>
      </Card>

      {/* ── Qualification ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="border-b border-slate-100 bg-slate-50 pb-3 pt-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Fa icon="fa-solid fa-chart-simple" className="text-slate-500" />
            Qualification
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">

          {/* Temperature picker */}
          <Field label="Température" icon="fa-solid fa-thermometer-half">
            <div className="flex gap-2">
              {TEMPERATURES.map(t => (
                <button
                  key={t.k}
                  onClick={() => setField('temperature', t.k)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition',
                    lead.temperature === t.k
                      ? t.badge + ' shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  )}
                >
                  <Fa icon={t.icon} className="text-[11px]" />
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Contact status — read-only display */}
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
            <Fa icon="fa-solid fa-flag" className="text-[12px] text-slate-400" />
            <span className="text-xs text-slate-400 w-24 shrink-0">Statut contact</span>
            <span className="text-xs font-semibold text-slate-700">
              {lead.contactStatus.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Read-only Google data */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <Fa icon="fa-brands fa-google" className="text-[12px] text-slate-400" />
            <span className="text-xs text-slate-400 w-24 shrink-0">Note Google</span>
            <span className="text-sm font-semibold text-slate-700">
              {lead.googleRating != null ? `${lead.googleRating} ★` : '—'}
              {lead.googleReviews != null ? ` · ${lead.googleReviews} avis` : ''}
            </span>
          </div>

          {/* Read-only AI score */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <Fa icon="fa-solid fa-brain" className="text-[12px] text-slate-400" />
            <span className="text-xs text-slate-400 w-24 shrink-0">Score IA</span>
            <span className={cn(
              'text-sm font-bold tabular-nums',
              (lead.aiScore ?? 0) >= 80 ? 'text-emerald-600' :
              (lead.aiScore ?? 0) >= 60 ? 'text-amber-600' : 'text-slate-500'
            )}>
              {lead.aiScore ?? '—'}
            </span>
          </div>

        </CardContent>
      </Card>

      {/* ── Decision makers ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="border-b border-slate-100 bg-slate-50 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Fa icon="fa-solid fa-id-card" className="text-slate-500" />
              Décideurs
              {lead.decisionMakers.length > 0 && (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {lead.decisionMakers.length}
                </span>
              )}
            </CardTitle>
            <button onClick={addDecisionMaker}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700">
              <Fa icon="fa-solid fa-plus" className="text-[10px]" />
              Ajouter
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-5">
          {lead.decisionMakers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Fa icon="fa-solid fa-user-slash" className="text-2xl text-slate-300" />
              <p className="text-sm text-slate-400">Aucun décideur enregistré</p>
              <button onClick={addDecisionMaker}
                className="mt-1 text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700">
                + Ajouter le premier décideur
              </button>
            </div>
          ) : (
            lead.decisionMakers.map((dm, i) => (
              <DecisionMakerCard
                key={dm.id ?? `new-${i}`}
                dm={dm}
                index={i}
                onChange={(field, value) => updateDecisionMaker(i, field, value)}
                onDelete={() => removeDecisionMaker(i)}
              />
            ))
          )}
        </CardContent>
      </Card>

    </div>
  );
}
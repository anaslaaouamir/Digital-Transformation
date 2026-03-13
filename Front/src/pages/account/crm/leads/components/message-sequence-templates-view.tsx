import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, Clock3, RefreshCw, Save, ChevronDown, ChevronUp, Variable } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MessageSequenceTemplateStep {
  id: number;
  templateId: number;
  title: string;
  stepOrder: number;
  delayDays: number;
  subject: string;
  body: string;
  category: string;
  sequenceName: string;
}

interface ApiSequenceStep {
  id: number;
  delayDays: number;
  stepOrder: number;
  sequence: { id: number; name: string };
  template: { id: number; name: string; subject: string; body: string; category: string };
}

// ── API gateway ───────────────────────────────────────────────────────────────
const gateway = axios.create({
  baseURL: (import.meta as any).env?.VITE_GATEWAY_BASE_URL || 'http://localhost:8081/api',
});

function mapApiStep(step: ApiSequenceStep): MessageSequenceTemplateStep {
  return {
    id: step.id, templateId: step.template.id,
    title: `Étape ${step.stepOrder} — ${step.template.name}`,
    stepOrder: step.stepOrder, delayDays: step.delayDays,
    subject: step.template.subject, body: step.template.body,
    category: step.template.category, sequenceName: step.sequence.name,
  };
}

const currentLeadInfo = ['{{company}}', '{{firstName}}', '{{lastName}}', '{{city}}'];

export const applyMessageTemplateVariables = (
  template: Pick<MessageSequenceTemplateStep, 'subject' | 'body'>,
  vars: Record<string, string>,
) => {
  let subject = template.subject;
  let body = template.body;
  Object.entries(vars).forEach(([key, value]) => {
    subject = subject.split(key).join(value);
    body = body.split(key).join(value);
  });
  return { subject, body };
};

// ── Category color map ────────────────────────────────────────────────────────
const CATEGORY_STYLES: Record<string, string> = {
  EMAIL:    'bg-[rgb(15,23,42)]/5 text-[rgb(15,23,42)] border-[rgb(15,23,42)]/10',
  LINKEDIN: 'bg-sky-100 text-sky-700 border-sky-200',
  SMS:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  CALL:     'bg-amber-100 text-amber-700 border-amber-200',
};

const getCategoryStyle = (cat: string) =>
  CATEGORY_STYLES[cat?.toUpperCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ order, total }: { order: number; total: number }) {
  const progress = (order / total) * 100;
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="12" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle cx="16" cy="16" r="12" fill="none" stroke="rgb(15, 23, 42)" strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 12}`}
            strokeDashoffset={`${2 * Math.PI * 12 * (1 - progress / 100)}`}
            strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[rgb(15,23,42)]">
          {order}
        </span>
      </div>
    </div>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────
function TemplateCard({
  template, total, isDirty, onUpdate,
}: {
  template: MessageSequenceTemplateStep;
  total: number;
  isDirty: boolean;
  onUpdate: (stepId: number, changes: Partial<Pick<MessageSequenceTemplateStep, 'delayDays' | 'subject' | 'body'>>) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm
      ${isDirty ? 'border-[rgb(15,23,42)]/20 shadow-[rgb(15,23,42)]/5' : 'border-gray-100'}`}>

      {/* Card header — always visible */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <StepIndicator order={template.stepOrder} total={total} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800 truncate">{template.title}</span>
            {isDirty && (
              <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-[rgb(15,23,42)]" title="Modifié" />
            )}
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{template.subject || 'Aucun sujet'}</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Delay badge */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
            <Clock3 className="w-3 h-3" />
            J+{template.delayDays}
          </div>
          {/* Category badge */}
          <span className={`hidden sm:block rounded-xl border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getCategoryStyle(template.category)}`}>
            {template.category}
          </span>
          {/* Expand icon */}
          <div className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* Expandable body */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/30 p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            {/* Delay input */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <Clock3 className="w-3 h-3 text-gray-400" />
                Délai d&apos;envoi (jours)
              </label>
              <div className="relative">
                <input
                  type="number" min={0}
                  value={template.delayDays}
                  onChange={e => onUpdate(template.id, { delayDays: Math.max(0, Number(e.target.value || 0)) })}
                  className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3.5 pr-10 text-sm text-gray-800 outline-none
                    focus:ring-2 focus:ring-[rgb(15,23,42)]/10 focus:border-[rgb(15,23,42)]/40 hover:border-gray-300 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">j</span>
              </div>
            </div>

            {/* Subject input */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Sujet de l&apos;email
              </label>
              <input
                value={template.subject}
                onChange={e => onUpdate(template.id, { subject: e.target.value })}
                placeholder="Objet du message..."
                className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-800 placeholder-gray-300 outline-none
                  focus:ring-2 focus:ring-[rgb(15,23,42)]/10 focus:border-[rgb(15,23,42)]/40 hover:border-gray-300 transition-all"
              />
            </div>
          </div>

          {/* Body textarea */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Corps du message
            </label>
            <textarea
              rows={7}
              value={template.body}
              onChange={e => onUpdate(template.id, { body: e.target.value })}
              placeholder="Régigez le corps du message ici..."
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-800 placeholder-gray-300 outline-none resize-y
                focus:ring-2 focus:ring-[rgb(15,23,42)]/10 focus:border-[rgb(15,23,42)]/40 hover:border-gray-300 transition-all leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface MessageSequenceTemplatesViewProps {
  onTemplatesSaved?: (templates: MessageSequenceTemplateStep[]) => void;
}

export function MessageSequenceTemplatesView({ onTemplatesSaved }: MessageSequenceTemplatesViewProps) {
  const [savedTemplates,  setSavedTemplates]  = useState<MessageSequenceTemplateStep[]>([]);
  const [draftTemplates,  setDraftTemplates]  = useState<MessageSequenceTemplateStep[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [loadError,       setLoadError]       = useState<string | null>(null);
  const [saveState,       setSaveState]       = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const fetchTemplates = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const resp = await gateway.get('/templates');
      const raw: ApiSequenceStep[] = resp?.data ?? [];
      const mapped = [...raw].sort((a, b) => a.stepOrder - b.stepOrder).map(mapApiStep);
      setSavedTemplates(mapped);
      setDraftTemplates(mapped.map(t => ({ ...t })));
    } catch {
      setLoadError('Impossible de charger les templates depuis le serveur.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const isDirty = useMemo(
    () => JSON.stringify(savedTemplates) !== JSON.stringify(draftTemplates),
    [draftTemplates, savedTemplates],
  );

  const dirtyIds = useMemo(
    () => new Set(draftTemplates.filter((d, i) => JSON.stringify(d) !== JSON.stringify(savedTemplates[i])).map(d => d.id)),
    [draftTemplates, savedTemplates],
  );

  const updateTemplate = (stepId: number, changes: Partial<Pick<MessageSequenceTemplateStep, 'delayDays' | 'subject' | 'body'>>) => {
    setDraftTemplates(prev => prev.map(t => t.id === stepId ? { ...t, ...changes } : t));
    setSaveState('idle');
  };

  const restoreSaved = () => {
    setDraftTemplates(savedTemplates.map(t => ({ ...t })));
    setSaveState('idle');
  };

  const saveChanges = async () => {
    setSaveState('saving');
    try {
      const payload = draftTemplates.map(draft => ({
        templateId: draft.templateId, subject: draft.subject,
        body: draft.body, delayDays: draft.delayDays,
      }));
      await gateway.put('/templates/bulk-update', payload);
      setSavedTemplates(draftTemplates.map(t => ({ ...t })));
      onTemplatesSaved?.(draftTemplates.map(t => ({ ...t })));
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('error');
    }
  };

  const sequenceName = draftTemplates[0]?.sequenceName;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* ── Header card ───────────────────────────────────────────────────── */}
      <div className="bg-white/90 backdrop-blur-sm sticky top-0 z-[5] rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">Templates de séquence</h2>
              {sequenceName
                ? <p className="text-sm text-gray-400 mt-0.5">Séquence : <span className="font-semibold text-[rgb(15,23,42)]">{sequenceName}</span></p>
                : <p className="text-sm text-gray-400 mt-0.5">Gérez les messages envoyés par étape</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {saveState === 'saved' && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enregistré
                </span>
              )}
              {saveState === 'error' && (
                <span className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-3 py-1.5">
                  Erreur d&apos;enregistrement
                </span>
              )}
              <button onClick={restoreSaved} disabled={!isDirty || loading}
                className="h-9 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600
                  hover:border-gray-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                Annuler
              </button>
              <button onClick={saveChanges} disabled={!isDirty || loading || saveState === 'saving'}
                className={`flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-semibold text-white transition-all
                  ${!isDirty || saveState === 'saving'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[rgb(15,23,42)] hover:bg-[rgb(15,23,42)]/90 shadow-sm shadow-gray-200'}`}>
                <Save className="w-3.5 h-3.5" />
                {saveState === 'saving' ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>

        {/* Variable pills */}
        <div className="px-6 py-4 flex flex-wrap gap-2 items-center bg-gray-50/50">
          <span className="text-xs text-gray-400 font-medium mr-1">Variables disponibles :</span>
          {currentLeadInfo.map(variable => (
            <span key={variable}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(15,23,42)]/10 bg-[rgb(15,23,42)]/5 px-2.5 py-1 text-xs font-semibold text-[rgb(15,23,42)] font-mono">
              {variable}
            </span>
          ))}
          <span className="text-xs text-gray-400 ml-1">→ remplacées automatiquement à l&apos;envoi</span>
        </div>
      </div>

      {/* ── Loading state ─────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[rgb(15,23,42)]/10 border-t-[rgb(15,23,42)] animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Chargement des templates...</p>
        </div>
      )}

      {/* ── Error state ───────────────────────────────────────────────────── */}
      {!loading && loadError && (
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto">
            <span className="text-2xl text-rose-400">✕</span>
          </div>
          <p className="text-sm font-semibold text-gray-800">{loadError}</p>
          <button onClick={fetchTemplates}
            className="flex items-center gap-2 mx-auto rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-400 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Réessayer
          </button>
        </div>
      )}

      {/* ── Timeline + cards ──────────────────────────────────────────────── */}
      {!loading && !loadError && (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[26px] top-8 bottom-8 w-px bg-gradient-to-b from-[rgb(15,23,42)]/20 via-[rgb(15,23,42)]/10 to-transparent z-0 hidden sm:block" />

          <div className="space-y-3 relative z-[5]">
            {draftTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                total={draftTemplates.length}
                isDirty={dirtyIds.has(template.id)}
                onUpdate={updateTemplate}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!loading && !loadError && draftTemplates.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
            <span className="text-3xl">📭</span>
          </div>
          <p className="text-sm font-semibold text-gray-600">Aucun template configuré</p>
          <p className="text-xs text-gray-400">Les templates de séquence apparaîtront ici une fois créés.</p>
        </div>
      )}

    </div>
  );
}
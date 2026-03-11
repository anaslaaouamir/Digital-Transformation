import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, Clock3, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MessageSequenceTemplateStep {
  id: number;           // sequence step id
  templateId: number;   // template.id from API
  title: string;        // e.g. "Étape 1 — Première approche"
  stepOrder: number;
  delayDays: number;
  subject: string;
  body: string;
  category: string;
  sequenceName: string;
}

// Raw shape returned by GET /api/templates
interface ApiSequenceStep {
  id: number;
  delayDays: number;
  stepOrder: number;
  sequence: {
    id: number;
    name: string;
  };
  template: {
    id: number;
    name: string;
    subject: string;
    body: string;
    category: string;
  };
}

// ── API gateway (same pattern as account-basic-content & crm) ─────────────────

const gateway = axios.create({
  baseURL: (import.meta as any).env?.VITE_GATEWAY_BASE_URL || 'http://localhost:8081/api',
});

// ── Mapping helper ────────────────────────────────────────────────────────────

function mapApiStep(step: ApiSequenceStep): MessageSequenceTemplateStep {
  return {
    id: step.id,
    templateId: step.template.id,
    title: `Étape ${step.stepOrder} — ${step.template.name}`,
    stepOrder: step.stepOrder,
    delayDays: step.delayDays,
    subject: step.template.subject,
    body: step.template.body,
    category: step.template.category,
    sequenceName: step.sequence.name,
  };
}

// ── Variable helpers ──────────────────────────────────────────────────────────

const currentLeadInfo = ['{{company}}'];

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

// ── Component ─────────────────────────────────────────────────────────────────

interface MessageSequenceTemplatesViewProps {
  onTemplatesSaved?: (templates: MessageSequenceTemplateStep[]) => void;
}

export function MessageSequenceTemplatesView({
  onTemplatesSaved,
}: MessageSequenceTemplatesViewProps) {
  const [savedTemplates, setSavedTemplates] = useState<MessageSequenceTemplateStep[]>([]);
  const [draftTemplates, setDraftTemplates] = useState<MessageSequenceTemplateStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // ── Fetch from API ──────────────────────────────────────────────────────────
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const resp = await gateway.get('/templates');
      const raw: ApiSequenceStep[] = resp?.data ?? [];
      const mapped = [...raw]
        .sort((a, b) => a.stepOrder - b.stepOrder)
        .map(mapApiStep);
      setSavedTemplates(mapped);
      setDraftTemplates(mapped.map(t => ({ ...t })));
    } catch (err: any) {
      console.error('[GET /templates] failed', err);
      setLoadError('Impossible de charger les templates depuis le serveur.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ── Dirty check ─────────────────────────────────────────────────────────────
  const isDirty = useMemo(
    () => JSON.stringify(savedTemplates) !== JSON.stringify(draftTemplates),
    [draftTemplates, savedTemplates],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  const updateTemplate = (
    stepId: number,
    changes: Partial<Pick<MessageSequenceTemplateStep, 'delayDays' | 'subject' | 'body'>>,
  ) => {
    setDraftTemplates(prev =>
      prev.map(t => (t.id === stepId ? { ...t, ...changes } : t)),
    );
    setSaveState('idle');
  };

  const restoreSaved = () => {
    setDraftTemplates(savedTemplates.map(t => ({ ...t })));
    setSaveState('idle');
  };

  // Save: PUT /templates/bulk-update — sends all templates in one request
  const saveChanges = async () => {
    setSaveState('saving');
    try {
      const payload = draftTemplates.map(draft => ({
        templateId: draft.templateId,
        subject: draft.subject,
        body: draft.body,
        delayDays: draft.delayDays,
      }));

      await gateway.put('/templates/bulk-update', payload);

      setSavedTemplates(draftTemplates.map(t => ({ ...t })));
      onTemplatesSaved?.(draftTemplates.map(t => ({ ...t })));
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 2500);
    } catch (err: any) {
      console.error('[PUT /templates] failed', err);
      setSaveState('error');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Templates de séquence</CardTitle>
          <CardDescription>
            {draftTemplates[0]?.sequenceName
              ? `Séquence : ${draftTemplates[0].sequenceName}`
              : 'Gérez les messages envoyés par étape avec leur délai, sujet et corps.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Variable badges */}
          <div className="flex flex-wrap gap-2 text-xs">
            {currentLeadInfo.map(variable => (
              <span
                key={variable}
                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-600"
              >
                {variable}
              </span>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            {'Les changements entre "{{...}}" sont remplacés par les données du prospect.'}
          </p>
            <div className="flex flex-wrap gap-2">
              
              <Button
                size="sm"
                variant="outline"
                onClick={restoreSaved}
                disabled={!isDirty || loading}
              >
                Annuler les modifications
              </Button>
              <Button
                size="sm"
                onClick={saveChanges}
                disabled={!isDirty || loading || saveState === 'saving'}
              >
                <Save className="size-3.5" />
                {saveState === 'saving' ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>

          {/* Status messages */}
          {saveState === 'saved' && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="size-3.5" />
              Modifications enregistrées.
            </p>
          )}
          {saveState === 'error' && (
            <p className="text-xs font-medium text-red-600">
              Erreur lors de l'enregistrement des templates.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-sm text-slate-400">
            <RefreshCw className="mr-2 size-4 animate-spin" />
            Chargement des templates...
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {!loading && loadError && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm font-medium text-red-600">{loadError}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={fetchTemplates}>
              <RefreshCw className="size-3.5" /> Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Template cards */}
      {!loading && !loadError && (
        <div className="grid gap-4">
          {draftTemplates.map(template => (
            <Card key={template.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{template.title}</CardTitle>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {template.category}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                  <div>
                    <label className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <Clock3 className="size-3.5" />
                      Délai d&apos;envoi (jours)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={template.delayDays}
                      onChange={e =>
                        updateTemplate(template.id, {
                          delayDays: Math.max(0, Number(e.target.value || 0)),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                      Sujet
                    </label>
                    <Input
                      value={template.subject}
                      onChange={e =>
                        updateTemplate(template.id, { subject: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                    Corps du message
                  </label>
                  <Textarea
                    rows={8}
                    value={template.body}
                    onChange={e =>
                      updateTemplate(template.id, { body: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
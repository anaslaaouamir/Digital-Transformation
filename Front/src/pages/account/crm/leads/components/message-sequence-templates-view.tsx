import { useMemo, useState } from 'react';
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

export interface MessageSequenceTemplateStep {
  id: number;
  title: string;
  delayDays: number;
  subject: string;
  body: string;
}

export const MESSAGE_SEQUENCE_TEMPLATES_STORAGE_KEY =
  'crm_message_sequence_templates_v1';

export const DEFAULT_MESSAGE_SEQUENCE_TEMPLATES: MessageSequenceTemplateStep[] = [
  {
    id: 1,
    title: 'Étape 1 (Template 1)',
    delayDays: 0,
    subject: 'Collaboration digitale — {{company}}',
    body: `Bonjour,

J'ai récemment découvert {{company}} et j'ai été très impressionné par votre positionnement.
Chez ELBAHI.NET, nous accompagnons les entreprises de votre secteur pour optimiser leur présence en ligne et générer plus d'opportunités.

Aimeriez-vous que l'on prenne 10 minutes la semaine prochaine pour discuter des leviers de croissance adaptés à {{company}} ?

Excellente journée,
Cordialement,`,
  },
  {
    id: 2,
    title: 'Étape 2 (Template 2)',
    delayDays: 3,
    subject: 'Re: Collaboration digitale — {{company}}',
    body: `Bonjour,

Je me permets de faire suite à mon précédent e-mail concernant {{company}}.
Avez-vous eu l'occasion d'y jeter un œil ?

Je sais que votre emploi du temps est chargé, mais je suis convaincu que nous pourrions accomplir de belles choses ensemble.

Dans l'attente de votre retour.
Cordialement,`,
  },
  {
    id: 3,
    title: 'Étape 3 (Template 3)',
    delayDays: 3,
    subject: 'Audit gratuit pour {{company}}',
    body: `Bonjour,

Pour vous montrer concrètement ce que nous pouvons apporter à {{company}}, j'ai pris la liberté de réaliser un pré-audit gratuit de votre présence en ligne.
Il met en évidence deux axes d'amélioration rapide qui pourraient booster votre visibilité.

Seriez-vous disponible pour que je vous le partage rapidement ?

Bien à vous,`,
  },
  {
    id: 4,
    title: 'Étape 4 (Template 5)',
    delayDays: 4,
    subject:
      'Comment nous avons aidé une entreprise similaire à {{company}}',
    body: `Bonjour,

Récemment, nous avons accompagné une entreprise de votre secteur rencontrant des défis très similaires à ceux de {{company}}.
En quelques mois, nous avons réussi à augmenter leur taux de conversion de manière significative.

Seriez-vous curieux de découvrir la stratégie que nous avons appliquée et comment elle pourrait s'adapter à {{company}} ?

Au plaisir d'échanger avec vous.
Cordialement,`,
  },
  {
    id: 5,
    title: 'Étape 5 (Template 4)',
    delayDays: 5,
    subject: 'Dernière tentative — {{company}}',
    body: `Bonjour,

N'ayant pas eu de retour de votre part, j'imagine que l'optimisation digitale de {{company}} n'est pas votre priorité du moment, ou que le timing n'est pas le bon.
Ceci est mon dernier message.

N'hésitez pas à revenir vers moi si vos priorités évoluent à l'avenir.
Je vous souhaite une excellente continuation avec {{company}} !

Cordialement,`,
  },
];


//TODO: change based on the current active lead
const currentLeadInfo = ['{{firstName}}', '{{company}}', '{{sector}}', '{{city}}'];

const cloneTemplates = (templates: MessageSequenceTemplateStep[]) =>
  templates.map((template) => ({ ...template }));

const normalizeTemplate = (
  candidate: Partial<MessageSequenceTemplateStep>,
  fallback: MessageSequenceTemplateStep,
): MessageSequenceTemplateStep => {
  const parsedDelay = Number(candidate.delayDays);
  const delayDays = Number.isFinite(parsedDelay)
    ? Math.max(0, Math.floor(parsedDelay))
    : fallback.delayDays;

  return {
    id: fallback.id,
    title:
      typeof candidate.title === 'string' && candidate.title.trim()
        ? candidate.title
        : fallback.title,
    delayDays,
    subject:
      typeof candidate.subject === 'string' && candidate.subject.trim()
        ? candidate.subject
        : fallback.subject,
    body:
      typeof candidate.body === 'string' && candidate.body.trim()
        ? candidate.body
        : fallback.body,
  };
};

const normalizeTemplates = (value: unknown): MessageSequenceTemplateStep[] => {
  if (!Array.isArray(value)) {
    return cloneTemplates(DEFAULT_MESSAGE_SEQUENCE_TEMPLATES);
  }

  return DEFAULT_MESSAGE_SEQUENCE_TEMPLATES.map((fallback) => {
    const match = value.find(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        Number((item as { id: unknown }).id) === fallback.id,
    ) as Partial<MessageSequenceTemplateStep> | undefined;
    return normalizeTemplate(match ?? {}, fallback);
  });
};

export const loadMessageSequenceTemplates = (): MessageSequenceTemplateStep[] => {
  if (typeof window === 'undefined') {
    return cloneTemplates(DEFAULT_MESSAGE_SEQUENCE_TEMPLATES);
  }

  try {
    const raw = window.localStorage.getItem(
      MESSAGE_SEQUENCE_TEMPLATES_STORAGE_KEY,
    );
    if (!raw) {
      return cloneTemplates(DEFAULT_MESSAGE_SEQUENCE_TEMPLATES);
    }
    return normalizeTemplates(JSON.parse(raw));
  } catch {
    return cloneTemplates(DEFAULT_MESSAGE_SEQUENCE_TEMPLATES);
  }
};

export const saveMessageSequenceTemplates = (
  templates: MessageSequenceTemplateStep[],
) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    MESSAGE_SEQUENCE_TEMPLATES_STORAGE_KEY,
    JSON.stringify(templates),
  );
};

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

interface MessageSequenceTemplatesViewProps {
  onTemplatesSaved?: (templates: MessageSequenceTemplateStep[]) => void;
}

export function MessageSequenceTemplatesView({
  onTemplatesSaved,
}: MessageSequenceTemplatesViewProps) {
  const initialTemplates = useMemo(loadMessageSequenceTemplates, []);
  const [savedTemplates, setSavedTemplates] =
    useState<MessageSequenceTemplateStep[]>(initialTemplates);
  const [draftTemplates, setDraftTemplates] = useState<MessageSequenceTemplateStep[]>(
    cloneTemplates(initialTemplates),
  );
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');

  const isDirty = useMemo(
    () => JSON.stringify(savedTemplates) !== JSON.stringify(draftTemplates),
    [draftTemplates, savedTemplates],
  );

  const updateTemplate = (
    stepId: number,
    changes: Partial<Pick<MessageSequenceTemplateStep, 'delayDays' | 'subject' | 'body'>>,
  ) => {
    setDraftTemplates((previous) =>
      previous.map((template) =>
        template.id === stepId ? { ...template, ...changes } : template,
      ),
    );
    setSaveState('idle');
  };

  const restoreSaved = () => {
    setDraftTemplates(cloneTemplates(savedTemplates));
    setSaveState('idle');
  };

  const loadDefaults = () => {
    setDraftTemplates(cloneTemplates(DEFAULT_MESSAGE_SEQUENCE_TEMPLATES));
    setSaveState('idle');
  };

  const saveChanges = () => {
    try {
      const normalized = normalizeTemplates(draftTemplates);
      saveMessageSequenceTemplates(normalized);
      setDraftTemplates(cloneTemplates(normalized));
      setSavedTemplates(cloneTemplates(normalized));
      onTemplatesSaved?.(cloneTemplates(normalized));
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('error');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Templates de séquence</CardTitle>
          <CardDescription>
            Gérez les messages envoyés par étape avec leur délai, sujet et corps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs">
            {currentLeadInfo.map(
              (variable) => (
                <span
                  key={variable}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-600"
                >
                  {variable}
                </span>
              ),
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              Les changements sont sauvegardés après
              “Enregistrer”.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={loadDefaults}>
                <RefreshCw className="size-3.5" />
                Charger les valeurs par défaut
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={restoreSaved}
                disabled={!isDirty}
              >
                Annuler les modifications
              </Button>
              <Button size="sm" onClick={saveChanges} disabled={!isDirty}>
                <Save className="size-3.5" />
                Enregistrer
              </Button>
            </div>
          </div>
          {saveState === 'saved' && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="size-3.5" />
              Modifications enregistrées.
            </p>
          )}
          {saveState === 'error' && (
            <p className="text-xs font-medium text-red-600">
              Erreur lors de l’enregistrement des templates.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {draftTemplates.map((template) => (
          <Card key={template.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{template.title}</CardTitle>
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
                    onChange={(event) =>
                      updateTemplate(template.id, {
                        delayDays: Math.max(
                          0,
                          Number(event.target.value || 0),
                        ),
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
                    onChange={(event) =>
                      updateTemplate(template.id, {
                        subject: event.target.value,
                      })
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
                  onChange={(event) =>
                    updateTemplate(template.id, { body: event.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

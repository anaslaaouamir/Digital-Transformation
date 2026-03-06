import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarClock,
  Layers3,
  ListChecks,
  MessageSquare,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { KpiCard } from './kpi-card';

interface LeadRecord {
  id: number;
  name: string;
  company: string;
  status: string;
}

type InteractionChannel = 'email' | 'whatsapp' | 'sms' | 'call';
type InteractionType = 'intro' | 'follow_up' | 'nurture' | 'manual';
type InteractionStatus = 'scheduled' | 'sent' | 'opened' | 'replied' | 'failed';
type TemplateCategory = 'intro' | 'follow_up' | 'nurture' | 'closing';
type EnrollmentStatus = 'active' | 'paused' | 'completed' | 'stopped';
type LeadContactStatus = 'new' | 'contacted' | 'engaged';

interface Interaction {
  id: number;
  leadId: number;
  channel: InteractionChannel;
  type: InteractionType;
  status: InteractionStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
  content: string;
  subject: string;
}

interface MessageTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  category: TemplateCategory;
}

interface Sequence {
  id: number;
  name: string;
}

interface SequenceStep {
  id: number;
  sequenceId: number;
  templateId: number;
  stepOrder: number;
  delayDays: number;
}

interface SequenceEnrollment {
  id: number;
  leadId: number;
  sequenceId: number;
  currentStepOrder: number;
  status: EnrollmentStatus;
  nextExecutionDate: string | null;
}

interface PersistedState {
  selectedLeadId: number | null;
  selectedSequenceId: number | null;
  interactions: Interaction[];
  templates: MessageTemplate[];
  sequences: Sequence[];
  steps: SequenceStep[];
  enrollments: SequenceEnrollment[];
}

interface InteractionsSectionProps {
  leads: LeadRecord[];
}

const STORAGE_KEY = 'crm_leads_interactions_schema_v1';

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 101,
    name: 'Intro Email',
    subject: 'Quick intro - {{company}}',
    body: 'Hi {{firstName}},\n\nI would love to discuss growth opportunities for {{company}}.\n\nBest regards,',
    category: 'intro',
  },
  {
    id: 102,
    name: 'Follow-up',
    subject: 'Following up on my previous note',
    body: 'Hi {{firstName}},\n\nJust checking if you had time to review my previous message.\n\nThanks,',
    category: 'follow_up',
  },
  {
    id: 103,
    name: 'WhatsApp Nurture',
    subject: 'Quick WhatsApp touchpoint',
    body: 'Hello {{firstName}}, I wanted to quickly share a useful idea for {{company}}.',
    category: 'nurture',
  },
];

const DEFAULT_SEQUENCES: Sequence[] = [
  { id: 201, name: 'Standard Outreach' },
  { id: 202, name: 'High Intent Follow-up' },
];

const DEFAULT_STEPS: SequenceStep[] = [
  { id: 301, sequenceId: 201, templateId: 101, stepOrder: 1, delayDays: 0 },
  { id: 302, sequenceId: 201, templateId: 102, stepOrder: 2, delayDays: 3 },
  { id: 303, sequenceId: 202, templateId: 101, stepOrder: 1, delayDays: 0 },
  { id: 304, sequenceId: 202, templateId: 103, stepOrder: 2, delayDays: 1 },
];

const DEFAULT_INTERACTION_DRAFT = {
  leadId: '',
  channel: 'email' as InteractionChannel,
  type: 'intro' as InteractionType,
  status: 'scheduled' as InteractionStatus,
  scheduledAt: '',
  sentAt: '',
  openedAt: '',
  repliedAt: '',
  subject: '',
  content: '',
};

const DEFAULT_TEMPLATE_DRAFT = {
  name: '',
  subject: '',
  body: '',
  category: 'intro' as TemplateCategory,
};

const DEFAULT_STEP_DRAFT = {
  sequenceId: '',
  templateId: '',
  stepOrder: 1,
  delayDays: 0,
};

const DEFAULT_ENROLLMENT_DRAFT = {
  id: null as number | null,
  sequenceId: '',
  currentStepOrder: 1,
  status: 'active' as EnrollmentStatus,
  nextExecutionDate: '',
};

const leadStatusVariant = (status: LeadContactStatus) => {
  if (status === 'engaged') return 'success';
  if (status === 'contacted') return 'warning';
  return 'secondary';
};

const interactionStatusVariant = (status: InteractionStatus) => {
  if (status === 'replied') return 'success';
  if (status === 'opened') return 'info';
  if (status === 'failed') return 'destructive';
  if (status === 'sent') return 'secondary';
  return 'warning';
};

const enrollmentStatusVariant = (status: EnrollmentStatus) => {
  if (status === 'active') return 'success';
  if (status === 'paused') return 'warning';
  if (status === 'completed') return 'info';
  return 'destructive';
};

const getNextId = (items: Array<{ id: number }>) =>
  (items.reduce((max, item) => Math.max(max, item.id), 0) || 0) + 1;

const toIsoOrNull = (value: string) => (value ? new Date(value).toISOString() : null);

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString() : '--';

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString() : '--';

const loadPersistedState = (): PersistedState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
};

const buildStarterInteractions = (leads: LeadRecord[]): Interaction[] => {
  if (!leads.length) return [];

  const now = new Date();
  const inTwoDays = new Date(now);
  inTwoDays.setDate(now.getDate() + 2);

  return leads.slice(0, 3).map((lead, index) => ({
    id: 400 + index,
    leadId: lead.id,
    channel: index % 2 === 0 ? 'email' : 'whatsapp',
    type: index === 0 ? 'intro' : 'follow_up',
    status: index === 2 ? 'sent' : 'scheduled',
    scheduledAt: index === 2 ? null : inTwoDays.toISOString(),
    sentAt: index === 2 ? now.toISOString() : null,
    openedAt: null,
    repliedAt: null,
    subject: `Initial outreach - ${lead.company}`,
    content: `Contacting ${lead.company} to start a sequence conversation.`,
  }));
};

const buildStarterEnrollments = (leads: LeadRecord[]): SequenceEnrollment[] =>
  leads.slice(0, 3).map((lead, index) => ({
    id: 500 + index,
    leadId: lead.id,
    sequenceId: index % 2 === 0 ? 201 : 202,
    currentStepOrder: 1,
    status: 'active',
    nextExecutionDate: new Date(Date.now() + 86400000 * (index + 1)).toISOString(),
  }));

export function LeadsInteractionsSection({ leads }: InteractionsSectionProps) {
  const [persisted] = useState<PersistedState | null>(() => loadPersistedState());

  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(
    persisted?.selectedLeadId ?? null,
  );
  const [selectedSequenceId, setSelectedSequenceId] = useState<number | null>(
    persisted?.selectedSequenceId ?? DEFAULT_SEQUENCES[0]?.id ?? null,
  );

  const [interactions, setInteractions] = useState<Interaction[]>(
    persisted?.interactions ?? [],
  );
  const [templates, setTemplates] = useState<MessageTemplate[]>(
    persisted?.templates ?? DEFAULT_TEMPLATES,
  );
  const [sequences, setSequences] = useState<Sequence[]>(
    persisted?.sequences ?? DEFAULT_SEQUENCES,
  );
  const [steps, setSteps] = useState<SequenceStep[]>(
    persisted?.steps ?? DEFAULT_STEPS,
  );
  const [enrollments, setEnrollments] = useState<SequenceEnrollment[]>(
    persisted?.enrollments ?? [],
  );

  const [interactionDraft, setInteractionDraft] = useState(
    DEFAULT_INTERACTION_DRAFT,
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [templateDraft, setTemplateDraft] = useState(DEFAULT_TEMPLATE_DRAFT);
  const [sequenceNameDraft, setSequenceNameDraft] = useState('');
  const [stepDraft, setStepDraft] = useState(DEFAULT_STEP_DRAFT);
  const [enrollmentDraft, setEnrollmentDraft] = useState(DEFAULT_ENROLLMENT_DRAFT);

  useEffect(() => {
    if (!leads.length) return;

    setSelectedLeadId((previous) =>
      previous != null && leads.some((lead) => lead.id === previous)
        ? previous
        : leads[0].id,
    );

    if (!interactions.length) {
      setInteractions(buildStarterInteractions(leads));
    }

    setEnrollments((previous) => {
      if (!previous.length) {
        return buildStarterEnrollments(leads);
      }

      const enrolledLeadIds = new Set(previous.map((entry) => entry.leadId));
      const baseId = getNextId(previous);
      const missing = leads
        .filter((lead) => !enrolledLeadIds.has(lead.id))
        .map((lead, index) => ({
          id: baseId + index,
          leadId: lead.id,
          sequenceId: sequences[0]?.id ?? DEFAULT_SEQUENCES[0].id,
          currentStepOrder: 1,
          status: 'active' as EnrollmentStatus,
          nextExecutionDate: null,
        }));

      return missing.length ? [...previous, ...missing] : previous;
    });

    if (!selectedSequenceId) {
      setSelectedSequenceId(sequences[0]?.id ?? null);
    }
  }, [
    leads,
    interactions.length,
    selectedSequenceId,
    sequences,
  ]);

  useEffect(() => {
    const snapshot: PersistedState = {
      selectedLeadId,
      selectedSequenceId,
      interactions,
      templates,
      sequences,
      steps,
      enrollments,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [
    selectedLeadId,
    selectedSequenceId,
    interactions,
    templates,
    sequences,
    steps,
    enrollments,
  ]);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId],
  );

  const selectedLeadInteractions = useMemo(
    () =>
      interactions
        .filter((interaction) => interaction.leadId === selectedLeadId)
        .sort((a, b) => {
          const dateA =
            a.repliedAt ?? a.openedAt ?? a.sentAt ?? a.scheduledAt ?? '';
          const dateB =
            b.repliedAt ?? b.openedAt ?? b.sentAt ?? b.scheduledAt ?? '';
          return dateB.localeCompare(dateA);
        }),
    [interactions, selectedLeadId],
  );

  const selectedLeadEnrollments = useMemo(
    () => enrollments.filter((entry) => entry.leadId === selectedLeadId),
    [enrollments, selectedLeadId],
  );

  const stepCountBySequence = useMemo(() => {
    const counts: Record<number, number> = {};
    steps.forEach((step) => {
      counts[step.sequenceId] = (counts[step.sequenceId] ?? 0) + 1;
    });
    return counts;
  }, [steps]);

  const selectedSequenceSteps = useMemo(
    () =>
      steps
        .filter((step) => step.sequenceId === selectedSequenceId)
        .sort((a, b) => a.stepOrder - b.stepOrder),
    [steps, selectedSequenceId],
  );

  const leadContactStatusMap = useMemo(() => {
    const map = new Map<number, LeadContactStatus>();

    leads.forEach((lead) => {
      const interactionsForLead = interactions.filter(
        (interaction) => interaction.leadId === lead.id,
      );

      if (interactionsForLead.some((interaction) => interaction.status === 'replied')) {
        map.set(lead.id, 'engaged');
      } else if (
        interactionsForLead.some((interaction) =>
          ['sent', 'opened'].includes(interaction.status),
        )
      ) {
        map.set(lead.id, 'contacted');
      } else {
        map.set(lead.id, 'new');
      }
    });

    return map;
  }, [interactions, leads]);

  const templatesMap = useMemo(() => {
    const map = new Map<number, MessageTemplate>();
    templates.forEach((template) => {
      map.set(template.id, template);
    });
    return map;
  }, [templates]);

  const sequencesMap = useMemo(() => {
    const map = new Map<number, Sequence>();
    sequences.forEach((sequence) => {
      map.set(sequence.id, sequence);
    });
    return map;
  }, [sequences]);

  useEffect(() => {
    if (!selectedLeadId) return;

    setInteractionDraft((previous) => ({
      ...previous,
      leadId: String(selectedLeadId),
    }));

    const firstEnrollment = selectedLeadEnrollments[0];

    if (firstEnrollment) {
      setEnrollmentDraft({
        id: firstEnrollment.id,
        sequenceId: String(firstEnrollment.sequenceId),
        currentStepOrder: firstEnrollment.currentStepOrder,
        status: firstEnrollment.status,
        nextExecutionDate: firstEnrollment.nextExecutionDate
          ? firstEnrollment.nextExecutionDate.slice(0, 10)
          : '',
      });
      return;
    }

    setEnrollmentDraft({
      ...DEFAULT_ENROLLMENT_DRAFT,
      sequenceId: String(sequences[0]?.id ?? ''),
    });
  }, [selectedLeadEnrollments, selectedLeadId, sequences]);

  const createInteraction = () => {
    if (!interactionDraft.leadId || !interactionDraft.content.trim()) return;

    const leadId = Number(interactionDraft.leadId);

    const nextInteraction: Interaction = {
      id: getNextId(interactions),
      leadId,
      channel: interactionDraft.channel,
      type: interactionDraft.type,
      status: interactionDraft.status,
      scheduledAt:
        interactionDraft.status === 'scheduled'
          ? toIsoOrNull(interactionDraft.scheduledAt) ?? new Date().toISOString()
          : toIsoOrNull(interactionDraft.scheduledAt),
      sentAt: ['sent', 'opened', 'replied'].includes(interactionDraft.status)
        ? toIsoOrNull(interactionDraft.sentAt) ?? new Date().toISOString()
        : toIsoOrNull(interactionDraft.sentAt),
      openedAt: ['opened', 'replied'].includes(interactionDraft.status)
        ? toIsoOrNull(interactionDraft.openedAt) ?? new Date().toISOString()
        : toIsoOrNull(interactionDraft.openedAt),
      repliedAt:
        interactionDraft.status === 'replied'
          ? toIsoOrNull(interactionDraft.repliedAt) ?? new Date().toISOString()
          : toIsoOrNull(interactionDraft.repliedAt),
      subject: interactionDraft.subject,
      content: interactionDraft.content,
    };

    setInteractions((previous) => [nextInteraction, ...previous]);
    setInteractionDraft((previous) => ({
      ...DEFAULT_INTERACTION_DRAFT,
      leadId: previous.leadId,
      channel: previous.channel,
    }));
  };

  const applySelectedTemplate = () => {
    if (!selectedTemplateId) return;

    const template = templates.find((item) => item.id === Number(selectedTemplateId));
    if (!template) return;

    const firstName = selectedLead?.name?.split(' ')[0] ?? 'there';
    const company = selectedLead?.company ?? 'your company';

    const applyTokens = (raw: string) =>
      raw.replaceAll('{{firstName}}', firstName).replaceAll('{{company}}', company);

    setInteractionDraft((previous) => ({
      ...previous,
      subject: applyTokens(template.subject),
      content: applyTokens(template.body),
      type:
        template.category === 'follow_up'
          ? 'follow_up'
          : template.category === 'nurture'
            ? 'nurture'
            : 'intro',
    }));
  };

  const addTemplate = () => {
    if (!templateDraft.name.trim() || !templateDraft.body.trim()) return;

    const nextTemplate: MessageTemplate = {
      id: getNextId(templates),
      name: templateDraft.name.trim(),
      subject: templateDraft.subject.trim(),
      body: templateDraft.body.trim(),
      category: templateDraft.category,
    };

    setTemplates((previous) => [...previous, nextTemplate]);
    setTemplateDraft(DEFAULT_TEMPLATE_DRAFT);
    setSelectedTemplateId(nextTemplate.id);
  };

  const addSequence = () => {
    const name = sequenceNameDraft.trim();
    if (!name) return;

    const nextSequence: Sequence = {
      id: getNextId(sequences),
      name,
    };

    setSequences((previous) => [...previous, nextSequence]);
    setSelectedSequenceId(nextSequence.id);
    setStepDraft((previous) => ({
      ...previous,
      sequenceId: String(nextSequence.id),
    }));
    setSequenceNameDraft('');
  };

  const addSequenceStep = () => {
    if (!stepDraft.sequenceId || !stepDraft.templateId) return;

    const nextStep: SequenceStep = {
      id: getNextId(steps),
      sequenceId: Number(stepDraft.sequenceId),
      templateId: Number(stepDraft.templateId),
      stepOrder: Number(stepDraft.stepOrder),
      delayDays: Number(stepDraft.delayDays),
    };

    setSteps((previous) => [...previous, nextStep]);
    setStepDraft((previous) => ({
      ...previous,
      stepOrder: previous.stepOrder + 1,
      delayDays: 0,
    }));
  };

  const saveEnrollment = () => {
    if (!selectedLeadId || !enrollmentDraft.sequenceId) return;

    const payload: SequenceEnrollment = {
      id: enrollmentDraft.id ?? getNextId(enrollments),
      leadId: selectedLeadId,
      sequenceId: Number(enrollmentDraft.sequenceId),
      currentStepOrder: Number(enrollmentDraft.currentStepOrder),
      status: enrollmentDraft.status,
      nextExecutionDate: enrollmentDraft.nextExecutionDate
        ? new Date(enrollmentDraft.nextExecutionDate).toISOString()
        : null,
    };

    setEnrollments((previous) => {
      if (enrollmentDraft.id == null) {
        return [...previous, payload];
      }

      return previous.map((entry) =>
        entry.id === enrollmentDraft.id ? payload : entry,
      );
    });
  };

  const editEnrollment = (entry: SequenceEnrollment) => {
    setEnrollmentDraft({
      id: entry.id,
      sequenceId: String(entry.sequenceId),
      currentStepOrder: entry.currentStepOrder,
      status: entry.status,
      nextExecutionDate: entry.nextExecutionDate
        ? entry.nextExecutionDate.slice(0, 10)
        : '',
    });
  };

  if (!leads.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Add leads first, then manage interactions.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard icon={Users} label="Leads" value={leads.length} />
        <KpiCard icon={MessageSquare} label="Interactions" value={interactions.length} />
        <KpiCard
          icon={CalendarClock}
          label="Scheduled"
          value={interactions.filter((item) => item.status === 'scheduled').length}
        />
        <KpiCard
          icon={ListChecks}
          label="Templates"
          value={templates.length}
        />
        <KpiCard
          icon={Layers3}
          label="Sequences"
          value={sequences.length}
        />
        <KpiCard
          icon={Activity}
          label="Active enrollments"
          value={enrollments.filter((item) => item.status === 'active').length}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lead + Interaction overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>id</TableHead>
                  <TableHead>company</TableHead>
                  <TableHead>contact_status</TableHead>
                  <TableHead>interactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const contactStatus = leadContactStatusMap.get(lead.id) ?? 'new';
                  const interactionCount = interactions.filter(
                    (interaction) => interaction.leadId === lead.id,
                  ).length;

                  return (
                    <TableRow
                      key={lead.id}
                      className={lead.id === selectedLeadId ? 'bg-muted/50' : ''}
                      onClick={() => setSelectedLeadId(lead.id)}
                    >
                      <TableCell className="font-mono text-xs">{lead.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{lead.company}</div>
                        <div className="text-xs text-muted-foreground">{lead.name || 'Unknown contact'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={leadStatusVariant(contactStatus)} appearance="light">
                          {contactStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{interactionCount}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="rounded-md border border-border">
              <div className="border-b border-border px-3 py-2 text-sm font-medium">
                Interaction timeline{selectedLead ? ` - ${selectedLead.company}` : ''}
              </div>
              <div className="max-h-75 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>id</TableHead>
                      <TableHead>channel</TableHead>
                      <TableHead>type</TableHead>
                      <TableHead>status</TableHead>
                      <TableHead>scheduled_at</TableHead>
                      <TableHead>sent_at</TableHead>
                      <TableHead>opened_at</TableHead>
                      <TableHead>replied_at</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedLeadInteractions.length ? (
                      selectedLeadInteractions.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs">{item.id}</TableCell>
                          <TableCell>{item.channel}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>
                            <Badge variant={interactionStatusVariant(item.status)} appearance="light">
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{formatDateTime(item.scheduledAt)}</TableCell>
                          <TableCell className="text-xs">{formatDateTime(item.sentAt)}</TableCell>
                          <TableCell className="text-xs">{formatDateTime(item.openedAt)}</TableCell>
                          <TableCell className="text-xs">{formatDateTime(item.repliedAt)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                          No interactions for this lead.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create interaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={interactionDraft.leadId}
                onChange={(event) =>
                  setInteractionDraft((previous) => ({
                    ...previous,
                    leadId: event.target.value,
                  }))
                }
              >
                <option value="">lead_id</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.id} - {lead.company}
                  </option>
                ))}
              </select>

              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={interactionDraft.channel}
                onChange={(event) =>
                  setInteractionDraft((previous) => ({
                    ...previous,
                    channel: event.target.value as InteractionChannel,
                  }))
                }
              >
                <option value="email">channel: email</option>
                <option value="whatsapp">channel: whatsapp</option>
                <option value="sms">channel: sms</option>
                <option value="call">channel: call</option>
              </select>

              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={interactionDraft.type}
                onChange={(event) =>
                  setInteractionDraft((previous) => ({
                    ...previous,
                    type: event.target.value as InteractionType,
                  }))
                }
              >
                <option value="intro">type: intro</option>
                <option value="follow_up">type: follow_up</option>
                <option value="nurture">type: nurture</option>
                <option value="manual">type: manual</option>
              </select>

              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={interactionDraft.status}
                onChange={(event) =>
                  setInteractionDraft((previous) => ({
                    ...previous,
                    status: event.target.value as InteractionStatus,
                  }))
                }
              >
                <option value="scheduled">status: scheduled</option>
                <option value="sent">status: sent</option>
                <option value="opened">status: opened</option>
                <option value="replied">status: replied</option>
                <option value="failed">status: failed</option>
              </select>

              <Input
                type="datetime-local"
                value={interactionDraft.scheduledAt}
                onChange={(event) =>
                  setInteractionDraft((previous) => ({
                    ...previous,
                    scheduledAt: event.target.value,
                  }))
                }
                placeholder="scheduled_at"
              />
              <Input
                type="datetime-local"
                value={interactionDraft.sentAt}
                onChange={(event) =>
                  setInteractionDraft((previous) => ({
                    ...previous,
                    sentAt: event.target.value,
                  }))
                }
                placeholder="sent_at"
              />
              <Input
                type="datetime-local"
                value={interactionDraft.openedAt}
                onChange={(event) =>
                  setInteractionDraft((previous) => ({
                    ...previous,
                    openedAt: event.target.value,
                  }))
                }
                placeholder="opened_at"
              />
              <Input
                type="datetime-local"
                value={interactionDraft.repliedAt}
                onChange={(event) =>
                  setInteractionDraft((previous) => ({
                    ...previous,
                    repliedAt: event.target.value,
                  }))
                }
                placeholder="replied_at"
              />
            </div>

            <div className="grid gap-2 md:grid-cols-[1fr_auto] xl:grid-cols-[1fr_auto]">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedTemplateId}
                onChange={(event) =>
                  setSelectedTemplateId(
                    event.target.value ? Number(event.target.value) : '',
                  )
                }
              >
                <option value="">Use message_template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.id} - {template.name}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" onClick={applySelectedTemplate}>
                Apply template
              </Button>
            </div>

            <Input
              value={interactionDraft.subject}
              onChange={(event) =>
                setInteractionDraft((previous) => ({
                  ...previous,
                  subject: event.target.value,
                }))
              }
              placeholder="subject"
            />
            <Textarea
              rows={6}
              value={interactionDraft.content}
              onChange={(event) =>
                setInteractionDraft((previous) => ({
                  ...previous,
                  content: event.target.value,
                }))
              }
              placeholder="content"
            />

            <Button
              className="w-full"
              onClick={createInteraction}
              disabled={!interactionDraft.leadId || !interactionDraft.content.trim()}
            >
              Add interaction row
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>message_template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Input
                value={templateDraft.name}
                placeholder="name"
                onChange={(event) =>
                  setTemplateDraft((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
              />
              <Input
                value={templateDraft.subject}
                placeholder="subject"
                onChange={(event) =>
                  setTemplateDraft((previous) => ({
                    ...previous,
                    subject: event.target.value,
                  }))
                }
              />
              <Textarea
                rows={4}
                value={templateDraft.body}
                placeholder="body"
                onChange={(event) =>
                  setTemplateDraft((previous) => ({
                    ...previous,
                    body: event.target.value,
                  }))
                }
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={templateDraft.category}
                onChange={(event) =>
                  setTemplateDraft((previous) => ({
                    ...previous,
                    category: event.target.value as TemplateCategory,
                  }))
                }
              >
                <option value="intro">category: intro</option>
                <option value="follow_up">category: follow_up</option>
                <option value="nurture">category: nurture</option>
                <option value="closing">category: closing</option>
              </select>
              <Button type="button" onClick={addTemplate}>Add template</Button>
            </div>

            <div className="max-h-75 overflow-y-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>id</TableHead>
                    <TableHead>name</TableHead>
                    <TableHead>category</TableHead>
                    <TableHead>subject</TableHead>
                    <TableHead>body</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-mono text-xs">{template.id}</TableCell>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" appearance="light">{template.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-50 truncate">{template.subject || '--'}</TableCell>
                      <TableCell className="max-w-60 truncate text-xs text-muted-foreground">
                        {template.body}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>sequence + sequence_step</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <Input
                value={sequenceNameDraft}
                onChange={(event) => setSequenceNameDraft(event.target.value)}
                placeholder="sequence.name"
              />
              <Button type="button" onClick={addSequence}>Add sequence</Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-border">
                <div className="border-b border-border px-3 py-2 text-sm font-medium">
                  sequence
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>id</TableHead>
                      <TableHead>name</TableHead>
                      <TableHead>steps</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sequences.map((sequence) => (
                      <TableRow
                        key={sequence.id}
                        className={sequence.id === selectedSequenceId ? 'bg-muted/50' : ''}
                        onClick={() => {
                          setSelectedSequenceId(sequence.id);
                          setStepDraft((previous) => ({
                            ...previous,
                            sequenceId: String(sequence.id),
                          }));
                        }}
                      >
                        <TableCell className="font-mono text-xs">{sequence.id}</TableCell>
                        <TableCell>{sequence.name}</TableCell>
                        <TableCell>{stepCountBySequence[sequence.id] ?? 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2 rounded-md border border-border p-3">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={stepDraft.sequenceId || String(selectedSequenceId ?? '')}
                  onChange={(event) =>
                    setStepDraft((previous) => ({
                      ...previous,
                      sequenceId: event.target.value,
                    }))
                  }
                >
                  <option value="">sequence_id</option>
                  {sequences.map((sequence) => (
                    <option key={sequence.id} value={sequence.id}>
                      {sequence.id} - {sequence.name}
                    </option>
                  ))}
                </select>

                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={stepDraft.templateId}
                  onChange={(event) =>
                    setStepDraft((previous) => ({
                      ...previous,
                      templateId: event.target.value,
                    }))
                  }
                >
                  <option value="">template_id</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.id} - {template.name}
                    </option>
                  ))}
                </select>

                <Input
                  type="number"
                  value={stepDraft.stepOrder}
                  onChange={(event) =>
                    setStepDraft((previous) => ({
                      ...previous,
                      stepOrder: Number(event.target.value),
                    }))
                  }
                  placeholder="step_order"
                />
                <Input
                  type="number"
                  value={stepDraft.delayDays}
                  onChange={(event) =>
                    setStepDraft((previous) => ({
                      ...previous,
                      delayDays: Number(event.target.value),
                    }))
                  }
                  placeholder="delay_days"
                />
                <Button
                  type="button"
                  onClick={addSequenceStep}
                  disabled={!stepDraft.sequenceId || !stepDraft.templateId}
                >
                  Add sequence_step
                </Button>
              </div>
            </div>

            <div className="rounded-md border border-border">
              <div className="border-b border-border px-3 py-2 text-sm font-medium">
                sequence_step for sequence_id={selectedSequenceId ?? '--'}
              </div>
              <div className="max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>id</TableHead>
                      <TableHead>sequence_id</TableHead>
                      <TableHead>template_id</TableHead>
                      <TableHead>step_order</TableHead>
                      <TableHead>delay_days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSequenceSteps.length ? (
                      selectedSequenceSteps.map((step) => (
                        <TableRow key={step.id}>
                          <TableCell className="font-mono text-xs">{step.id}</TableCell>
                          <TableCell>{step.sequenceId}</TableCell>
                          <TableCell>
                            {step.templateId}
                            <div className="text-xs text-muted-foreground">
                              {templatesMap.get(step.templateId)?.name ?? 'Template removed'}
                            </div>
                          </TableCell>
                          <TableCell>{step.stepOrder}</TableCell>
                          <TableCell>{step.delayDays}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                          No steps on this sequence.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            sequence_enrollment{selectedLead ? ` for lead_id=${selectedLead.id} (${selectedLead.company})` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-4">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={enrollmentDraft.sequenceId}
              onChange={(event) =>
                setEnrollmentDraft((previous) => ({
                  ...previous,
                  sequenceId: event.target.value,
                }))
              }
            >
              <option value="">sequence_id</option>
              {sequences.map((sequence) => (
                <option key={sequence.id} value={sequence.id}>
                  {sequence.id} - {sequence.name}
                </option>
              ))}
            </select>

            <Input
              type="number"
              value={enrollmentDraft.currentStepOrder}
              placeholder="current_step_order"
              onChange={(event) =>
                setEnrollmentDraft((previous) => ({
                  ...previous,
                  currentStepOrder: Number(event.target.value),
                }))
              }
            />

            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={enrollmentDraft.status}
              onChange={(event) =>
                setEnrollmentDraft((previous) => ({
                  ...previous,
                  status: event.target.value as EnrollmentStatus,
                }))
              }
            >
              <option value="active">status: active</option>
              <option value="paused">status: paused</option>
              <option value="completed">status: completed</option>
              <option value="stopped">status: stopped</option>
            </select>

            <Input
              type="date"
              value={enrollmentDraft.nextExecutionDate}
              onChange={(event) =>
                setEnrollmentDraft((previous) => ({
                  ...previous,
                  nextExecutionDate: event.target.value,
                }))
              }
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" onClick={saveEnrollment} disabled={!selectedLeadId || !enrollmentDraft.sequenceId}>
              {enrollmentDraft.id == null ? 'Create enrollment' : 'Update enrollment'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setEnrollmentDraft({
                  ...DEFAULT_ENROLLMENT_DRAFT,
                  sequenceId: String(sequences[0]?.id ?? ''),
                })
              }
            >
              Clear form
            </Button>
          </div>

          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>id</TableHead>
                  <TableHead>lead_id</TableHead>
                  <TableHead>sequence_id</TableHead>
                  <TableHead>current_step_order</TableHead>
                  <TableHead>status</TableHead>
                  <TableHead>next_execution_date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedLeadEnrollments.length ? (
                  selectedLeadEnrollments.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-xs">{entry.id}</TableCell>
                      <TableCell>{entry.leadId}</TableCell>
                      <TableCell>
                        {entry.sequenceId}
                        <div className="text-xs text-muted-foreground">
                          {sequencesMap.get(entry.sequenceId)?.name ?? 'Sequence removed'}
                        </div>
                      </TableCell>
                      <TableCell>{entry.currentStepOrder}</TableCell>
                      <TableCell>
                        <Badge variant={enrollmentStatusVariant(entry.status)} appearance="light">
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(entry.nextExecutionDate)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => editEnrollment(entry)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                      No enrollment rows for this lead.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

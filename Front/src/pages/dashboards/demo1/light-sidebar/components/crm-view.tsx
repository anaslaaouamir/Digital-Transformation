import type { Dispatch, SetStateAction } from 'react';
import {
  Activity,
  Brain,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  Target,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  Channel,
  ComposeState,
  CrmActionCounts,
  CrmFilter,
  CrmStats,
  EmailLog,
  Lead,
  Template,
} from '@/types/dashboard.types';
import { KpiCard } from './kpi-card';

const FILE_TYPES = ["PDF", "DOCX", "PPTX", "PNG", "JPG"];
const MAX_SIZE = 25;
const allowedInfo = `(${FILE_TYPES.join(", ")} - Max size ${MAX_SIZE} MB)`;

interface CrmSectionViewProps {
  crmStats: CrmStats;
  compose: ComposeState;
  setCompose: Dispatch<SetStateAction<ComposeState>>;
  composeLead: Lead | null;
  leads: Lead[];
  emails: EmailLog[];
  sendMessage: (
    lead: Lead,
    subject: string,
    body: string,
    channel: Channel,
    scheduled: boolean,
    options?: {
      whatsappNumber?: string;
      attachmentName?: string;
    },
  ) => void;
  applyTemplate: (template: Template, lead: Lead) => {
    subject: string;
    body: string;
  };
  templates: Template[];
  defaultCompose: ComposeState;
  crmActionCounts: CrmActionCounts;
  crmFilter: CrmFilter;
  setCrmFilter: Dispatch<SetStateAction<CrmFilter>>;
  crmFilteredEmails: EmailLog[];
  setLeads: Dispatch<SetStateAction<Lead[]>>;
}

export function CrmSectionView({
  crmStats,
  compose,
  setCompose,
  composeLead,
  leads,
  emails,
  sendMessage,
  applyTemplate,
  templates,
  defaultCompose,
  crmActionCounts,
  crmFilter,
  setCrmFilter,
  crmFilteredEmails,
  setLeads,
}: CrmSectionViewProps) {
  const needsWhatsappNumber =
    compose.channel === 'whatsapp' || compose.channel === 'both';
  const resolvedWhatsappNumber =
    compose.whatsappNumber.trim() || composeLead?.phone?.trim() || '';
  const attachmentName = compose.attachment?.name;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={Send} label="Mails sent" value={crmStats.sent} />
        <KpiCard icon={Activity} label="Planned" value={crmStats.planned} />
        <KpiCard
          icon={Mail}
          label="Opened rate"
          value={`${crmStats.openedRate}%`}
        />
        <KpiCard
          icon={MessageSquare}
          label="Response rate"
          value={`${crmStats.responseRate}%`}
        />
        <KpiCard
          icon={RefreshCw}
          label="Active sequences"
          value={crmStats.activeSequences}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail size={16} /> CRM outreach
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                value={compose.leadId == null ? 'none' : String(compose.leadId)}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setCompose((previous) => ({ ...previous, leadId: null }));
                    return;
                  }
                  const lead = leads.find((item) => item.id === Number(value));
                  if (!lead) return;
                  setCompose((previous) => {
                    const nextWhatsappNumber =
                      previous.whatsappNumber.trim() || lead.phone || '';
                    if (!previous.templateId) {
                      return {
                        ...previous,
                        leadId: lead.id,
                        whatsappNumber: nextWhatsappNumber,
                      };
                    }
                    const template = templates.find(
                      (item) => item.id === previous.templateId,
                    );
                    if (!template) {
                      return {
                        ...previous,
                        leadId: lead.id,
                        whatsappNumber: nextWhatsappNumber,
                      };
                    }
                    const applied = applyTemplate(template, lead);
                    return {
                      ...previous,
                      leadId: lead.id,
                      whatsappNumber: nextWhatsappNumber,
                      subject: applied.subject,
                      body: applied.body,
                    };
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select prospect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No prospect selected</SelectItem>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={String(lead.id)}>
                      {lead.name} ({lead.company})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={compose.templateId || 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setCompose((previous) => ({
                      ...previous,
                      templateId: '',
                    }));
                    return;
                  }
                  const template = templates.find((item) => item.id === value);
                  if (!template) return;
                  setCompose((previous) => {
                    const lead = leads.find((item) => item.id === previous.leadId);
                    const applied = lead
                      ? applyTemplate(template, lead)
                      : { subject: template.subject, body: template.body };
                    return {
                      ...previous,
                      templateId: template.id,
                      subject: applied.subject,
                      body: applied.body,
                    };
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Manual</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={compose.channel === 'email' ? 'secondary' : 'outline'}
                onClick={() =>
                  setCompose((previous) => ({
                    ...previous,
                    channel: 'email',
                  }))
                }
              >
                Email
              </Button>
              <Button
                size="sm"
                variant={compose.channel === 'whatsapp' ? 'secondary' : 'outline'}
                onClick={() =>
                  setCompose((previous) => ({
                    ...previous,
                    channel: 'whatsapp',
                  }))
                }
              >
                WhatsApp
              </Button>
              <Button
                size="sm"
                variant={compose.channel === 'both' ? 'secondary' : 'outline'}
                onClick={() =>
                  setCompose((previous) => ({
                    ...previous,
                    channel: 'both',
                  }))
                }
              >
                Email + WhatsApp
              </Button>
              <Button
                size="sm"
                variant={compose.scheduled ? 'secondary' : 'outline'}
                onClick={() =>
                  setCompose((previous) => ({
                    ...previous,
                    scheduled: !previous.scheduled,
                  }))
                }
              >
                {compose.scheduled ? 'Scheduled' : 'Send now'}
              </Button>
            </div>

            <Input
              placeholder="Subject"
              value={compose.subject}
              onChange={(event) =>
                setCompose((previous) => ({
                  ...previous,
                  subject: event.target.value,
                }))
              }
            />
            <Textarea
              rows={8}
              placeholder="Body"
              value={compose.body}
              onChange={(event) =>
                setCompose((previous) => ({
                  ...previous,
                  body: event.target.value,
                }))
              }
            />
            {needsWhatsappNumber ? (
              <div className="space-y-1">
                <Input
                  placeholder="WhatsApp number (e.g. +212600000000)"
                  value={compose.whatsappNumber}
                  onChange={(event) =>
                    setCompose((previous) => ({
                      ...previous,
                      whatsappNumber: event.target.value,
                    }))
                  }
                />
                {!compose.whatsappNumber.trim() && composeLead?.phone ? (
                  <div className="text-[11px] text-muted-foreground">
                    Using selected prospect number: {composeLead.phone}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-1">
              <Input
                key={
                  compose.attachment
                    ? `${compose.attachment.name}-${compose.attachment.lastModified}`
                    : 'no-attachment'
                }
                type="file"
                onChange={(event) =>
                  setCompose((previous) => ({
                    ...previous,
                    attachment: event.target.files?.[0] ?? null,
                  }))
                }
              />
              <div className="text-[11px] text-muted-foreground">
                Attachment {!attachmentName && allowedInfo} : {attachmentName ?? "none"}
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {composeLead
                  ? `To: ${composeLead.name} (${composeLead.company})${
                      needsWhatsappNumber && resolvedWhatsappNumber
                        ? ` - WhatsApp ${resolvedWhatsappNumber}`
                        : ''
                    }`
                  : 'Select a prospect'}
              </div>
              <Button
                disabled={
                  !composeLead ||
                  !compose.subject.trim() ||
                  !compose.body.trim() ||
                  (needsWhatsappNumber && !resolvedWhatsappNumber)
                }
                onClick={() => {
                  if (!composeLead) return;
                  if (compose.channel === 'both') {
                    sendMessage(
                      composeLead,
                      compose.subject,
                      compose.body,
                      'email',
                      compose.scheduled,
                      { attachmentName },
                    );
                    sendMessage(
                      composeLead,
                      compose.subject,
                      compose.body,
                      'whatsapp',
                      compose.scheduled,
                      {
                        whatsappNumber: resolvedWhatsappNumber,
                        attachmentName,
                      },
                    );
                  } else {
                    sendMessage(
                      composeLead,
                      compose.subject,
                      compose.body,
                      compose.channel,
                      compose.scheduled,
                      {
                        whatsappNumber:
                          compose.channel === 'whatsapp'
                            ? resolvedWhatsappNumber
                            : undefined,
                        attachmentName,
                      },
                    );
                  }
                  setCompose({
                    ...defaultCompose,
                    leadId: composeLead.id,
                    whatsappNumber: composeLead.phone || '',
                  });
                }}
              >
                <Send size={14} />{' '}
                {compose.scheduled
                  ? compose.channel === 'both'
                    ? 'Schedule both'
                    : 'Schedule'
                  : compose.channel === 'both'
                    ? 'Send both'
                    : 'Send'}
              </Button>
            </div>

            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity size={14} /> Fast actions
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                <Button
                  variant="outline"
                  className="h-auto justify-start px-3 py-2 text-left"
                  onClick={() => {
                    const hotTargets = leads
                      .filter(
                        (lead) =>
                          lead.status === 'hot' &&
                          !emails.some((email) => email.leadId === lead.id),
                      )
                      .slice(0, 5);
                    hotTargets.forEach((lead) => {
                      const applied = applyTemplate(templates[0], lead);
                      sendMessage(lead, applied.subject, applied.body, 'email', false);
                    });
                  }}
                >
                  <div className="w-full space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Target size={14} /> Hot email prospects
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {crmActionCounts.hotToContact} to contact
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto justify-start px-3 py-2 text-left"
                  onClick={() => {
                    const untouched = leads
                      .filter(
                        (lead) =>
                          !emails.some((email) => email.leadId === lead.id),
                      )
                      .slice(0, 5);
                    untouched.forEach((lead) => {
                      const intro = applyTemplate(templates[0], lead);
                      const followup = applyTemplate(templates[1], lead);
                      sendMessage(lead, intro.subject, intro.body, 'email', false);
                      sendMessage(
                        lead,
                        followup.subject,
                        followup.body,
                        'email',
                        true,
                      );
                    });
                  }}
                >
                  <div className="w-full space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <RefreshCw size={14} /> Run auto sequence
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {crmActionCounts.uncontacted} uncontacted
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto justify-start px-3 py-2 text-left"
                  onClick={() => {
                    const targets = leads
                      .filter((lead) =>
                        emails.some(
                          (email) =>
                            email.leadId === lead.id && email.status === 'sent',
                        ),
                      )
                      .slice(0, 5);
                    targets.forEach((lead) => {
                      const applied = applyTemplate(templates[1], lead);
                      sendMessage(
                        lead,
                        `[J+3] ${applied.subject}`,
                        applied.body,
                        'email',
                        false,
                      );
                    });
                  }}
                >
                  <div className="w-full space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Mail size={14} /> Rerun auto J+3
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {crmActionCounts.followupCandidates} with sent mails
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto justify-start px-3 py-2 text-left"
                  onClick={() => {
                    const aiTargets = leads
                      .filter((lead) => lead.score >= 70 && !lead.aiMessage.trim())
                      .slice(0, 5);
                    const aiIds = new Set(aiTargets.map((lead) => lead.id));
                    setLeads((previous) =>
                      previous.map((lead) =>
                        aiIds.has(lead.id)
                          ? {
                              ...lead,
                              aiMessage: `Hello ${lead.name.split(' ')[0]},\n\nI prepared a short growth note for ${lead.company} with practical quick wins and a 15-minute next step.\n\nBest,\nAbderrahim`,
                            }
                          : lead,
                      ),
                    );
                  }}
                >
                  <div className="w-full space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Brain size={14} /> Generate AI message
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {crmActionCounts.aiCandidates} candidates
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto justify-start px-3 py-2 text-left"
                  onClick={() => {
                    const targets = leads
                      .filter(
                        (lead) => lead.status === 'hot' && Boolean(lead.phone),
                      )
                      .slice(0, 5);
                    targets.forEach((lead) => {
                      sendMessage(
                        lead,
                        `Intro ${lead.company}`,
                        `Hello ${lead.name.split(' ')[0]},\n\nI am reaching out from ELBAHI.NET to share growth opportunities for ${lead.company}. Are you open to a quick call this week?`,
                        'whatsapp',
                        false,
                      );
                    });
                  }}
                >
                  <div className="w-full space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MessageSquare size={14} /> WhatsApp mass
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {crmActionCounts.whatsappCandidates} hot prospects
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto justify-start px-3 py-2 text-left"
                  onClick={() => {
                    const targets = composeLead
                      ? [composeLead]
                      : leads.filter((lead) => lead.status !== 'cold').slice(0, 3);
                    targets.forEach((lead) => {
                      sendMessage(
                        lead,
                        `Proposition for ${lead.company}`,
                        `Hello ${lead.name.split(' ')[0]},\n\nPlease find our proposition attached (email + WhatsApp delivery).\n\nBest,\nAbderrahim`,
                        'email',
                        false,
                      );
                      sendMessage(
                        lead,
                        `Proposition ${lead.company}`,
                        `Hello ${lead.name.split(' ')[0]},\n\nI also sent our proposition package here for quick follow-up.`,
                        'whatsapp',
                        false,
                      );
                    });
                  }}
                >
                  <div className="w-full space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Send size={14} /> Send proposition
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Email + WhatsApp + PJ
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare size={16} /> Message history
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 'all', label: 'All', count: emails.length },
                  {
                    value: 'sent',
                    label: 'Sent',
                    count: emails.filter((email) => email.status === 'sent').length,
                  },
                  {
                    value: 'whatsapp',
                    label: 'WhatsApp',
                    count: emails.filter((email) => email.channel === 'whatsapp')
                      .length,
                  },
                  {
                    value: 'scheduled',
                    label: 'Planned',
                    count: emails.filter((email) => email.status === 'scheduled')
                      .length,
                  },
                ] as const
              ).map((filter) => (
                <Button
                  key={filter.value}
                  size="sm"
                  variant={crmFilter === filter.value ? 'secondary' : 'outline'}
                  className="h-7 px-3 text-xs"
                  onClick={() => setCrmFilter(filter.value)}
                >
                  {filter.label} ({filter.count})
                </Button>
              ))}
            </div>

            <div className="max-h-125 space-y-3 overflow-y-auto pr-1">
              {crmFilteredEmails.length ? (
                crmFilteredEmails.map((email) => {
                  const lead = leads.find((item) => item.id === email.leadId);
                  const timestamp =
                    email.status === 'sent' ? email.sentAt : email.scheduledAt;

                  return (
                    <div key={email.id} className="rounded-md border border-border p-3">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">{email.subject}</div>
                        <Badge
                          variant={email.status === 'sent' ? 'success' : 'warning'}
                          appearance="light"
                        >
                          {email.channel === 'whatsapp'
                            ? 'WhatsApp'
                            : email.status === 'sent'
                              ? 'Sent'
                              : 'Planned'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        To: {lead?.name ?? 'Unknown'} {lead ? `- ${lead.company}` : ''}
                        {email.channel === 'whatsapp' && email.whatsappNumber
                          ? ` - ${email.whatsappNumber}`
                          : ''}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {email.status === 'sent' ? 'Sent' : 'Planned'}:{' '}
                        {timestamp ? new Date(timestamp).toLocaleString() : '--'}
                      </div>
                      {email.channel === 'email' && email.status === 'sent' ? (
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {email.openedAt ? 'Opened' : 'Not opened'}
                          {email.repliedAt ? ' - Replied' : ''}
                        </div>
                      ) : null}
                      {email.attachmentName ? (
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          Attachment: {email.attachmentName}
                        </div>
                      ) : null}
                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {email.body}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No messages in this filter.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

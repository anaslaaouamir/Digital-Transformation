import { useMemo, useState } from 'react';
import {
  Activity,
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
import { Textarea } from '@/components/ui/textarea';
import { KpiCard } from './kpi-card';

type Channel = 'email' | 'whatsapp';
type ComposeChannel = Channel | 'both';
type CrmFilter = 'all' | 'sent' | 'whatsapp' | 'scheduled';
type LeadStatus = 'hot' | 'warm' | 'cold';

interface Lead {
  id: number;
  name: string;
  company: string;
  phone: string;
  city: string;
  score: number;
  status: string;
}

interface ComposeState {
  leadId: number | null;
  channel: ComposeChannel;
  subject: string;
  body: string;
  scheduled: boolean;
  whatsappNumber: string;
  attachmentName: string | null;
}

interface EmailLog {
  id: string;
  leadId: number;
  subject: string;
  body: string;
  channel: Channel;
  status: 'sent' | 'scheduled';
  sentAt: string | null;
  scheduledAt: string | null;
  whatsappNumber?: string | null;
  attachmentName?: string | null;
}

interface CrmSectionViewProps {
  leads: Lead[];
}

const DEFAULT_COMPOSE: ComposeState = {
  leadId: null,
  channel: 'email',
  subject: '',
  body: '',
  scheduled: false,
  whatsappNumber: '',
  attachmentName: null,
};

const normalizeStatus = (status: string): LeadStatus => {
  const normalized = status.toLowerCase();
  if (normalized === 'hot' || normalized === 'warm' || normalized === 'cold') {
    return normalized;
  }
  return 'cold';
};

const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] || 'there';

const createLogId = () =>
  `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const introBody = (lead: Lead) =>
  `Hello ${firstNameOf(lead.name)},\n\nI am reaching out regarding ${lead.company}. Are you open to a short 15-minute call this week?\n\nBest,\nAbderrahim`;

export function CrmSectionView({ leads }: CrmSectionViewProps) {
  const [compose, setCompose] = useState<ComposeState>(DEFAULT_COMPOSE);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [crmFilter, setCrmFilter] = useState<CrmFilter>('all');

  const composeLead = useMemo(
    () => leads.find((lead) => lead.id === compose.leadId) ?? null,
    [compose.leadId, leads],
  );

  const sendMessage = (
    lead: Lead,
    subject: string,
    body: string,
    channel: Channel,
    scheduled: boolean,
    options?: {
      whatsappNumber?: string;
      attachmentName?: string | null;
    },
  ) => {
    const timestamp = new Date().toISOString();
    const entry: EmailLog = {
      id: createLogId(),
      leadId: lead.id,
      subject,
      body,
      channel,
      status: scheduled ? 'scheduled' : 'sent',
      sentAt: scheduled ? null : timestamp,
      scheduledAt: scheduled ? timestamp : null,
      whatsappNumber: options?.whatsappNumber ?? null,
      attachmentName: options?.attachmentName ?? null,
    };
    setEmails((previous) => [entry, ...previous]);
  };

  const crmFilteredEmails = useMemo(() => {
    if (crmFilter === 'all') return emails;
    if (crmFilter === 'whatsapp') {
      return emails.filter((email) => email.channel === 'whatsapp');
    }
    return emails.filter((email) => email.status === crmFilter);
  }, [crmFilter, emails]);

  const crmStats = useMemo(() => {
    const sent = emails.filter((email) => email.status === 'sent').length;
    const planned = emails.filter((email) => email.status === 'scheduled').length;
    const activeSequences = new Set(
      emails
        .filter((email) => email.status === 'scheduled')
        .map((email) => email.leadId),
    ).size;
    return {
      sent,
      planned,
      openedRate: 0,
      responseRate: 0,
      activeSequences,
    };
  }, [emails]);

  const actionCounts = useMemo(() => {
    const contacted = new Set(emails.map((email) => email.leadId));
    return {
      hotToContact: leads.filter(
        (lead) =>
          normalizeStatus(lead.status) === 'hot' && !contacted.has(lead.id),
      ).length,
      uncontacted: leads.filter((lead) => !contacted.has(lead.id)).length,
      whatsappCandidates: leads.filter(
        (lead) =>
          normalizeStatus(lead.status) === 'hot' && Boolean(lead.phone?.trim()),
      ).length,
    };
  }, [emails, leads]);

  const needsWhatsappNumber =
    compose.channel === 'whatsapp' || compose.channel === 'both';
  const resolvedWhatsappNumber =
    compose.whatsappNumber.trim() || composeLead?.phone?.trim() || '';

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={Send} label="Mails sent" value={crmStats.sent} />
        <KpiCard icon={Activity} label="Planned" value={crmStats.planned} />
        <KpiCard icon={Mail} label="Opened rate" value={`${crmStats.openedRate}%`} />
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
            <select
              value={compose.leadId == null ? '' : String(compose.leadId)}
              onChange={(event) => {
                const leadId = event.target.value ? Number(event.target.value) : null;
                const lead = leads.find((item) => item.id === leadId) ?? null;
                setCompose((previous) => ({
                  ...previous,
                  leadId,
                  whatsappNumber: lead?.phone ?? '',
                }));
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select prospect</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name || 'Unknown'} ({lead.company})
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={compose.channel === 'email' ? 'secondary' : 'outline'}
                onClick={() =>
                  setCompose((previous) => ({ ...previous, channel: 'email' }))
                }
              >
                Email
              </Button>
              <Button
                size="sm"
                variant={compose.channel === 'whatsapp' ? 'secondary' : 'outline'}
                onClick={() =>
                  setCompose((previous) => ({ ...previous, channel: 'whatsapp' }))
                }
              >
                WhatsApp
              </Button>
              <Button
                size="sm"
                variant={compose.channel === 'both' ? 'secondary' : 'outline'}
                onClick={() =>
                  setCompose((previous) => ({ ...previous, channel: 'both' }))
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
            ) : null}

            <Input
              type="file"
              onChange={(event) =>
                setCompose((previous) => ({
                  ...previous,
                  attachmentName: event.target.files?.[0]?.name ?? null,
                }))
              }
            />

            <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {composeLead
                  ? `To: ${composeLead.name || 'Unknown'} (${composeLead.company})`
                  : 'Select a prospect'}
              </span>
              <span>{compose.attachmentName ? `Attachment: ${compose.attachmentName}` : null}</span>
            </div>

            <Button
              className="w-full"
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
                    { attachmentName: compose.attachmentName },
                  );
                  sendMessage(
                    composeLead,
                    compose.subject,
                    compose.body,
                    'whatsapp',
                    compose.scheduled,
                    {
                      whatsappNumber: resolvedWhatsappNumber,
                      attachmentName: compose.attachmentName,
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
                      attachmentName: compose.attachmentName,
                    },
                  );
                }
                setCompose({
                  ...DEFAULT_COMPOSE,
                  leadId: composeLead.id,
                  whatsappNumber: composeLead.phone || '',
                });
              }}
            >
              <Send size={14} /> Send
            </Button>

            <div className="grid gap-2 md:grid-cols-3">
              <Button
                variant="outline"
                className="h-auto justify-start px-3 py-2 text-left"
                onClick={() => {
                  const hotTargets = leads
                    .filter(
                      (lead) =>
                        normalizeStatus(lead.status) === 'hot' &&
                        !emails.some((email) => email.leadId === lead.id),
                    )
                    .slice(0, 5);
                  hotTargets.forEach((lead) => {
                    sendMessage(
                      lead,
                      `Intro ${lead.company}`,
                      introBody(lead),
                      'email',
                      false,
                    );
                  });
                }}
              >
                <Target size={14} /> Hot email ({actionCounts.hotToContact})
              </Button>
              <Button
                variant="outline"
                className="h-auto justify-start px-3 py-2 text-left"
                onClick={() => {
                  const untouched = leads
                    .filter(
                      (lead) => !emails.some((email) => email.leadId === lead.id),
                    )
                    .slice(0, 5);
                  untouched.forEach((lead) => {
                    sendMessage(
                      lead,
                      `Sequence ${lead.company}`,
                      introBody(lead),
                      'email',
                      false,
                    );
                    sendMessage(
                      lead,
                      `[J+3] Follow up ${lead.company}`,
                      `Hello ${firstNameOf(lead.name)},\n\nI wanted to quickly follow up regarding ${lead.company}.`,
                      'email',
                      true,
                    );
                  });
                }}
              >
                <RefreshCw size={14} /> Auto sequence ({actionCounts.uncontacted})
              </Button>
              <Button
                variant="outline"
                className="h-auto justify-start px-3 py-2 text-left"
                onClick={() => {
                  const targets = leads
                    .filter(
                      (lead) =>
                        normalizeStatus(lead.status) === 'hot' && Boolean(lead.phone),
                    )
                    .slice(0, 5);
                  targets.forEach((lead) => {
                    sendMessage(
                      lead,
                      `WhatsApp ${lead.company}`,
                      introBody(lead),
                      'whatsapp',
                      false,
                    );
                  });
                }}
              >
                <MessageSquare size={14} /> WhatsApp ({actionCounts.whatsappCandidates})
              </Button>
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

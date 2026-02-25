import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Card } from '@/components/ui/card';
import {
  CrmSectionView,
  DashboardSectionView,
  PipelineSectionView,
} from './components';
import type {
  Channel,
  ComposeState,
  CrmFilter,
  DashboardView,
  EmailLog,
  Lead,
  LeadStatus,
  ScanHistoryEntry,
  Template,
} from '@/types/dashboard.types';

const DASHBOARD_PATHS: Record<DashboardView, string> = {
  dashboard: '/',
  scan: '/mass-scan',
  prospects: '/prospects',
  crm: '/crm',
  pipeline: '/pipline',
  leads: '/leads',
};

const TEMPLATES: Template[] = [
  {
    id: 'intro',
    name: 'Intro',
    subject: 'Digital collaboration for {{company}}',
    body: `Hello {{firstName}},\n\nI noticed {{company}} in {{city}} and wanted to share practical ideas to increase qualified leads.\n\nAt ELBAHI.NET, we help teams in {{sector}} improve visibility and conversion.\n\nCan we schedule a short 15-minute call this week?\n\nBest,\nAbderrahim\nELBAHI.NET`,
  },
  {
    id: 'followup',
    name: 'Follow-up',
    subject: 'Re: collaboration for {{company}}',
    body: `Hello {{firstName}},\n\nQuick follow-up on my previous note.\n\nIf useful, I can send a short plan with 3 quick wins specific to {{company}}.\n\nBest,\nAbderrahim`,
  },
  {
    id: 'audit',
    name: 'Free audit',
    subject: 'Free digital audit for {{company}}',
    body: `Hello {{firstName}},\n\nI can prepare a free digital audit for {{company}} in 48 hours:\n- SEO snapshot\n- competitor benchmark\n- conversion opportunities\n\nReply "yes" and I will share it.\n\nBest,\nAbderrahim`,
  },
];

const DEFAULT_COMPOSE: ComposeState = {
  leadId: null,
  templateId: '',
  channel: 'email',
  subject: '',
  body: '',
  scheduled: false,
  whatsappNumber: '',
  attachment: null,
};

type DashboardSeedData = {
  leads: Lead[];
  scanHistory: ScanHistoryEntry[];
  apiUsage: {
    google: number;
    apollo: number;
    claude: number;
  };
};

const EMPTY_DASHBOARD_DATA: DashboardSeedData = {
  leads: [],
  scanHistory: [],
  apiUsage: { google: 0, apollo: 0, claude: 0 },
};

const TMP_DASHBOARD_DATA: DashboardSeedData = {
  leads: [
    {
      id: 1001,
      name: 'Youssef Bennani',
      company: 'Le Jardin Casablanca',
      role: 'Gerant',
      sector: 'Restauration',
      city: 'Casablanca',
      email: 'contact@lejardin.ma',
      phone: '+212512345678',
      website: 'lejardin.ma',
      rating: 4.7,
      score: 88,
      status: 'hot',
      employees: '20-50',
      revenue: '3-5M MAD',
      linkedin: 'linkedin.com/company/le-jardin-casablanca',
      notes: '',
      aiMessage: '',
      lastContact: null,
    },
    {
      id: 1002,
      name: 'Fatima El Fassi',
      company: 'La Table du Marche Rabat',
      role: 'Gerant',
      sector: 'Restauration',
      city: 'Rabat',
      email: 'contact@latabledumarche.ma',
      phone: '+212623456789',
      website: 'latabledumarche.ma',
      rating: 4.5,
      score: 82,
      status: 'hot',
      employees: '10-20',
      revenue: '1-3M MAD',
      linkedin: 'linkedin.com/company/la-table-du-marche-rabat',
      notes: '',
      aiMessage: '',
      lastContact: null,
    },
    {
      id: 1003,
      name: 'Mohammed Tazi',
      company: 'Riad Lotus Marrakech',
      role: 'Directeur',
      sector: 'Hotellerie',
      city: 'Marrakesh',
      email: 'contact@riadlotus.ma',
      phone: '+212534567890',
      website: 'riadlotus.ma',
      rating: 4.2,
      score: 77,
      status: 'warm',
      employees: '50-100',
      revenue: '5-10M MAD',
      linkedin: 'linkedin.com/company/riad-lotus-marrakech',
      notes: '',
      aiMessage: '',
      lastContact: null,
    },
    {
      id: 1004,
      name: 'Sara Chraibi',
      company: 'Hotel Kenzi Tanger',
      role: 'Directeur',
      sector: 'Hotellerie',
      city: 'Tanger',
      email: 'contact@hotelkenzi.ma',
      phone: '+212645678901',
      website: 'hotelkenzi.ma',
      rating: 4.0,
      score: 73,
      status: 'warm',
      employees: '20-50',
      revenue: '3-5M MAD',
      linkedin: 'linkedin.com/company/hotel-kenzi-tanger',
      notes: '',
      aiMessage: '',
      lastContact: null,
    },
    {
      id: 1005,
      name: 'Ahmed Alaoui',
      company: 'Century 21 Maroc Casablanca',
      role: 'Agent Principal',
      sector: 'Immobilier',
      city: 'Casablanca',
      email: 'contact@centurymaroc.ma',
      phone: '+212556789012',
      website: 'centurymaroc.ma',
      rating: 4.1,
      score: 71,
      status: 'warm',
      employees: '10-20',
      revenue: '1-3M MAD',
      linkedin: 'linkedin.com/company/century-21-maroc-casablanca',
      notes: '',
      aiMessage: '',
      lastContact: null,
    },
    {
      id: 1006,
      name: 'Khadija Idrissi',
      company: 'Immo Expert Rabat',
      role: 'Agent Principal',
      sector: 'Immobilier',
      city: 'Rabat',
      email: 'contact@immoexpert.ma',
      phone: '+212667890123',
      website: 'immoexpert.ma',
      rating: 3.9,
      score: 67,
      status: 'warm',
      employees: '5-10',
      revenue: '500K-1M MAD',
      linkedin: 'linkedin.com/company/immo-expert-rabat',
      notes: '',
      aiMessage: '',
      lastContact: null,
    },
    {
      id: 1007,
      name: 'Omar Berrada',
      company: 'Clinique Atlas Fes',
      role: 'Medecin Chef',
      sector: 'Sante',
      city: 'Fes',
      email: 'contact@cliniqueatlas.ma',
      phone: '+212578901234',
      website: 'cliniqueatlas.ma',
      rating: 4.3,
      score: 83,
      status: 'hot',
      employees: '50-100',
      revenue: '5-10M MAD',
      linkedin: 'linkedin.com/company/clinique-atlas-fes',
      notes: '',
      aiMessage: '',
      lastContact: null,
    },
    {
      id: 1008,
      name: 'Salma Hakimi',
      company: 'Cabinet Dr. Tazi Meknes',
      role: 'Medecin Chef',
      sector: 'Sante',
      city: 'Meknes',
      email: 'contact@cabinetdrtazi.ma',
      phone: '+212689012345',
      website: 'cabinetdrtazi.ma',
      rating: 3.8,
      score: 62,
      status: 'warm',
      employees: '10-20',
      revenue: '1-3M MAD',
      linkedin: 'linkedin.com/company/cabinet-dr-tazi-meknes',
      notes: '',
      aiMessage: '',
      lastContact: null,
    },
    {
      id: 1009,
      name: 'Rachid Filali',
      company: 'Salon Prestige Agadir',
      role: 'Proprietaire',
      sector: 'Beaute',
      city: 'Agadir',
      email: 'contact@salonprestige.ma',
      phone: '+212590123456',
      website: '',
      rating: 3.6,
      score: 57,
      status: 'cold',
      employees: '--',
      revenue: '--',
      linkedin: 'linkedin.com/company/salon-prestige-agadir',
      notes: '',
      aiMessage: '',
      lastContact: null,
    },
    {
      id: 1010,
      name: 'Nadia Sefrioui',
      company: 'Cabinet Fassi Oujda',
      role: 'Associe',
      sector: 'Juridique',
      city: 'Oujda',
      email: 'contact@cabinetfassi.ma',
      phone: '+212601234567',
      website: '',
      rating: 3.7,
      score: 52,
      status: 'cold',
      employees: '5-10',
      revenue: '500K-1M MAD',
      linkedin: 'linkedin.com/company/cabinet-fassi-oujda',
      notes: '',
      aiMessage: '',
      lastContact: null,
    },
  ],
  scanHistory: [
    { id: 1, prospects: 5, avgScore: 74 },
    { id: 2, prospects: 6, avgScore: 71 },
    { id: 3, prospects: 7, avgScore: 69 },
    { id: 4, prospects: 6, avgScore: 67 },
  ],
  apiUsage: { google: 62, apollo: 31, claude: 7 },
};

//? toggle this option to enable/disable temporary dashboard data display
const IS_DASHBOARD_DATA_ENABLED = true;


const INITIAL_DASHBOARD_DATA: DashboardSeedData = IS_DASHBOARD_DATA_ENABLED
  ? TMP_DASHBOARD_DATA
  : EMPTY_DASHBOARD_DATA;

const scoreVariant = (score: number): 'success' | 'warning' | 'destructive' => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'destructive';
};

const statusVariant = (status: LeadStatus): 'success' | 'warning' | 'info' => {
  if (status === 'hot') return 'warning';
  if (status === 'warm') return 'info';
  return 'success';
};

export function Demo1LightSidebarContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>(INITIAL_DASHBOARD_DATA.leads);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [compose, setCompose] = useState<ComposeState>(DEFAULT_COMPOSE);
  const [crmFilter, setCrmFilter] = useState<CrmFilter>('all');
  const [apiUsage] = useState(INITIAL_DASHBOARD_DATA.apiUsage);
  const [scanHistory] = useState<ScanHistoryEntry[]>(
    INITIAL_DASHBOARD_DATA.scanHistory,
  );

  const view = useMemo<DashboardView>(() => {
    if (location.pathname === DASHBOARD_PATHS.scan) return 'scan';
    if (location.pathname === DASHBOARD_PATHS.prospects) return 'prospects';
    if (location.pathname === DASHBOARD_PATHS.crm) return 'crm';
    if (location.pathname === DASHBOARD_PATHS.pipeline) return 'pipeline';
    if (location.pathname === DASHBOARD_PATHS.leads) return 'leads';
    return 'dashboard';
  }, [location.pathname]);

  const stats = useMemo(() => {
    const bySector: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    const byStatus: Record<LeadStatus, number> = { hot: 0, warm: 0, cold: 0 };
    let scoreSum = 0;
    let withSite = 0;
    let enriched = 0;

    leads.forEach((lead) => {
      bySector[lead.sector] = (bySector[lead.sector] ?? 0) + 1;
      byCity[lead.city] = (byCity[lead.city] ?? 0) + 1;
      byStatus[lead.status] += 1;
      scoreSum += lead.score;
      if (lead.website) withSite += 1;
      if (lead.employees !== '--') enriched += 1;
    });

    return {
      total: leads.length,
      hot: byStatus.hot,
      warm: byStatus.warm,
      cold: byStatus.cold,
      avgScore: leads.length ? Math.round(scoreSum / leads.length) : 0,
      bySector,
      byCity,
      withSite,
      enriched,
    };
  }, [leads]);

  const sectorChartData = useMemo(
    () =>
      Object.entries(stats.bySector)
        .map(([name, value]) => ({
          name: name.length > 12 ? `${name.slice(0, 12)}...` : name,
          value,
        }))
        .sort((a, b) => b.value - a.value),
    [stats.bySector],
  );

  const cityChartData = useMemo(
    () =>
      Object.entries(stats.byCity)
        .map(([name, value]) => ({
          name,
          value,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    [stats.byCity],
  );

  const statusChartData = useMemo(
    () => [
      { name: 'Hot', value: stats.hot, fill: '#ef4444' },
      { name: 'Warm', value: stats.warm, fill: '#f59e0b' },
      { name: 'Cold', value: stats.cold, fill: '#38bdf8' },
    ],
    [stats],
  );

  const scanHistoryChartData = useMemo(
    () =>
      scanHistory.map((scan) => ({
        name: `Scan ${scan.id}`,
        prospects: scan.prospects,
        score: scan.avgScore,
      })),
    [scanHistory],
  );

  const composeLead = useMemo(
    () => leads.find((lead) => lead.id === compose.leadId) ?? null,
    [compose.leadId, leads],
  );

  const crmStats = useMemo(() => {
    const sent = emails.filter((email) => email.status === 'sent');
    const planned = emails.filter((email) => email.status === 'scheduled');
    const sentEmails = sent.filter((email) => email.channel === 'email');
    const opened = sentEmails.filter((email) => email.openedAt).length;
    const replied = sentEmails.filter((email) => email.repliedAt).length;

    return {
      sent: sent.length,
      planned: planned.length,
      openedRate: sentEmails.length
        ? Math.round((opened / sentEmails.length) * 100)
        : 0,
      responseRate: sentEmails.length
        ? Math.round((replied / sentEmails.length) * 100)
        : 0,
      activeSequences: new Set(planned.map((email) => email.leadId)).size,
    };
  }, [emails]);

  const crmFilteredEmails = useMemo(() => {
    if (crmFilter === 'all') return emails;
    if (crmFilter === 'whatsapp') {
      return emails.filter((email) => email.channel === 'whatsapp');
    }
    if (crmFilter === 'sent') {
      return emails.filter((email) => email.status === 'sent');
    }
    return emails.filter((email) => email.status === 'scheduled');
  }, [crmFilter, emails]);

  const crmActionCounts = useMemo(() => {
    const contactedLeadIds = new Set(emails.map((email) => email.leadId));
    const hotToContact = leads.filter(
      (lead) => lead.status === 'hot' && !contactedLeadIds.has(lead.id),
    ).length;
    const uncontacted = leads.filter(
      (lead) => !contactedLeadIds.has(lead.id),
    ).length;
    const followupCandidates = leads.filter((lead) =>
      emails.some((email) => email.leadId === lead.id && email.status === 'sent'),
    ).length;
    const aiCandidates = leads.filter(
      (lead) => lead.score >= 70 && !lead.aiMessage.trim(),
    ).length;
    const whatsappCandidates = leads.filter(
      (lead) => lead.status === 'hot' && Boolean(lead.phone),
    ).length;
    const propositionTargets = composeLead
      ? 1
      : Math.min(
          leads.filter((lead) => lead.status !== 'cold').length,
          3,
        );

    return {
      hotToContact,
      uncontacted,
      followupCandidates,
      aiCandidates,
      whatsappCandidates,
      propositionTargets,
    };
  }, [composeLead, emails, leads]);

  const applyTemplate = useCallback((template: Template, lead: Lead) => {
    const firstName = lead.name.split(' ')[0] ?? '';
    return {
      subject: template.subject.replaceAll('{{company}}', lead.company),
      body: template.body
        .replaceAll('{{firstName}}', firstName)
        .replaceAll('{{company}}', lead.company)
        .replaceAll('{{sector}}', lead.sector)
        .replaceAll('{{city}}', lead.city),
    };
  }, []);

  const sendMessage = useCallback(
    (
      lead: Lead,
      subject: string,
      body: string,
      channel: Channel,
      scheduled: boolean,
      options?: {
        whatsappNumber?: string;
        attachmentName?: string;
      },
    ) => {
      const now = Date.now();
      const sentAt = scheduled ? null : new Date(now).toISOString();
      const normalizedWhatsappNumber = options?.whatsappNumber?.trim();
      const normalizedAttachmentName = options?.attachmentName?.trim();

      setEmails((previous) => [
        {
          id: now + Math.floor(Math.random() * 1000),
          leadId: lead.id,
          subject: channel === 'whatsapp' ? `[WhatsApp] ${subject}` : subject,
          body,
          channel,
          status: scheduled ? 'scheduled' : 'sent',
          sentAt,
          scheduledAt: scheduled
            ? new Date(now + 3600 * 1000).toISOString()
            : null,
          openedAt: null,
          repliedAt: null,
          whatsappNumber:
            channel === 'whatsapp'
              ? normalizedWhatsappNumber || lead.phone || null
              : null,
          attachmentName: normalizedAttachmentName || null,
        },
        ...previous,
      ]);
      setLeads((previous) =>
        previous.map((item) =>
          item.id === lead.id
            ? { ...item, lastContact: new Date().toISOString() }
            : item,
        ),
      );
    },
    [],
  );

  return (
    <div className="space-y-5 lg:space-y-7.5">
      {view === 'dashboard' ? (
        <DashboardSectionView
          leads={leads}
          stats={stats}
          statusChartData={statusChartData}
          sectorChartData={sectorChartData}
          cityChartData={cityChartData}
          scanHistoryChartData={scanHistoryChartData}
          apiUsage={apiUsage}
          onStartScan={() => navigate(DASHBOARD_PATHS.scan)}
          onOpenLeads={() => navigate(DASHBOARD_PATHS.leads)}
          scoreVariant={scoreVariant}
          statusVariant={statusVariant}
        />
      ) : null}

      {view === 'scan' ? <Card /> : null}
      {view === 'prospects' ? <Card /> : null}

      {view === 'crm' ? (
        <CrmSectionView
          crmStats={crmStats}
          compose={compose}
          setCompose={setCompose}
          composeLead={composeLead}
          leads={leads}
          emails={emails}
          sendMessage={sendMessage}
          applyTemplate={applyTemplate}
          templates={TEMPLATES}
          defaultCompose={DEFAULT_COMPOSE}
          crmActionCounts={crmActionCounts}
          crmFilter={crmFilter}
          setCrmFilter={setCrmFilter}
          crmFilteredEmails={crmFilteredEmails}
          setLeads={setLeads}
        />
      ) : null}

      {view === 'pipeline' ? (
        <PipelineSectionView
          leads={leads}
          onOpenProspects={() => navigate(DASHBOARD_PATHS.prospects)}
          scoreVariant={scoreVariant}
        />
      ) : null}

      {view === 'leads' ? <Card /> : null}
    </div>
  );
}

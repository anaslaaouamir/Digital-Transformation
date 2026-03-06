export type DashboardView =
  | 'dashboard'
  | 'scan'
  | 'prospects'
  | 'crm'
  | 'pipeline'
  | 'leads';

export type LeadStatus = 'hot' | 'warm' | 'cold';
export type Channel = 'email' | 'whatsapp';
export type ComposeChannel = Channel | 'both';
export type CrmFilter = 'all' | 'sent' | 'whatsapp' | 'scheduled';

export interface Lead {
  id: number;
  name: string;
  company: string;
  role: string;
  sector: string;
  city: string;
  email: string;
  phone: string;
  website: string;
  rating: number;
  score: number;
  status: LeadStatus;
  employees: string;
  revenue: string;
  linkedin: string;
  notes: string;
  aiMessage: string;
  lastContact: string | null;
}

export interface EmailLog {
  id: number;
  leadId: number;
  subject: string;
  body: string;
  channel: Channel;
  status: 'sent' | 'scheduled';
  sentAt: string | null;
  scheduledAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
  whatsappNumber?: string | null;
  attachmentName?: string | null;
}

export interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export interface ComposeState {
  leadId: number | null;
  templateId: string;
  channel: ComposeChannel;
  subject: string;
  body: string;
  scheduled: boolean;
  whatsappNumber: string;
  attachment: File | null;
}

export interface ScanHistoryEntry {
  id: number;
  prospects: number;
  avgScore: number;
}

export interface DashboardStats {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  avgScore: number;
  bySector: Record<string, number>;
  byCity: Record<string, number>;
  withSite: number;
  enriched: number;
}

export interface ApiUsage {
  google: number;
  apollo: number;
  claude: number;
}

export interface CategoryChartDatum {
  name: string;
  value: number;
}

export interface StatusChartDatum extends CategoryChartDatum {
  fill: string;
}

export interface ScanHistoryChartDatum {
  name: string;
  prospects: number;
  score: number;
}

export interface CrmStats {
  sent: number;
  planned: number;
  openedRate: number;
  responseRate: number;
  activeSequences: number;
}

export interface CrmActionCounts {
  hotToContact: number;
  uncontacted: number;
  followupCandidates: number;
  aiCandidates: number;
  whatsappCandidates: number;
  propositionTargets: number;
}

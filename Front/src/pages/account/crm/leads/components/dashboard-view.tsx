import { useMemo } from 'react';
import {
  Activity,
  BarChart3,
  Brain,
  CreditCard,
  Database,
  Globe,
  LayoutDashboard,
  MapPin,
  Rocket,
  Target,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { KpiCard } from './kpi-card';

type LeadStatus = 'hot' | 'warm' | 'cold';

interface Lead {
  id: number;
  name: string;
  company: string;
  city: string;
  sector: string;
  score: number;
  status: string;
  website?: string;
  apolloEnriched?: boolean;
}

interface ScanHistoryEntry {
  date: string;
  count: number;
  avgScore: number;
  apollo: boolean;
}

interface DashboardSectionViewProps {
  leads: Lead[];
  scanHistory: ScanHistoryEntry[];
  onStartScan: () => void;
  onOpenLeads: () => void;
}

const normalizeStatus = (status: string): LeadStatus => {
  const normalized = status.toLowerCase();
  if (normalized === 'hot' || normalized === 'warm' || normalized === 'cold') {
    return normalized;
  }
  return 'cold';
};

const scoreVariant = (score: number): 'success' | 'warning' | 'destructive' =>
  score >= 80 ? 'success' : score >= 60 ? 'warning' : 'destructive';

const statusVariant = (status: LeadStatus): 'success' | 'warning' | 'info' =>
  status === 'hot' ? 'success' : status === 'warm' ? 'warning' : 'info';

export function DashboardSectionView({
  leads,
  scanHistory,
  onStartScan,
  onOpenLeads,
}: DashboardSectionViewProps) {
  const normalizedLeads = useMemo(
    () =>
      leads.map((lead) => ({
        ...lead,
        status: normalizeStatus(lead.status),
      })),
    [leads],
  );

  const stats = useMemo(() => {
    const bySector: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    let hot = 0;
    let warm = 0;
    let cold = 0;
    let withSite = 0;
    let enriched = 0;
    let scoreTotal = 0;

    normalizedLeads.forEach((lead) => {
      scoreTotal += lead.score;
      bySector[lead.sector] = (bySector[lead.sector] ?? 0) + 1;
      byCity[lead.city] = (byCity[lead.city] ?? 0) + 1;
      if (lead.website) withSite += 1;
      if (lead.apolloEnriched) enriched += 1;
      if (lead.status === 'hot') hot += 1;
      else if (lead.status === 'warm') warm += 1;
      else cold += 1;
    });

    return {
      total: normalizedLeads.length,
      hot,
      warm,
      cold,
      avgScore: normalizedLeads.length
        ? Math.round(scoreTotal / normalizedLeads.length)
        : 0,
      withSite,
      enriched,
      bySector,
      byCity,
    };
  }, [normalizedLeads]);

  const statusChartData = useMemo(
    () => [
      { name: 'Hot', value: stats.hot, fill: '#ef4444' },
      { name: 'Warm', value: stats.warm, fill: '#f59e0b' },
      { name: 'Cold', value: stats.cold, fill: '#94a3b8' },
    ],
    [stats.cold, stats.hot, stats.warm],
  );

  const sectorChartData = useMemo(
    () =>
      Object.entries(stats.bySector)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [stats.bySector],
  );

  const cityChartData = useMemo(
    () =>
      Object.entries(stats.byCity)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [stats.byCity],
  );

  const scanHistoryChartData = useMemo(
    () =>
      scanHistory.slice(-10).map((scan, index) => ({
        name: `Scan ${index + 1}`,
        prospects: scan.count,
        score: scan.avgScore,
      })),
    [scanHistory],
  );

  const apiUsage = useMemo(
    () => ({
      google: scanHistory.reduce((sum, scan) => sum + scan.count, 0),
      apollo: scanHistory
        .filter((scan) => scan.apollo)
        .reduce((sum, scan) => sum + scan.count, 0),
      claude: scanHistory.length,
    }),
    [scanHistory],
  );

  if (normalizedLeads.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <LayoutDashboard size={52} className="text-muted-foreground/40" />
          <div>
            <h3 className="text-xl font-semibold">Dashboard is empty</h3>
            <p className="text-sm text-muted-foreground">
              Run your first scan to populate insights.
            </p>
          </div>
          <Button onClick={onStartScan}>
            <Rocket size={16} /> Start first scan
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={Users} label="Total prospects" value={stats.total} />
        <KpiCard icon={Target} label="Hot prospects" value={stats.hot} />
        <KpiCard
          icon={Brain}
          label="Average score"
          value={stats.avgScore}
          helper="/100"
        />
        <KpiCard icon={Database} label="Apollo enriched" value={stats.enriched} />
        <KpiCard icon={Globe} label="With website" value={stats.withSite} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target size={14} /> Status split
            </CardTitle>
          </CardHeader>
          <CardContent className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                >
                  {statusChartData.map((row) => (
                    <Cell key={row.name} fill={row.fill} />
                  ))}
                </Pie>
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 size={14} /> Top sectors
            </CardTitle>
          </CardHeader>
          <CardContent className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis hide />
                <ReTooltip />
                <Bar
                  dataKey="value"
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin size={14} /> Top cities
            </CardTitle>
          </CardHeader>
          <CardContent className="h-60">
            {cityChartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis hide />
                  <ReTooltip />
                  <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No city data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity size={14} /> Scan history
          </CardTitle>
        </CardHeader>
        <CardContent className="h-60">
          {scanHistoryChartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scanHistoryChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                />
                <ReTooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="prospects"
                  name="Prospects"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="score"
                  name="Avg score"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No scans yet
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top prospects</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...normalizedLeads]
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
                .map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={onOpenLeads}
                  >
                    <TableCell className="font-medium">{lead.company}</TableCell>
                    <TableCell>{lead.name || '-'}</TableCell>
                    <TableCell>{lead.city}</TableCell>
                    <TableCell>
                      <Badge
                        variant={scoreVariant(lead.score)}
                        appearance="light"
                        className="font-mono"
                      >
                        {lead.score}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant(lead.status)}
                        appearance="light"
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <CreditCard size={14} /> API usage
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {(
            [
              {
                label: 'Google',
                used: apiUsage.google,
                max: 11764,
                color: 'bg-red-500',
              },
              {
                label: 'Apollo',
                used: apiUsage.apollo,
                max: 10000,
                color: 'bg-emerald-500',
              },
              {
                label: 'Claude',
                used: apiUsage.claude,
                max: 1000,
                color: 'bg-violet-500',
              },
            ] as const
          ).map((api) => {
            const percent = Math.min(Math.round((api.used / api.max) * 100), 100);
            return (
              <div
                key={api.label}
                className="space-y-2 rounded-md border border-border p-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{api.label}</span>
                  <span className="font-mono">{percent}%</span>
                </div>
                <Progress value={percent} indicatorClassName={api.color} />
                <div className="text-xs text-muted-foreground">
                  {api.used.toLocaleString()} / {api.max.toLocaleString()}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}

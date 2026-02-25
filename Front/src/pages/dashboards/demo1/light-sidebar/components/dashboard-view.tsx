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
import type {
  ApiUsage,
  CategoryChartDatum,
  DashboardStats,
  Lead,
  LeadStatus,
  ScanHistoryChartDatum,
  StatusChartDatum,
} from '@/types/dashboard.types';
import { KpiCard } from './kpi-card';

interface DashboardSectionViewProps {
  leads: Lead[];
  stats: DashboardStats;
  statusChartData: StatusChartDatum[];
  sectorChartData: CategoryChartDatum[];
  cityChartData: CategoryChartDatum[];
  scanHistoryChartData: ScanHistoryChartDatum[];
  apiUsage: ApiUsage;
  onStartScan: () => void;
  onOpenLeads: () => void;
  scoreVariant: (score: number) => 'success' | 'warning' | 'destructive';
  statusVariant: (status: LeadStatus) => 'success' | 'warning' | 'info';
}

export function DashboardSectionView({
  leads,
  stats,
  statusChartData,
  sectorChartData,
  cityChartData,
  scanHistoryChartData,
  apiUsage,
  onStartScan,
  onOpenLeads,
  scoreVariant,
  statusVariant,
}: DashboardSectionViewProps) {
  if (leads.length === 0) {
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
              {[...leads]
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
                .map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={onOpenLeads}
                  >
                    <TableCell className="font-medium">{lead.company}</TableCell>
                    <TableCell>{lead.name}</TableCell>
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

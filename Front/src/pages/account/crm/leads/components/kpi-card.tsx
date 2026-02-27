import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  helper?: string;
}

export function KpiCard({ icon: Icon, label, value, helper }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 inline-flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon size={18} />
        </div>
        <div className="text-xl font-semibold text-mono">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {helper ? (
          <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

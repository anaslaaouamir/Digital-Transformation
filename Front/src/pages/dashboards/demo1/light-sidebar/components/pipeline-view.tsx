import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Lead } from '@/types/dashboard.types';

interface PipelineSectionViewProps {
  leads: Lead[];
  onOpenProspects: () => void;
  scoreVariant: (score: number) => 'success' | 'warning' | 'destructive';
}

export function PipelineSectionView({
  leads,
  onOpenProspects,
  scoreVariant,
}: PipelineSectionViewProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {(['hot', 'warm', 'cold'] as const).map((status) => {
        const items = [...leads]
          .filter((lead) => lead.status === status)
          .sort((a, b) => b.score - a.score);
        return (
          <Card key={status}>
            <CardHeader>
              <CardTitle className="text-sm capitalize">
                {status} ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.length ? (
                items.slice(0, 12).map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    className="w-full rounded-md border border-border p-3 text-left hover:bg-muted/30"
                    onClick={onOpenProspects}
                  >
                    <div className="text-sm font-medium">{lead.company}</div>
                    <div className="text-xs text-muted-foreground">
                      {lead.name} · {lead.city}
                    </div>
                    <div className="mt-1">
                      <Badge variant={scoreVariant(lead.score)} appearance="light">
                        {lead.score}
                      </Badge>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                  Empty
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

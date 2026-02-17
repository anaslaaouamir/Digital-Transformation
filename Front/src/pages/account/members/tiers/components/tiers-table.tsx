'use client';

import { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  EllipsisVertical, Filter, Search, Settings2,
  Trash2, Eye, Edit2, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card, CardFooter, CardHeader, CardHeading,
  CardTable, CardToolbar,
} from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from '@/components/ui/data-grid-table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useTiersQuery, useDeleteTierMutation } from '../hooks';
import type { ITiers, ITiersApiParams } from '../types';

interface TiersTableProps {
  onView?: (tier: ITiers) => void;
  onEdit?: (tier: ITiers) => void;
}

export function TiersTable({ onView, onEdit }: TiersTableProps = {}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchInput, setSearchInput] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [showFilters, setShowFilters] = useState(false);
  const [filterClient, setFilterClient] = useState(false);
  const [filterFournisseur, setFilterFournisseur] = useState(false);
  const [filterProspect, setFilterProspect] = useState(false);
  const [filterEtat, setFilterEtat] = useState('');

  const titleClass = 'text-xs font-bold uppercase tracking-widest text-foreground';

  const resetPage = useCallback(() => setPagination((p) => ({ ...p, pageIndex: 0 })), []);

  const handleFilterChange = useCallback((fn: () => void) => { fn(); resetPage(); }, [resetPage]);

  // ── Build query params matching the API's expected camelCase param names ──
  const queryParams = useMemo((): ITiersApiParams => ({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    // search sent as-is — backend searches by nom/email/telephone
    search: searchInput.trim() || undefined,
    // boolean filters — only sent when true
    estClient:      filterClient      ? true : undefined,
    estFournisseur: filterFournisseur ? true : undefined,
    estProspect:    filterProspect    ? true : undefined,
    // etat filter — sent as the French value the backend expects
    etat: filterEtat || undefined,
    sortBy:    sorting.length > 0 ? sorting[0].id : undefined,
    sortOrder: sorting.length > 0 ? (sorting[0].desc ? 'desc' as const : 'asc' as const) : undefined,
  }), [
    pagination.pageIndex, pagination.pageSize,
    searchInput, filterClient, filterFournisseur,
    filterProspect, filterEtat, sorting,
  ]);

  const { data: tiersResponse, isLoading, isFetching, error } = useTiersQuery(queryParams);
  const deleteTierMutation = useDeleteTierMutation();

  const handleViewTier = useCallback((tier: ITiers) => {
    if (onView) onView(tier); else toast.info(`Affichage de ${tier.nom}`);
  }, [onView]);

  const handleEditTier = useCallback((tier: ITiers) => {
    if (onEdit) onEdit(tier); else toast.info(`Modification de ${tier.nom}`);
  }, [onEdit]);

  const handleDeleteTier = useCallback((id: number) => {
    deleteTierMutation.mutate(id);
  }, [deleteTierMutation]);

  const data     = useMemo<ITiers[]>(() => tiersResponse?.data ?? [], [tiersResponse]);
  const total    = tiersResponse?.total ?? 0;
  const pageCount = Math.ceil(total / pagination.pageSize) || 1;

  // Local fallback filtering for toggles, in case backend ignores them.
  const viewData = useMemo(() => {
    return data.filter((t) => {
      const isClient = (t as any).estClient ?? (t as any).est_client ?? false;
      const isFournisseur = (t as any).estFournisseur ?? (t as any).est_fournisseur ?? false;
      const isProspect = (t as any).estProspect ?? (t as any).est_prospect ?? false;
      if (filterClient && !isClient) return false;
      if (filterFournisseur && !isFournisseur) return false;
      if (filterProspect && !isProspect) return false;
      if (filterEtat && t.etat !== filterEtat) return false;
      return true;
    });
  }, [data, filterClient, filterFournisseur, filterProspect, filterEtat]);

  // If backend does not paginate (returns full list), slice on the client.
  // Heuristic: when total <= returned data length, we assume no server-side pagination.
  const tableData = useMemo(() => {
    const isServerPaginated = total > data.length;
    if (isServerPaginated) return viewData;
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return viewData.slice(start, end);
  }, [total, data.length, viewData, pagination.pageIndex, pagination.pageSize]);

  const columns: ColumnDef<ITiers>[] = useMemo(() => [
    {
      id: 'select',
      header: () => <DataGridTableRowSelectAll />,
      cell: ({ row }) => <DataGridTableRowSelect row={row} />,
      enableSorting: false,
      enableHiding: false,
      size: 51,
    },
    // ── Nom ─────────────────────────────────────────────────────────────────
    {
      accessorKey: 'nom',
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Nom" className={titleClass} />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.nom}</span>
          {row.original.email && (
            <span className="text-xs text-gray-500">{row.original.email}</span>
          )}
        </div>
      ),
    },
    // ── Nature ──────────────────────────────────────────────────────────────
    {
      id: 'nature',
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Nature" className={titleClass} />
      ),
      enableSorting: false,
      cell: ({ row }) => {
        const t = row.original;
        if (!t.estClient && !t.estFournisseur && !t.estProspect)
          return <span className="text-gray-400">—</span>;
        return (
          <div className="flex gap-1 flex-wrap">
            {t.estClient      && <Badge variant="secondary">Client</Badge>}
            {t.estFournisseur && <Badge variant="secondary">Fournisseur</Badge>}
            {t.estProspect    && <Badge variant="secondary">Prospect</Badge>}
          </div>
        );
      },
    },
    // ── E-mail ──────────────────────────────────────────────────────────────
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="E-mail" className={titleClass} />
      ),
      cell: ({ row }) => row.original.email || <span className="text-gray-400">—</span>,
    },
    // ── Téléphone ───────────────────────────────────────────────────────────
    {
      accessorKey: 'telephone',
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Téléphone" className={titleClass} />
      ),
      cell: ({ row }) => (row.original.telephone || row.original.mobile) || <span className="text-gray-400">—</span>,
    },
    // ── Ville ───────────────────────────────────────────────────────────────
    {
      accessorKey: 'ville',
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Ville" className={titleClass} />
      ),
      cell: ({ row }) => row.original.ville || <span className="text-gray-400">—</span>,
    },
    // ── Statut ──────────────────────────────────────────────────────────────
    {
      accessorKey: 'etat',
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Statut" className={titleClass} />
      ),
      cell: ({ row }) => {
        const etat = row.original.etat;
        const label =
          etat === 'ouvert'   ? 'ouvert'     :
          etat === 'Fermé'    ? 'Fermé'     :
         
          etat ?? '—';
        const isActive = etat === 'ouvert' ;
        return <Badge variant={isActive ? 'success' : 'warning'}>{label}</Badge>;
      },
    },
    // ── Actions ─────────────────────────────────────────────────────────────
    {
      id: 'actions',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const tier = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Ouvrir le menu</span>
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewTier(tier)}>
                <Eye className="mr-2 h-4 w-4" /> Voir les détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditTier(tier)}>
                <Edit2 className="mr-2 h-4 w-4" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteTier(tier.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [handleViewTier, handleEditTier, handleDeleteTier]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, pagination, columnVisibility, globalFilter: searchInput },
    manualPagination: true,
    manualSorting: true,
    pageCount,
    onSortingChange: (u) => { setSorting(u); resetPage(); },
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Fallback client-side filtering for search only (helps when backend ignores `search`)
    getFilteredRowModel: getFilteredRowModel(),
  });

  const hasActiveFilters = filterClient || filterFournisseur || filterProspect || !!filterEtat;

  return (
    <Card>
      <CardHeader className="sticky top-0 z-10">
        <CardHeading>Gestion des tiers</CardHeading>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertIcon />
            <AlertTitle>{error instanceof Error ? error.message : 'Error loading tiers'}</AlertTitle>
          </Alert>
        )}

        <CardToolbar>
          <div className="flex items-center gap-2 lg:gap-5">

            {/* ── Search ─────────────────────────────────────────────────── */}
            <div className="flex flex-auto items-center gap-2">
              <Search className="size-5 shrink-0 text-gray-500" />
              <Input
                placeholder="Rechercher par nom, e-mail, téléphone…"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); resetPage(); }}
                className="h-9 max-w-64"
              />
            </div>

            {/* ── Filters ────────────────────────────────────────────────── */}
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant={hasActiveFilters ? 'default' : 'outline'} size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtres{hasActiveFilters && ' (actifs)'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Filtrer par</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Client</Label>
                      <Switch
                        checked={filterClient}
                        onCheckedChange={(v) => handleFilterChange(() => setFilterClient(v))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Fournisseur</Label>
                      <Switch
                        checked={filterFournisseur}
                        onCheckedChange={(v) => handleFilterChange(() => setFilterFournisseur(v))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Prospect</Label>
                      <Switch
                        checked={filterProspect}
                        onCheckedChange={(v) => handleFilterChange(() => setFilterProspect(v))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Statut</Label>
                      <select
                        value={filterEtat}
                        onChange={(e) => handleFilterChange(() => setFilterEtat(e.target.value))}
                        className="w-full h-8 rounded border border-gray-300 px-2 text-sm"
                      >
                        <option value="">Tous les statuts</option>
                        <option value="ouvert">Ouvert</option>
                        <option value="ferme">Fermé</option>
                        
                      </select>
                    </div>
                  </div>
                  <Button
                    variant="outline" size="sm" className="w-full"
                    onClick={() => handleFilterChange(() => {
                      setFilterClient(false);
                      setFilterFournisseur(false);
                      setFilterProspect(false);
                      setFilterEtat('');
                    })}
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button size="sm" asChild>
              <Link to="/add_tiers">
                <Plus className="mr-2 h-4 w-4" /> Ajouter un tiers
              </Link>
            </Button>

            <DataGridColumnVisibility
              table={table}
              trigger={
                <Button variant="outline" size="sm">
                  <Settings2 className="mr-2 h-4 w-4" /> Colonnes
                </Button>
              }
            />
          </div>
        </CardToolbar>
      </CardHeader>

      <DataGrid table={table} recordCount={total} tableLayout={{}}>
        <CardTable>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : (
            <ScrollArea>
              <div className={isFetching && !isLoading ? 'opacity-60 pointer-events-none' : ''}>
                <table className="w-full border-collapse">
                  <thead className="bg-muted/50">
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id}>
                        {hg.headers.map((h) => (
                          <th
                            key={h.id}
                            className="border-b px-4 py-2 text-left text-muted-foreground font-semibold text-xs uppercase tracking-wider"
                          >
                            {h.isPlaceholder ? null
                              : typeof h.column.columnDef.header === 'function'
                              ? h.column.columnDef.header(h.getContext())
                              : h.column.columnDef.header}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="border-b hover:bg-gray-50">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-2">
                            {typeof cell.column.columnDef.cell === 'function'
                              ? cell.column.columnDef.cell(cell.getContext())
                              : cell.column.columnDef.cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardTable>

        {!isLoading && data.length === 0 && !error && (
          <div className="flex flex-col justify-center items-center h-40 gap-2">
            <p className="text-gray-500">Aucun tiers trouvé</p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm"
                onClick={() => handleFilterChange(() => {
                  setFilterClient(false); setFilterFournisseur(false);
                  setFilterProspect(false); setFilterEtat('');
                  setSearchInput('');
                })}>
                Effacer les filtres
              </Button>
            )}
          </div>
        )}

        <CardFooter>
          <DataGridPagination />
        </CardFooter>
      </DataGrid>
    </Card>
  );
}

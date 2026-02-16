'use client';

import { useState } from 'react';
import { TiersTable } from './components/tiers-table';
import { TiersDetailView } from './components/tiers-detail-view';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ITiers } from './types';

export function AccountTiersContent() {
  const [selectedTier, setSelectedTier] = useState<ITiers | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  // ─── These are passed as props to TiersTable ──────────────────────────────
  const handleView = (tier: ITiers) => {
    setSelectedTier(tier);
    setShowDetail(true);
  };

  const handleEdit = (tier: ITiers) => {
    setSelectedTier(tier);
    setShowEdit(true);
  };
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="grid gap-5 lg:gap-7.5">

      {/* TiersTable receives onView and onEdit — clicking "View Details" now
          calls handleView() above which sets selectedTier and opens the dialog */}
      <TiersTable onView={handleView} onEdit={handleEdit} />

      {/* ── Detail View Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={showDetail}
        onOpenChange={(open) => {
          setShowDetail(open);
          if (!open) setSelectedTier(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTier?.nom ?? 'Détails du Tier'}</DialogTitle>
          </DialogHeader>

          {/* Only render TiersDetailView when a tier is selected */}
          {selectedTier && (
            <TiersDetailView
              tierId={selectedTier.id}
              onClose={() => {
                setShowDetail(false);
                setSelectedTier(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ────────────────────────────────────────────────────── */}
      <Dialog
        open={showEdit}
        onOpenChange={(open) => {
          setShowEdit(open);
          if (!open) setSelectedTier(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier — {selectedTier?.nom ?? ''}</DialogTitle>
          </DialogHeader>

          {selectedTier && (
            // TODO: Replace this with <TiersForm tier={selectedTier} onSubmit={...} onCancel={...} />
            <div className="p-4 text-sm text-gray-500">
              Replace this with your <strong>TiersForm</strong> component.<br />
              Editing: <strong>{selectedTier.nom}</strong> (id: {selectedTier.id})
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
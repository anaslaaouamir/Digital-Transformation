'use client';

import { useState } from 'react';
import { ITiers } from '../types';
import { TiersTable } from '../components/tiers-table';
import { TiersForm } from '../components/tiers-form';
import { TiersDetailView } from '../components/tiers-detail-view';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * This is an example of how to extend the basic Tiers module
 * with additional features like modals for creating/editing tiers.
 * 
 * You can use this as a reference for your own implementation.
 */

export function ExampleTiersManagement() {
  const [selectedTier, setSelectedTier] = useState<ITiers | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const handleAddTier = () => {
    setSelectedTier(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEditTier = (tier: ITiers) => {
    setSelectedTier(tier);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleViewTier = (tier: ITiers) => {
    setSelectedTier(tier);
    setShowDetail(true);
  };

  const handleFormSubmit = (tier: ITiers) => {
    setShowForm(false);
    setSelectedTier(null);
    // Optionally reload table data here
  };

  return (
    <div>
      {/* Main Table */}
      <TiersTable />

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? 'Ajouter un Tier' : 'Modifier le Tier'}
            </DialogTitle>
          </DialogHeader>
          <TiersForm
            tier={selectedTier || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du Tier</DialogTitle>
          </DialogHeader>
          {selectedTier && (
            <TiersDetailView
              tierId={selectedTier.id}
              onClose={() => setShowDetail(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

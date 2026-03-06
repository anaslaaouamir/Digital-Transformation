'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { fetchTierById } from '../api';
import type { ITiers } from '../types';

interface TiersDetailViewProps {
  tierId: number;
  onClose?: () => void;
}

export function TiersDetailView({ tierId, onClose }: TiersDetailViewProps) {
  const [tier, setTier] = useState<ITiers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTierDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTierById(tierId);
      setTier(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tier details');
    } finally {
      setLoading(false);
    }
  }, [tierId]);

  useEffect(() => {
    loadTierDetails();
  }, [loadTierDetails]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2 p-4">
        <p className="text-red-600">{error}</p>
        <Button variant="outline" size="sm" onClick={loadTierDetails}>Retry</Button>
      </div>
    );
  }

  if (!tier) {
    return <div className="text-gray-500 p-4">No tier found</div>;
  }

  // Only show sections that have at least one real value
  const hasIdentification = !!(tier.codeClient || tier.codeFournisseur);
  const hasNature        = !!(tier.estClient || tier.estFournisseur || tier.estProspect);
  const hasContact       = !!(tier.telephone || tier.mobile || tier.email || tier.siteWeb);
  const hasAddress       = !!(tier.adresse || tier.codePostal || tier.ville || tier.pays || tier.departementCanton);
  const hasTax           = !!(tier.rc || tier.ifFisc || tier.cnss || tier.ice);
  const hasCompany       = !!(tier.typeTiers || tier.typeEntiteLegale || tier.capital != null || tier.effectif);
  const hasFinancial     = !!(tier.devise || tier.conditionReglement || tier.modeReglement);

  return (
    <Card className="p-6 border-0 shadow-none">
      {onClose && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{tier.nom}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left Column */}
        <div className="space-y-5">

          {hasIdentification && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Identification</p>
              <div className="space-y-1 text-sm">
                {tier.codeClient && (
                  <p><span className="font-medium text-gray-600">Client Code:</span> {tier.codeClient}</p>
                )}
                {tier.codeFournisseur && (
                  <p><span className="font-medium text-gray-600">Supplier Code:</span> {tier.codeFournisseur}</p>
                )}
              </div>
            </section>
          )}

          {hasNature && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Nature</p>
              <div className="flex gap-2 flex-wrap">
                {tier.estClient     && <Badge variant="secondary">Client</Badge>}
                {tier.estFournisseur && <Badge variant="secondary">Supplier</Badge>}
                {tier.estProspect   && <Badge variant="secondary">Prospect</Badge>}
              </div>
            </section>
          )}

          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Status</p>
            <Badge variant={tier.etat === 'ouvert' ? 'success' : 'warning'}>
              {tier.etat === 'ouvert' ? 'Active' : tier.etat}
            </Badge>
          </section>

          {hasContact && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Contact Information</p>
              <div className="space-y-1 text-sm">
                {tier.telephone && <p>Phone: {tier.telephone}</p>}
                {tier.mobile    && <p>Mobile: {tier.mobile}</p>}
                {tier.email     && <p>Email: {tier.email}</p>}
                {tier.siteWeb   && <p>Website: {tier.siteWeb}</p>}
              </div>
            </section>
          )}

        </div>

        {/* Right Column */}
        <div className="space-y-5">

          {hasAddress && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Address</p>
              <div className="space-y-1 text-sm">
                {tier.adresse && <p>{tier.adresse}</p>}
                {(tier.codePostal || tier.ville) && (
                  <p>{[tier.codePostal, tier.ville].filter(Boolean).join(' ')}</p>
                )}
                {tier.pays               && <p>{tier.pays}</p>}
                {tier.departementCanton  && <p>{tier.departementCanton}</p>}
              </div>
            </section>
          )}

          {hasTax && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Tax Identifiers</p>
              <div className="space-y-1 text-sm">
                {tier.rc      && <p>RC: {tier.rc}</p>}
                {tier.ifFisc  && <p>Tax ID: {tier.ifFisc}</p>}
                {tier.cnss    && <p>CNSS: {tier.cnss}</p>}
                {tier.ice     && <p>ICE: {tier.ice}</p>}
              </div>
            </section>
          )}

          {hasCompany && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Company</p>
              <div className="space-y-1 text-sm">
                {tier.typeTiers         && <p>Type: {tier.typeTiers}</p>}
                {tier.typeEntiteLegale  && <p>Legal Entity: {tier.typeEntiteLegale}</p>}
                {tier.capital != null   && <p>Capital: {tier.capital.toLocaleString('en-US')}</p>}
                {tier.effectif          && <p>Employees: {tier.effectif}</p>}
              </div>
            </section>
          )}

          {hasFinancial && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Financial</p>
              <div className="space-y-1 text-sm">
                {tier.devise             && <p>Currency: {tier.devise}</p>}
                {tier.conditionReglement && <p>Payment Terms: {tier.conditionReglement}</p>}
                {tier.modeReglement      && <p>Payment Method: {tier.modeReglement}</p>}
              </div>
            </section>
          )}

        </div>
      </div>

      {tier.tags && (
        <section className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Tags</p>
          <div className="flex gap-2 flex-wrap">
            {tier.tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 pt-4 border-t text-xs text-gray-400">
        Created on{' '}
        {tier.dateCreation
          ? new Date(tier.dateCreation).toLocaleDateString('en-US')
          : '—'}
      </div>
    </Card>
  );
}
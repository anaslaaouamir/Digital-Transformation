'use client';

import { Fragment } from 'react';
import { PageNavbar } from '@/pages/account';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { Link } from 'react-router';
import { useSettings } from '@/providers/settings-provider';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import { AccountTiersContent } from './account-basic-content';

export function AccountTiersPage() {
  const { settings } = useSettings();

  return (
    <Fragment>
      <PageNavbar />
      {settings?.layout === 'demo1' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                  <span className="text-gray-700 font-medium">
                  Track, organize, and follow up with your tiers (clients, fournisseurs, prospects).
                  </span>
    
              </ToolbarDescription>

            </ToolbarHeading>
            <ToolbarActions>
              <Button asChild>
                <Link to="/account/members/tiers//tiers-form">Add Tier</Link>
              </Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountTiersContent />
      </Container>
    </Fragment>
  );
}
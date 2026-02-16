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
import { AccountCompanyProfileContent } from '.';

export function AddTiers() {
  const { settings } = useSettings();

  return (
    <Fragment>
      <PageNavbar />
      {settings?.layout === 'demo1' && (
        <Container>
          <Toolbar>
          <ToolbarHeading>
            <h1 className="text-xl font-bold text-gray-900">Ajouter un Tiers</h1>
          </ToolbarHeading>
            
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountCompanyProfileContent />
      </Container>
    </Fragment>
  );
}

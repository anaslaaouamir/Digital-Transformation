import { Fragment } from 'react';
import { PageNavbar } from '@/pages/account';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useSettings } from '@/providers/settings-provider';
import { Container } from '@/components/common/container';
import { AccountCrmLeadsContent } from './account-basic-content';

export function AccountCrmLeadsPage() {
  const { settings } = useSettings();

  return (
    <Fragment>
      <PageNavbar />
      {settings?.layout === 'demo1' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text="Leads" />
              <ToolbarDescription>
                ProspectAI — Google Places, Apollo.io & Claude. Manage and track your prospects.
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>{null}</ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountCrmLeadsContent />
      </Container>
    </Fragment>
  );
}

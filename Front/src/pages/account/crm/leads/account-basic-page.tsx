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
    
      <Container>
        <AccountCrmLeadsContent />
      </Container>
    </Fragment>
  );
}

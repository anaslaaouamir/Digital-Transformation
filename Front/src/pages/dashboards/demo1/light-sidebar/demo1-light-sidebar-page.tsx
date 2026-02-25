import { Fragment, useMemo } from 'react';
import {
  Toolbar,
  ToolbarHeading,
} from '@/layouts/demo1/components/toolbar';
import { useLocation } from 'react-router';
import { Container } from '@/components/common/container';
import { Demo1LightSidebarContent } from './';

export function Demo1LightSidebarPage() {
  const location = useLocation();

  const pageHeading = useMemo(() => {
    if (location.pathname === '/mass-scan') {
      return {
        title: 'Mass Scan',
        description: 'Configure filters and run lead discovery scans',
      };
    }
    if (location.pathname === '/prospects') {
      return {
        title: 'Prospects',
        description: 'Browse and qualify generated prospects',
      };
    }
    if (location.pathname === '/crm') {
      return {
        title: 'CRM',
        description: 'Manage outreach and message history',
      };
    }
    if (location.pathname === '/pipline') {
      return {
        title: 'Pipeline',
        description: 'Track hot, warm, and cold pipeline stages',
      };
    }
    if (location.pathname === '/leads') {
      return {
        title: 'Leads',
        description: ' description - fill later',
      };
    }

    return {
      title: 'Dashboard',
      description: 'Central Hub for Personal Customization',
    };
  }, [location.pathname]);

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading
            title={pageHeading.title}
            description={pageHeading.description}
          />
        </Toolbar>
      </Container>
      <Container>
        <Demo1LightSidebarContent />
      </Container>
    </Fragment>
  );
}

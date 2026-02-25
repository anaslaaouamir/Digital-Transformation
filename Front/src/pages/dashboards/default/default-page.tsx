import { useSettings } from '@/providers/settings-provider';
import {
  Demo1LightSidebarPage,
} from '../';

const DefaultPage = () => {
  const { settings } = useSettings();

  if (settings?.layout === 'demo1') {
    return <Demo1LightSidebarPage />;
  }
  
};

export { DefaultPage };

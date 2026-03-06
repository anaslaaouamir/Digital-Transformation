import { GeneralInfo } from './components';
import { Button } from '@/components/ui/button';


export function AccountCompanyProfileContent() {
  return (
    // We removed "grid-cols-3" so it now takes full width
    <div className="w-full max-w-7xl mx-auto">
        
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <GeneralInfo />
          
         
        </div>

    </div>
  );
}
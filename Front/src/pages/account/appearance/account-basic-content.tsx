import { Engage } from '@/partials/common/engage';
import { Faq } from '@/partials/common/faq';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Branding } from '../home/company-profile';
import { AdvancedSettingsAppearance } from '../home/settings-sidebar';
import { Accessibility, DisableDefaultBrand } from './components';

export function AccountAppearanceContent() {

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
      <div className="col-span-2">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <AdvancedSettingsAppearance title="Theme" />
          <Branding />
          <Accessibility />
          <Faq />
          <Engage
            title="Contact Support"
            description="Need assistance? Contact our support team for prompt, personalized help your queries & concerns."
            image={
              <>
                <img
                  src={toAbsoluteUrl('/media/illustrations/31.svg')}
                  className="dark:hidden max-h-[150px]"
                  alt="image"
                />
                <img
                  src={toAbsoluteUrl('/media/illustrations/31-dark.svg')}
                  className="light:hidden max-h-[150px]"
                  alt="image"
                />
              </>
            }
            more={{
              title: 'Contact Support',
              url: '#',
            }}
          />
        </div>
      </div>
      <div className="col-span-1">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <DisableDefaultBrand />
        </div>
      </div>
    </div>
  );
}

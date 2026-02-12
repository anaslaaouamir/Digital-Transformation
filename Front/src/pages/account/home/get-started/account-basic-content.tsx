import { Fragment } from 'react';
import {
  FileText,
  IdCard,
  LineChart,
  Users,
} from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { IOptionsItems, Options } from './components';

export function AccountGetStartedContent() {
  const items: IOptionsItems = [
    {
      icon: IdCard,
      title: 'Personal info',
      desc: "We're open to partnerships, guest posts, promo bannersand more.",
      path: '/account/members/team-info',
    },
    {
      icon: FileText,
      title: 'Billing & Payments',
      desc: 'Simplify payments today with secure, user-friendly transaction processes.',
      path: '/account/billing/basic',
    },
    {
      icon: Users,
      title: 'Members, Teams & Roles',
      desc: 'Efficient management of members, teams, and available roles.',
      path: '/account/members/roles',
    },
    {
      icon: LineChart,
      title: 'Activity',
      desc: 'Central Hub for Personal Customization.',
      path: '/account/activity',
    },
  ];

  return (
    <Fragment>
      <Options items={items} />
      <div className="flex grow justify-center pt-5 lg:pt-7.5">
        <Button mode="link" underlined="dashed" asChild>
          <Link to="/account/members/team-info">More Account Options</Link>
        </Button>
      </div>
    </Fragment>
  );
}

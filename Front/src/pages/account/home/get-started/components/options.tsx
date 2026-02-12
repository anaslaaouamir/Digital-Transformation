import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';

interface IOptionsItem {
  icon: LucideIcon;
  title: string;
  desc: string;
  path: string;
}
type IOptionsItems = Array<IOptionsItem>;

interface IOptionsProps {
  items: IOptionsItems;
}

const Options = ({ items }: IOptionsProps) => {
  const renderProject = (item: IOptionsItem, index: number) => {
    return (
      <Link to={`${item.path}`}>
        <Card key={index} className="p-5 lg:p-7.5 lg:pt-7">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <item.icon className="text-xl text-primary" />
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-base font-medium leading-none text-mono hover:text-primary-active">
                {item.title}
              </span>
              <span className="text-sm text-secondary leading-5">
                {item.desc}
              </span>
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-7.5">
      {items.map((item, index) => {
        return renderProject(item, index);
      })}
    </div>
  );
};

export { Options, type IOptionsItem, type IOptionsItems, type IOptionsProps };

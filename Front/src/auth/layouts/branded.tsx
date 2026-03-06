import { Link, Outlet } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';

export function BrandedLayout() {
  return (
    <>
      <style>
        {`
          .branded-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/1.png')}');
            }
            .dark .branded-bg {
              background-image: url('${toAbsoluteUrl('/media/images/2600x1600/elbahi.net.png')}');
          }
        `}
      </style>
      <div className="grid lg:grid-cols-2 grow">
        <div className="flex justify-center items-center p-8 lg:p-10 order-2 lg:order-1">
          <Card className="w-full max-w-100">
            <CardContent className="p-6">
              <Outlet />
            </CardContent>
          </Card>
        </div>

        <div className="lg:rounded-xl lg:border lg:border-border lg:m-5 order-1 lg:order-2 bg-top xxl:bg-center xl:bg-cover bg-no-repeat branded-bg">
          <div className="flex flex-col p-8 lg:p-16 gap-4">
            <Link to="/">
              <img
                src={toAbsoluteUrl('/media/app/mini-logo.png')}
                className="h-7 max-w-none"
                alt=""
              />
            </Link>

            <div className="flex flex-col gap-3">
              <h3 className="text-2xl font-semibold text-mono">
                ELBAHI.NET
              </h3>
              <div className="text-base font-medium text-secondary">
                Agence digitale à Marrakech depuis 2014
                <br /> On transforme&nbsp;
                <span className="text-mono font-semibold">
                  des marques,
                </span>
                &nbsp;pas seulement
                <br /> des sites.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

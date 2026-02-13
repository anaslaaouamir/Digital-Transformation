import { Details, Invoicing, PaymentMethods, Plan } from './components';

export function AccountBasicContent() {

  return (
    <div className="grid grid-cols-1 gap-5 lg:gap-7.5">
      <div className="col-span-2">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <Plan />
          <PaymentMethods />
          <Details />
          <Invoicing />
        </div>
      </div>
    </div>
  );
}

import { TeamInfo } from './components';

export function AccountTeamInfoContent() {

  return (
    <div className="grid grid-cols-1 gap-5 lg:gap-7.5">
        <div className="flex flex-col gap-5 lg:gap-7.5">
          <TeamInfo />
        </div>
    </div>
  );
}

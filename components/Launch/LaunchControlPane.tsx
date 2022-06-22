import React from 'react';
import { arraySort } from '../../util/arrayUtils';
import { useLaunch } from '../contexts/LaunchContext';
import { useRoleAPI } from '../contexts/OfficersContext';
import { useAttendee, usePads } from '../contexts/rthooks';
import RolePref from '../Profile/RolePref';
import { PadCard } from './Launch';
import { Loading } from '/components/common/util';

export function LaunchControlPane() {
  const [pads] = usePads();
  const [launch] = useLaunch();
  const [user] = useAttendee();
  const { isOfficer } = useRoleAPI();

  if (!pads) return <Loading wat='Pads' />;

  const padGroups = Array.from(
    new Set(Object.values(pads).map(pad => pad.group ?? ''))
  ).sort();

  return (
    <>
      {isOfficer(user) ? (
        <div className='d-flex justify-content-center align-items-baseline mb-3'>
          <div className='me-2'>My Status: </div>
          <RolePref launchId={launch?.id ?? ''} userId={user?.id ?? ''} />
        </div>
      ) : null}

      {padGroups.map(group => (
        <div key={group}>
          {group ? <h2 className='mt-5'>{group}</h2> : null}
          <div className='deck ms-3'>
            {arraySort(
              Object.values(pads).filter(pad => (pad.group ?? '') === group),
              'name'
            ).map((pad, i) => (
              <PadCard key={i} padId={pad.id} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

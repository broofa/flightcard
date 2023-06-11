import React, { HTMLAttributes } from 'react';
import { ANONYMOUS } from '../App/App';
import { useRoleAPI } from '../contexts/officer_hooks';
import styles from './AttendeeInfo.module.scss';
import DEFAULT_PROFILE_IMAGE from '/art/astronaut.svg';
import { CertDot } from '/components/common/CertDot';
import { cn } from '/components/common/util';
import { iAttendee } from '/types';

export function AttendeeInfo({
  attendee,
  className,
  ...props
}: {
  attendee: iAttendee;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const roleApi = useRoleAPI();

  const photoUrl = attendee.photoURL ?? DEFAULT_PROFILE_IMAGE;
  return (
    <div
      className={cn(styles.root, className, `d-flex align-items-center`)}
      {...props}
    >
      <img className='flex-grow-0 me-2' src={photoUrl} />
      <div className='flex-grow-1 flex-column'>
        <div>{attendee?.name ?? ANONYMOUS}</div>
        <div>
          {roleApi.isOfficer(attendee) ? (
            <span className={styles.officerStar}>{'\u2605'}</span>
          ) : null}
          <CertDot
            showType={true}
            className='flex-grow-0'
            attendee={attendee}
          />
          {attendee.role ? (
            <span
              className={cn(styles.role, 'ms-2 me-2 px-1 bg-info text-white')}
            >
              {attendee.role?.toUpperCase()}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

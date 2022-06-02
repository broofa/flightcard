import React, { HTMLAttributes, useContext } from 'react';
import { Alert } from 'react-bootstrap';
import { AppContext } from '/components/app/App';
import { CertDot } from '/components/common/CertDot';
import { OFFICERS } from '/components/Launch';
import { AttendeesLink, Loading } from '/components/common/util';
import { db, DELETE } from '/firebase';
import { CertLevel, CertOrg, iAttendee } from '/types';

export default function CertForm({
  user,
  launchId,
}: {
  user: iAttendee;
  launchId: string;
}) {
  const { launch } = useContext(AppContext);

  if (!user) return <Loading wat='Attendee' />;
  if (!launch) return <Loading wat='Launch' />;

  const cert = user?.cert;

  function CertRadio({
    organization,
    level,
    children,
    ...props
  }: {
    organization?: CertOrg;
    level: CertLevel;
  } & HTMLAttributes<HTMLLabelElement>) {
    function handleChange() {
      if (user.cert?.verifiedTime) {
        if (
          !confirm(
            "You'll need to re-verify your certification with a launch officer if you make this change.  Continue?"
          )
        )
          return;
      }
      db.attendee.updateChild(launchId, user.id, 'cert', {
        organization: organization ?? DELETE,
        level,
        verifiedTime: DELETE,
        verifiedId: DELETE,
      });
    }

    return (
      <label {...props}>
        <input
          type='radio'
          className='me-1'
          onChange={handleChange}
          checked={organization == cert?.organization && level == cert?.level}
        />
        {organization ? (
          <CertDot
            cert={{ organization, level, verifiedTime: 999 }}
            showType
            className='me-4'
          />
        ) : null}
        {children}
      </label>
    );
  }

  // Compose certification status
  let certStatus;
  switch (true) {
    case cert?.level ?? -1 < 0: {
      certStatus = (
        <Alert className='py-1 mb-1' variant='danger'>
          Please indicate your high-power certification level. (If you are both
          NAR and TRA certified, select the one most appropriate for this
          launch.)
        </Alert>
      );
      break;
    }

    case (cert?.level ?? -1) >= 1 && !cert?.verifiedTime: {
      certStatus = (
        <Alert className='py-1 mb-1' variant='warning'>
          Show your certification card to a{' '}
          <AttendeesLink filter={OFFICERS} launchId={launch.id}>
            launch officer
          </AttendeesLink>{' '}
          to complete this step.
        </Alert>
      );
      break;
    }
  }

  return (
    <div className='ms-3'>
      {certStatus}

      <div
        className='d-grid'
        style={{
          width: 'max-content',
          gap: '0.3em 1em',
          gridTemplateColumns: 'auto auto auto',
        }}
      >
        <CertRadio level={CertLevel.NONE} style={{ gridColumn: 'span 3' }}>
          Not certified
        </CertRadio>

        <CertRadio organization={CertOrg.NAR} level={CertLevel.L1} />
        <CertRadio organization={CertOrg.NAR} level={CertLevel.L2} />
        <CertRadio organization={CertOrg.NAR} level={CertLevel.L3} />

        <CertRadio organization={CertOrg.TRA} level={CertLevel.L1} />
        <CertRadio organization={CertOrg.TRA} level={CertLevel.L2} />
        <CertRadio organization={CertOrg.TRA} level={CertLevel.L3} />
      </div>
    </div>
  );
}

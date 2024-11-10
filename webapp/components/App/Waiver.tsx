import { useRef } from 'react';
import { Button } from 'react-bootstrap';
import { FCLinkButton } from '../common/FCLinkButton';
import { useCurrentUser, useLaunch } from '../contexts/rt_hooks';
import { APPNAME } from './App';
import { Loading, busy } from '/components/common/util';
import { rtSet } from '/rt';
import { ATTENDEE_PATH } from '/rt/rtconstants';

export function Waiver() {
  const [launch] = useLaunch();
  const [currentUser] = useCurrentUser();
  const agreeRef = useRef<HTMLButtonElement>(null);

  if (!currentUser) return <Loading wat='User' />;
  if (!launch) return <Loading wat='Launch' />;

  const rtPath = ATTENDEE_PATH.with({
    launchId: launch.id,
    userId: currentUser.id,
  });

  async function launchAgree() {
    await busy(
      agreeRef.current,
      rtSet(rtPath, {
        ...currentUser,
        waiverTime: Date.now(),
      })
    );
  }

  return (
    <div className='m-4'>
      <h1 style={{ textAlign: 'center' }}>
        This is a Dangerous Activity
        <br />
        {'\u2620'} {'\u2620'} {'\u2620'}{' '}
      </h1>

      <p>
        <strong>Before proceeding, you must agree to the following:</strong>
      </p>

      <ol>
        <li>
          You meet all attendance requirements set by the event hosts.
          <br />
          <em className='text-danger'>
            Unsure what these are? Contact the event host.
          </em>
        </li>

        <li>
          You hold harmless the authors of {APPNAME} (this application).
          <br />
          <em className='text-danger'>
            This app is experimental and under active development. Do not expect
            it to be reliable or correct. Always verify any information it
            provides with an independent source.
          </em>
        </li>
      </ol>

      <div className='d-flex justify-content-between mt-3'>
        <FCLinkButton variant='danger' to='/launches'>
          No Thanks
        </FCLinkButton>
        <Button ref={agreeRef} onClick={launchAgree}>
          I Agree
        </Button>
      </div>
    </div>
  );
}

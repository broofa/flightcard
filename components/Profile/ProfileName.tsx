import React, {
  ChangeEvent,
  InputHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from 'react';
import { busy } from '../common/util';
import { rtuiFromPath } from '../rtui/RTUI';
import { AttendeeFields, ATTENDEE_PATH } from '/rt/rtconstants';
import useDebounce from '/util/useDebounce';

const TRIPOLI_MEMBER_URL =
  'https://tripoli-memberships.robert4852.workers.dev?id=ID';

type TripoliInfo = {
  id: number;
  firstName: string;
  lastName: string;
  level: number;
  expires: number;
};

export default function ProfileName({
  attendeeFields,
  ...props
}: {
  attendeeFields: AttendeeFields;
} & InputHTMLAttributes<HTMLInputElement>) {
  const [tripoliId, setTripoliId] = useState<string>('');
  const [tripoliInfo, setTripoliInfo] = useState<TripoliInfo>();
  const rtui = rtuiFromPath(ATTENDEE_PATH.with(attendeeFields));
  const inputField = useRef<HTMLInputElement>();

  const debouncedTripoliId = useDebounce(tripoliId, 300);

  useEffect(() => {
    if (debouncedTripoliId == null) return;

    // (Insert grumbling here... https://github.com/whatwg/dom/issues/981)
    const controller = new AbortController();
    const signal = controller.signal;

    (async function () {
      try {
        const req = fetch(
          TRIPOLI_MEMBER_URL.replace('ID', debouncedTripoliId),
          {
            signal,
          }
        );
        busy(inputField.current, req);
        const resp = await req;
        setTripoliInfo(resp.ok ? await resp.json() : null);
      } catch (err) {
        console.error(err);
      }
    })();

    return () => controller.abort();
  }, [debouncedTripoliId]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setTripoliId(e.target.value);
  }

  let tripoliDetail;
  if (tripoliId) {
    if (tripoliInfo) {
      tripoliDetail = (
        <div>
          <p>
            {tripoliInfo.firstName} {tripoliInfo.lastName}
          </p>
          <p>
            Certifed for level {tripoliInfo.level}, expires on{' '}
            {new Date(tripoliInfo.expires).toLocaleDateString()}
          </p>
        </div>
      );
    } else {
      <div>No user with that member ID found</div>;
    }
  }

  return (
    <>
      <p>
        Active Tripoli members, please provide your member ID here:{' '}
        <input
          ref={inputField}
          type='number'
          value={tripoliId}
          placeholder='e.g. 12345'
          onChange={handleChange}
        />
      </p>

      {tripoliDetail}

      <div className='mt-3'>
        Everyone else, please enter your name here:{' '}
        <rtui.StringInput label='Name' field='name' {...props} />
      </div>
    </>
  );
}

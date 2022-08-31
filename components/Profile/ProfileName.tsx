import React, {
  ChangeEvent,
  InputHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert, Button, FloatingLabel, Form } from 'react-bootstrap';
import { busy } from '../common/util';
import { rtuiFromPath } from '../rtui/RTUI';
import { AttendeeFields, ATTENDEE_PATH } from '/rt/rtconstants';
import useDebounce from '/util/useDebounce';
const LOGO_TRIPOLI = new URL('/art/tripoli.svg', import.meta.url).toString();
const LOGO_NAR = new URL('/art/nar.svg', import.meta.url).toString();

const TRIPOLI_MEMBER_URL =
  'https://tripoli-members.robert4852.workers.dev?id=ID';

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
  const [certOrg, setCertOrg] = useState<string>();
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
        if (!debouncedTripoliId) {
          setTripoliInfo(undefined);
          return;
        }

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
        <Alert variant='success' className='mb-0'>
          <span className='me-4'>
            Are you{' '}
            <b>
              {tripoliInfo.firstName} {tripoliInfo.lastName}
            </b>
            ? (Level {tripoliInfo.level}, valid thru{' '}
            {new Date(tripoliInfo.expires).toLocaleDateString()})
          </span>
          <Button className='me-4'>Yes, that's me!</Button>
        </Alert>
      );
    } else {
      tripoliDetail = (
        <Alert variant='warning' className='mb-0'>
          No active member with that ID. Please check your ID #. If you believe
          it's correct, it may be that your certification has expired and needs
          to be renewed.
        </Alert>
      );
    }
  }

  return (
    <>
      <h2>High-Power Certification</h2>
      <strong>Organization:</strong>
      <div
        className='ms-4'
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, 5em)',
          gap: '.3em 2em',
        }}
      >
        {[
          ['tripoli', 'Tripoli'],
          ['nar', 'NAR'],
          ['none', 'None'],
        ].map(([val, title]) => (
          <label key={val}>
            <input
              name='cert_org'
              type='radio'
              checked={certOrg === val}
              value={val}
              className='me-2'
              onChange={() => setCertOrg(val)}
            />
            {title}
          </label>
        ))}
      </div>

      {certOrg === 'tripoli' ? (
        <>
          <div className='d-flex align-items-top mt-2' style={{ gap: '1em' }}>
            <FloatingLabel label='Tripoli ID #' style={{ flexasis: '10em' }}>
              <Form.Control
                ref={inputField}
                type='number'
                placeholder='e.g. 12345'
                value={tripoliId}
                onChange={handleChange}
              />
            </FloatingLabel>
            {tripoliDetail ?? <div />}
          </div>
        </>
      ) : null}

      {certOrg === 'nar' || certOrg === '' ? (
        <>
          {' '}
          <div className='mt-3'>
            Please enter your name here:{' '}
            <rtui.StringInput
              style={{ maxWidth: '20em' }}
              label='Name'
              field='name'
              {...props}
            />
          </div>
        </>
      ) : null}
    </>
  );
}

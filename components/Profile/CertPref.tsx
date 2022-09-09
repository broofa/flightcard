import React, {
  ChangeEvent,
  InputHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert, FloatingLabel, Form } from 'react-bootstrap';
import { busy } from '../common/util';
import { rtuiFromPath } from '../rtui/RTUI';
import { DELETE, rtSet } from '/rt';
import {
  AttendeeFields,
  ATTENDEE_NAR_CERT_PATH,
  ATTENDEE_PATH,
  ATTENDEE_TRA_CERT_PATH,
} from '/rt/rtconstants';
import { CertLevel, CertOrg, iCert } from '/types';
import useDebounce from '/util/useDebounce';

const MEMBER_URL = 'https://club-members.robert4852.workers.dev?id=ID&org=ORG';
const NONE = Symbol('none');
const FETCHING = Symbol('fetching');
const FAILED = Symbol('failed');

type CertInfo = {
  id: number;
  firstName: string;
  lastName: string;
  level: CertLevel;
  expires: number;
  org: CertOrg;
};

function isMember(obj: CertInfo | symbol): obj is CertInfo {
  return typeof obj === 'object' && obj?.id !== undefined;
}

export default function CertPref({
  attendeeFields,
  org,
  className,
  ...props
}: {
  attendeeFields: AttendeeFields;
  org: CertOrg;
} & InputHTMLAttributes<HTMLInputElement>) {
  const [memberId, setMemberId] = useState<string>('');
  const [certInfo, setCertInfo] = useState<CertInfo | symbol>(NONE);
  const rtui = rtuiFromPath(ATTENDEE_PATH.with(attendeeFields));
  const inputField = useRef<HTMLInputElement>(null);

  const debouncedMemberId = useDebounce(
    memberId,
    org == CertOrg.TRA ? 500 : 1000
  );
  const clubName = org == CertOrg.TRA ? 'Tripoli' : 'NAR';

  useEffect(() => {
    if (debouncedMemberId == null) return;

    // (Insert grumbling here... https://github.com/whatwg/dom/issues/981)
    const controller = new AbortController();
    const signal = controller.signal;

    (async function () {
      try {
        const rtPath =
          org === CertOrg.TRA
            ? ATTENDEE_TRA_CERT_PATH.with(attendeeFields)
            : ATTENDEE_NAR_CERT_PATH.with(attendeeFields);

        if (!debouncedMemberId) {
          await rtSet(rtPath, DELETE);
          setCertInfo(NONE);
          return;
        }

        setCertInfo(FETCHING);
        const req = fetch(
          MEMBER_URL.replace('ID', debouncedMemberId).replace('ORG', org),
          {
            signal,
          }
        );
        busy(inputField.current, req);
        const resp = await req;
        if (resp.ok) {
          const cert: CertInfo = await resp.json();
          setCertInfo(cert);

          console.log('CERT', cert);
          const newCert: iCert = {
            memberId: cert.id,
            organization: org,
            level: cert.level,
            expires: cert.expires,
          };
          rtSet(rtPath, newCert ?? DELETE);
        } else {
          setCertInfo(FAILED);
        }
      } catch (err) {
        console.error(err);
      }
    })();

    return () => controller.abort();
  }, [org, debouncedMemberId]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setMemberId(e.target.value);
  }

  return (
    <div className={`${className} d-flex flex-column flex-sm-row`} {...props}>
      <FloatingLabel
        label={`${clubName} member #`}
        className='flex-shrink-0 me-2 mb-2'
      >
        <Form.Control
          ref={inputField}
          type='number'
          placeholder='e.g. 12345'
          value={memberId}
          onChange={handleChange}
        />
      </FloatingLabel>

      {org === CertOrg.NAR && certInfo === FETCHING ? (
        <div className='text-tip'>
          Fetching member info from NAR's website. This usually takes 10-15
          seconds. {'\u{1f622}'}
        </div>
      ) : null}
      {certInfo === FAILED ? (
        <Alert variant='warning'>
          {org === CertOrg.TRA
            ? `No active certification found for member #${debouncedMemberId}`
            : `Member #${debouncedMemberId} not found`}
        </Alert>
      ) : null}

      {isMember(certInfo) ? (
        <div className='flex-grow-1'>
          <strong>
            {certInfo.firstName} {certInfo.lastName}
          </strong>{' '}
          is{' '}
          <strong>
            {org} L-{certInfo.level}
          </strong>{' '}
          certified thru {new Date(certInfo.expires).toLocaleDateString()}
        </div>
      ) : null}
    </div>
  );
}

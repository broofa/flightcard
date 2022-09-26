import React, {
  ChangeEvent,
  InputHTMLAttributes,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Alert, FloatingLabel, Form } from 'react-bootstrap';
import { errorTrap } from '../common/Flash';
import { fetchHelper } from '../common/useFetch';
import { cn, Loading } from '../common/util';
import { DELETE, rtSet, useRTValue } from '/rt';
import {
  AttendeeFields,
  ATTENDEE_NAR_CERT_PATH,
  ATTENDEE_TRA_CERT_PATH,
} from '/rt/rtconstants';
import { CertOrg, iCert } from '/types';
import useDebounce from '/util/useDebounce';

const MEMBER_URL = 'https://club-members.robert4852.workers.dev';
// const MEMBER_URL = 'http://localhost:6543';

export default function CertPref({
  attendeeFields,
  org,
  className,
  ...props
}: {
  attendeeFields: AttendeeFields;
  org: CertOrg;
} & InputHTMLAttributes<HTMLInputElement>) {
  const rtPath =
    org === CertOrg.TRA
      ? ATTENDEE_TRA_CERT_PATH.with(attendeeFields)
      : ATTENDEE_NAR_CERT_PATH.with(attendeeFields);

  const [isChanged, setIsChanged] = useState(false);
  const [memberId, setMemberId] = useState<string>('');

  const [dbCert, dbCertLoading] = useRTValue<iCert>(
    rtPath,
    useCallback(
      (cert?: iCert) => {
        // Set member id field if it hasn't been changed yet
        if (!isChanged) setMemberId(String(cert?.memberId ?? ''));
      },
      [isChanged]
    )
  );

  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<Error>();
  const [debouncedMemberId, isDebouncing] = useDebounce(memberId, 500);

  const memberNum = parseInt(debouncedMemberId ?? '');
  const memberInfoUrl =
    !isDebouncing && !isNaN(memberNum)
      ? `${MEMBER_URL}?org=${org}&id=${memberNum}`
      : undefined;

  function handleMemberIdChange(e: ChangeEvent<HTMLInputElement>) {
    setMemberId(e.target.value);
    setIsChanged(true);
    setFetchError(undefined);
  }

  // Effect to clear loading/error state when user is typing
  useEffect(() => {
    if (!isDebouncing) return;
    setFetchLoading(false);
    setFetchError(undefined);
  }, [isDebouncing]);

  // Effect to fetch member info once user has stopped typing
  useEffect(() => {
    if (!isChanged || !memberInfoUrl) return;

    const fetchAbort = fetchHelper<iCert>(memberInfoUrl, {
      setData(cert) {
        errorTrap(rtSet(rtPath, cert ?? DELETE));
      },
      setLoading: setFetchLoading,
      setError(err) {
        setFetchError(err);
        if (err) errorTrap(rtSet(rtPath, DELETE));
      },
    });

    return fetchAbort;
  }, [memberInfoUrl, rtPath]);

  if (dbCertLoading) return <Loading wat='certification' />;

  return (
    <div className={cn(className, `d-flex flex-column flex-sm-row`)} {...props}>
      <FloatingLabel
        label={`${org == CertOrg.TRA ? 'Tripoli' : 'NAR'} member #`}
        className='flex-shrink-0 me-2 mb-2'
      >
        <Form.Control
          className={cn({ busy: fetchLoading })}
          type='number'
          placeholder='e.g. 12345'
          value={memberId}
          onChange={handleMemberIdChange}
        />
      </FloatingLabel>

      {org === CertOrg.NAR && fetchLoading ? (
        <div className='text-tip'>
          One moment, please. NAR's site usually takes 10-20 seconds to respond.{' '}
          {'\u{1f622}'}
        </div>
      ) : null}
      {fetchError && !isDebouncing ? (
        <Alert variant='warning'>
          Couldn't find certification info for member #{memberId}
          <p className='text-tip'>Make sure your membership is current.</p>
        </Alert>
      ) : null}

      {dbCert && !dbCertLoading && !fetchLoading ? (
        <div className='flex-grow-1 ms-3'>
          <strong>
            {dbCert.firstName} {dbCert.lastName}
          </strong>{' '}
          is{' '}
          <strong>
            {org} L-{dbCert.level}
          </strong>{' '}
          certified thru {new Date(dbCert.expires ?? 0).toLocaleDateString()}
          {dbCert?.verifiedTime ? (
            <p className='text-tip text-success'>
              Nice, you've been verified!  (Now don't change this, otherwise you'll have to reverify!)
            </p>
          ) : <p className='text-tip text-warning'>
          Please see one of the club officers so they can verify this information.
        </p>
}
        </div>
      ) : null}
    </div>
  );
}

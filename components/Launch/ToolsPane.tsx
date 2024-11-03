import React, { useEffect } from 'react';
import '/components/Launch/ToolsPane.scss';
import { iCert } from '/types';
import useDebounce from '/util/useDebounce';

const { MEMBER_API_ENDPOINT } = process.env;

type MembersMeta = {
  nar: {
    queryAccountId: number;
    queryTimestamp: number;
    trackingAccountId: number;
    trackingTimestamp: number;
    pagination: {
      currentPage: number;
      pageSize: number;
      sortColumn: string;
      sortDirection: string;
      totalPages: number;
      totalResults: number;
    };
    scannedAt: string;
  };

  tra: {
    scannedAt: string;
    certsFetched: number;
    publishedAt: string;
  };
};

export function ToolsPane() {
  const [searchText, setSearchText] = React.useState('');
  const [debouncedQuery] = useDebounce(searchText, 500);
  const [members, setMembers] = React.useState<iCert[]>([]);
  const [membersMeta, setMembersMeta] = React.useState<MembersMeta>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setSearchText(v);
    setMembers([]);
  }

  async function fetchMembers(query: { lastName: string; firstName?: string }) {
    const queryURL = new URL(MEMBER_API_ENDPOINT!);
    queryURL.searchParams.append('lastName', query.lastName);

    if (query.firstName) {
      queryURL.searchParams.append('firstName', query.firstName);
    }

    const res = await fetch(queryURL.toString());

    const json = await res.json();

    setMembers(json.results);
  }

  async function fetchMembersMeta() {
    const queryURL = new URL(`${MEMBER_API_ENDPOINT!}/members/meta`);

    const res = await fetch(queryURL.toString(), { method: 'GET' });

    const json: MembersMeta = await res.json();
    setMembersMeta(json);
  }

  useEffect(() => {
    let lastName: string;
    let firstName: string | undefined;

    if (searchText.includes(',')) {
      [lastName, firstName] = searchText.trim().split(/[,\s]+/);
    } else if (searchText.includes(' ')) {
      [firstName, lastName] = searchText.trim().split(/[,\s]+/);
    } else {
      lastName = searchText;
    }

    lastName = lastName.trim();
    firstName = firstName?.trim();

    if (!lastName || lastName.length < 2) return;

    // TODO: error handling
    fetchMembers({ lastName, firstName });
  }, [debouncedQuery]);

  useEffect(() => {
    // TODO: error handling
    fetchMembersMeta();
  }, []);

  const now = Date.now();

  const resultTable =
    members.length > 0 ? (
      <table className='members-table'>
        <thead>
          <tr>
            <th>Org.</th>
            <th>ID</th>
            <th>Name</th>
            <th>Level</th>
            <th>Expires</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const lapsed = member.expires < now;
            return (
              <tr key={member.memberId} className={lapsed ? 'lapsed' : ''}>
                <td className='organization'>{member.organization}</td>
                <td className='memberId'>{member.memberId}</td>
                <td className='name'>{`${member.lastName}, ${member.firstName}`}</td>
                <td className='level'>{member.level}</td>
                <td className='expires'>
                  {new Date(member.expires).toDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    ) : null;

  const traDate = membersMeta?.tra?.publishedAt;
  const narDate = membersMeta?.nar?.scannedAt;
  const narPagination = membersMeta?.nar?.pagination;

  return (
    <>
      <h1>NAR / Tripoli Member Search</h1>
      <input
        type='text'
        value={searchText}
        onChange={handleChange}
        className='form-control'
        placeholder='E.g. "Smith" or "Smith, Alice" or "Alice Smith"'
      />
      <div className='text-tip'>
        Enter last name, or "last, first" or "first last" to search. Partial
        names also work. E.g. "Robert Kieffer", "Kieffer, Robert", "Rob Kie",
        "Kie, Rob" etc.
      </div>

      {resultTable}

      {membersMeta ? (
        <div className='members-meta'>
          <div>
            TRA data as of {traDate ? new Date(traDate).toDateString() : 'n/a'}
          </div>
          <div>
            NAR data as of {narDate ? new Date(narDate).toDateString() : 'n/a'}
          </div>
          <div>
            NAR scan at page {narPagination?.currentPage ?? 'n/a'} of{' '}
            {narPagination?.totalPages ?? 'n/a'}
          </div>
        </div>
      ) : null}
    </>
  );
}

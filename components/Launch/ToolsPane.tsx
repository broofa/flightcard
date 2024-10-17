import React, { useEffect } from 'react';
import '/components/Launch/ToolsPane.scss';
import { iCert } from '/types';
import useDebounce from '/util/useDebounce';

const { MEMBER_API_ENDPOINT } = process.env;

type MembersMeta = {
  nar: {
    queryAccountId: number,
    queryTimestamp: number,
    trackingAccountId: number,
    trackingTimestamp: number,
    pagination: {
      currentPage: number,
      pageSize: number,
      sortColumn: string,
      sortDirection: string,
      totalPages: number,
      totalResults: number
    },
    updatedAt: string
  },
  tra: {
    updatedAt: string,
    certsFetched: number,
    lastModified: string
  }
}

export function ToolsPane() {
  const [searchText, setSearchText] = React.useState('');
  const [debouncedQuery] = useDebounce(searchText, 500);
  const [members, setMembers] = React.useState<iCert[]>([]);
  const [membersMeta, setMembersMeta] = React.useState<MembersMeta>();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    const [lastName, firstName] = v.trim().split(/[\W]+/);

    setSearchText(firstName ? `${lastName}, ${firstName}` : v);
    setMembers([]);
  }

  async function fetchMembers(query: { lastName: string, firstName?: string }) {
    const queryURL = new URL(MEMBER_API_ENDPOINT!);
    queryURL.searchParams.append('lastName', query.lastName);

    if (query.firstName) {
      queryURL.searchParams.append('firstName', query.firstName);
    }

    const res = await fetch(queryURL.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const json = await res.json();

    setMembers(json.results);
  }

  async function fetchMembersMeta() {
    const queryURL = new URL(`${MEMBER_API_ENDPOINT!}/members/meta`);

    const res = await fetch(queryURL.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const json: MembersMeta = await res.json();
    setMembersMeta(json);
  }



  useEffect(() => {
    console.log('debouncedQuery:', debouncedQuery);
    const [lastName, firstName] = searchText.trim().split(/[\W]+/);

    if (!lastName || lastName.length < 2) return;

    // TODO: error handling
    fetchMembers({ lastName, firstName });

  }, [debouncedQuery]);

  useEffect(() => {
    // TODO: error handling
    fetchMembersMeta();
  }, [])

  const now = Date.now();

  const resultTable = members.length > 0 ?
    <table className='members-table'>
      <tr>
        <th>Org.</th>
        <th>ID</th>
        <th>Name</th>
        <th>Level</th>
        <th>Expires</th>
      </tr>
      {
        members.map((member) => {
          const lapsed = member.expires < now;
          return (
            <tr key={member.memberId} className={lapsed ? 'lapsed' : ''}>
              <td className='organization'>{member.organization}</td>
              <td className='memberId'>{member.memberId}</td>
              <td className='name'>{`${member.lastName}, ${member.firstName}`}</td>
              <td className='level'>{member.level}</td>
              <td className='expires'>{new Date(member.expires).toDateString()}</td>
            </tr>
          );
        })
      }
    </table>
    : null;

  return (
    <>
      <h1>NAR / Tripoli Member Search</h1>
      <input type='text'
        value={searchText}
        onChange={handleChange}
        className='form-control'
        placeholder='Last name [, First name]' />

      {resultTable}

      {membersMeta ? <div className='members-meta'>
        <div>NAR data as of {new Date(membersMeta.nar.updatedAt).toDateString()}</div>
        <div>TRA  data as of {new Date(membersMeta.tra.lastModified).toDateString()}</div>
      </div> : null
      }
    </>
  );
}

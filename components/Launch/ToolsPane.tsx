import React, { useEffect } from 'react';
import '/components/Launch/ToolsPane.scss';
import { iCert } from '/types';
import useDebounce from '/util/useDebounce';

const { MEMBER_API_ENDPOINT } = process.env;

export function ToolsPane() {
  const [searchText, setSearchText] = React.useState('');
  const [debouncedQuery] = useDebounce(searchText, 500);
  const [members, setMembers] = React.useState<iCert[]>([]);

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

  useEffect(() => {
    console.log('debouncedQuery:', debouncedQuery);
    const [lastName, firstName] = searchText.trim().split(/[\W]+/);

    if (!lastName || lastName.length < 2) return;

    fetchMembers({ lastName, firstName });

  }, [debouncedQuery]);

  return (
    <>
      <h1>NAR / Tripoli Member Search</h1>
      <input type='text' value={searchText} onChange={handleChange} className='form-control' placeholder='Last name [, First name]'/>
      <table className='members-table'>
        {members.map((member) => (
          <tr key={member.memberId}>
            <td>{member.organization}</td>
            <td>{member.memberId}</td>
            <td>{`${member.firstName} ${member.lastName}`}</td>
            <td>{member.level}</td>
            <td>{new Date(member.expires).toDateString()}</td>
          </tr>
        ))}
      </table>
    </>
  );
}

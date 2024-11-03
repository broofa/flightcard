import React, { useEffect } from 'react';
import '/components/Launch/ToolsPane.scss';
import { iCert, MembersMeta } from '/types';
import useDebounce from '/util/useDebounce';

const { MEMBER_API_ENDPOINT } = process.env;

export function ToolsPane() {
  const [searchText, setSearchText] = React.useState('');
  const [debouncedQuery] = useDebounce(searchText, 500);
  const [members, setMembers] = React.useState<iCert[]>([]);
  const [membersMeta, setMembersMeta] = React.useState<MembersMeta>();

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

    try {
      const res = await fetch(queryURL.toString(), { method: 'GET' });
      const json: MembersMeta = await res.json();
      setMembersMeta(json);
    } catch (err) {
      console.log(err);
      return;
    }
  }

  useEffect(() => {
    let lastName: string;
    let firstName: string | undefined;

    const st = searchText.trim();

    if (st.includes(',')) {
      [lastName, firstName] = st.trim().split(/[,\s]+/);
    } else if (st.includes(' ')) {
      [firstName, lastName] = st.trim().split(/[,\s]+/);
    } else {
      lastName = st;
    }

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

  const traMeta = membersMeta?.tra ? (
    <section className='meta-section'>
      <h2>Tripoli Data</h2>
      <div className='meta-grid'>
        <MetaRow label='Updated At' date={membersMeta?.tra?.publishedAt} />
      </div>
    </section>
  ) : null;

  const narMeta = membersMeta?.nar ? (
    <div className='meta-section'>
      <h2>NAR Data</h2>
      <div className='meta-grid'>
        <MetaRow label='Updated' date={membersMeta?.nar?.scanEndAt} />
        <MetaRow label='Scan Start' date={membersMeta?.nar?.scanBeginAt} />
        <MetaRow label='Scan Update' date={membersMeta?.nar?.scanUpdateAt} />
        <MetaRow
          label='Scan Progress'
          text={`${membersMeta?.nar?.pagination?.currentPage} of ${membersMeta?.nar?.pagination?.totalPages} pages`}
        />
      </div>
    </div>
  ) : null;

  return (
    <>
      <h1>NAR / Tripoli Member Search</h1>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        <input
          type='text'
          value={searchText}
          onChange={handleChange}
          placeholder='Member name or partial name'
          className='form-control'
        />

        {!searchText ? (
          <>
            <div>
              {traMeta}
              {narMeta}
            </div>
          </>
        ) : null}
      </div>

      {resultTable}
    </>
  );
}

function MetaRow({
  label,
  text,
  date,
}: {
  label: string;
  text?: number | string;
  date?: string;
}) {
  if (date) {
    text = new Date(date).toLocaleString();
  }
  if (!text) return null;

  return (
    <>
      <div className='meta-label'>{label}</div>
      <div className='meta-text'>{text ?? '---'}</div>
    </>
  );
}

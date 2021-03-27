import React, { Fragment, useState } from 'react';
import { Switch, Route, Link, useParams, useRouteMatch, useHistory } from 'react-router-dom';
import db from '../db.js';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from 'react-bootstrap';
import { Editor } from './Editor';

function useUserParam() {
  const { userId } = useParams();
  return useLiveQuery(() => db.users.get(parseInt(userId)), [userId]);
}

function Rocket({ rocket }) {
  const match = useRouteMatch();

  return <div>
    {rocket.name}, {rocket.motor}
    <Link to={`${match.url}/${rocket.id}/edit`}>Edit</Link>
  </div>;
}

function RocketEditor({ create }) {
  const history = useHistory();
  const user = useUserParam();
  const { rocketId } = useParams();

  const s0 = create
    ? {
        name: 'New Rocket',
        id: Math.random().toString(36).substr(-6)
      }
    : user?.rockets.find(r => r.id === rocketId);

  const [values, setValues] = useState();

  if (!values && s0) setValues(s0);
  if (!s0 || !values) return <p>Rocket not found</p>;

  const onSave = () => {
    user.rockets = user.rockets.filter(r => r.id != rocketId);
    user.rockets.push(values);
    db.users.put(user, user.id)
      .then(() => history.goBack());
  };

  const onDelete = () => {
    if (!confirm(`Really delete "${values.name}"?`)) return;
    user.rockets = user.rockets.filter(r => r.id != rocketId);
    db.users.put(user, user.id)
      .then(() => history.goBack());
  };
  return <Editor
    onSave={onSave}
    onCancel={() => history.goBack()}
    onDelete={!create && onDelete}>
    <h2>{values.name || '(Unnamed rocket)'}</h2>
    <div style={{ display: 'grid', gap: '.5em', gridTemplateColumns: 'auto 1fr' }}>
    {
      ['name', 'manufacturer', 'diameter', 'length', 'weight', 'motor', 'color'].map(k => {
        const onChange = e => {
          values[k] = e.target.value;
          setValues({ ...values });
        };
        return <Fragment key={k}>
          <span style={{ textAlign: 'right', textTransform: 'capitalize' }}>{k}</span>
          <input type="test" value={values[k] || ''} onChange={onChange} />
        </Fragment>;
      })
    }
    </div>
  </Editor>;
}

function Rockets() {
  const user = useUserParam();

  if (!user) return <p>User not found</p>;

  const { rockets } = user;

  rockets.sort((a, b) => {
    a = a.name;
    b = b.name;
    return a < b ? -1 : a > b ? 1 : 0;
  });

  return rockets?.length
    ? <ul>
        {rockets.map(r => <Rocket key={r.id} rocket={r} />)}
      </ul>
    : <p>Get started by telling us what rockets you want to fly...</p>;
}

export default function User() {
  const match = useRouteMatch();

  const user = useUserParam();
  if (!user) return <p>User not found</p>;

  return <>
    <Link to={`${match.url}/rockets`}>My Rockets</Link>

    <Switch>
      <Route exact path={`${match.path}`}>
        <h1>User Home</h1>
      </Route>

      <Route path={`${match.path}/rockets/create`}>
        <RocketEditor create />
      </Route>

      <Route path={`${match.path}/rockets/:rocketId/edit`}>
        <RocketEditor />
      </Route>

      <Route path={`${match.path}/rockets`}>
        <h1>My Rockets</h1>
        <Rockets rockets={user.rockets} />
        <Button href={`${match.url}/rockets/create`}>Add new rocket</Button>
      </Route>
    </Switch>

  </>;
}

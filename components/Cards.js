import React, { Fragment, useState } from 'react';
import { Link, useHistory, useRouteMatch } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db.js';
import { Editor } from './Editor';
import { useCurrentUser } from './App.js';
import { Form, Col } from 'react-bootstrap';

const { Label, Control, Group, Row, Check, Switch } = Form;

function FormSection({ className, children, ...props }) {
  const style = {
    fontSize: '1.2em',
    fontWeight: 'bold',
    color: '#ccc'
  };

  return <div className={`${className ?? ''}`} style={style} {...props}>{children}</div>;
}

function Field({ className, access, label, children, ...props }) {
  const { getter = () => {}, setter = () => {} } = access || {};

  const labelProps = {
    className: `text-xs-left text-sm-right ${className ?? ''}`,
    sm: '2',
    style: { textTransform: 'capitalize' }
  };

  const rId = Math.random().toString(16).substr(2);
  let input;
  if (props.type == 'switch') {
    const checked = getter();
    return <Col {...labelProps}>
      <Switch style={{ whiteSpace: 'nowrap' }} id={rId} label={label} checked={checked} onChange={setter} />
    </Col>;
  } else if (/^radio\((.*)\)$/.test(props.type)) {
    // Special case for type="radio(..list,of,radio,values...)"
    props.type = 'radio';
    const val = getter();
    input = RegExp.$1
      .split(/, */)
      .map((v, i) => <Col key={i}>
        <Check {...props} style={{ textTransform: 'capitalize' }}
          id={rId + i} checked={val === v} label={v} value={v} onChange={setter} />
        </Col>);
  } else {
    input = <Col><Control {...props} value={getter()} onChange={setter}>{children}</Control></Col>;
  }

  return <>
    <Col {...labelProps}><Label>{label}</Label></Col>
    { input}
  </>;
}

function CardEditor({ create }) {
  const history = useHistory();
  const user = useCurrentUser();
  const { params: { launchId, cardId } } = useRouteMatch();

  const dbCard = useLiveQuery(() => cardId && db.cards.get(cardId), [cardId]);
  const [card, setCard] = useState(dbCard || {
    userId: null,
    launchId: null,
    rsoId: null, // RSO user
    lcoId: null, // LCO user

    user: {
      name: '',
      certLevel: '',
      certType: '',
      certMember: ''
    },

    rocket: {
      name: '',
      manufacturer: '',
      length: '',
      diameter: '',
      weight: '',
      color: '',
      recovery: ''
    },

    flight: {
      firstFlight: false,
      headsUp: false,
      motor: '',
      impulse: '',
      notes: ''
    }
  });

  if (!user) return <p>User not found</p>;
  if (!card) return <p>Card not found</p>;

  function access(path) {
    path = path.split('.');

    return {
      getter() {
        let o = card;
        for (const k of path) o = o[k];
        return o;
      },

      setter({ target: t }) {
        // const value = t.type == 'checkbox' ? t.checked : t.value;

        // const newCard = { ...card };
        // let o = newCard;
        // for (let i = 0; i < path.length; i++) {
        //   if (i < path.length - 1) {
        //     o = o[path[i]];
        //   } else {
        //     o[path[i]] = value;
        //   }
        // }

        // setCard(newCard);
      }
    };
  }

  const onSubmit = e => {
    e.preventDefault();

    card.launchId = Number(launchId);
    card.userId = user?.id;
    db.cards.put(card).then(id => history.goBack());
  };

  const onDelete = card.id
    ? () => {
        if (!confirm(`Really delete '${card.name}'?`)) return;
      }
    : null;

  return <Editor
    onSubmit={onSubmit}
    onCancel={() => history.goBack()}
    onDelete={!create && card.id !== null && onDelete}>

      <Group as={Row}>
        <Field style={{ fontSize: '1.5em', fontWeight: 'bold' }}
          placeholder='Name (e.g. John Smith)'
          access={access('user.name')} />
      </Group>

      <div className='mt-5 mb-3' style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
        <FormSection>Certification Info</FormSection>
        <Col style={{ border: `solid 2px ${card?.user.certVerified ? 'green' : 'red'}` }}>
          <Field type='switch' label='Verified' access={access('user.certVerified')} />
        </Col>
      </div>

      <Group as={Row}>
        <Field as="select" label='Cert. Level'access={access('user.certLevel')} >
          <option value='' >none</option>
          <option value='1'>1</option>
          <option value='2'>2</option>
          <option value='3'>3</option>
        </Field>
        <Field type='month' label='Expires' access={access('user.certExpires')} />
      </Group>

      <Group as={Row}>
        <Field as="select" label='Cert. Org' access={access('user.certType')} >
          <option value='' >none</option>
          <option value='nar'>NAR</option>
          <option value='tra'>TRA</option>
        </Field>

        <Field type='number' label='Member #' access={access('user.certMember')} />
      </Group>

      <div className='mt-5 mb-3' style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
        <FormSection>Rocket Info</FormSection>
        <Col style={{ border: `solid 2px ${card?.flight.rsoVerified ? 'green' : 'red'}` }}>
          <Field type='switch' label='RSO Approved' access={access('flight.rsoVerified')} />
        </Col>
      </div>

      <Group as={Row}>
        <Field label='Name' placeholder='Rocket name' access={access('rocket.name')} />
        <Field label='Manufacturer' access={access('rocket.manufacturer')} />
      </Group>

      <Group as={Row}>
        <Field label='Length' access={access('rocket.length')} />
        <Field label='Diameter' access={access('rocket.diameter')} />
        </Group>

      <Group as={Row}>
        <Field label='Motor' access={access('flight.motor')} />
        <Field label='Impulse' access={access('flight.impulse')} />
      </Group>

      <Group as={Row}>
        <Field label='Weight (incl. motor)' access={access('rocket.weight')} />
        <Field label='Color' access={access('rocket.color')} />
      </Group>

      <Group as={Row}>
        <Field type='radio(chute, streamer, shovel)' label='Recovery' access={access('rocket.recovery')} />
     </Group>

      <FormSection >Flight Info</FormSection>

      <Group as={Row}>
        <Col sm='2'/>
        <Field type='switch' label='1st Flight' access={access('flight.firstFlight')} />
        <Field sm='3' type='switch' label='Heads Up' access={access('flight.headsUp')} />
      </Group>

      <Group as={Row}>
        <Field label='Notes' as='textarea' rows='5' access={access('flight.notes')} />
      </Group>
  </Editor>;
}

function CardList({ cards }) {
  const launchId = useRouteMatch()?.params.launchId;
  cards = cards?.map(c => <li key={c.id}>
    <Link to={`/launches/${launchId}/cards/${c.id}`}>Card {c?.id}</Link>
    </li>);

  return <ul>
    {cards}
    </ul>;
}

export default function Cards() {
  const user = useCurrentUser();
  const previousCards = useLiveQuery(
    () => user && db.cards.where('userId').equals(user.id).toArray(),
    [user?.id]
  );

  return <>
    {previousCards?.length ? <CardList cards={previousCards} /> : null}
    <h1>Flight Card</h1>
    <CardEditor />
  </>;
}

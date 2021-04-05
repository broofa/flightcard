import React, { Fragment, useState } from 'react';
import { Link, useHistory, useRouteMatch } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { iUser, iCard } from '../db';
import Editor from './Editor';
import { useLaunchUsers, useCurrentUser } from './hooks';
import { Form, Col } from 'react-bootstrap';
import { nameComparator } from './Launch';

const { Label, Control, Group, Row, Check, Switch } = Form;

const FormSection : React.FC<{className ?: string}> = ({ className, children, ...props }) => {
  return <div className={`${className ?? ''}`}
    style={{
      fontSize: '1.2em',
      fontWeight: 'bold',
      color: '#ccc'
    }}
    {...props}>
    {children}
  </div>;
};

const FieldCol : React.FC<{className ?: string}> = ({ className, children, ...props }) => {
  return <Col sm='2' className={`text-xs-left text-sm-right text-capitalize ${className ?? ''}`} {...props}>
    {children}
  </Col>;
};

const Field : React.FC<{
  type ?: any,
  access : {getter : () => any, setter : (v) => void},
  label : string,
  placeholder ?: string,
  sm ?: string,
  as ?: any,
  rows ?: string,
}> = ({ access, label, children, ...props }) => {
  const { getter, setter } = access;

  const rId = Math.random().toString(16).substr(2);
  let input;
  if (props.type == 'switch') {
    const checked = getter();
    return <FieldCol>
      <Switch style={{ whiteSpace: 'nowrap' }} id={rId} label={label} checked={checked} onChange={setter} />
    </FieldCol>;
  } else if (/^radio\((.*)\)$/.test(props.type)) {
  // Special case for type="radio(..list,of,radio,values...)"
    props.type = 'radio';
    const val = getter();
    input = RegExp.$1
      .split(/, */)
      .map((v, i) => <Col key={i}>
      <Check {...props} className='text-capitalize'
        id={rId + i} checked={val === v} label={v} value={v} onChange={setter} />
      </Col>);
  } else {
    input = <Col><Control {...props} value={getter()} onChange={setter}>{children}</Control></Col>;
  }

  return <>
    <FieldCol><Label>{label}</Label></FieldCol>
    { input}
  </>;
};

const CardEditor : React.FC<{create ?: boolean}> = ({ create }) => {
  const history = useHistory();
  const user = useCurrentUser();
  const match = useRouteMatch<{launchId : string, cardId : string}>();
  const cardId = parseInt(match.params.cardId);
  const launchId = parseInt(match.params.launchId);

  const launchUsers = useLaunchUsers(launchId);
  const flierIds = launchUsers ? launchUsers.map(u => u.userId) : [];
  const fliers = useLiveQuery(() => db.users.bulkGet(flierIds), [flierIds.join()]);

  const dbCard = useLiveQuery(() => cardId ? db.cards.get(cardId) : null, [cardId]);

  if (!user || !fliers) return <p>Loading ...</p>;

  const [card, setCard] = useState(dbCard || {
    id: 0,
    launchId,
    userId: user?.id || 0, // Flier

    verified: false,

    rocket: {
      id: 0,
      name: '',
      manufacturer: '',
      color: '',
      diameter: 0,
      length: 0,
      weight: 0
    },

    flight: {
      firstFlight: false,
      headsUp: false,
      motor: '',
      impulse: 0
    }
  } as iCard);

  fliers.sort(nameComparator);

  const flier = fliers.find(f => f?.id == card.userId) || {} as iUser;

  function access(path : string) {
    const parts : string[] = path.split('.');

    return {
      getter() : any {
        let o : any = card;
        for (const k of parts) o = o[k];
        return o;
      },

      setter({ target }) {
        const value = target.type == 'checkbox' ? target.checked : target.value;

        const newCard : iCard = { ...card };
        let o = newCard;
        for (let i = 0; i < parts.length; i++) {
          if (i < parts.length - 1) {
            o = o[parts[i]];
          } else {
            o[parts[i]] = value;
          }
        }

        setCard(newCard);
      }
    };
  }

  const onSubmit = e => {
    e.preventDefault();

    card.launchId = Number(launchId);
    card.userId = user?.id;
    db.cards.put(card).then(() => history.goBack());
  };

  const onDelete = card.id
    ? () => {
        // TODO: Disallow deletion of cards that are racked, or that have been flown

        if (!confirm(`Really delete '${card.rocket.name}'?`)) return;
        db.cards.delete(card.id);
      }
    : null;

  return <Editor
    onSubmit={onSubmit}
    onCancel={() => history.goBack()}
    onDelete={(!create && card.id !== null && onDelete) ? onDelete : undefined}>

    <Group as={Row}>
      <FieldCol><Label>Flier</Label></FieldCol>
      <Col>
        <Control as="select" value={flier.id || ''}
          onChange={
            e => {
              const u = { ...card, userId: parseInt(e.target.value) };
              setCard(u);
            }
          }>
          <option value=''>Select Flier ...</option>
           {fliers.map(u => u ? <option key={u.id} value={u.id}>{u.name || '(anonymous)'}</option> : null)}
        </Control>
      </Col>
    </Group>

    <Group as={Row}>
      <FieldCol><Label>Cert. Level</Label></FieldCol>
      <Col><Control disabled value={flier.certLevel} /></Col>

      <FieldCol><Label>Cert. Expires</Label></FieldCol>
      <Col><Control disabled value={flier.certExpires} /></Col>
    </Group>

    <Group as={Row}>
      <FieldCol><Label>Cert. Organization</Label></FieldCol>
      <Col><Control disabled value={flier.certType} /></Col>

      <FieldCol><Label>Membership #</Label></FieldCol>
      <Col><Control disabled value={flier.certNumber} /></Col>
    </Group>

    <div className='mt-5 mb-3' style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
      <FormSection>Rocket Info</FormSection>
      <Col style={{ border: `solid 2px ${card?.rsoId ? 'green' : 'red'}` }}>
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
};

function CardList({ cards }) {
  const launchId = useRouteMatch<{launchId : string}>()?.params.launchId;
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

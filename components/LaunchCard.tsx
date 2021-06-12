import React from 'react';
import { Link } from 'react-router-dom';
import { iAttendee, iCard } from '../types';
import './LaunchCard.scss';
import { AttendeeInfo } from './UserList';

export function LaunchCard(
  { card, attendee } :
  { card : iCard; attendee ?: iAttendee; }
) {
  return <Link to={`/launches/${card.launchId}/cards/${card.id}`} className='launch-card text-center rounded border border-dark d-flex flex-column p-1 cursor-pointer'>
    {
      attendee
        ? <AttendeeInfo className='flex-grow-0 text-left me-1 fw-bold border-bottom pb-1 mb-1' hidePhoto attendee={attendee} />
        : null
    }
    <div>{card.rocket?.name ? `"${card.rocket.name}"` : <em>Unnamed rocket</em>}</div>
    {card.motor
      ? <div className=''>Flying on <strong>{card.motor?.name ?? '(motor?)'}</strong></div>
      : null}
  </Link>;
}
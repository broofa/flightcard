import React from 'react';
import { NavDropdown } from 'react-bootstrap';
import { db } from '/firebase';
import { iLaunch, iUser, tRole } from '/types';

export function RoleDropdown({
  launch,
  user,
}: {
  launch: iLaunch;
  user: iUser;
}) {
  const isOfficer = db.officer.useValue(launch.id, user.id);
  const attendee = db.attendee.useValue(launch.id, user.id);

  function setRole(role?: tRole) {
    db.attendee.update(launch.id, user.id, { role });
  }

  if (!attendee) return null;

  const roleTitle = attendee.role?.toUpperCase() ?? 'Off Duty';

  return (
    <NavDropdown title={roleTitle} id='collasible-nav-dropdown'>
      <NavDropdown.Item onClick={() => setRole(undefined)}>
        Off Duty
      </NavDropdown.Item>
      {isOfficer ? (
        <>
          <NavDropdown.Item onClick={() => setRole('lco')}>
            LCO
          </NavDropdown.Item>
          <NavDropdown.Item onClick={() => setRole('rso')}>
            RSO
          </NavDropdown.Item>
        </>
      ) : null}
    </NavDropdown>
  );
}

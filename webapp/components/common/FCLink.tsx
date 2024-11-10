import React from 'react';
import { Nav, type NavLinkProps } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export function FCLink({
  to,
  children,
  ...props
}: { to: string } & Omit<NavLinkProps, 'href'>) {
  const navigate = useNavigate();
  return (
    <Nav.Link onClick={() => navigate(String(to))} {...props}>
      {children}
    </Nav.Link>
  );
}

import { iCert } from '/types';

export default function certString(cert?: iCert) {
  if (!cert?.organization) return 'none';
  return `${cert.organization}${cert.level}`;
}

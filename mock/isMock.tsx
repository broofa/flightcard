import { MOCK_ID_PREFIX } from './mock_db';

export default function isMock(id: string | { id: string }) {
  id = typeof id === 'string' ? id : id.id;
  return id.startsWith(MOCK_ID_PREFIX);
}

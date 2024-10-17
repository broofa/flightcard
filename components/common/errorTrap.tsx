import { flash } from '../Flash/flash';

export function errorTrap<T>(action: Promise<T>): Promise<T> {
  action.catch((err) => flash(err));
  return action;
}

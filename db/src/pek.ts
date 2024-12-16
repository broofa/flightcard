import type { UserProps } from './UserModel';

class Pek<T> {
  constructor(public readonly root: T) {}
}

type AppData = {
  users: Record<string, UserProps>;
};

const pek = new Pek<AppData>({ users: new Map<string, UserProps>() });

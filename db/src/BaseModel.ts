type BaseProps = {
  createdAt?: number;
};

export class BaseModel<ModelProps extends BaseProps> {
  #props: ModelProps;

  constructor(props: ModelProps) {
    this.#props = { ...props };
    this.#props.createdAt ??= Date.now();
  }

  get<T extends keyof ModelProps>(key: T) {
    return this.#props[key];
  }

  // All methods that mutate the model are shielded by the #mutable object
  #mutable = {
    set: <T extends keyof ModelProps>(key: T, value: ModelProps[T]) => {},
    update: (props: Partial<ModelProps>) => {
      for (const k in props) {
        this.#mutable.set(k, props[k] as ModelProps[typeof k]);
      }
    },
  };

  toJSON() {
    return this.#props;
  }
}

type UserProps = BaseProps & {
  userID: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarURL?: string;
};

export class UserModel extends BaseModel<UserProps> {
  get userID() {
    return this.get('userID');
  }
}

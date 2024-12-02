export type BaseProps = {
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

  get createdAt() {
    return this.#props.createdAt;
  }

  // All methods that mutate the model are shielded by the #mutable object
  mutable = {
    set: <T extends keyof ModelProps>(key: T, value: ModelProps[T]) => {},
    update: (props: Partial<ModelProps>) => {
      for (const k in props) {
        this.mutable.set(k, props[k] as ModelProps[typeof k]);
      }
    },
  };

  props() {
    return { ...this.#props };
  }

  toJSON() {
    return this.#props;
  }
}

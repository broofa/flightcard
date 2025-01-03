import type { BaseModel } from './BaseModel';
import { type RocketModel, isRocketModel } from './RocketModel';
import { type UserModel, isUserModel } from './UserModel';

/**
 * ModelEvent has the following primitive forms:
 * CREATE: { before: undefined; after: T; }
 * UPDATE: { before: T; after: T; }
 * DELETE: { before: T; after: undefined; }
 */
type ModelUpdateEvent<T extends BaseModel = BaseModel> = {
  before?: Readonly<T>;
  after?: Readonly<T>;
};

type ModelUpdateListener<T extends BaseModel = BaseModel> = (
  e: ModelUpdateEvent[]
) => void;

interface ModelUpdateConsumer {
  onModelUpdate: ModelUpdateListener;
}

class ModelEventEmitter {
  #listeners = new Set<ModelUpdateListener<BaseModel>>();

  on(listener: ModelUpdateListener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  pipe<T extends ModelUpdateConsumer>(consumer: T) {
    this.on(consumer.onModelUpdate);
    return consumer;
  }

  emit(events: ModelUpdateEvent[]) {
    for (const listener of this.#listeners) {
      listener(events);
    }
  }
}

export class ModelStore extends ModelEventEmitter {
  models: Record<string, BaseModel | undefined> = {};

  #parentStore?: ModelStore;

  [Symbol.iterator]() {
    return Object.entries(this.models);
  }

  get<T extends BaseModel>(id: string | T): T | undefined {
    if (typeof id !== 'string') {
      id = getModelID(id);
    }

    return (id in this.models ? this.models[id] : this.#parentStore?.get(id)) as
      | T
      | undefined;
  }

  put<T extends BaseModel>(model: T) {
    this.models[getModelID(model)] = model;
  }

  patch<T extends BaseModel>(model: T | string, patch: Partial<T>) {
    const before = this.get(model);
    const after = { ...before, ...patch };

    this.put(after);
  }

  delete<T extends BaseModel>(id: string | T) {
    if (typeof id !== 'string') {
      id = getModelID(id);
    }

    if (!this.models[id]) {
      this.models[id] = undefined;
    }
  }

  async transaction(cb: (cache: ModelStore) => void | Promise<void>) {
    const cache = new ModelStore();
    cache.#parentStore = this;
    try {
      // Run transaction
      await cb(cache);

      // Apply changes
      const changes: ModelUpdateEvent<BaseModel>[] = [];

      for (const [id, after] of Object.entries(cache.models)) {
        const before = this.models[id];
        changes.push({ before, after });
        if (!after) {
          delete this.models[id];
        } else {
          this.put(after);
        }
      }

      // Notify listeners
      this.emit(changes);
    } catch {
      console.error('Transaction failed - dropping changes');
    }
  }
}

export class ModelFilter<T extends BaseModel> extends ModelEventEmitter {
  constructor(private filter: (model: unknown) => model is T) {
    super();
  }

  onModelUpdate(events: ModelUpdateEvent<BaseModel>[]) {
    const filteredEvents = events.filter(({ before, after }) => {
      return this.filter(before) || this.filter(after);
    }) as ModelUpdateEvent<T>[];

    this.emit(filteredEvents);
  }
}

export class ModelIndex<T extends BaseModel>
  extends ModelEventEmitter
  implements ModelUpdateConsumer
{
  #index = new Map<string, T>();

  constructor(private hasher: (model: T) => string | undefined) {
    super();
  }

  onModelUpdate(events: readonly ModelUpdateEvent<BaseModel>[]) {
    const indexChanges: ModelUpdateEvent<T>[] = [];
    for (const e of events as ModelUpdateEvent<T>[]) {
      const { before, after } = e;

      if (after) {
        const key = this.hasher(after);
        if (key) {
          this.#index.set(key, after);
        }
      } else if (before) {
        const key = this.hasher(before);
        if (key) {
          this.#index.delete(key);
        }
      } else {
        continue;
      }

      indexChanges.push(e);
    }
  }

  [Symbol.iterator]() {
    return this.#index.entries();
  }

  get(id: string): BaseModel | undefined {
    return this.#index.get(id);
  }
}

// Bit of a hack to allow us to index [most] models by their primary key
const keyForType = new Map<string, string>();
function getModelID<T extends BaseModel>(model: T) {
  let key = keyForType.get(model._type!);
  if (!key) {
    key = `${model._type!}ID`;
    keyForType.set(model._type!, key);
  }
  const id = model[key as keyof T];
  if (!id) {
    throw new Error(`Model key ${key} undefined`);
  }
  return id as string;
}

// ======================================================

const modelStore = new ModelStore();

const rocketEvents = new ModelFilter(isRocketModel);
const rocketsByRocketID = new ModelIndex<RocketModel>((m) => m.rocketID);
const rocketsByUserID = new ModelIndex<RocketModel>((m) => m.userID);
modelStore.pipe(rocketEvents);
rocketEvents.pipe(rocketsByRocketID);
rocketEvents.pipe(rocketsByUserID);

const userEvents = new ModelFilter<UserModel>(isUserModel);
const usersByUserID = new ModelIndex<UserModel>((m) => m.userID);
modelStore.pipe(userEvents);

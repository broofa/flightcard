import type { BaseModel } from './BaseModel';

type ModelChangeListener<T> = (
  newModel: T | undefined,
  oldModel: T | undefined
) => void;

export class ModelCache<T extends BaseModel> {
  #inflight = new Map<string, Promise<Readonly<T> | undefined>>();
  #models = new Map<string, Readonly<T>>();
  #listeners = new Map<string, Set<ModelChangeListener<T>>>();
  #fetcher: (id: string) => Promise<T>;

  constructor(fetcher: (id: string) => Promise<T>) {
    this.#fetcher = fetcher;
  }

  [Symbol.iterator]() {
    return this.#models.entries();
  }

  async #fetch(id: string, force = false) {
    if (!force && this.#models.has(id)) {
      return this.#models.get(id);
    }

    if (!this.#inflight.has(id)) {
      const modelPromise = this.#fetcher(id)
        .then((model) => {
          const oldModel = this.#models.get(id);
          this.#models.set(id, model);
          this.#emit(id, model, oldModel);
          return model;
        })
        .catch((e) => {
          console.error(e);
          return undefined;
        })
        .finally(() => {
          this.#inflight.delete(id);
        });
      this.#inflight.set(id, modelPromise);
    }

    return await this.#inflight.get(id);
  }

  #emit(id: string, newModel: T | undefined, oldModel?: T) {
    if (oldModel === newModel) {
      return;
    }

    const listeners = this.#listeners.get(id);
    if (!listeners) {
      return;
    }
    for (const listener of listeners) {
      listener(newModel, oldModel);
    }

    if (id !== '*') {
      this.#emit('*', newModel, oldModel);
    }
  }

  on(id: string, listener: ModelChangeListener<T>) {
    let listeners = this.#listeners.get(id);
    if (!listeners) {
      listeners = new Set();
      this.#listeners.set(id, listeners);
    }
    listeners.add(listener);
  }

  off(id: string, listener: ModelChangeListener<T>) {
    this.#listeners.get(id)?.delete(listener);
  }

  put(id: string, model?: Readonly<T>) {
    const oldModel = this.#models.get(id);
    if (!model) {
      this.#models.delete(id);
    } else {
      this.#models.set(id, model);
    }
    this.#emit(id, model, oldModel);
  }

  refresh(id: string) {
    const modelPromise = this.#fetcher(id)
      .then((model) => {
        const oldModel = this.#models.get(id);
        this.#models.set(id, model);
        this.#emit(id, model, oldModel);
        return model;
      })
      .catch((e) => {
        console.error(e);
        return undefined;
      })
      .finally(() => {
        this.#inflight.delete(id);
      });

    this.#inflight.set(id, modelPromise);

    return modelPromise;
  }

  get(id: string) {
    const modelPromise = this.#inflight.get(id);
    if (modelPromise) {
      return modelPromise;
    }

    const model = this.#models.get(id);
    if (model) {
      return Promise.resolve(model);
    }

    return this.refresh(id);
  }
}

//
// ModelCacheFilter
//

export function filteredCache<T extends BaseModel>(
  cache: ModelCache<T>,
  filter: (model?: T) => boolean,
  listener: ModelChangeListener<T>
) {
  function unfilteredListener(
    newModel: T | undefined,
    oldModel: T | undefined
  ) {
    if (filter(newModel) || filter(oldModel)) {
      listener(newModel, oldModel);
    }
  }
  cache.on('*', unfilteredListener);
  return {
    off: () => cache.off('*', unfilteredListener),

    *[Symbol.iterator]() {
      for (const [id, model] of cache) {
        if (filter(model)) {
          yield model;
        }
      }
    },
  };
}

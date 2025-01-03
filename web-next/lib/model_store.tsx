'use client';

import {
  MODEL_TYPE_ROCKET,
  ModelStore,
  Recovery,
  type RocketModel,
  createRocket,
} from '@flightcard/models';

export const modelStore = new ModelStore();

const COLORS = [
  'red',
  'green',
  'blue',
  'yellow',
  'purple',
  'orange',
  'pink',
  'black',
  'white',
  'silver',
  'gold',
  'brown',
  'gray',
  'cyan',
];

modelStore.transaction((store: ModelStore) => {
  for (let i = 0; i < 10; i++) {
    const rocket: RocketModel = createRocket({
      _type: MODEL_TYPE_ROCKET,
      extra: {
        description: COLORS[i % COLORS.length],
        diameter: i * 0.2,
        length: i * 0.7,
        manufacturer: 'Estes',
        mass: 0.1,
        recovery: Recovery.CHUTE,
      },
      name: `Rocket ${i}`,
      rocketID: `rocket-${i}`,
      userID: 'user-1',
    });
    store.put(rocket);
  }
});

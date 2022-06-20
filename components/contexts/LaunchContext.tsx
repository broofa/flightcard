import React, { createContext, PropsWithChildren, useContext } from 'react';
import { useMatch } from 'react-router-dom';
import { LAUNCH_PATH, RTState, util } from '/firebase';
import { iLaunch } from '/types';

const launchContext = createContext<RTState<iLaunch>>([
  undefined,
  true,
  undefined,
]);

export function useLaunch() {
  return useContext(launchContext);
}

export function LaunchProvider({ children }: PropsWithChildren) {
  const { Provider } = launchContext;

  const match = useMatch<'launchId', string>('/launches/:launchId/*');
  const { launchId } = match?.params ?? {};

  const launchFields = launchId ? { launchId } : undefined;
  const rtpath = LAUNCH_PATH.with(launchFields);

  const value = util.useValue<iLaunch>(rtpath);

  return <Provider value={value}>{children}</Provider>;
}

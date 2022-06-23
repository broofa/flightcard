import React, { createContext, PropsWithChildren, useContext } from 'react';
import { RTState, useRTValue } from '/rt';
import { LAUNCH_PATH } from '/rt/rtconstants';
import { iLaunch } from '/types';

const launchContext = createContext<RTState<iLaunch>>([
  undefined,
  true,
  undefined,
]);

export function useLaunch() {
  return useContext(launchContext);
}

export function LaunchProvider({
  launchId,
  children,
}: PropsWithChildren<{ launchId?: string }>) {
  const { Provider } = launchContext;

  const launchFields = launchId ? { launchId } : undefined;
  const rtpath = LAUNCH_PATH.with(launchFields);

  const value = useRTValue<iLaunch>(rtpath);

  return <Provider value={value}>{children}</Provider>;
}

import React, { createContext, PropsWithChildren, useContext } from 'react';
import { RTState, useRTValue } from '/rt';
import {
  ATTENDEES_PATH,
  CARDS_PATH,
  LAUNCH_PATH,
  OFFICERS_PATH,
  PADS_PATH,
} from '/rt/rtconstants';
import { iAttendees, iCards, iLaunch, iOfficers, iPads } from '/types';

export const launchStateContext = createContext<{
  launch: RTState<iLaunch>;
  attendees: RTState<iAttendees>;
  officers: RTState<iOfficers>;
  cards: RTState<iCards>;
  pads: RTState<iPads>;
}>({
  launch: [undefined, true, undefined],
  attendees: [undefined, true, undefined],
  officers: [undefined, true, undefined],
  cards: [undefined, true, undefined],
  pads: [undefined, true, undefined],
});

export function LaunchStateProvider({
  launchId,
  children,
}: PropsWithChildren<{ launchId?: string }>) {
  const { Provider } = launchStateContext;

  const launchFields = launchId ? { launchId } : undefined;

  const launch = useRTValue<iLaunch>(LAUNCH_PATH.with(launchFields));
  const attendees = useRTValue<iAttendees>(ATTENDEES_PATH.with(launchFields));
  const officers = useRTValue<iOfficers>(OFFICERS_PATH.with(launchFields));
  const cards = useRTValue<iCards>(CARDS_PATH.with(launchFields));
  const pads = useRTValue<iPads>(PADS_PATH.with(launchFields));

  return (
    <Provider value={{ launch, attendees, officers, cards, pads }}>
      {children}
    </Provider>
  );
}

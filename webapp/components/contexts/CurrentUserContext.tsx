import React, {
  createContext,
  type PropsWithChildren,
  useContext,
} from 'react';
import { type RTState, useRTValue } from '/rt';
import { USER_PATH } from '/rt/rtconstants';
import type { iUser } from '../../types';
import { useAuthUser } from './AuthIdContext';

const currentUserContext = createContext<RTState<iUser>>([
  undefined,
  true,
  undefined,
]);

export function useCurrentUser() {
  return useContext(currentUserContext);
}

export function CurrentUserProvider({ children }: PropsWithChildren) {
  const { Provider } = currentUserContext;
  const [authUser] = useAuthUser();

  const authFields = authUser ? { authId: authUser.uid } : undefined;
  const value = useRTValue<iUser>(USER_PATH.with(authFields));

  return <Provider value={value}>{children}</Provider>;
}

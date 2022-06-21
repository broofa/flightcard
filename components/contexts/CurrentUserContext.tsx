import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { auth, DELETE, RTState, util } from '/rt';
import { USER_PATH } from '/rt/rtconstants';
import { iUser } from '/types';

const currentUserContext = createContext<RTState<iUser>>([
  undefined,
  true,
  undefined,
]);

export function CurrentUserProvider({ children }: PropsWithChildren) {
  const { Provider } = currentUserContext;

  const [authId, setAuthId] = useState<string>();

  const rtpath = useMemo(() => {
    const authFields = authId ? { authId } : undefined;
    return USER_PATH.with(authFields);
  }, [authId]);

  const value = util.useValue<iUser>(rtpath);

  // Subscribe to auth changes once only
  useEffect(() => {
    return auth.onAuthStateChanged(async authUser => {
      setAuthId(authUser?.uid ?? undefined);
      // Update user state
      if (authUser) {
        const rtpath = USER_PATH.with({ authId: authUser.uid });
        // Get most recent state
        const userState = await util.get<iUser>(rtpath).catch(console.error);
        // Update user's state
        const user: iUser = {
          id: authUser.uid,
          photoURL: authUser.photoURL ?? DELETE,
          name: (authUser.displayName || userState?.name) ?? DELETE,
        };
        util.update(rtpath, user).catch(console.error);
      }
    });
  }, []);

  return <Provider value={value}>{children}</Provider>;
}

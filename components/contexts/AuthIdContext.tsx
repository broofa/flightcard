import { User } from 'firebase/auth';
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import { auth, RTState } from '/rt';

const authUserContext = createContext<RTState<User>>([
  undefined,
  true,
  undefined,
]);

export function useAuthUser() {
  return useContext(authUserContext);
}

export function AuthUserProvider({ children }: PropsWithChildren) {
  const { Provider } = authUserContext;

  const [authUser, setAuthUser] = useState<User>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error>();

  function onAuth(user: User | null) {
    setAuthUser(user ?? undefined);
    setError(undefined);
    setLoading(false);
  }
  function onError(err: Error) {
    console.log('Auth Error', err);
    setAuthUser(undefined);
    setError(err);
    setLoading(false);
  }

  // Subscribe to auth changes, once only
  useEffect(() => auth.onAuthStateChanged(onAuth, onError), []);

  return <Provider value={[authUser, loading, error]}>{children}</Provider>;
}

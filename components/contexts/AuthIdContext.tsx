import { getAdditionalUserInfo, User } from 'firebase/auth';
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { showError } from '../common/ErrorFlash';
import { checkForEmailLinkLogin } from '../Login/checkForEmailLinkLogin';
import { auth, DELETE, rtGet, RTState, rtUpdate } from '/rt';
import { USER_PATH } from '/rt/rtconstants';
import { iUser } from '/types';

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
  const navigate = useNavigate();

  async function onAuth(user: User | null) {
    setAuthUser(user ?? undefined);
    setError(undefined);
    setLoading(false);
  }

  function onError(err: Error) {
    setAuthUser(undefined);
    setError(err);
    setLoading(false);
  }

  // Check href to see if this is a login via email-link
  useEffect(() => {
    (async function () {
      let userCredential;
      try {
        userCredential = await checkForEmailLinkLogin();
      } catch (err) {
        switch ((err as { code: string })?.code) {
          case 'auth/invalid-action-code':
            showError(
              new Error(
                'Sorry, that login link is no longer valid. Please try logging in again.'
              )
            );
            break;
          case 'auth/invalid-email': // eslint-disable-line no-fallthrough
          default:
            showError(err as Error);
            break;
        }
      }

      if (userCredential) {
        console.log('userCredential', userCredential);

        const userInfo = getAdditionalUserInfo(userCredential);
        console.log('userInfo', userInfo);

        const { user } = userCredential;

        const rtpath = USER_PATH.with({ authId: user.uid });
        // Get most recent state
        const userState = await rtGet<iUser>(rtpath).catch(console.error);
        // Update user's state
        const currentUser: iUser = {
          ...userState,
          id: user.uid,
          photoURL: user.photoURL ?? DELETE,
          name: (user.displayName || userState?.name) ?? DELETE,
        };

        await rtUpdate(rtpath, currentUser).catch(console.error);

        navigate('/');
      }

      // Sign up for auth changes
      auth.onAuthStateChanged(onAuth, onError);
    })();
  }, []);

  return <Provider value={[authUser, loading, error]}>{children}</Provider>;
}

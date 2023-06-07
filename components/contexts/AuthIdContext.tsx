import { getAdditionalUserInfo, User } from 'firebase/auth';
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { checkForEmailLinkLogin } from '../Login/checkForEmailLinkLogin';
import { auth, rtGet, RTState, rtUpdate } from '/rt';
import { USER_PATH } from '/rt/rtconstants';
import { iUser } from '/types';
import { flash } from '../Flash/flash';

const authUserContext = createContext<RTState<User>>([
  undefined,
  true,
  undefined,
]);

export function useAuthUser() {
  return useContext(authUserContext);
}

// Update local user state based on auth-provided user state
export async function loginUpdateUser(user: User) {
  const rtpath = USER_PATH.with({ authId: user.uid });

  let currentUser = await rtGet<iUser>(rtpath).catch(console.error);

  if (!currentUser) {
    currentUser = { id: user.uid };
  }
  if (user.displayName) {
    currentUser.name ||= user.displayName;
  }
  if (user.photoURL) {
    currentUser.photoURL = user.photoURL;
  }

  await rtUpdate(rtpath, currentUser).catch(console.error);
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
            flash(
              new Error(
                'Sorry, that login link is no longer valid. Please try logging in again.'
              )
            );
            break;
          case 'auth/invalid-email': // eslint-disable-line no-fallthrough
          default:
            flash(err as Error);
            break;
        }
      }

      // Only defined if user landed on page via email-link
      if (userCredential) {
        const userInfo = getAdditionalUserInfo(userCredential);
        if (userInfo?.isNewUser) {
          flash('Welcome to FlightCard!');
        }

        const { user } = userCredential;

        await loginUpdateUser(user);

        navigate(userInfo?.isNewUser ? '/' : '/launches');
      }

      // Sign up for auth changes
      auth.onAuthStateChanged(onAuth, onError);
    })();
  }, []);

  return <Provider value={[authUser, loading, error]}>{children}</Provider>;
}

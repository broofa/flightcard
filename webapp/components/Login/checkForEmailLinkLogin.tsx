import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '/rt';
import { EMAIL_KEY } from './Login';

export async function checkForEmailLinkLogin() {
  const { href } = window.location;

  // Is this is a signin request?
  if (!isSignInWithEmailLink(auth, href)) return;

  let email = localStorage.getItem(EMAIL_KEY);
  if (!email) {
    email = window.prompt(
      'To finish signing in, please confirm the email you used to sign up:'
    );
  }

  return await signInWithEmailLink(auth, email ?? '', href);
}

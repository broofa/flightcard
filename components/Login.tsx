import React from 'react';
import { Button } from 'react-bootstrap';
import { auth } from '../firebase';

export default function Login() {
  async function loginWithGoogle() {
    const provider = new auth.GoogleAuthProvider();

    try {
      await auth().signInWithPopup(provider);

      // This gives you a Google Access Token. You can use it to access the Google API.
      // @type {firebase.auth.OAuthCredential}
      // const credential = result.credential;
      // const token = credential.accessToken;
    } catch (err) {
      console.log(err);
    }
  }

  return <div id='login'>
    <Button onClick={loginWithGoogle}>Login with Google</Button>
  </div>;
}

import React from 'react';
import { Button } from 'react-bootstrap';
// import Logo from './LogoTest.jsx';
import { auth } from '../firebase';
import { APPNAME } from './App';

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

  return <div className='text-center'>
    <h2 className='my-5'>Welcome to {APPNAME}</h2>
    <Button onClick={loginWithGoogle}>Login with Google</Button>
  </div>;
}

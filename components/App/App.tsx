import React, { useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useMatch,
} from 'react-router-dom';
import Admin from '../Admin/Admin';
import { AuthUserProvider, useAuthUser } from '../contexts/AuthIdContext';
import { LaunchProvider } from '../contexts/LaunchContext';
import { OfficersProvider } from '../contexts/OfficersContext';
import Launch from '../Launch/Launch';
import LaunchHome from '../Launch/LaunchHome';
import Launches from '../Launches';
import Login from '../Login/Login';
import './App.scss';
import { LaunchNavBar } from './LaunchNavBar';
import { Loading } from '/components/common/util';

export const APPNAME = 'FlightCard';
export const ANONYMOUS = '(anonymous)';

// REF: https://stackoverflow.com/a/69592617/109538
function RequireAuth() {
  const [authUser, loading, error] = useAuthUser();
  const location = useLocation();

  if (loading) {
    return <Loading wat='User Credentials' />;
  } else if (error) {
    return (
      <Alert variant='danger'>Authentication error: {error.message}</Alert>
    );
  } else if (!authUser) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default function App() {
  const match = useMatch<'launchId', string>('/launches/:launchId/*');
  const { launchId } = match?.params ?? {};

  return (
    <AuthUserProvider>
      <LaunchProvider launchId={launchId}>
        <OfficersProvider>
          <Routes>
            <Route path='/login' element={<Login />} />

            <Route element={<RequireAuth />}>
              <Route path='/' element={<Navigate to='/launches' />} />
              <Route path='/admin' element={<Admin />} />
              <Route path='/launches' element={<Launches />} />
              <Route path='/launches/:launchid' element={<LaunchNavBar />}>
                <Route index element={<LaunchHome />} />
                <Route path='*' element={<Launch />} />
              </Route>
            </Route>
          </Routes>
        </OfficersProvider>
      </LaunchProvider>
    </AuthUserProvider>
  );
}
